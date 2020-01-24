#!/usr/bin/python
# -*- coding: utf-8 -*-

from serial import Serial
from serial import SerialException
import requests
import json
import threading
import sys
import os

### JSON Template ###
pv_json = {"energy": 0, "power": 0}
grid_json = {"energy_in": 0, "energy_out": 0, "power": 0}

headers = {'Content-Type': 'application/json'}

grid_api = "http://127.0.0.1:5000/api/grid"
pv_api = "http://127.0.0.1:5000/api/pv"

### Energy Data ###
grid_energy_out_mwh = 0
grid_energy_in_mwh = 0
grid_power_w = 0

pv_energy = 0
pv_power = 0

### miscellanious
post_timeout = 2 # seconds
debug_output = False

os.environ['NO_PROXY'] = '127.0.0.1'

def represents_float(str):
    try:
        float(str)
        return True
    except ValueError:
        return False
    
def serial_read(ser):
    while True:
        line = ser.readline().decode('utf-8')[:-2]
        if line:
            if '/ESY5Q3D' in line: # grid meter
                read_grid_meter(ser)
            elif '/EBZ5DD3' in line: # pv meter
                read_pv_meter(ser)

def read_grid_meter(ser):
    grid_set_complete = 0b000 # bit2 (left) = energy_out, bit1 = energy_in, bit0 = power 
    while grid_set_complete != 0b111:
        # Read a line and convert it from b'xxx\r\n' to xxx
        line = ser.readline().decode('utf-8')[:-2]
        if line:  
            if '1-0:1.8.0' in line: # consumed energy in kwh
                grid_energy_out_kwh = line[14:-5]
                if represents_float(grid_energy_out_kwh): 
                    grid_energy_out_mwh = int(1000000 * float(grid_energy_out_kwh))
                    grid_set_complete = grid_set_complete | 0b100
            elif '1-0:2.8.0' in line: # energy fed into grid in kwh
                grid_energy_in_kwh = line[14:-5] 
                if represents_float(grid_energy_in_kwh): 
                    grid_energy_in_mwh = int(1000000 * float(grid_energy_in_kwh))
                    grid_set_complete = grid_set_complete | 0b010
            elif '1-0:1.7.0' in line: # consumed power in W
                grid_power_w_str = line[14:-3]
                if represents_float(grid_power_w_str):
                    grid_power_w = int(float(grid_power_w_str))
                    grid_set_complete = grid_set_complete | 0b001

    # send post request
    grid_json["energy_in"] = grid_energy_in_mwh
    grid_json["energy_out"] = grid_energy_out_mwh
    grid_json["power"] = grid_power_w
    try:
        response = requests.post(grid_api, headers=headers, data=json.dumps(grid_json), timeout=post_timeout)
    except requests.exceptions.RequestException as e:  # This is the correct syntax
        pass # failed to connect
    if debug_output:
        print(grid_json)

def read_pv_meter(ser):
    pv_set_complete = 0b00 # bit1 (left) = energy, bit0 = power
    while pv_set_complete != 0b11:
        # Read a line and convert it from b'xxx\r\n' to xxx
        line = ser.readline().decode('utf-8')[:-2]
        if line:  
            if '1-0:2.8.0' in line: # produced energy in kwh
                pv_energy_str = line[14:-5]
                if represents_float(pv_energy_str): 
                    pv_energy = int(1000000 * float(pv_energy_str))
                    pv_set_complete = pv_set_complete | 0b10
            elif '1-0:16.7.0' in line: # currently provided power
                pv_power_str = line[15:-3]
                if represents_float(pv_power_str): 
                    pv_power = int(abs(float(pv_power_str)))
                    pv_set_complete = pv_set_complete | 0b01
            
    # send post request
    pv_json["energy"] = pv_energy
    pv_json["power"] = pv_power
    try:
        response = requests.post(pv_api, headers=headers, data=json.dumps(pv_json), timeout=post_timeout)
    except requests.exceptions.RequestException as e:  # This is the correct syntax
        pass # failed to connect
    if debug_output:
        print(pv_json)

         
def main():
    try:
        ser0 = Serial('/dev/ttyUSB0', 9600, 7, 'E', 1)
        ser1 = Serial('/dev/ttyUSB1', 9600, 7, 'E', 1)

        thread0 = threading.Thread(target=serial_read, args=(ser0,),).start()
        thread1 = threading.Thread(target=serial_read, args=(ser1,),).start()

    except SerialException:
        print("Failed to open serial ports. Exiting...")
        sys.exit()


if __name__ == '__main__':
    main()
