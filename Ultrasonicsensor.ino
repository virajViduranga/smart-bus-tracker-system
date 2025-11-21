#include <ESP8266WiFi.h>

const char* ssid = "";
const char* password = "";

#define TRIG D1
#define ECHO D2

WiFiServer server(80);

void setup() {
  Serial.begin(9600);
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);

  WiFi.begin(ssid, password);
  Serial.println("\nConnecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nConnected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  server.begin();
}



void loop() {
  WiFiClient client = server.available();
  if(!client.available()) delay(1);

  // -- Mesure Distance
  digitalWrite(TRIG, LOW);
  delayMicroseconds(5);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, loW);

  long duration = pulseIN(ECHO, HIGH 30000); // timeout for reliability
  float distance = duration * 0.0343 / 2;

  if (duration == 0) distance = 0;

  Serial.print("Distance:");
  Serial.print(Distance);
  Serial.println("cm");

  // -- Send HTTP response
  Serial.println("HTTP/1.1200 OK");
  Serial.println("Content-Type: text/html");
  Serial.println("Connection: close");
  Serial.println("");


  client.println("<!DOCTYPE html>");
  client.println("<html>");
  client.println("<head>");
  client.println("<meta http-equiv='refresh' content='1'>");
  client.println("<meta name='viewport' content='width=device-width, initial-scale=1'>");
  client.println("<title> Ulteasonic Distance</title>");
  client.println("<stype>");
  client.println("< body{ font-family: Arial; text-align: center; background: #f7f7f7;} >");
  client.println("h1{ color: #333}");
  client.println("div{ margin-top: 30px; font-size: 2em;}");
  client.println("</style></head><body>");
  client.println("<h1> NodeMCU Ultrasonic Distance</h1>");
  client.println("<div>Distance: <b>");
  client.println(distance, 2);
  client.println("cm</b></div>");
  client.println("</body></html>");

  delay(500);

}