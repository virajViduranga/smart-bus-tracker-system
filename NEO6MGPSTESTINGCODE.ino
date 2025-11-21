#include <TinyGPS++.h>

TinyGPSPlus gps;
HardwareSerial GPS(1);

void setup() {
  Serial.begin(115200);

  GPS.begin(9600, SERIAL_8N1, 16, 17); 
  // GPS TX → GPIO16, GPS RX → GPIO17

  Serial.println("ESP32 NEO-6M GPS Test Started...");
}

void loop() {
  while (GPS.available()) {
    gps.encode(GPS.read());

    if (gps.location.isUpdated()) {
      Serial.print("Lat: ");
      Serial.println(gps.location.lat(), 6);

      Serial.print("Lng: ");
      Serial.println(gps.location.lng(), 6);

      Serial.print("Satellites: ");
      Serial.println(gps.satellites.value());

      Serial.println("-------------------");
    }
  }
}
