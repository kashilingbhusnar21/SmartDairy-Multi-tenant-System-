import { useState, useEffect, useCallback } from "react";
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
  Sparkles
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

export default function RapidCollectionPage() {
  // Operational state
  const [date, setDate] = useState(todayISO());
  const [shift, setShift] = useState(getAutoShift());
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 4G IoT Gateway Telemetry State
  const [iotDeviceKey, setIotDeviceKey] = useState(() => getEmail() || "EKOMILK_BOOTH_01");
  const [iotFarmerId, setIotFarmerId] = useState("101");
  const [iotQty, setIotQty] = useState("12.50");
  const [iotFat, setIotFat] = useState("4.20");
  const [iotSnf, setIotSnf] = useState("8.80");
  const [iotSubmitting, setIotSubmitting] = useState(false);
  const [iotLogs, setIotLogs] = useState([]);

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

  // Quick Simulation Presets
  const applyIoTPreset = (preset) => {
    if (audioEnabled) playKeyClick();
    if (preset === "cow") {
      setIotQty((9 + Math.random() * 5).toFixed(2));
      setIotFat("4.10");
      setIotSnf("8.60");
    } else if (preset === "buffalo") {
      setIotQty((12 + Math.random() * 6).toFixed(2));
      setIotFat("6.80");
      setIotSnf("8.90");
    } else if (preset === "random") {
      const isBuff = Math.random() > 0.5;
      setIotQty((8 + Math.random() * 10).toFixed(2));
      setIotFat(isBuff ? (6.2 + Math.random() * 1.5).toFixed(2) : (3.6 + Math.random() * 0.9).toFixed(2));
      setIotSnf(isBuff ? (8.7 + Math.random() * 0.5).toFixed(2) : (8.4 + Math.random() * 0.4).toFixed(2));
    }
  };

  // Autonomous 4G IoT Telemetry Emission Handler
  const handleEmitIoT = async () => {
    if (!iotFarmerId) {
      toast.error("Please enter a Farmer ID for the IoT device");
      if (audioEnabled) playErrorBuzz();
      return;
    }
    setIotSubmitting(true);
    try {
      const payload = {
        farmerId: Number(iotFarmerId),
        quantityLiters: Number(iotQty),
        fatPercentage: Number(iotFat),
        snfPercentage: Number(iotSnf),
        shift: shift,
        date: date
      };

      const res = await emitIoTTelemetry(payload, iotDeviceKey);

      if (audioEnabled) playSuccessChime();
      toast.success(
        `📡 4G Telemetry Ingested: Farmer #${res.farmerId} (${res.farmerName}) -> ₹${res.totalAmount}`,
        { duration: 4000, icon: "✅" }
      );

      const logEntry = `[${new Date().toLocaleTimeString()}] ✅ 4G TX: Farmer #${res.farmerId} (${res.farmerName}) | ${res.quantityLiters}L @ FAT ${res.fatPercentage}%, SNF ${res.snfPercentage}% -> ₹${res.totalAmount} (Intake ID #${res.collectionId})`;
      setIotLogs((prev) => [logEntry, ...prev.slice(0, 19)]);

      // Reload cloud ledger feed
      loadDailyFeed(date);
    } catch (err) {
      if (audioEnabled) playErrorBuzz();
      const msg = getErrorMessage(err) || "IoT Telemetry failed to ingest";
      toast.error(msg);
      const logEntry = `[${new Date().toLocaleTimeString()}] ❌ 4G ERR: ${msg}`;
      setIotLogs((prev) => [logEntry, ...prev.slice(0, 19)]);
    } finally {
      setIotSubmitting(false);
    }
  };

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
                    FARMER:{iotFarmerId ? String(iotFarmerId).padStart(3, "0") : "---"} | {iotQty || "0.00"}L
                  </span>
                  <span>
                    F:{iotFat}% S:{iotSnf}%
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
                <span className="text-[10px] text-slate-400 font-mono">Flashed in MCU Bootloader</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={iotDeviceKey}
                  onChange={(e) => setIotDeviceKey(e.target.value)}
                  placeholder="e.g. admin@smartdairy.com or EKOMILK_BOOTH_01"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => setIotDeviceKey(getEmail() || "Admin@gmail.com")}
                  className="px-3 py-1.5 text-[11px] font-mono bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 rounded-lg border border-cyan-500/30 transition-colors font-semibold"
                  title="Auto-Bind to Logged-in Dairy Admin Email"
                >
                  Auto-Bind My Email
                </button>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                <span>🛡️ Active Tenant: <span className="text-cyan-400 font-mono font-semibold">{getEmail() || "admin@smartdairy.com"}</span> (Auto-detected from login session)</span>
                <span className="text-emerald-400 font-mono">Isolated Database Scope</span>
              </div>
            </div>

            {/* TELEMETRY READINGS FORM */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  Farmer ID
                </label>
                <input
                  type="number"
                  value={iotFarmerId}
                  onChange={(e) => setIotFarmerId(e.target.value)}
                  placeholder="101"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-base font-bold font-mono text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-300 mb-1 block">
                  Weight (Liters)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={iotQty}
                  onChange={(e) => setIotQty(e.target.value)}
                  placeholder="12.50"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-base font-bold font-mono text-cyan-400 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-300 mb-1 block">
                  FAT (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={iotFat}
                  onChange={(e) => setIotFat(e.target.value)}
                  placeholder="4.20"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-base font-bold font-mono text-amber-400 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-300 mb-1 block">
                  SNF (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={iotSnf}
                  onChange={(e) => setIotSnf(e.target.value)}
                  placeholder="8.80"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-base font-bold font-mono text-purple-400 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* QUICK TEST PRESETS */}
            <div className="flex flex-wrap items-center gap-2 mb-4 bg-slate-950/40 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono mr-1">
                Simulate Ekomilk / Scale:
              </span>
              <button
                type="button"
                onClick={() => applyIoTPreset("cow")}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded text-slate-200 transition-colors flex items-center gap-1 border border-slate-700 active:scale-95"
              >
                <span>🐄 Cow Sample (4.1% F / 8.6% S)</span>
              </button>
              <button
                type="button"
                onClick={() => applyIoTPreset("buffalo")}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded text-slate-200 transition-colors flex items-center gap-1 border border-slate-700 active:scale-95"
              >
                <span>🐃 Buffalo Sample (6.8% F / 8.9% S)</span>
              </button>
              <button
                type="button"
                onClick={() => applyIoTPreset("random")}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded text-slate-200 transition-colors flex items-center gap-1 border border-slate-700 active:scale-95"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Randomize</span>
              </button>
            </div>

            {/* TRANSMIT BUTTON */}
            <button
              type="button"
              onClick={handleEmitIoT}
              disabled={iotSubmitting || !iotFarmerId || !iotQty || !iotFat || !iotSnf}
              className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black py-3 px-5 rounded-xl shadow-lg shadow-cyan-500/20 transition-all text-sm sm:text-base flex items-center justify-center gap-2 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {iotSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Emitting 4G Telemetry Packet to Cloud...</span>
                </>
              ) : (
                <>
                  <Radio className="w-5 h-5" />
                  <span>TRANSMIT 4G TELEMETRY TO CLOUD (M2M)</span>
                  <Send className="w-4 h-4 ml-1 opacity-70" />
                </>
              )}
            </button>
          </div>

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
                  Awaiting 4G packet transmission... Click &quot;Transmit 4G Telemetry&quot; or execute the Python CLI simulator (<code className="text-cyan-500">python hardware_simulator/iot_cellular_simulator.py</code>).
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
                    Transmit a 4G telemetry packet from the gateway on the left.
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
    </div>
  );
}
