from serial import Serial
from serial import SerialException
import requests
import json
import threading
import sys
import os


def serial_read(ser):
    while True:
        line = ser.readline().decode('utf-8')[:-2]
        if line:
            print(line)


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

