# DairyAI Nexus - Ekomilk & Weighing Scale Hardware Simulator

This guide explains how to connect and test the **Rapid POS** interface with a virtual Ekomilk machine on Windows without needing any physical wires or hardware equipment.

---

## 1. Quick In-Browser Test (Zero Setup Required)

If you just want to test right now inside Chrome:

1. Open DairyAI Nexus at: `http://localhost:5174/rapid-collection` (or click **Rapid POS** on the sidebar).
2. Type a Farmer ID (e.g. `16`) and hit `[ENTER]`. The farmer's name appears with a chime.
3. Look at the top bar and click:
   - `🐄 Cow Sample` (instantly simulates FAT: 4.10%, SNF: 8.60%, Weight: 11.20L)
   - Or `🐃 Buffalo Sample` (FAT: 6.80%, SNF: 9.20%, Weight: 14.80L)
4. Notice how the live rate and total amount calculate immediately, and hitting `[ENTER]` saves the intake and plays the success chime!

---

## 2. Full "Ghost Hardware" Virtual Serial Setup (Windows)

To simulate a real USB/RS-232 cable between Python and Chrome using the Web Serial API:

### Step A: Install `com0com` (Null-Modem Emulator)
1. Download the free Windows utility **com0com** (Null-modem emulator):
   - Direct SourceForge Download: [com0com on SourceForge](https://sourceforge.net/projects/com0com/)
2. Open the **Setup Command Prompt** of com0com and run:
   ```cmd
   install PortName=COM1 PortName=COM2
   ```
   *This creates a virtual telephone wire: anything sent into COM1 instantly comes out of COM2.*

### Step B: Run the Python Simulator on COM1
In a PowerShell or Command Prompt terminal:
```bash
pip install pyserial
python hardware_simulator/ghost_ekomilk.py COM1
```

### Step C: Connect DairyAI Nexus to COM2
1. In Google Chrome, go to `http://localhost:5174/rapid-collection`.
2. Click **[ 🔗 Connect Serial Port ]**.
3. Chrome will display the native Windows port selection dialog: choose **COM2** and click **Connect**.
4. The status indicator will turn **🟢 Online (COM2)**.
5. In your Python terminal, press `[1]` or `[5]` (Auto-Loop).
6. Watch Chrome instantly receive the reading, update the fields with an emerald flash, compute the money, and be ready to save!
