#include "esp_camera.h"
#include <TinyGPS++.h>
#define TINY_GSM_MODEM_SIM800 // Tell library we are using SIM800
#include <TinyGsmClient.h>
#include <SoftwareSerial.h>

// --- USER CONFIGURATION ---
const char apn[]  = "dialogbb"; // Your APN (dialogbb, mobitel, etc)
const char user[] = "";         // Often empty
const char pass[] = "";         // Often empty

// Backend (Your HF Space)
const char server[] = "anhaj-bus-tracker.hf.space";
const char resource[] = "/api/update-bus";
const int  port = 443; // HTTPS

// --- PIN DEFINITIONS ---
// SIM800L (Connected to 12 and 13)
#define SIM_TX_PIN 13 // Connect to SIM TX
#define SIM_RX_PIN 12 // Connect to SIM RX

// GPS (Connected to 14 and 15)
#define GPS_TX_PIN 15 // Connect to GPS TX
#define GPS_RX_PIN 14 // Connect to GPS RX

// Camera Pins (AI-Thinker)
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// --- OBJECTS ---
TinyGPSPlus gps;
SoftwareSerial SerialGPS(GPS_TX_PIN, GPS_RX_PIN);
SoftwareSerial SerialAT(SIM_TX_PIN, SIM_RX_PIN); // RX, TX
TinyGsm modem(SerialAT);
TinyGsmClientSecure client(modem);

void setup() {
  // 1. Init Debug Serial
  Serial.begin(115200);
  Serial.println("\n--- BUS TRACKER STARTING ---");

  // 2. Init GPS
  SerialGPS.begin(9600);
  Serial.println("GPS Serial Started");

  // 3. Init SIM800L
  SerialAT.begin(9600);
  delay(3000);
  Serial.println("Initializing Modem...");
  modem.restart();
  String modemInfo = modem.getModemInfo();
  Serial.print("Modem: ");
  Serial.println(modemInfo);

  // 4. Connect to 2G Network
  Serial.print("Connecting to GPRS...");
  if (!modem.gprsConnect(apn, user, pass)) {
    Serial.println(" FAILED");
    delay(10000);
    ESP.restart();
  }
  Serial.println(" CONNECTED!");

  // 5. Init Camera
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  
  // OPTIMIZATION FOR 2G SPEED
  config.frame_size = FRAMESIZE_QVGA; // 320x240 (Small file)
  config.jpeg_quality = 15;           // Low quality (Faster upload)
  config.fb_count = 1;

  if (esp_camera_init(&config) != ESP_OK) {
    Serial.println("Camera Init Failed");
    return;
  }
  Serial.println("Camera Ready.");
}

void loop() {
  // --- STEP 1: GET GPS LOCATION ---
  Serial.println("Reading GPS (Waiting 2s)...");
  float lat = 0.0;
  float lng = 0.0;
  float speed = 0.0;
  
  unsigned long start = millis();
  while (millis() - start < 2000) { // Listen to GPS for 2 seconds
    while (SerialGPS.available() > 0) {
      gps.encode(SerialGPS.read());
    }
  }

  if (gps.location.isValid()) {
    lat = gps.location.lat();
    lng = gps.location.lng();
    speed = gps.speed.kmph();
    Serial.printf("GPS Fixed: %f, %f\n", lat, lng);
  } else {
    Serial.println("No GPS Fix (Sending 0,0)");
  }

  // --- STEP 2: TAKE PHOTO ---
  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera Capture Failed");
    return;
  }
  Serial.printf("Photo Taken: %d bytes\n", fb->len);

  // --- STEP 3: UPLOAD TO SERVER ---
  if (client.connect(server, port)) {
    Serial.println("Connected to Server! Uploading...");
    
    // HTTP Headers
    String head = "--BusTrackerBoundary\r\nContent-Disposition: form-data; name=\"image\"; filename=\"capture.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n";
    String tail = "\r\n--BusTrackerBoundary--\r\n";
    uint32_t totalLen = head.length() + fb->len + tail.length();
  
    // Send Request
    client.println("POST " + String(resource) + " HTTP/1.1");
    client.println("Host: " + String(server));
    client.println("Content-Length: " + String(totalLen));
    client.println("Content-Type: multipart/form-data; boundary=BusTrackerBoundary");
    
    // Send Bus Data Headers
    client.println("bus-id: BUS-99");
    client.println("bus-lat: " + String(lat, 6));
    client.println("bus-lng: " + String(lng, 6));
    client.println("bus-speed: " + String(speed));
    client.println(); // End of headers
    
    // Send Body
    client.print(head);
    
    // Send Image in Chunks (Crucial for stability)
    uint8_t *fbBuf = fb->buf;
    size_t fbLen = fb->len;
    for (size_t n = 0; n < fbLen; n = n + 1024) {
      if (n + 1024 < fbLen) {
        client.write(fbBuf, 1024);
        fbBuf += 1024;
      } else if (fbLen % 1024 > 0) {
        size_t remainder = fbLen % 1024;
        client.write(fbBuf, remainder);
      }
    }
    
    client.print(tail);
    
    // Read Response
    long timeout = millis();
    while (client.connected() && millis() - timeout < 10000) {
      while (client.available()) {
        char c = client.read();
        Serial.print(c);
        timeout = millis();
      }
    }
    client.stop();
    Serial.println("\nUpload Complete!");
    
  } else {
    Serial.println("Connection to Server Failed");
  }
  
  esp_camera_fb_return(fb);

  // --- STEP 4: WAIT ---
  Serial.println("Waiting 60 seconds...");
  delay(60000); 
}