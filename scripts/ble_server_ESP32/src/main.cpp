#include <WiFi.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "main.h"

#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define COMMAND_CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define TEMP_CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a9"

// Init 433MHz Pilight Transmission
#define TRANSMITTER_PIN 22
ESPiLight rf(TRANSMITTER_PIN);

// Init Temp Sensor
#define ONE_WIRE_BUS 23
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

BLECharacteristic* pCharacteristicTemp = NULL;
CommandCallback *ccb;
int count = 0;

CommandCallback::CommandCallback() {
} 

void CommandCallback::onWrite(BLECharacteristic *pCharacteristicCommand) {
    std::string command = pCharacteristicCommand->getValue();

    if (command.length() > 0) {
      if (command[0] == 'y'){
        //Serial.println("Turning heating on.");
        turn_heating_on = true;
      }
      else if (command[0] == 'n') {
        //Serial.println("Turning heating off.");
        turn_heating_on = false;
      }
      else {
        Serial.println("Unexpected command.");
      }
      signalReceived = true;
    }
  }

bool CommandCallback::receivedSignal() {
  if (signalReceived) {
    signalReceived = false;
    return true;
  }
  return false;
}

void sendCommand(bool turn_on) {
  if (turn_on) {
    Serial.println("Turning Heating On");
    rf.send("arctech_switch", "{\"id\":15634410,\"unit\":15,\"on\":1}"); 
  }
  else {
    Serial.println("Turning Heating Off");
    rf.send("arctech_switch", "{\"id\":15634410,\"unit\":15,\"off\":1}");  
  }
}


void setup() { 
  Serial.begin(115200);
  sensors.begin();

  BLEDevice::init("heating_controller");
  BLEServer *pServer = BLEDevice::createServer();

  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create the command characteric
  BLECharacteristic *pCharacteristicCommand = pService->createCharacteristic(
                                         COMMAND_CHARACTERISTIC_UUID,
                                         BLECharacteristic::PROPERTY_READ |
                                         BLECharacteristic::PROPERTY_WRITE
                                       );
  ccb = new CommandCallback();
  pCharacteristicCommand->setCallbacks(ccb);
  pCharacteristicCommand->setValue("n");

  // Create the temperature characteristic
  pCharacteristicTemp = pService->createCharacteristic(
                                         TEMP_CHARACTERISTIC_UUID,
                                         BLECharacteristic::PROPERTY_READ
                                       );
  pCharacteristicTemp->setValue("127");
  
  pService->start();
  BLEAdvertising *pAdvertising = pServer->getAdvertising();
  pAdvertising->start();

  // rf.send("arctech_switch", "{\"id\":15634410,\"unit\":15,\"on\":1}");
  // delay(300);
  // rf.send("arctech_switch", "{\"id\":15634410,\"unit\":15,\"off\":1}");
}


void loop() {

  if (ccb->receivedSignal()) {
    sendCommand(ccb->heating_on());
    count = 0;  

    // Update temperature
    // (should ideally be done in the onRead callback)
    sensors.requestTemperatures();
    int temp = sensors.getTempCByIndex(0);  
    Serial.print("TEMP: ");
    Serial.print(sensors.getTempCByIndex(0));  
    Serial.println(" °C");    
    char tempBuf [10];
    snprintf(tempBuf,10, "%d", temp); // solarlogger
    pCharacteristicTemp->setValue(tempBuf);
  } 
  else {
    count++;
  }

  if (count>60) {
    sendCommand(false);
    ESP.restart();
  }

  delay(1000); 
}
