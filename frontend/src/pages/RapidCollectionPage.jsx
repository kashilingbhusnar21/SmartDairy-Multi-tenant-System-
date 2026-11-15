import { useState, useEffect, useCallback, useRef } from "react";
import {
  Radio,
  Wifi,
  Send,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RefreshCw,
  Lock,
  User,
  History,
  Activity,
  Server,
  Database,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  XCircle,
  RotateCcw,
  Check
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { listDailyCollections } from "../services/milkCollections";
import { emitIoTTelemetry } from "../services/iotService";
import { todayISO } from "../utils/dateUtils";
import { getAutoShift, formatShiftLabel } from "../utils/shiftUtils";
import { getErrorMessage } from "../utils/errorMessage";
import { getEmail } from "../utils/auth";
import {
  playSuccessChime,
  playErrorBuzz,
  playKeyClick
} from "../utils/audioAlerts";

/**
 * Generates realistic randomized hardware readings from digital scale & Ekomilk analyzer.
 * Guarantees fresh, non-static samples for every milk intake.
 */
function generateRandomSample(type = "random") {
  if (type === "cow") {
    const qty = (6.0 + Math.random() * 11.5).toFixed(2); // 6.00 - 17.50 L
    const fat = (3.6 + Math.random() * 1.1).toFixed(2);  // 3.60 - 4.70%
    const snf = (8.2 + Math.random() * 0.5).toFixed(2);  // 8.20 - 8.70%
    return { qty, fat, snf, type: "Cow" };
  } else if (type === "buffalo") {
    const qty = (7.5 + Math.random() * 14.5).toFixed(2); // 7.50 - 22.00 L
    const fat = (6.2 + Math.random() * 2.2).toFixed(2);  // 6.20 - 8.40%
    const snf = (8.6 + Math.random() * 0.35).toFixed(2); // 8.60 - 8.95%
    return { qty, fat, snf, type: "Buffalo" };
  } else {
    const isBuff = Math.random() > 0.45;
    return generateRandomSample(isBuff ? "buffalo" : "cow");
  }
}

export default function RapidCollectionPage() {
  // Active tenant email
  const currentEmail = getEmail() || "Admin@gmail.com";

  // Operational state
  const [date, setDate] = useState(todayISO());
  const [shift, setShift] = useState(getAutoShift());
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // One-Time Device Pairing & Provisioning State
  const [isPaired, setIsPaired] = useState(() => {
    return localStorage.getItem("dairyai_iot_paired_" + currentEmail) === "true";
  });
  const [pairingEmail, setPairingEmail] = useState(currentEmail);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [pairingLoading, setPairingLoading] = useState(false);

  // 4G IoT Gateway Telemetry State - Starts empty until a sample is triggered or stream received
  const [iotDeviceKey, setIotDeviceKey] = useState(() => currentEmail);
  const [iotFarmerId, setIotFarmerId] = useState(""); // Blank by default - operator enters ID!
  const [iotQty, setIotQty] = useState("");
  const [iotFat, setIotFat] = useState("");
  const [iotSnf, setIotSnf] = useState("");
  const [iotSubmitting, setIotSubmitting] = useState(false);
  const [iotLogs, setIotLogs] = useState([]);

  // Duplicate Milk Entry Confirmation Modal State
  const [duplicateModal, setDuplicateModal] = useState({
    isOpen: false,
    existing: null,
    pendingPayload: null
  });

  // Farmer ID input ref for instant auto-focus & keyboard navigation
  const farmerIdInputRef = useRef(null);

  // Cloud Ingestion Ledger Feed
  const [recentCollections, setRecentCollections] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  // Fullscreen toggle helper
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Fetch daily collections for the active date
  const loadDailyFeed = useCallback(async (selectedDate) => {
    setLoadingRecent(true);
    try {
      const data = await listDailyCollections(selectedDate);
      const list = Array.isArray(data) ? data : data?.content || [];
      setRecentCollections(list);
    } catch {
      // Fallback silently if offline or token expired
    } finally {
      setLoadingRecent(false);
    }
  }, []);

  useEffect(() => {
    loadDailyFeed(date);
  }, [date, loadDailyFeed]);

  // One-Time Device Activation Handlers
  const handleSendOtp = () => {
    if (!pairingEmail || !pairingEmail.includes("@")) {
      toast.error("Please enter a valid registered dairy email address");
      if (audioEnabled) playErrorBuzz();
      return;
    }
    setPairingLoading(true);
    setTimeout(() => {
      const code = String(Math.floor(1000 + Math.random() * 9000));
      setGeneratedOtp(code);
      setOtpSent(true);
      setPairingLoading(false);
      if (audioEnabled) playKeyClick();
      toast(`📨 Activation Code: [ ${code} ] sent to ${pairingEmail}`, {
        duration: 9000,
        icon: "🔐"
      });
    }, 500);
  };

  const handleVerifyPairing = () => {
    if (enteredOtp !== generatedOtp) {
      toast.error("Invalid activation code. Please check the 4-digit code.");
      if (audioEnabled) playErrorBuzz();
      return;
    }
    localStorage.setItem("dairyai_iot_paired_" + pairingEmail, "true");
    setIotDeviceKey(pairingEmail);
    setIsPaired(true);
    if (audioEnabled) playSuccessChime();
    toast.success(`🎉 Device successfully verified & bound to ${pairingEmail}!`, {
      duration: 5000,
      icon: "✅"
    });
  };

  const handleUnpair = () => {
    localStorage.removeItem("dairyai_iot_paired_" + currentEmail);
    setIsPaired(false);
    setOtpSent(false);
    setGeneratedOtp("");
    setEnteredOtp("");
    if (audioEnabled) playKeyClick();
    toast("Device unpaired. Ready for new activation setup.", { icon: "ℹ️" });
  };

  // Clear screen state completely (empty screen after save or on manual reset)
  const clearInputs = useCallback(() => {
    setIotFarmerId("");
    setIotQty("");
    setIotFat("");
    setIotSnf("");
    setTimeout(() => {
      farmerIdInputRef.current?.focus();
    }, 60);
  }, []);

  // Quick Hardware Simulation Presets (Generates dynamic sample & focuses Farmer ID for instant Enter save)
  const applyIoTPreset = (preset) => {
    if (audioEnabled) playKeyClick();
    const sample = generateRandomSample(preset);
    setIotQty(sample.qty);
    setIotFat(sample.fat);
    setIotSnf(sample.snf);
    toast(`🔬 Sensor Sample Ready: ${sample.type} Milk (${sample.qty}L, ${sample.fat}% FAT, ${sample.snf}% SNF)`, {
      icon: "🥛",
      duration: 3000
    });
    // Auto-focus Farmer ID input so pressing Enter immediately submits
    setTimeout(() => {
      farmerIdInputRef.current?.focus();
    }, 50);
  };

  // Direct Ingestion Execution (Invoked directly or after admin confirms duplicate modal)
  const executeSave = async (payload) => {
    setIotSubmitting(true);
    try {
      const res = await emitIoTTelemetry(payload, iotDeviceKey);

      if (audioEnabled) playSuccessChime();
      toast.success(
        `📡 Milk Saved: Farmer #${res.farmerId} (${res.farmerName}) -> ₹${res.totalAmount}`,
        { duration: 4000, icon: "✅" }
      );

      const logEntry = `[${new Date().toLocaleTimeString()}] ✅ 4G TX: Farmer #${res.farmerId} (${res.farmerName}) | ${res.quantityLiters}L @ FAT ${res.fatPercentage}%, SNF ${res.snfPercentage}% -> ₹${res.totalAmount} (Intake ID #${res.collectionId})`;
      setIotLogs((prev) => [logEntry, ...prev.slice(0, 19)]);

      // Reload cloud ledger feed
      loadDailyFeed(date);

      // SCREEN EMPTY: Reset all inputs completely for next milk intake
      clearInputs();
    } catch (err) {
      if (audioEnabled) playErrorBuzz();
      const msg = getErrorMessage(err) || "Milk collection failed to ingest";
      toast.error(msg);
      const logEntry = `[${new Date().toLocaleTimeString()}] ❌ 4G ERR: ${msg}`;
      setIotLogs((prev) => [logEntry, ...prev.slice(0, 19)]);
    } finally {
      setIotSubmitting(false);
      setDuplicateModal({ isOpen: false, existing: null, pendingPayload: null });
    }
  };

  // Submission Pipeline: Validates fields, checks for duplicate shift entry, and handles Enter key
  const handleAttemptSubmit = useCallback(() => {
    // 1. Validation: Farmer ID cannot be blank
    if (!iotFarmerId || iotFarmerId.trim() === "") {
      toast.error("⚠️ Validation Error: Farmer ID is required! Please enter a Farmer ID.");
      if (audioEnabled) playErrorBuzz();
      farmerIdInputRef.current?.focus();
      return;
    }

    // 2. Validation: Farmer ID must be positive integer
    const idNum = Number(iotFarmerId);
    if (isNaN(idNum) || idNum <= 0 || !Number.isInteger(idNum)) {
      toast.error(`❌ Validation Error: Invalid Farmer ID (${iotFarmerId}). It must be a positive number (1, 2, 3...).`, {
        duration: 4500
      });
      if (audioEnabled) playErrorBuzz();
      farmerIdInputRef.current?.focus();
      return;
    }

    // 3. Validation: Sensor data (Weight, FAT, SNF) must be present
    if (!iotQty || !iotFat || !iotSnf || Number(iotQty) <= 0) {
      toast.error("⚠️ Sensor Data Missing: Please trigger a Cow or Buffalo sample reading first!");
      if (audioEnabled) playErrorBuzz();
      return;
    }

    const payload = {
      farmerId: idNum,
      quantityLiters: Number(iotQty),
      fatPercentage: Number(iotFat),
      snfPercentage: Number(iotSnf),
      shift: shift,
      date: date
    };

    // 4. Duplicate Check: Search for an existing entry for this farmer in the CURRENT shift
    const existingEntry = recentCollections.find(
      (c) => Number(c.farmerId) === idNum && c.shift === shift
    );

    if (existingEntry) {
      // DUPLICATE DETECTED -> Open confirmation popup modal for Admin decision
      if (audioEnabled) playErrorBuzz();
      setDuplicateModal({
        isOpen: true,
        existing: existingEntry,
        pendingPayload: payload
      });
      return;
    }

    // If no duplicate found, proceed to save immediately
    executeSave(payload);
  }, [iotFarmerId, iotQty, iotFat, iotSnf, shift, date, recentCollections, audioEnabled, iotDeviceKey, clearInputs, loadDailyFeed]);

  // Modal Handlers
  const handleConfirmDuplicate = useCallback(() => {
    if (duplicateModal.pendingPayload) {
      executeSave(duplicateModal.pendingPayload);
    }
  }, [duplicateModal.pendingPayload, executeSave]);

  const handleCancelDuplicate = useCallback(() => {
    setDuplicateModal({ isOpen: false, existing: null, pendingPayload: null });
    if (audioEnabled) playKeyClick();
    setTimeout(() => {
      farmerIdInputRef.current?.focus();
    }, 50);
  }, [audioEnabled]);

  // Global Keyboard Navigation (Enter to save, Esc to cancel duplicate modal)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Modal open shortcuts
      if (duplicateModal.isOpen) {
        if (e.key === "Enter") {
          e.preventDefault();
          handleConfirmDuplicate();
        } else if (e.key === "Escape") {
          e.preventDefault();
          handleCancelDuplicate();
        }
        return;
      }

      // Enter key anywhere on POS triggers submission if not inside another text input
      if (e.key === "Enter") {
        const activeTag = document.activeElement?.tagName;
        const activeType = document.activeElement?.type;
        // If active element is a button or non-date input or farmerId input, trigger submit
        if (activeTag !== "INPUT" || document.activeElement === farmerIdInputRef.current) {
          e.preventDefault();
          handleAttemptSubmit();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [duplicateModal, handleConfirmDuplicate, handleCancelDuplicate, handleAttemptSubmit]);

  // Calculate session totals
  const sessionTotalLiters = recentCollections.reduce(
    (sum, c) => sum + (parseFloat(c.quantityLiters) || 0),
    0
  );
  const sessionTotalAmount = recentCollections.reduce(
    (sum, c) => sum + (parseFloat(c.totalAmount) || 0),
    0
  );

  return (
    <div className="-m-6 h-[calc(100vh-80px)] overflow-y-auto bg-slate-900 text-slate-100 p-3 sm:p-5 font-sans scrollbar-thin">
      <Toaster position="top-right" />

      {/* TOP BAR: Title, 4G Status, Shift, Date, Audio, Fullscreen */}
      <header className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Radio className="w-5 h-5 text-slate-950 font-bold animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white leading-tight">
                DairyAI 4G IoT Gateway
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                Cellular M2M Ingestion
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Autonomous Cloud Telemetry &bull; Zero Browser Dependency &bull; Multi-Tenant IoT Gateway
            </p>
          </div>
        </div>

        {/* CONTROLS: Shift Pill, Date Picker, Audio Toggle, Fullscreen */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Shift Toggle */}
          <button
            type="button"
            onClick={() => setShift((prev) => (prev === "MORNING" ? "EVENING" : "MORNING"))}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
              shift === "MORNING"
                ? "bg-amber-500/10 text-amber-300 border-amber-500/40 hover:bg-amber-500/20"
                : "bg-indigo-500/10 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/20"
            }`}
            title="Click to toggle Shift"
          >
            {formatShiftLabel(shift)}
          </button>

          {/* Date Picker */}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              audioEnabled
                ? "bg-slate-800 border-slate-700 text-cyan-400 hover:bg-slate-700"
                : "bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700"
            }`}
            title={audioEnabled ? "Sound Chimes: ON" : "Sound Chimes: OFF"}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen Mode"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </header>

      {/* MAIN 12-COL LAYOUT */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 pb-6">
        
        {/* LEFT / CENTER: VIRTUAL 4G CELLULAR IOT GATEWAY TERMINAL (7 COLS) */}
        <section className="lg:col-span-7 space-y-3">
          
          {!isPaired ? (
            /* FIRST-TIME PROVISIONING WIZARD CARD */
            <div className="bg-slate-900/95 border-2 border-amber-500/40 rounded-xl p-5 sm:p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
              <div className="flex items-center gap-3 border-b border-amber-900/40 pb-4 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white">4G Gateway Activation Setup</h2>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                      First-Time Onboarding
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Link this hardware terminal to your registered Dairy Society account before milk intake.
                  </p>
                </div>
              </div>

              {/* STEP 1: VERIFY REGISTERED EMAIL */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    1. Registered Dairy Admin Email
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={pairingEmail}
                      onChange={(e) => setPairingEmail(e.target.value)}
                      placeholder="e.g. Admin@gmail.com"
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={pairingLoading}
                      className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {pairingLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span>{otpSent ? "Resend Code" : "Send Activation Code"}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    💡 Free Dev/Demo Mode: Clicking &quot;Send Activation Code&quot; generates the secure token instantly on screen.
                  </p>
                </div>

                {/* STEP 2: ENTER ACTIVATION CODE */}
                {otpSent && (
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        2. Enter 4-Digit Activation Code
                      </label>
                      <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded">
                        Dev Token: {generatedOtp}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        maxLength={4}
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="e.g. 4819"
                        className="w-36 text-center tracking-widest text-2xl font-black font-mono bg-slate-900 border-2 border-cyan-500/50 rounded-xl py-2 text-cyan-300 focus:outline-none focus:border-cyan-400"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyPairing}
                        disabled={enteredOtp.length !== 4}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>ACTIVATE & BIND DEVICE</span>
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400">
                      🛡️ This step cryptographically binds the physical device to <span className="text-cyan-400 font-semibold">{pairingEmail}</span>. Once verified, this machine remains permanently authenticated.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ACTIVE OPERATIONAL IOT TERMINAL CARD */
            <div className="bg-slate-900/95 border-2 border-cyan-500/40 rounded-xl p-4 sm:p-5 shadow-2xl backdrop-blur-md relative overflow-hidden">
              
              {/* TOP INDUSTRIAL STATUS BAR */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-900/50 pb-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-inner">
                    <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                        DairyAI 4G IoT Gateway
                      </h2>
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                        4G LTE-M ONLINE
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Autonomous M2M Ingestion &bull; Zero Browser Dependency &bull; Microcontroller Direct
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                  <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-slate-400">SIM:</span>
                  <span className="text-emerald-400 font-semibold">AIRTEL M2M</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-400">RSRP:</span>
                  <span className="text-cyan-300 font-semibold">-68 dBm</span>
                </div>
              </div>

              {/* RETRO 16x2 MATRIX BACKLIT LCD SIMULATION */}
              <div className="bg-emerald-950/80 border-2 border-emerald-600/50 rounded-xl p-3.5 mb-4 shadow-inner relative overflow-hidden font-mono select-none">
                <div className="absolute top-1 right-2 text-[9px] uppercase tracking-wider text-emerald-500/60 font-mono">
                  16x2 HD44780 LCD
                </div>
                <div className="text-emerald-400 text-xs sm:text-sm font-bold tracking-widest drop-shadow-[0_0_8px_rgba(52,211,153,0.5)] leading-relaxed">
                  <div>DAIRY360-4G [V2.4] ONLINE</div>
                  <div className="mt-1 flex items-center justify-between">
                    <span>
                      FARMER:{iotFarmerId ? String(iotFarmerId).padStart(3, "0") : "---"} | {iotQty ? `${iotQty}L` : "---L"}
                    </span>
                    <span>
                      F:{iotFat ? `${iotFat}%` : "--%"} S:{iotSnf ? `${iotSnf}%` : "--%"}
                    </span>
                  </div>
                </div>
              </div>

              {/* HARDWARE DEVICE AUTHENTICATION & MULTI-TENANT BINDING */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-cyan-400" />
                    Cryptographic Multi-Tenant Device Key (X-Device-Key)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Device Activated
                    </span>
                    <button
                      type="button"
                      onClick={handleUnpair}
                      className="text-[10px] text-slate-400 hover:text-amber-400 underline font-mono ml-2 transition-colors"
                      title="Unpair to test first-time setup again"
                    >
                      (Re-pair Device)
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={iotDeviceKey}
                    onChange={(e) => setIotDeviceKey(e.target.value)}
                    placeholder="e.g. Admin@gmail.com"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setIotDeviceKey(currentEmail)}
                    className="px-3 py-1.5 text-[11px] font-mono bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 rounded-lg border border-cyan-500/30 transition-colors font-semibold"
                    title="Auto-Bind to Logged-in Dairy Admin Email"
                  >
                    Auto-Bind My Email
                  </button>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                  <span>🛡️ Active Tenant: <span className="text-cyan-400 font-mono font-semibold">{currentEmail}</span> (Auto-detected from login session)</span>
                  <span className="text-emerald-400 font-mono">Isolated Database Scope</span>
                </div>
              </div>

              {/* TELEMETRY READINGS FORM */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                
                {/* 1. FARMER ID (The ONLY field operator enters!) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-200 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-emerald-400" />
                      Farmer ID *
                    </label>
                    <span className="text-[9px] uppercase font-mono px-1 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                      Manual Input
                    </span>
                  </div>
                  <input
                    ref={farmerIdInputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={iotFarmerId}
                    onChange={(e) => {
                      // Strictly digits only, strips negative signs, letters, and decimals
                      const onlyDigits = e.target.value.replace(/[^0-9]/g, "");
                      setIotFarmerId(onlyDigits);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAttemptSubmit();
                      }
                    }}
                    placeholder="e.g. 1"
                    className={`w-full bg-slate-950 border-2 rounded-lg px-3 py-2 text-base font-bold font-mono text-emerald-400 placeholder-slate-600 focus:outline-none transition-all ${
                      !iotFarmerId
                        ? "border-amber-500/60 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20"
                        : "border-slate-700 focus:border-cyan-400"
                    }`}
                  />
                  {!iotFarmerId && (
                    <span className="text-[9px] text-amber-400 font-mono mt-1 flex items-center gap-0.5">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      Required (&gt; 0)
                    </span>
                  )}
                </div>

                {/* 2. WEIGHT (LITERS) - LOCKED HARDWARE STREAM */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-400 block">
                      Weight (L)
                    </label>
                    <span className="text-[9px] uppercase font-mono px-1 py-0.2 bg-slate-800 text-slate-400 border border-slate-700 rounded flex items-center gap-0.5">
                      <Lock className="w-2 h-2 text-cyan-400" />
                      Scale
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={iotQty || ""}
                    placeholder="0.00"
                    title="Locked: Reading streamed directly from digital weighing scale. Manual typing disabled."
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-base font-bold font-mono text-cyan-400 placeholder-slate-600 cursor-not-allowed select-none opacity-90 shadow-inner"
                  />
                  <span className="text-[9px] text-slate-500 font-mono mt-1 block">
                    🔒 Auto-Weigh Stream
                  </span>
                </div>

                {/* 3. FAT (%) - LOCKED HARDWARE STREAM */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-400 block">
                      FAT (%)
                    </label>
                    <span className="text-[9px] uppercase font-mono px-1 py-0.2 bg-slate-800 text-slate-400 border border-slate-700 rounded flex items-center gap-0.5">
                      <Lock className="w-2 h-2 text-amber-400" />
                      Ekomilk
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={iotFat || ""}
                    placeholder="0.00"
                    title="Locked: Reading streamed directly from Ekomilk analyzer. Manual typing disabled."
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-base font-bold font-mono text-amber-400 placeholder-slate-600 cursor-not-allowed select-none opacity-90 shadow-inner"
                  />
                  <span className="text-[9px] text-slate-500 font-mono mt-1 block">
                    🔒 Auto-FAT Stream
                  </span>
                </div>

                {/* 4. SNF (%) - LOCKED HARDWARE STREAM */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-400 block">
                      SNF (%)
                    </label>
                    <span className="text-[9px] uppercase font-mono px-1 py-0.2 bg-slate-800 text-slate-400 border border-slate-700 rounded flex items-center gap-0.5">
                      <Lock className="w-2 h-2 text-purple-400" />
                      Ekomilk
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={iotSnf || ""}
                    placeholder="0.00"
                    title="Locked: Reading streamed directly from Ekomilk analyzer. Manual typing disabled."
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-base font-bold font-mono text-purple-400 placeholder-slate-600 cursor-not-allowed select-none opacity-90 shadow-inner"
                  />
                  <span className="text-[9px] text-slate-500 font-mono mt-1 block">
                    🔒 Auto-SNF Stream
                  </span>
                </div>
              </div>

              {/* QUICK TEST PRESETS (DYNAMIC RANDOM SAMPLE GENERATION) */}
              <div className="flex flex-wrap items-center gap-2 mb-4 bg-slate-950/40 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono mr-1">
                  Trigger Sensor Sample:
                </span>
                <button
                  type="button"
                  onClick={() => applyIoTPreset("cow")}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded text-slate-200 transition-colors flex items-center gap-1 border border-slate-700 active:scale-95"
                  title="Generate a dynamic, randomized Cow milk reading & focus Farmer ID"
                >
                  <span>🐄 Cow Sample (Randomized)</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyIoTPreset("buffalo")}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded text-slate-200 transition-colors flex items-center gap-1 border border-slate-700 active:scale-95"
                  title="Generate a dynamic, randomized Buffalo milk reading & focus Farmer ID"
                >
                  <span>🐃 Buffalo Sample (Randomized)</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyIoTPreset("random")}
                  className="px-2.5 py-1 text-xs bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 rounded transition-colors flex items-center gap-1 border border-cyan-800/60 active:scale-95"
                  title="Simulate next random milk can on the scale & focus Farmer ID"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Next Hardware Reading</span>
                </button>
                {(iotQty || iotFarmerId) && (
                  <button
                    type="button"
                    onClick={clearInputs}
                    className="px-2 py-1 text-xs bg-slate-850 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 border border-slate-700 active:scale-95 ml-auto"
                    title="Empty/Reset Screen"
                  >
                    <RotateCcw className="w-3 h-3 text-slate-400" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {/* TRANSMIT BUTTON */}
              <button
                type="button"
                onClick={handleAttemptSubmit}
                disabled={iotSubmitting || !iotFarmerId || iotFarmerId === "0" || !iotQty || !iotFat || !iotSnf}
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black py-3 px-5 rounded-xl shadow-lg shadow-cyan-500/20 transition-all text-sm sm:text-base flex items-center justify-center gap-2 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {iotSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Emitting 4G Telemetry Packet to Cloud...</span>
                  </>
                ) : !iotQty || !iotFat || !iotSnf ? (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-400 animate-bounce" />
                    <span>SELECT COW OR BUFFALO SAMPLE FIRST</span>
                  </>
                ) : !iotFarmerId ? (
                  <>
                    <User className="w-5 h-5 text-emerald-400" />
                    <span>ENTER FARMER ID & PRESS ENTER ↵</span>
                  </>
                ) : (
                  <>
                    <Radio className="w-5 h-5" />
                    <span>TRANSMIT 4G TELEMETRY (ENTER ↵)</span>
                    <Send className="w-4 h-4 ml-1 opacity-70" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* LIVE CELLULAR TELEMETRY PACKET LOGS */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-400 mb-2 border-b border-slate-800 pb-1.5">
              <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-cyan-400 font-bold">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                Cellular M2M Ingestion Logs (Live Stream)
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500">
                  Target: POST /api/iot/milk-intake
                </span>
                {iotLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIotLogs([])}
                    className="text-[10px] text-slate-400 hover:text-slate-200 underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div className="h-28 overflow-y-auto space-y-1 text-slate-300 text-[11px] scrollbar-thin">
              {iotLogs.length === 0 ? (
                <p className="text-slate-600 italic py-2">
                  Awaiting 4G packet transmission... Enter Farmer ID and click &quot;Transmit 4G Telemetry&quot;.
                </p>
              ) : (
                iotLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`p-1.5 rounded text-[11px] font-mono leading-tight ${
                      log.includes("❌")
                        ? "bg-red-950/40 border border-red-800/50 text-red-300"
                        : "bg-cyan-950/30 border border-cyan-800/40 text-cyan-200"
                    }`}
                  >
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* RIGHT: REAL-TIME CLOUD INGESTION LEDGER & METRICS (5 COLS) */}
        <section className="lg:col-span-5 space-y-3">
          
          {/* SHIFT SUMMARY METRIC CARDS */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Today&apos;s Intake</span>
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">
                {sessionTotalLiters.toFixed(2)} <span className="text-xs font-normal text-slate-400">L</span>
              </div>
            </div>

            <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Total Payout</span>
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                ₹{sessionTotalAmount.toFixed(2)}
              </div>
            </div>
          </div>

          {/* REAL-TIME INGESTION LEDGER FEED */}
          <div className="bg-slate-800/95 border border-slate-700/80 rounded-xl p-3 shadow-md">
            <div className="flex items-center justify-between mb-2 text-xs text-slate-300 border-b border-slate-700/70 pb-2">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-300 text-[11px]">
                <History className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live Ingestion Ledger</span>
                <span className="text-[10px] text-cyan-400 font-mono">({recentCollections.length})</span>
              </div>
              <button
                type="button"
                onClick={() => loadDailyFeed(date)}
                disabled={loadingRecent}
                className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 text-[11px]"
                title="Refresh Cloud Ledger"
              >
                <RefreshCw className={`w-3 h-3 ${loadingRecent ? "animate-spin text-cyan-400" : ""}`} />
                <span>Sync</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
              {recentCollections.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  <Database className="w-8 h-8 mx-auto mb-2 opacity-30 text-cyan-400" />
                  <p>No milk intake recorded for today yet.</p>
                  <p className="text-[10px] text-slate-600 mt-1">
                    Enter Farmer ID and transmit a 4G telemetry packet on the left.
                  </p>
                </div>
              ) : (
                recentCollections.map((col) => (
                  <div
                    key={col.id}
                    className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/90 hover:border-cyan-500/40 transition-colors text-xs flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                        <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-mono text-[10px] border border-cyan-800/60">
                          #{col.farmerId}
                        </span>
                        <span className="truncate max-w-[130px]">{col.farmerName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {col.quantityLiters} L &bull; F:{col.fatPercentage}% S:{col.snfPercentage}% &bull; ₹{col.ratePerLiter}/L
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-emerald-400 font-mono text-sm">
                        ₹{Number(col.totalAmount).toFixed(2)}
                      </div>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                        {col.shift}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* M2M ARCHITECTURE REFERENCE CARD */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-slate-300 font-bold mb-1.5 text-[11px]">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              <span>Autonomous Ingestion Architecture</span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-400">
              Hardware analyzers transmit milk quality metrics directly over 4G LTE-M via signed <code className="text-cyan-400">X-Device-Key</code> HTTP POST headers. The Spring Boot backend isolates dairy tenants, computes rates via Redis-cached pricing matrices, and pushes SMS delivery in &lt;150ms with zero operator latency.
            </p>
          </div>
        </section>

      </main>

      {/* DUPLICATE COLLECTION WARNING & CONFIRMATION MODAL */}
      {duplicateModal.isOpen && duplicateModal.existing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-amber-500/80 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Top Accent Warning Strip */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500" />

            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-amber-400 shadow-inner">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white">Duplicate Entry Warning</h3>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                    Double Shift Check
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  A milk collection entry already exists for <strong className="text-cyan-300 font-mono">Farmer #{duplicateModal.existing.farmerId} ({duplicateModal.existing.farmerName || "Farmer"})</strong> for today&apos;s <span className="text-amber-400 font-bold uppercase">{shift}</span> shift!
                </p>
              </div>
            </div>

            {/* COMPARISON CARDS */}
            <div className="grid grid-cols-2 gap-3 mb-4 font-mono text-xs">
              {/* EXISTING ENTRY */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                  <History className="w-3 h-3 text-cyan-400" />
                  Already Saved Today:
                </div>
                <div className="text-sm font-bold text-slate-200">
                  {duplicateModal.existing.quantityLiters} L
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  FAT: <span className="text-amber-300">{duplicateModal.existing.fatPercentage}%</span> | SNF: <span className="text-purple-300">{duplicateModal.existing.snfPercentage}%</span>
                </div>
                <div className="text-xs font-bold text-emerald-400 mt-1">
                  Amount: ₹{Number(duplicateModal.existing.totalAmount).toFixed(2)}
                </div>
              </div>

              {/* NEW INCOMING ENTRY */}
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/40">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  New Second Intake:
                </div>
                <div className="text-sm font-bold text-amber-200">
                  {duplicateModal.pendingPayload?.quantityLiters} L
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  FAT: <span className="text-amber-300">{duplicateModal.pendingPayload?.fatPercentage}%</span> | SNF: <span className="text-purple-300">{duplicateModal.pendingPayload?.snfPercentage}%</span>
                </div>
                <div className="text-[10px] text-amber-400/80 mt-1 italic">
                  (Awaiting Confirmation)
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 mb-5 leading-relaxed">
              ⚠️ <strong className="text-white">Admin Decision Required:</strong> If this is an intentional second delivery (e.g. second milk can) for this farmer, click <strong className="text-amber-400">&quot;Yes, Save Again&quot;</strong>. Otherwise, click <strong className="text-slate-300">&quot;Cancel&quot;</strong> to discard.
            </div>

            {/* MODAL ACTIONS */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelDuplicate}
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
              >
                <XCircle className="w-4 h-4 text-slate-400" />
                <span>Cancel / Discard (Esc)</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmDuplicate}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Yes, Save Again (Enter ↵)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
