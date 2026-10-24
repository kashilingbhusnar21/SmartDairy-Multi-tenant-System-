#!/usr/bin/env python3
"""
DairyAI Nexus - Ghost Ekomilk Hardware Simulator
Simulates physical RS-232 / USB Serial output from milk analyzers & weighing scales:
- Ekomilk Ultra / Horizon
- Lactoscan MCC
- Essae / Avery Weighing Scale

Setup with com0com (Virtual COM Port Pair):
1. Create a pair: COM1 <--> COM2
2. Run this script on COM1:  python ghost_ekomilk.py COM1
3. In DairyAI Rapid POS (in Chrome): Click [ Connect Serial Port ] and pick COM2!
"""

import sys
import time
import random

try:
    import serial
    HAS_PYSERIAL = True
except ImportError:
    HAS_PYSERIAL = False

BANNER = """
====================================================================
           DAIRYAI NEXUS - GHOST EKOMILK SIMULATOR (RS-232)
====================================================================
"""

def generate_payload(fat, snf, clr=28.0, weight=None):
    """
    Format standard ASCII string used by Indian milk analyzers.
    Example: FAT=04.20  SNF=08.80  CLR=28.50  WT=12.50\r\n
    """
    parts = [
        f"FAT={float(fat):05.2f}",
        f"SNF={float(snf):05.2f}",
        f"CLR={float(clr):05.2f}"
    ]
    if weight is not None:
        parts.append(f"WT={float(weight):05.2f}")
    
    return "  ".join(parts) + "\r\n"

def send_frame(ser, payload_str):
    raw_bytes = payload_str.encode("ascii")
    if ser:
        ser.write(raw_bytes)
        ser.flush()
    timestamp = time.strftime("%H:%M:%S")
    print(f"[{timestamp}] TRANSMITTED >> {payload_str.strip()}")

def main():
    print(BANNER)

    port_name = "COM1"
    baud_rate = 9600

    if len(sys.argv) > 1:
        port_name = sys.argv[1].upper()
    if len(sys.argv) > 2:
        baud_rate = int(sys.argv[2])

    ser = None
    if HAS_PYSERIAL:
        try:
            ser = serial.Serial(port_name, baudrate=baud_rate, timeout=1)
            print(f"[OK] Successfully opened virtual serial port: {port_name} @ {baud_rate} baud (8-N-1).")
        except Exception as e:
            print(f"[WARN] Could not open {port_name}: {e}")
            print("Running in PREVIEW/TEST MODE (printing payload to screen without physical COM write).")
            print("Tip: Install and configure com0com to create linked COM1 <--> COM2 ports.\n")
    else:
        print("[WARN] 'pyserial' package is not installed.")
        print("To send real bytes through virtual COM port:  pip install pyserial")
        print("Running in PREVIEW MODE.\n")

    print("\nSelect an action:")
    print("  [1] Send Standard Cow Milk    (FAT: 4.10% | SNF: 8.60% | WT: 10.50 L)")
    print("  [2] Send Rich Buffalo Milk   (FAT: 6.80% | SNF: 8.90% | WT: 14.50 L)")
    print("  [3] Send Low-Fat Cow Sample  (FAT: 3.50% | SNF: 8.40% | WT:  8.00 L)")
    print("  [4] Send Custom Sample       (Input your own values)")
    print("  [5] Auto-Stress Loop         (Sends realistic random sample every 3 seconds)")
    print("  [Q] Exit")
    print("-" * 68)

    while True:
        try:
            choice = input("\nEnter choice [1-5 or Q]: ").strip().upper()
            if choice == "Q":
                print("Exiting simulator. Happy dairy farming!")
                break
            elif choice == "1":
                payload = generate_payload(fat=4.10, snf=8.60, clr=28.0, weight=round(random.uniform(8.0, 15.0), 2))
                send_frame(ser, payload)
            elif choice == "2":
                payload = generate_payload(fat=6.80, snf=8.90, clr=30.5, weight=round(random.uniform(10.0, 20.0), 2))
                send_frame(ser, payload)
            elif choice == "3":
                payload = generate_payload(fat=3.50, snf=8.40, clr=27.5, weight=round(random.uniform(6.0, 12.0), 2))
                send_frame(ser, payload)
            elif choice == "4":
                fat_in = input("  Enter FAT % [e.g. 4.2]: ") or "4.2"
                snf_in = input("  Enter SNF % [e.g. 8.8]: ") or "8.8"
                wt_in  = input("  Enter Weight (L) [e.g. 12.5]: ") or "12.5"
                payload = generate_payload(fat=float(fat_in), snf=float(snf_in), clr=28.5, weight=float(wt_in))
                send_frame(ser, payload)
            elif choice == "5":
                print("\n[STARTED] Auto-Stress Loop. Transmitting every 3s... (Press Ctrl+C to stop)")
                try:
                    count = 1
                    while True:
                        # Randomize slightly around cow/buffalo ranges
                        is_cow = random.choice([True, False])
                        if is_cow:
                            f = round(random.uniform(3.7, 4.4), 2)
                            s = round(random.uniform(8.4, 8.8), 2)
                            w = round(random.uniform(7.5, 16.0), 2)
                        else:
                            f = round(random.uniform(6.2, 7.5), 2)
                            s = round(random.uniform(8.5, 8.95), 2)
                            w = round(random.uniform(10.0, 22.0), 2)
                        
                        payload = generate_payload(fat=f, snf=s, clr=29.0, weight=w)
                        print(f"Sample #{count}:", end=" ")
                        send_frame(ser, payload)
                        count += 1
                        time.sleep(3)
                except KeyboardInterrupt:
                    print("\n[STOPPED] Auto loop paused.")
            else:
                print("Invalid option. Please choose 1, 2, 3, 4, 5, or Q.")
        except KeyboardInterrupt:
            print("\nExiting.")
            break
        except Exception as e:
            print(f"[ERROR] {e}")

    if ser:
        ser.close()

if __name__ == "__main__":
    main()
