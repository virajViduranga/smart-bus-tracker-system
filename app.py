import os
import random
import time
import io
import uvicorn
import base64

from fastapi import FastAPI, Request, Header
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from PIL import Image
import google.generativeai as genai
import requests
import firebase_admin
from firebase_admin import credentials, firestore
from concurrent.futures import ThreadPoolExecutor
import json

# --- 1. FASTAPI APP SETUP ---

app = FastAPI()

# CORS: allow your React frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. FIREBASE / FIRESTORE SETUP ---

firebase_config_str = os.environ.get("FIREBASE_CREDENTIALS")
db = None

if firebase_config_str:
    try:
        cred_dict = json.loads(firebase_config_str)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("✅ Firebase Initialized Successfully")
    except Exception as e:
        print(f"❌ Firebase Config Error: {e}")
else:
    print("⚠️ FIREBASE_CREDENTIALS not set. Firestore updates will be skipped.")

# --- 3. API KEYS & CONSTANTS ---

# Put up to 5 Gemini keys & HF keys into HF Space secrets:
# GEMINI_KEY_1, GEMINI_KEY_2, ...  GEMINI_KEY_5
# HF_KEY_1, HF_KEY_2, ... HF_KEY_5
GEMINI_KEYS = [os.environ.get(f"GEMINI_KEY_{i}") for i in range(1, 6)]
HF_KEYS = [os.environ.get(f"HF_KEY_{i}") for i in range(1, 6)]

HF_API_URL = "https://router.huggingface.co/hf-inference/models/facebook/detr-resnet-50"

GEMINI_PROMPT = (
    "Count the exact number of people visible inside this bus or crowd. "
    "Respond with ONLY the integer number (e.g. 5)."
)

# --- 4. HELPER FUNCTIONS ---


def get_random_key(key_list):
    """Pick a random non-empty key from a list or return None."""
    valid_keys = [k for k in key_list if k]
    return random.choice(valid_keys) if valid_keys else None


def analyze_with_gemini(image_bytes: bytes) -> int:
    """Use Gemini 2.5 Flash (multimodal) to count people."""
    key = get_random_key(GEMINI_KEYS)
    if not key:
        print("⚠️ No Gemini keys configured")
        return 0

    try:
        genai.configure(api_key=key)
        # ✅ use 2.5 – 1.5 models are retired and return 404
        model = genai.GenerativeModel("gemini-2.5-flash")

        img = Image.open(io.BytesIO(image_bytes))
        response = model.generate_content([GEMINI_PROMPT, img])

        # Gemini responds with plain text like "7"
        return int(response.text.strip())
    except Exception as e:
        print(f"❌ Gemini Error: {e}")
        return 0


def analyze_with_huggingface(image_bytes: bytes) -> int:
    """
    Use HF Inference (facebook/detr-resnet-50) to count 'person' detections.

    Uses the router endpoint with a JSON payload and base64 image to avoid
    the 'NoneType has no attribute \"lower\"' 400 error.
    """
    key = get_random_key(HF_KEYS)
    if not key:
        print("⚠️ No HF keys configured")
        return 0

    headers = {"Authorization": f"Bearer {key}"}

    try:
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")
        payload = {"inputs": image_b64}

        response = requests.post(
            HF_API_URL,
            headers=headers,
            json=payload,
            timeout=30,
        )
        result = response.json()

        # If HF returns an error dict, log it
        if isinstance(result, dict) and "error" in result:
            print(f"❌ HF API Error Payload: {result['error']}")
            return 0

        # DETR returns a list of detections
        count = 0
        if isinstance(result, list):
            for item in result:
                if item.get("label") == "person":
                    count += 1

        return count
    except Exception as e:
        print(f"❌ HF Error: {e}")
        return 0


# --- 5. ROUTES ---


@app.get("/")
async def root():
    # Serve React build if present
    if os.path.exists("build/index.html"):
        return FileResponse("build/index.html")
    return {"message": "BusLink backend running. React app not found in /build."}


@app.post("/api/update-bus")
async def update_bus(
    request: Request,
    bus_id: str = Header(..., alias="bus-id"),
    bus_lat: float = Header(..., alias="bus-lat"),
    bus_lng: float = Header(..., alias="bus-lng"),
    bus_speed: float = Header(..., alias="bus-speed"),
):
    print(f"📥 Received Update for {bus_id} | Speed: {bus_speed}")

    # Parse multipart form-data and extract the uploaded image (field name "image")
    form = await request.form()
    upload = form.get("image")
    if upload is None:
        return JSONResponse(
            {"status": "error", "message": "No image field named 'image' in form-data"},
            status_code=400,
        )

    image_bytes = await upload.read()
    if not image_bytes:
        return JSONResponse(
            {"status": "error", "message": "Empty image data"},
            status_code=400,
        )

    # --- 1. Run Gemini + HF in parallel ---
    gemini_count = 0
    hf_count = 0

    with ThreadPoolExecutor(max_workers=2) as executor:
        future_gem = executor.submit(analyze_with_gemini, image_bytes)
        future_hf = executor.submit(analyze_with_huggingface, image_bytes)
        gemini_count = future_gem.result()
        hf_count = future_hf.result()

    # --- 2. Combine results ---
    # If both work, average; otherwise use whichever is non-zero.
    if gemini_count > 0 and hf_count > 0:
        avg_count = round((gemini_count + hf_count) / 2)
    else:
        avg_count = max(gemini_count, hf_count)

    crowd_status = "Low"
    if avg_count > 10:
        crowd_status = "Moderate"
    if avg_count > 25:
        crowd_status = "High"
    if avg_count > 45:
        crowd_status = "Very High"

    print(f"   🧠 AI Result: G={gemini_count}, HF={hf_count} -> Final: {avg_count} ({crowd_status})")

    # --- 3. Update Firestore ---
    if db:
        try:
            # Path matches frontend: collection('public').doc('data').collection('buses')
            bus_ref = (
                db.collection("public")
                .document("data")
                .collection("buses")
                .document(bus_id)
            )

            bus_data = {
                "id": bus_id,
                "lat": bus_lat,
                "lng": bus_lng,
                "speed": bus_speed,
                "peopleCount": avg_count,
                "crowdLevel": crowd_status,
                "lastUpdated": firestore.SERVER_TIMESTAMP,
            }

            # merge=True so we don’t wipe routeNo/destination, etc.
            bus_ref.set(bus_data, merge=True)
            print("   💾 Firestore Updated!")
        except Exception as e:
            print(f"   ❌ Firestore Write Failed: {e}")

    return {"status": "success", "people_count": avg_count}


# --- 6. SERVE REACT STATIC FILES (for /, /index.html, etc.) ---

if os.path.exists("build"):
    app.mount("/", StaticFiles(directory="build", html=True), name="static")


# --- 7. LOCAL DEV ENTRYPOINT (HF Spaces ignores this and runs uvicorn itself) ---

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
