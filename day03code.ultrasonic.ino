#include<ESP8266wifi.h>


//replace with your wi-fi credentials
const char *ssid = "//ur home wifi id ";
const char *password = "//pswrd";

//ultrasonic pinsD1
#define TRIG D1
#define ECHO D2

WifiServer server(80);


void setup(){
 serial.begin(115200);
 pinMode(TRIG,OUTPUT);
 pinMode(ECHO,INPUT);

 //CONNECT TO WIFI
 Serial.print("Connecting To Wifi");
 wifi.begin(ssid, password);
 while (wifi.status() ! =WL_CONNECTED {
  delay(500);
  Serial.print(".");
 }
 
 Serial.print.ln();
 Serial.print(Connected To IP Address "";
 Serial.println(WiFi.localLIP());

 server.begin();
}

 void loop() {
  //accept client connection
  WiFiClient client = server.available();
  if (!client) return;

  while (!client.available()) delay(1);

  //---Measure Distance---
  digitalWrite(TRIG,LOW);
  delayMicroseconds(5);
  digitalWrite(TRIG,HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG,LOW);
 }

 long duration = pulseIN(ECHO,HIGH, 30000); //timeout for reliability
 float disatnce = duration * 0.0343/2;

 if (duration ==0) distance = 0;

 Serial.print("Distance: ");
 Serial.print(distance);
 Serial.println("cm");


 //---Send HTTP response---
 client.println("HTTP/1.1 200 OK");
 client.println("Content-Type : text/html");
 client.println("connection: close");
 client.println("");


 
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