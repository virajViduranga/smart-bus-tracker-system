#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include "esp_camera.h"
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

// ======================= CONFIGURATION =======================
const char* ssid = "Anhaj’s iPhone"; 
const char* password = "87654321";

// YOUR HUGGING FACE SERVER DETAILS
// Example: if url is "https://buslink-backend.hf.space" -> host is "buslink-backend.hf.space"
const char* host = "YOUR-SPACE-NAME.hf.space"; 
const int httpsPort = 443;

// BUS IDENTITY (Hardcoded for this specific ESP32)
const String BUS_ID = "bus_154_01"; 
// =============================================================

// CAMERA PINS (AI THINKER)
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

void setup() {
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);
  Serial.begin(115200);

  // 1. Connect WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi Connected!");

  // 2. Init Camera
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
  config.frame_size = FRAMESIZE_VGA; // 640x480
  config.jpeg_quality = 12;
  config.fb_count = 1;

  if (esp_camera_init(&config) != ESP_OK) {
    Serial.println("Camera Init Failed");
    return;
  }
  Serial.println("System Ready. Type 'update' to send data.");
}

void sendDataToServer(camera_fb_t *fb) {
  WiFiClientSecure client;
  client.setInsecure(); // Skip cert check

  Serial.print("Connecting to Server: ");
  Serial.println(host);

  if (client.connect(host, httpsPort)) {
    Serial.println("Connected!");

    // --- MOCK GPS DATA (Replace with Real GPS Reading later) ---
    // Simulating Bus 154 moving near NIBM
    float myLat = 6.9065 + (random(-10, 10) * 0.0001); 
    float myLng = 79.8708 + (random(-10, 10) * 0.0001);
    float mySpeed = 25.5;

    // --- CONSTRUCT HTTP REQUEST ---
    String head = "--BusLinkBoundary\r\nContent-Disposition: form-data; name=\"file\"; filename=\"capture.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n";
    String tail = "\r\n--BusLinkBoundary--\r\n";

    // We send headers so app.py knows who we are
    client.println("POST /api/update-bus HTTP/1.1");
    client.println("Host: " + String(host));
    client.println("Content-Type: image/jpeg"); // Sending Raw Bytes usually easier for simple endpoint
    
    // CRITICAL HEADERS FOR APP.PY
    client.println("bus-id: " + BUS_ID);
    client.println("bus-lat: " + String(myLat, 6));
    client.println("bus-lng: " + String(myLng, 6));
    client.println("bus-speed: " + String(mySpeed, 1));
    
    client.println("Content-Length: " + String(fb->len));
    client.println(); // End Headers

    // SEND IMAGE BINARY
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

    // READ RESPONSE
    Serial.println("Data Sent. Waiting for response...");
    long timeout = millis();
    while (client.connected() && millis() - timeout < 10000) {
      if (client.available()) {
        String line = client.readStringUntil('\n');
        Serial.println(line); // Debug output
      }
    }
    client.stop();
    Serial.println("Connection closed.");

  } else {
    Serial.println("Connection Failed.");
  }
}

void loop() {
  if (Serial.available()) {
    while(Serial.available()) Serial.read();
    Serial.println("Capturing...");
    
    camera_fb_t * fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("Capture Failed");
      return;
    }
    
    sendDataToServer(fb);
    esp_camera_fb_return(fb);
  }
}