import os
import random
import time
import io
import uvicorn
from fastapi import FastAPI, Request, UploadFile, File, Header
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import google.generativeai as genai
import requests
import firebase_admin
from firebase_admin import credentials, firestore
from concurrent.futures import ThreadPoolExecutor

# --- 1. SETUP & CONFIGURATION ---
app = FastAPI()

# CORS: Allow your frontend to hit this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Firebase Setup
# NOTE: In HF Spaces, set 'FIREBASE_CREDENTIALS' as a Secret containing the JSON content
import json
firebase_config_str = os.environ.get("FIREBASE_CREDENTIALS")
if firebase_config_str:
    # Handle potential formatting issues if copied with newlines
    try:
        cred_dict = json.loads(firebase_config_str)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("✅ Firebase Initialized Successfully")
    except Exception as e:
        print(f"❌ Firebase Config Error: {e}")
        db = None
else:
    print("⚠ WARNING: FIREBASE_CREDENTIALS secret not found. DB updates will fail.")
    db = None

# API Keys
GEMINI_KEYS = [os.environ.get(f"GEMINI_KEY_{i}") for i in range(1, 6)]
HF_KEYS = [os.environ.get(f"HF_KEY_{i}") for i in range(1, 6)]
HF_API_URL = "https://router.huggingface.co/hf-inference/models/facebook/detr-resnet-50"

GEMINI_PROMPT = "Count the exact number of people visible in this bus/crowd. Respond with ONLY the integer number (e.g. 5)."

# --- 2. HELPER FUNCTIONS ---

def get_random_key(key_list):
    valid_keys = [k for k in key_list if k]
    return random.choice(valid_keys) if valid_keys else None

def analyze_with_gemini(image_bytes):
    key = get_random_key(GEMINI_KEYS)
    if not key: 
        print("⚠ No Gemini Keys available")
        return 0
    try:
        genai.configure(api_key=key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        img = Image.open(io.BytesIO(image_bytes))
        response = model.generate_content([GEMINI_PROMPT, img])
        return int(response.text.strip())
    except Exception as e:
        print(f"❌ Gemini Error: {e}")
        return 0

def analyze_with_huggingface(image_bytes):
    key = get_random_key(HF_KEYS)
    if not key:
        print("⚠ No HF Keys available")
        return 0
    headers = {"Authorization": f"Bearer {key}"}
    try:
        response = requests.post(HF_API_URL, headers=headers, data=image_bytes)
        result = response.json()
        count = 0
        # DETR returns a list of objects
        if isinstance(result, list):
            for item in result:
                if item.get('label') == 'person':
                    count += 1
        return count
    except Exception as e:
        print(f"❌ HF Error: {e}")
        return 0

# --- 3. API ENDPOINTS ---

@app.get("/")
async def root():
    # Serve the React App index.html if accessed directly
    if os.path.exists("build/index.html"):
        return FileResponse("build/index.html")
    return {"message": "BusLink Backend Running. React App not found in /build."}

@app.post("/api/update-bus")
async def update_bus(
    request: Request,
    bus_id: str = Header(..., alias="bus-id"),
    bus_lat: float = Header(..., alias="bus-lat"),
    bus_lng: float = Header(..., alias="bus-lng"),
    bus_speed: float = Header(..., alias="bus-speed"),
):
    print(f"📥 Received Update for {bus_id} | Speed: {bus_speed}")
    
    # Read image data
    image_bytes = await request.body()
    
    if not image_bytes:
        return JSONResponse({"status": "error", "message": "No image data"}, status=400)

    # 1. Concurrent AI Analysis
    gemini_count = 0
    hf_count = 0
    
    with ThreadPoolExecutor(max_workers=2) as executor:
        future_gem = executor.submit(analyze_with_gemini, image_bytes)
        future_hf = executor.submit(analyze_with_huggingface, image_bytes)
        gemini_count = future_gem.result()
        hf_count = future_hf.result()

    # 2. Calculate Average & Crowd Level
    # Fallback: if one fails (returns 0), use the other. If both work, average them.
    if gemini_count > 0 and hf_count > 0:
        avg_count = round((gemini_count + hf_count) / 2)
    else:
        avg_count = max(gemini_count, hf_count)
    
    crowd_status = "Low"
    if avg_count > 10: crowd_status = "Moderate"
    if avg_count > 25: crowd_status = "High"
    if avg_count > 45: crowd_status = "Very High"

    print(f"   🧠 AI Result: G={gemini_count}, HF={hf_count} -> Final: {avg_count} ({crowd_status})")

    # 3. Update Firestore (THE FIXED PATH)
    if db:
        try:
            # Path matches App.js: collection('public').doc('data').collection('buses')
            bus_ref = db.collection('public').document('data').collection('buses').document(bus_id)
            
            # REMOVED routeNo line so it doesn't overwrite existing data
            bus_data = {
                "id": bus_id,
                "lat": bus_lat,
                "lng": bus_lng,
                "speed": bus_speed,
                "peopleCount": avg_count,
                "crowdLevel": crowd_status,
                "lastUpdated": firestore.SERVER_TIMESTAMP
            }
            
            # merge=True ensures we only update these fields and leave routeNo/destination alone
            bus_ref.set(bus_data, merge=True)
            print("   💾 Firestore Updated!")
        except Exception as e:
            print(f"   ❌ Firestore Write Failed: {e}")

    return {"status": "success", "people_count": avg_count}

# --- 4. SERVE REACT APP (Static Files) ---
# This must be at the end
if os.path.exists("build"):
    app.mount("/", StaticFiles(directory="build", html=True), name="static")