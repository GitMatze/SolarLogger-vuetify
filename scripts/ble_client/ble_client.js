/* eslint-disable handle-callback-err */

// const noble = require('noble');
const noble = require('noble');
const axios = require('axios')

var intervalObject = null
var command_characteristic = null
var temp_characteristic = null

const COMMAND_CHARACTERISTIC_UUID = "beb5483e36e14688b7f5ea07361b26a8";
const TEMP_CHARACTERISTIC = 'beb5483e36e14688b7f5ea07361b26a9';
url = 'http://localhost:5000/api/water_control'

noble.on('stateChange', state => {
    console.log('State changed to: ' + state)
    if (state === 'poweredOn') {
        console.log('Scanning');
        noble.startScanning();
    } else {
        noble.stopScanning();
        clearInterval(intervalObject);
    }
});

noble.on('discover', peripheral => {
    // connect to the first peripheral that is scanned
    const name = peripheral.advertisement.localName;
    console.log('Found Device: ' + name)
    if (name == 'heating_controller') {
        console.log(`Connecting to '${name}' ${peripheral.id}`);
        noble.stopScanning();
        connectAndSetUp(peripheral);
    }

});

function connectAndSetUp(peripheral) {
    peripheral.connect(error => {
        console.log('Connected to', peripheral.id);

        peripheral.discoverAllServicesAndCharacteristics(
            onServicesAndCharacteristicsDiscovered
        );
    });

    peripheral.on('disconnect', () => {
        console.log('disconnected')
        clearInterval(intervalObject);
        if (noble.state === 'poweredOn') {
            noble.startScanning();
        }
    });
}

function onServicesAndCharacteristicsDiscovered(error, services, characteristics) {
    console.log('Checking characteristics')
    characteristics.forEach((ch, chID) => {
        // console.log(ch.uuid)
        if (ch.uuid == COMMAND_CHARACTERISTIC_UUID) {
            console.log('Found Command Characteristic')
            command_characteristic = ch;
            
            var message = Buffer.from('Hallo', 'utf-8');
            console.log(`Sending:  '${message}'`);
            command_characteristic.write(message);
            
            startJob();
        }
        if (ch.uuid == TEMP_CHARACTERISTIC) {
            console.log('Found Temperature Characteristic')
            temp_characteristic = ch;
        }
    })
}

function startJob() {
    intervalObject = setInterval(() => {
        temp_characteristic.read((error, temp) => {
            console.log('Received temp data: ' + temp)
            axios.get(`${url}/${temp}`)
                .then(resp => {
                    console.log(resp.data)
                    var heat_on = resp.data[0]['heat_on'];
                    var message = Buffer.from(`${heat_on}`, 'utf-8');
                    console.log(`Sending:  '${message}'`);
                    command_characteristic.write(message);
                })
                .catch(err => {
                    // Handle Error Here
                    console.error(err);
                });
        })
    }, 5000);
}
