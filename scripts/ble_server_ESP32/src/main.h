#ifndef MAIN_H
#define MAIN_H

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <ESPiLight.h>

class CommandCallback: public BLECharacteristicCallbacks {

public:
    CommandCallback();
    void onWrite(BLECharacteristic *pCharacteristicCommand);

    bool receivedSignal();

    bool heating_on() { return turn_heating_on; }

private:
    bool signalReceived = false;
    bool turn_heating_on = false;
  
};

#endif /* MAIN_H */
