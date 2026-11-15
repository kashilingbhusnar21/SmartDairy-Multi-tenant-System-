#!/usr/bin/env python3
"""
DairyAI Nexus - 4G Cellular IoT Gateway Simulator (M2M Direct Telemetry)
Simulates an autonomous embedded 4G LTE cellular telemetry module (ESP32 + SIM7600)
transmitting milk intake readings directly over the internet to Dairy360 Cloud Backend.

No browser, No USB cable, No Bluetooth required.
"""

import sys
import time
import json
import random

try:
    import urllib.request
    import urllib.error
    HAS_URLLIB = True
except ImportError:
    HAS_URLLIB = False

BANNER = """
====================================================================
      DAIRYAI NEXUS - 4G CELLULAR IoT GATEWAY SIMULATOR (M2M)
====================================================================
  Mode: Autonomous Cellular IoT Telemetry (Airtel / Jio M2M SIM)
  Target: Direct HTTP/HTTPS Cloud Ingestion
====================================================================
"""

def send_telemetry(base_url, device_key, farmer_id, qty, fat, snf, clr=28.0):
    url = f"{base_url.rstrip('/')}/api/iot/milk-intake"
    payload = {
        "farmerId": int(farmer_id),
        "quantityLiters": float(qty),
        "fatPercentage": float(fat),
        "snfPercentage": float(snf),
        "clr": float(clr)
    }

    headers = {
        "Content-Type": "application/json",
        "X-Device-Key": device_key,
        "User-Agent": "DairyAI-4G-Gateway/1.0 (SIM7600G-LTE; ESP32)"
    }

    json_bytes = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=json_bytes, headers=headers, method="POST")

    timestamp = time.strftime("%H:%M:%S")
    print(f"\n[{timestamp}] 📡 4G LTE DISPATCH >> {url}")
    print(f"[{timestamp}] 🔑 X-Device-Key : {device_key}")
    print(f"[{timestamp}] 📦 Payload      : Farmer #{farmer_id} | Qty: {qty}L | FAT: {fat}% | SNF: {snf}%")

    try:
        with urllib.request.urlopen(req, timeout=8) as response:
            status_code = response.getcode()
            response_body = response.read().decode("utf-8")
            data = json.loads(response_body)

            print(f"[{timestamp}] ✅ [HTTP {status_code} CREATED] Cloud Acknowledgement Received!")
            print(f"       ├── Collection ID : #{data.get('collectionId')}")
            print(f"       ├── Farmer Name   : {data.get('farmerName')}")
            print(f"       ├── Rate / Liter  : ₹{data.get('ratePerLiter')}")
            print(f"       ├── Total Payout  : ₹{data.get('totalAmount')}")
            print(f"       ├── SMS Dispatched: {data.get('smsDispatched')}")
            print(f"       └── Status        : {data.get('status')}")
            return True
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"[{timestamp}] ❌ [HTTP {e.code}] Telemetry Rejected by Cloud:")
        print(f"       └── Error: {err_body}")
        return False
    except Exception as e:
        print(f"[{timestamp}] ⚠️ Connection Error: {e}")
        print("       (Make sure Spring Boot backend is running on localhost:8080)")
        return False

def main():
    print(BANNER)

    base_url = "http://localhost:8080"
    device_key = "EKOMILK_BOOTH_01"

    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    if len(sys.argv) > 2:
        device_key = sys.argv[2]

    print(f"Cloud Target Endpoint : {base_url}/api/iot/milk-intake")
    print(f"Hardware Device Key   : {device_key}\n")

    print("Select an action:")
    print("  [1] Send Cow Milk Sample     (Farmer #101 | FAT: 4.10% | SNF: 8.60% | WT: 12.50 L)")
    print("  [2] Send Buffalo Milk Sample (Farmer #101 | FAT: 6.80% | SNF: 8.90% | WT: 15.00 L)")
    print("  [3] Send Custom Sample       (Input your own Farmer ID & Readings)")
    print("  [4] Auto-Stream Loop         (Simulates live morning shift collection every 4s)")
    print("  [Q] Exit")
    print("-" * 68)

    while True:
        try:
            choice = input("\nEnter choice [1-4 or Q]: ").strip().upper()
            if choice == "Q":
                print("Exiting 4G IoT Gateway simulator. Have a great day!")
                break
            elif choice == "1":
                send_telemetry(base_url, device_key, farmer_id=101, qty=round(random.uniform(8.0, 16.0), 2), fat=4.10, snf=8.60)
            elif choice == "2":
                send_telemetry(base_url, device_key, farmer_id=101, qty=round(random.uniform(10.0, 20.0), 2), fat=6.80, snf=8.90)
            elif choice == "3":
                fid = input("Enter Farmer ID (e.g. 101): ").strip()
                qty = input("Enter Milk Quantity in Liters (e.g. 12.5): ").strip()
                fat = input("Enter FAT % (2.5 - 9.0): ").strip()
                snf = input("Enter SNF % (7.5 - 9.0): ").strip()
                send_telemetry(base_url, device_key, fid, qty, fat, snf)
            elif choice == "4":
                print("\n[INFO] Starting autonomous 4G shift telemetry stream (Ctrl+C to stop)...")
                count = 1
                while True:
                    qty = round(random.uniform(6.0, 25.0), 2)
                    fat = round(random.uniform(3.5, 7.5), 2)
                    snf = round(random.uniform(8.0, 8.9), 2)
                    print(f"\n--- Transmitting Intake #{count} ---")
                    send_telemetry(base_url, device_key, farmer_id=101, qty=qty, fat=fat, snf=snf)
                    count += 1
                    time.sleep(4)
        except KeyboardInterrupt:
            print("\nStopped stream.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    main()
