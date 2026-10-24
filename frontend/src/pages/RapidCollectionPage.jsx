import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Zap,
  Scale,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Usb,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  User,
  Phone,
  MapPin,
  Clock,
  History,
  Lock,
  Unlock
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { createMilkCollection, listDailyCollections } from "../services/milkCollections";
import { lookupFarmerById } from "../services/farmers";
import { calculateMilkRate } from "../services/pricingSettings";
import { todayISO } from "../utils/dateUtils";
import { getAutoShift, formatShiftLabel } from "../utils/shiftUtils";
import { getErrorMessage } from "../utils/errorMessage";
import {
  playSuccessChime,
  playErrorBuzz,
  playKeyClick,
  playHardwareConnectChime
} from "../utils/audioAlerts";
import { useWebSerial } from "../hooks/useWebSerial";

export default function RapidCollectionPage() {
  // Operational state
  const [date, setDate] = useState(todayISO());
  const [shift, setShift] = useState(getAutoShift());
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [hardwareLock, setHardwareLock] = useState(true);

  // Active input tracking for on-screen touch numpad
  const [activeField, setActiveField] = useState("farmerId");

  // Form inputs
  const [farmerId, setFarmerId] = useState("");
  const [quantityLiters, setQuantityLiters] = useState("");
  const [fatPercentage, setFatPercentage] = useState("");
  const [snfPercentage, setSnfPercentage] = useState("");

  // Farmer lookup state
  const [farmerLoading, setFarmerLoading] = useState(false);
  const [farmerData, setFarmerData] = useState(null);
  const [farmerError, setFarmerError] = useState("");

  // Pricing preview state
  const [ratePerLiter, setRatePerLiter] = useState(null);
  const [totalAmount, setTotalAmount] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  // Submitting state
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccessFlash, setSubmitSuccessFlash] = useState(false);
  const [hardwareFlash, setHardwareFlash] = useState(false);

  // Session & Daily Feed
  const [recentCollections, setRecentCollections] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  // Input refs for automatic focus jumping
  const farmerIdRef = useRef(null);
  const qtyRef = useRef(null);
  const fatRef = useRef(null);
  const snfRef = useRef(null);
  const submitBtnRef = useRef(null);

  // Hardware integration via Web Serial Hook
  const handleHardwareData = useCallback((data) => {
    setHardwareFlash(true);
    setTimeout(() => setHardwareFlash(false), 800);

    if (data.weight) {
      setQuantityLiters(data.weight);
    }
    if (data.fat) {
      setFatPercentage(data.fat);
    }
    if (data.snf) {
      setSnfPercentage(data.snf);
    }

    if (audioEnabled) {
      playKeyClick();
    }
    toast.success(`Hardware reading received: FAT ${data.fat || "-"}% | SNF ${data.snf || "-"}%`, {
      icon: "🥛",
      duration: 2500
    });
  }, [audioEnabled]);

  const serial = useWebSerial({ onData: handleHardwareData });

  // Initial focus on mount
  useEffect(() => {
    if (farmerIdRef.current) {
      farmerIdRef.current.focus();
    }
    loadRecentCollections();
  }, []);

  const loadRecentCollections = async () => {
    try {
      setLoadingRecent(true);
      const res = await listDailyCollections(date);
      const list = Array.isArray(res) ? res : res.content || [];
      // Filter by current shift if available, or sort newest first
      setRecentCollections(list.slice(0, 8));
    } catch (err) {
      console.warn("Failed to load recent collections:", err);
    } finally {
      setLoadingRecent(false);
    }
  };

  // Farmer Lookup trigger
  const performFarmerLookup = async (idToLookup) => {
    const trimmed = (idToLookup || farmerId).trim();
    if (!trimmed) {
      setFarmerData(null);
      setFarmerError("");
      return false;
    }

    setFarmerLoading(true);
    setFarmerError("");

    try {
      const res = await lookupFarmerById(trimmed);
      if (res && res.id) {
        setFarmerData(res);
        if (audioEnabled) playKeyClick();
        return true;
      } else {
        throw new Error("Farmer not found");
      }
    } catch (err) {
      setFarmerData(null);
      setFarmerError(`Farmer #${trimmed} not found`);
      if (audioEnabled) playErrorBuzz();
      return false;
    } finally {
      setFarmerLoading(false);
    }
  };

  // Live Pricing Calculation trigger
  useEffect(() => {
    const qty = parseFloat(quantityLiters);
    const fat = parseFloat(fatPercentage);
    const snf = parseFloat(snfPercentage);

    if (!isNaN(qty) && qty > 0 && !isNaN(fat) && fat > 0 && !isNaN(snf) && snf > 0) {
      let isMounted = true;
      setPricingLoading(true);

      calculateMilkRate({
        fatPercentage: fat,
        snfPercentage: snf,
        quantityLiters: qty
      })
        .then((res) => {
          if (isMounted) {
            setRatePerLiter(res.ratePerLiter);
            setTotalAmount(res.totalAmount);
          }
        })
        .catch(() => {
          // Fallback client-side calculation if pricing endpoint fails
          if (isMounted) {
            const fallbackRate = (fat * 5.8 + snf * 2.1).toFixed(2);
            const fallbackTotal = (qty * fallbackRate).toFixed(2);
            setRatePerLiter(fallbackRate);
            setTotalAmount(fallbackTotal);
          }
        })
        .finally(() => {
          if (isMounted) setPricingLoading(false);
        });

      return () => {
        isMounted = false;
      };
    } else {
      setRatePerLiter(null);
      setTotalAmount(null);
    }
  }, [quantityLiters, fatPercentage, snfPercentage]);

  // Keyboard navigation & Enter shortcuts
  const handleFarmerIdKeyDown = async (e) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const success = await performFarmerLookup(farmerId);
      if (success) {
        // If readings are already present from hardware/preset, submit immediately!
        if (quantityLiters && fatPercentage && snfPercentage) {
          handleSubmit();
        } else {
          // Direct cursor to RECORD INTAKE button (bypass weight, fat, snf completely!)
          if (submitBtnRef.current) {
            submitBtnRef.current.focus();
          }
        }
      }
    }
  };

  const handleQtyKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (fatRef.current) {
        fatRef.current.focus();
        setActiveField("fatPercentage");
      }
    }
  };

  const handleFatKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (snfRef.current) {
        snfRef.current.focus();
        setActiveField("snfPercentage");
      }
    }
  };

  const handleSnfKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Reset form completely and return focus to Farmer ID
  const handleReset = () => {
    setFarmerId("");
    setQuantityLiters("");
    setFatPercentage("");
    setSnfPercentage("");
    setFarmerData(null);
    setFarmerError("");
    setRatePerLiter(null);
    setTotalAmount(null);
    setActiveField("farmerId");
    if (farmerIdRef.current) {
      farmerIdRef.current.focus();
    }
  };

  // Submit milk collection
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!farmerData || !farmerData.id) {
      const success = await performFarmerLookup(farmerId);
      if (!success) {
        toast.error("Please enter a valid Farmer ID");
        if (farmerIdRef.current) farmerIdRef.current.focus();
        return;
      }
    }

    const qty = parseFloat(quantityLiters);
    const fat = parseFloat(fatPercentage);
    const snf = parseFloat(snfPercentage);

    if (isNaN(qty) || qty <= 0) {
      toast.error("Enter valid quantity in Liters");
      if (audioEnabled) playErrorBuzz();
      if (qtyRef.current) qtyRef.current.focus();
      return;
    }

    if (isNaN(fat) || fat < 2.5 || fat > 9.0) {
      toast.error("FAT % must be between 2.5 and 9.0");
      if (audioEnabled) playErrorBuzz();
      if (fatRef.current) fatRef.current.focus();
      return;
    }

    if (isNaN(snf) || snf < 7.5 || snf > 9.0) {
      toast.error("SNF % must be between 7.5 and 9.0");
      if (audioEnabled) playErrorBuzz();
      if (snfRef.current) snfRef.current.focus();
      return;
    }

    // Duplicate prevention: check if this farmer was already entered for this shift today
    const alreadyEntered = recentCollections.some(
      (c) => String(c.farmerId) === String(farmerData.id) && c.shift === shift
    );
    if (alreadyEntered) {
      const confirmed = window.confirm(
        `⚠️ DUPLICATE WARNING:\nFarmer #${farmerData.id} (${farmerData.fullName}) has ALREADY recorded milk in today's ${shift} shift!\n\nDo you want to save a SECOND collection for this farmer?`
      );
      if (!confirmed) {
        return;
      }
    }

    setSubmitting(true);

    try {
      const payload = {
        farmerId: farmerData.id,
        date: date,
        shift: shift,
        quantityLiters: qty,
        fatPercentage: fat,
        snfPercentage: snf
      };

      const saved = await createMilkCollection(payload);

      // Play success audio chime
      if (audioEnabled) {
        playSuccessChime();
      }

      // Flash green success animation
      setSubmitSuccessFlash(true);
      setTimeout(() => setSubmitSuccessFlash(false), 1000);

      toast.success(
        `Intake Saved! ₹${saved.totalAmount || totalAmount || "-"} for ${farmerData.fullName}`,
        {
          duration: 3500,
          icon: "✅"
        }
      );

      // Update recent list locally
      setRecentCollections((prev) => [
        {
          id: saved.id || Date.now(),
          farmerName: farmerData.fullName,
          farmerId: farmerData.id,
          quantityLiters: qty,
          fatPercentage: fat,
          snfPercentage: snf,
          ratePerLiter: saved.ratePerLiter || ratePerLiter,
          totalAmount: saved.totalAmount || totalAmount,
          shift: shift
        },
        ...prev.slice(0, 7)
      ]);

      // Sub-100ms reset for rapid operation
      handleReset();
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to save collection");
      toast.error(msg);
      if (audioEnabled) playErrorBuzz();
    } finally {
      setSubmitting(false);
    }
  };

  // Touch ATM Numpad typing helper
  const handleNumpadPress = (val) => {
    if (audioEnabled) playKeyClick();

    // In Hardware Lock mode, user can ONLY type into Farmer ID!
    const effectiveField = hardwareLock ? "farmerId" : activeField;

    const setterMap = {
      farmerId: (v) => setFarmerId(v),
      quantityLiters: (v) => setQuantityLiters(v),
      fatPercentage: (v) => setFatPercentage(v),
      snfPercentage: (v) => setSnfPercentage(v)
    };

    const getterMap = {
      farmerId: farmerId,
      quantityLiters: quantityLiters,
      fatPercentage: fatPercentage,
      snfPercentage: snfPercentage
    };

    const currentVal = getterMap[effectiveField] || "";
    const update = setterMap[effectiveField];

    if (!update) return;

    if (val === "BACKSPACE") {
      update(currentVal.slice(0, -1));
    } else if (val === "CLEAR") {
      update("");
    } else if (val === "ENTER") {
      if (effectiveField === "farmerId") {
        performFarmerLookup(farmerId).then((ok) => {
          if (ok) {
            if (quantityLiters && fatPercentage && snfPercentage) {
              handleSubmit();
            } else {
              if (submitBtnRef.current) {
                submitBtnRef.current.focus();
              }
              toast("Farmer confirmed. Waiting for Weight/FAT readings...", {
                icon: "⏳",
                duration: 2000
              });
            }
          }
        });
      } else if (effectiveField === "quantityLiters") {
        if (fatRef.current) {
          fatRef.current.focus();
          setActiveField("fatPercentage");
        }
      } else if (effectiveField === "fatPercentage") {
        if (snfRef.current) {
          snfRef.current.focus();
          setActiveField("snfPercentage");
        }
      } else if (effectiveField === "snfPercentage") {
        handleSubmit();
      }
    } else {
      // Prevent multiple decimals
      if (val === "." && currentVal.includes(".")) return;
      update(currentVal + val);
    }
  };

  // Quick Hardware Simulation Presets (for testing without physical cables)
  const injectPreset = (type) => {
    if (type === "cow") {
      serial.injectSimulatedData({
        fat: 4.1,
        snf: 8.6,
        clr: 28.0,
        weight: (8.5 + Math.random() * 5).toFixed(2),
        raw: "FAT=04.10  SNF=08.60  CLR=28.00  WT=11.20"
      });
    } else if (type === "buffalo") {
      serial.injectSimulatedData({
        fat: 6.8,
        snf: 8.9,
        clr: 30.5,
        weight: (12.0 + Math.random() * 6).toFixed(2),
        raw: "FAT=06.80  SNF=08.90  CLR=30.50  WT=14.80"
      });
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
    <div className="min-h-screen bg-slate-900 text-slate-100 p-3 sm:p-6 font-sans">
      <Toaster position="top-right" />

      {/* TOP BAR: Shift, Date, Hardware Status */}
      <header className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Zap className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                DairyAI Rapid POS
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                Hardware Ready
              </span>
            </div>
            <p className="text-xs text-slate-400">
              High-Speed RS-232 Milk Intake System &bull; Sub-5s Intake Loop
            </p>
          </div>
        </div>

        {/* CONTROLS: Shift Pill, Hardware Connection, Audio Toggle */}
        <div className="flex items-center flex-wrap gap-2.5">
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
            <span className="text-[10px] opacity-75 font-normal">(Click to switch)</span>
          </button>

          {/* Date Picker */}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              audioEnabled
                ? "bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700"
                : "bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700"
            }`}
            title={audioEnabled ? "Sound Beep: ON" : "Sound Beep: OFF"}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Hardware Lock Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !hardwareLock;
              setHardwareLock(next);
              if (next) {
                setActiveField("farmerId");
                toast.success("🔒 Hardware Lock ON: Manual typing disabled. Readings stream directly from Ekomilk / Scale.", {
                  duration: 3000
                });
              } else {
                toast("🔓 Manual Override ON: You can now type Weight, FAT & SNF manually.", {
                  icon: "⚠️",
                  duration: 3000
                });
              }
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
              hardwareLock
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/20"
                : "bg-amber-500/10 text-amber-300 border-amber-500/40 hover:bg-amber-500/20"
            }`}
            title={
              hardwareLock
                ? "Tamper-Proof Hardware Lock is ON. Readings only accepted from Ekomilk/Scale."
                : "Manual Override is ON. Operator can type values manually."
            }
          >
            {hardwareLock ? <Lock className="w-3.5 h-3.5 text-emerald-400" /> : <Unlock className="w-3.5 h-3.5 text-amber-400" />}
            <span>{hardwareLock ? "Hardware Lock: ON" : "Manual Override"}</span>
          </button>

          {/* Web Serial Hardware Connection */}
          {serial.isConnected ? (
            <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/50 rounded-lg px-3 py-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-emerald-300">
                {serial.portName || "Ekomilk Online"}
              </span>
              <button
                type="button"
                onClick={serial.disconnect}
                className="text-[11px] text-slate-400 hover:text-red-400 underline ml-1"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => serial.connect({ baudRate: 9600 })}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Usb className="w-3.5 h-3.5 text-cyan-400" />
              <span>Connect Serial Port</span>
            </button>
          )}

          {/* Quick Simulated Sample Injection */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/80">
            <span className="text-[10px] text-slate-400 px-1 font-mono uppercase">Ghost HW:</span>
            <button
              type="button"
              onClick={() => injectPreset("cow")}
              className="px-2 py-0.5 text-[11px] bg-slate-700 hover:bg-slate-600 rounded text-slate-200 transition-colors"
              title="Simulate Cow Milk RS-232 Stream"
            >
              🐄 Cow Sample
            </button>
            <button
              type="button"
              onClick={() => injectPreset("buffalo")}
              className="px-2 py-0.5 text-[11px] bg-slate-700 hover:bg-slate-600 rounded text-slate-200 transition-colors"
              title="Simulate Buffalo Milk RS-232 Stream"
            >
              🐃 Buffalo Sample
            </button>
          </div>
        </div>
      </header>

      {/* MAIN POS GRID */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT / CENTER: PRIMARY RAPID INPUT WORKFLOW (7 COLS) */}
        <section className="lg:col-span-7 space-y-5">
          <form
            onSubmit={handleSubmit}
            className={`bg-slate-800/90 border rounded-2xl p-5 sm:p-7 shadow-2xl backdrop-blur-sm transition-all duration-300 ${
              submitSuccessFlash
                ? "border-emerald-500 shadow-emerald-500/20 ring-4 ring-emerald-500/30"
                : hardwareFlash
                ? "border-cyan-400 shadow-cyan-400/20 ring-4 ring-cyan-400/30"
                : "border-slate-700/80"
            }`}
          >
            {/* STEP 1: FARMER NUMERIC IDENTIFIER */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold tracking-wider text-slate-300 uppercase flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  1. Farmer ID / Number
                </label>
                <span className="text-[11px] text-slate-400">Press [ENTER] to lookup</span>
              </div>

              <div className="relative">
                <input
                  ref={farmerIdRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="e.g. 16"
                  value={farmerId}
                  onFocus={() => setActiveField("farmerId")}
                  onWheel={(e) => e.target.blur()}
                  onChange={(e) => {
                    // Strictly allow only numbers (0-9), strip all letters/special characters
                    const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
                    setFarmerId(digitsOnly);
                    if (farmerData) setFarmerData(null);
                    if (farmerError) setFarmerError("");
                  }}
                  onBlur={() => {
                    if (farmerId && !farmerData) performFarmerLookup(farmerId);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                      e.preventDefault();
                    }
                    handleFarmerIdKeyDown(e);
                  }}
                  className={`w-full bg-slate-900 border-2 rounded-xl px-4 py-3 text-3xl font-black tracking-wider text-emerald-400 placeholder-slate-600 focus:outline-none transition-all shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    farmerError
                      ? "border-red-500 ring-2 ring-red-500/30"
                      : farmerData
                      ? "border-emerald-500 ring-2 ring-emerald-500/20"
                      : "border-slate-700 focus:border-emerald-500"
                  }`}
                  autoFocus
                />
                {farmerLoading && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
                  </div>
                )}
              </div>

              {/* Farmer Lookup Result Card */}
              {farmerData && (
                <div className="mt-2.5 p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-300">
                      {farmerData.fullName?.charAt(0) || "F"}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white leading-tight">
                        {farmerData.fullName}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-300 mt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-400" />
                          {farmerData.village || "Registered"}
                        </span>
                        {farmerData.mobileNumber && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-400" />
                            {farmerData.mobileNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active
                  </span>
                </div>
              )}

              {farmerError && (
                <div className="mt-2 p-2.5 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{farmerError}</span>
                </div>
              )}
            </div>

            {/* STEP 2 & 3: HARDWARE INPUTS (WEIGHT, FAT, SNF) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {/* QUANTITY / WEIGHT */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700 focus-within:border-emerald-500 transition-all">
                <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1">
                    <Scale className="w-3 h-3 text-cyan-400" />
                    2. Weight (L)
                  </span>
                  {hardwareLock ? (
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> Scale Auto
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400 font-mono flex items-center gap-0.5">
                      <Unlock className="w-2.5 h-2.5" /> Manual
                    </span>
                  )}
                </label>
                <input
                  ref={qtyRef}
                  type="number"
                  step="0.01"
                  tabIndex={-1}
                  placeholder={hardwareLock ? "Auto Scale" : "0.00"}
                  value={quantityLiters}
                  readOnly={hardwareLock}
                  onWheel={(e) => e.target.blur()}
                  onFocus={() => {
                    if (hardwareLock) {
                      toast("🔒 Weight is automated from Weighing Scale. Toggle 'Manual Override' to edit.", {
                        id: "hw-weight",
                        duration: 2000
                      });
                    } else {
                      setActiveField("quantityLiters");
                    }
                  }}
                  onChange={(e) => setQuantityLiters(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
                    handleQtyKeyDown(e);
                  }}
                  className={`w-full bg-transparent text-2xl font-black text-white focus:outline-none placeholder-slate-600 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    hardwareLock ? "cursor-not-allowed select-none opacity-90" : ""
                  }`}
                />
              </div>

              {/* FAT PERCENTAGE */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700 focus-within:border-emerald-500 transition-all">
                <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1">
                    <Activity className="w-3 h-3 text-amber-400" />
                    3. FAT (%)
                  </span>
                  {hardwareLock ? (
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> Ekomilk Auto
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400 font-mono flex items-center gap-0.5">
                      <Unlock className="w-2.5 h-2.5" /> Manual
                    </span>
                  )}
                </label>
                <input
                  ref={fatRef}
                  type="number"
                  step="0.01"
                  tabIndex={-1}
                  placeholder={hardwareLock ? "Auto Ekomilk" : "0.00"}
                  value={fatPercentage}
                  readOnly={hardwareLock}
                  onWheel={(e) => e.target.blur()}
                  onFocus={() => {
                    if (hardwareLock) {
                      toast("🔒 FAT is automated from Ekomilk. Toggle 'Manual Override' to edit.", {
                        id: "hw-fat",
                        duration: 2000
                      });
                    } else {
                      setActiveField("fatPercentage");
                    }
                  }}
                  onChange={(e) => setFatPercentage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
                    handleFatKeyDown(e);
                  }}
                  className={`w-full bg-transparent text-2xl font-black text-white focus:outline-none placeholder-slate-600 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    hardwareLock ? "cursor-not-allowed select-none opacity-90" : ""
                  }`}
                />
              </div>

              {/* SNF PERCENTAGE */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700 focus-within:border-emerald-500 transition-all">
                <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    4. SNF (%)
                  </span>
                  {hardwareLock ? (
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> Ekomilk Auto
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400 font-mono flex items-center gap-0.5">
                      <Unlock className="w-2.5 h-2.5" /> Manual
                    </span>
                  )}
                </label>
                <input
                  ref={snfRef}
                  type="number"
                  step="0.01"
                  tabIndex={-1}
                  placeholder={hardwareLock ? "Auto Ekomilk" : "0.00"}
                  value={snfPercentage}
                  readOnly={hardwareLock}
                  onWheel={(e) => e.target.blur()}
                  onFocus={() => {
                    if (hardwareLock) {
                      toast("🔒 SNF is automated from Ekomilk. Toggle 'Manual Override' to edit.", {
                        id: "hw-snf",
                        duration: 2000
                      });
                    } else {
                      setActiveField("snfPercentage");
                    }
                  }}
                  onChange={(e) => setSnfPercentage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
                    handleSnfKeyDown(e);
                  }}
                  className={`w-full bg-transparent text-2xl font-black text-white focus:outline-none placeholder-slate-600 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    hardwareLock ? "cursor-not-allowed select-none opacity-90" : ""
                  }`}
                />
              </div>
            </div>

            {/* LIVE PRICE & TOTAL CALCULATION CARD */}
            <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border border-emerald-500/40 rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-lg">
              <div>
                <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-400 block mb-0.5">
                  Calculated Milk Rate
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white font-mono">
                    {ratePerLiter ? `₹${parseFloat(ratePerLiter).toFixed(2)}` : "--"}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/ Liter</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-bold tracking-wider uppercase text-teal-400 block mb-0.5">
                  Total Payable Amount
                </span>
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-4xl font-black text-emerald-400 font-mono tracking-tight">
                    {totalAmount ? `₹${parseFloat(totalAmount).toFixed(2)}` : "₹0.00"}
                  </span>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS: SAVE & RESET */}
            <div className="grid grid-cols-4 gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="col-span-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3.5 px-3 rounded-xl border border-slate-600 transition-all text-xs sm:text-sm active:scale-95"
              >
                Clear (ESC)
              </button>

              <button
                ref={submitBtnRef}
                type="submit"
                disabled={submitting || !farmerData || !quantityLiters || !fatPercentage || !snfPercentage}
                className="col-span-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-500/25 transition-all text-base sm:text-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale focus:outline-none focus:ring-4 focus:ring-emerald-400/70"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Saving Intake...</span>
                  </>
                ) : (
                  <>
                    <span>RECORD INTAKE</span>
                    <span className="px-2 py-0.5 bg-slate-950/20 text-slate-950 text-xs rounded font-mono font-bold">
                      ⏎ ENTER
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* SERIAL CONSOLE LOG (COLLAPSIBLE / MONITORED) */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-400 mb-2 border-b border-slate-800 pb-1.5">
              <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-300 font-bold">
                <Usb className="w-3.5 h-3.5 text-cyan-400" />
                Hardware Serial Stream Logs
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500">
                  {serial.isConnected ? "Listening at 9600-8-N-1" : "Port closed"}
                </span>
                <button
                  type="button"
                  onClick={serial.clearLogs}
                  className="text-[10px] text-slate-400 hover:text-slate-200"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="h-20 overflow-y-auto space-y-0.5 text-slate-400 text-[11px] scrollbar-thin">
              {serial.rawLogs.length === 0 ? (
                <p className="text-slate-600 italic">
                  No serial stream frames received yet. Connect your COM port or click a Ghost HW
                  sample above.
                </p>
              ) : (
                serial.rawLogs.map((log, idx) => (
                  <p key={idx} className="leading-snug">
                    {log}
                  </p>
                ))
              )}
            </div>
          </div>
        </section>

        {/* RIGHT: TOUCH NUMPAD + LIVE FEED (5 COLS) */}
        <section className="lg:col-span-5 space-y-5">
          {/* TOUCH NUMPAD (PERFECT FOR TABLETS & MOBILES) */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-300">
              <span className="font-bold uppercase tracking-wider text-slate-400">
                Touch Keypad:{" "}
                <span className="text-emerald-400 font-mono">
                  {hardwareLock
                    ? "Farmer ID (Hardware Auto)"
                    : activeField === "farmerId"
                    ? "Farmer ID"
                    : activeField === "quantityLiters"
                    ? "Weight (L)"
                    : activeField === "fatPercentage"
                    ? "FAT %"
                    : "SNF %"}
                </span>
              </span>
              <span className="text-[10px] text-slate-500">10-Key Rapid POS</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "BACKSPACE"].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleNumpadPress(key)}
                  className={`h-12 rounded-xl text-lg font-black transition-all active:scale-95 shadow-sm border ${
                    key === "BACKSPACE"
                      ? "bg-slate-700/80 text-rose-300 border-slate-600 hover:bg-slate-700"
                      : "bg-slate-900/90 text-white border-slate-700/80 hover:bg-slate-800"
                  }`}
                >
                  {key === "BACKSPACE" ? "⌫" : key}
                </button>
              ))}

              <button
                type="button"
                onClick={() => handleNumpadPress("CLEAR")}
                className="h-12 rounded-xl text-xs font-black bg-slate-700/50 text-slate-400 border border-slate-600 hover:bg-slate-700 active:scale-95"
              >
                CLEAR
              </button>

              <button
                type="button"
                onClick={() => handleNumpadPress("ENTER")}
                className="col-span-2 h-12 rounded-xl text-sm font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 border border-emerald-400 shadow-md shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>NEXT / ENTER</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* RUNNING SESSION SUMMARY */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Shift Total Milk
              </span>
              <p className="text-xl font-black text-white font-mono mt-0.5">
                {sessionTotalLiters.toFixed(2)}{" "}
                <span className="text-xs text-slate-400 font-normal">L</span>
              </p>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Shift Total Value
              </span>
              <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                ₹{sessionTotalAmount.toFixed(2)}
              </p>
            </div>
          </div>

          {/* RECENT COLLECTIONS FEED */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700/80">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-emerald-400" />
                Recent Intakes (Today)
              </h3>
              <Link
                to="/milk-collections"
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
              >
                View All
              </Link>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
              {recentCollections.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-4">
                  No records yet for this session.
                </p>
              ) : (
                recentCollections.map((col) => (
                  <div
                    key={col.id}
                    className="p-2.5 bg-slate-900/70 border border-slate-700/60 rounded-xl flex items-center justify-between hover:border-slate-600 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-white">
                          {col.farmerName || `Farmer #${col.farmerId}`}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono">
                          #{col.farmerId}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                        <span>{parseFloat(col.quantityLiters).toFixed(2)} L</span>
                        <span>&bull;</span>
                        <span>FAT: {parseFloat(col.fatPercentage).toFixed(1)}%</span>
                        <span>&bull;</span>
                        <span>SNF: {parseFloat(col.snfPercentage).toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-400 font-mono block">
                        ₹{parseFloat(col.totalAmount || 0).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ₹{parseFloat(col.ratePerLiter || 0).toFixed(1)}/L
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
