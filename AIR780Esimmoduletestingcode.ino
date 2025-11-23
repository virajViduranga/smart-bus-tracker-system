



void setup() {
  Serial.begin(115200);          // Serial Monitor
  AIR.begin(115200, SERIAL_8N1, 16, 17);   // AIR780E connected here

  delay(2000);
  Serial.println("AIR780E Testing Started...");
}

void loop() {
 
  while (AIR.available()) {
    Serial.write(AIR.read());
  }

  // Read commands from ESP32 Serial Monitor and send to module
  while (Serial.available()) {
    AIR.write(Serial.read());
  }
}
