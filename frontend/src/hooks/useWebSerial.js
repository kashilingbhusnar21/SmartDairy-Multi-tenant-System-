import { useState, useEffect, useRef, useCallback } from "react";
import { playHardwareConnectChime, playErrorBuzz } from "../utils/audioAlerts";

/**
 * Robust regex parser for standard Indian dairy hardware outputs:
 * - Ekomilk Ultra / Horizon: "FAT=04.20  SNF=08.80  CLR=28.50"
 * - Lactoscan: "F:4.20 S:8.80 C:28.50"
 * - Essae / Weighing scale: "WT:12.50" or "ST,GS,+0012.50kg" or "12.50 kg"
 */
export function parseSerialPayload(rawText) {
  if (!rawText || typeof rawText !== "string") return null;

  const result = {
    fat: null,
    snf: null,
    clr: null,
    weight: null,
    raw: rawText.trim()
  };

  // 1. FAT percentage
  const fatMatch = rawText.match(/(?:FAT|F)[\s:=]+([0-9]+(?:\.[0-9]+)?)/i);
  if (fatMatch) {
    const val = parseFloat(fatMatch[1]);
    if (!isNaN(val) && val >= 0 && val <= 15) {
      result.fat = val.toFixed(2);
    }
  }

  // 2. SNF percentage
  const snfMatch = rawText.match(/(?:SNF|S)[\s:=]+([0-9]+(?:\.[0-9]+)?)/i);
  if (snfMatch) {
    const val = parseFloat(snfMatch[1]);
    if (!isNaN(val) && val >= 0 && val <= 20) {
      result.snf = val.toFixed(2);
    }
  }

  // 3. CLR (Corrected Lactometer Reading)
  const clrMatch = rawText.match(/(?:CLR|C|DEN)[\s:=]+([0-9]+(?:\.[0-9]+)?)/i);
  if (clrMatch) {
    const val = parseFloat(clrMatch[1]);
    if (!isNaN(val) && val >= 0 && val <= 50) {
      result.clr = val.toFixed(2);
    }
  }

  // 4. Weight / Quantity in Liters or Kg
  const weightMatch =
    rawText.match(/(?:WT|W|WEIGHT|QTY|KG)[\s:=]+([0-9]+(?:\.[0-9]+)?)/i) ||
    rawText.match(/(?:ST,GS,\+?|\+)([0-9]+(?:\.[0-9]+)?)(?:kg|L)?/i);

  if (weightMatch) {
    const val = parseFloat(weightMatch[1]);
    if (!isNaN(val) && val > 0 && val <= 500) {
      result.weight = val.toFixed(2);
    }
  }

  const hasAnyData =
    result.fat !== null ||
    result.snf !== null ||
    result.clr !== null ||
    result.weight !== null;

  return hasAnyData ? result : null;
}

export function useWebSerial({ onData } = {}) {
  const isSupported =
    typeof window !== "undefined" && "serial" in navigator;

  const [isConnected, setIsConnected] = useState(false);
  const [portName, setPortName] = useState(null);
  const [error, setError] = useState(null);
  const [latestData, setLatestData] = useState(null);
  const [rawLogs, setRawLogs] = useState([]);

  const portRef = useRef(null);
  const readerRef = useRef(null);
  const keepReadingRef = useRef(false);

  const addLog = useCallback((msg) => {
    const time = new Date().toLocaleTimeString();
    setRawLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 49)]);
  }, []);

  const disconnect = useCallback(async () => {
    keepReadingRef.current = false;

    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch {
        // Ignore cancel errors
      }
      readerRef.current = null;
    }

    if (portRef.current) {
      try {
        await portRef.current.close();
      } catch {
        // Ignore close errors
      }
      portRef.current = null;
    }

    setIsConnected(false);
    setPortName(null);
    addLog("Serial port disconnected.");
  }, [addLog]);

  const connect = useCallback(
    async (options = { baudRate: 9600 }) => {
      setError(null);

      if (!isSupported) {
        const msg =
          "Web Serial API is not supported in this browser. Please use Google Chrome or Microsoft Edge on Windows/Mac/Linux.";
        setError(msg);
        playErrorBuzz();
        return false;
      }

      try {
        // Request user to select COM port from native browser popup
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: options.baudRate || 9600 });

        portRef.current = port;
        setIsConnected(true);
        keepReadingRef.current = true;

        const info = port.getInfo ? port.getInfo() : {};
        const displayName = info.usbVendorId
          ? `USB (VID:${info.usbVendorId.toString(16)})`
          : "Serial Port";
        setPortName(displayName);

        playHardwareConnectChime();
        addLog(`Connected to ${displayName} @ ${options.baudRate || 9600} baud.`);

        // Read stream loop
        (async () => {
          let buffer = "";
          const textDecoder = new TextDecoderStream();
          const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
          const reader = textDecoder.readable.getReader();
          readerRef.current = reader;

          try {
            while (keepReadingRef.current) {
              const { value, done } = await reader.read();
              if (done) break;
              if (value) {
                buffer += value;
                const lines = buffer.split(/[\r\n]+/);
                // Keep the last incomplete fragment in buffer
                buffer = lines.pop() || "";

                for (const line of lines) {
                  const trimmed = line.trim();
                  if (trimmed.length > 0) {
                    addLog(`RAW IN: ${trimmed}`);
                    const parsed = parseSerialPayload(trimmed);
                    if (parsed) {
                      setLatestData(parsed);
                      if (onData) onData(parsed);
                    }
                  }
                }
              }
            }
          } catch (readErr) {
            if (keepReadingRef.current) {
              console.error("Serial read stream error:", readErr);
              addLog(`Read error: ${readErr.message}`);
            }
          } finally {
            try {
              reader.releaseLock();
              await readableStreamClosed.catch(() => {});
            } catch {
              // Ignore release errors
            }
          }
        })();

        return true;
      } catch (err) {
        if (err.name !== "NotFoundError") {
          console.error("Failed to connect serial port:", err);
          setError(err.message || "Failed to open serial port.");
          playErrorBuzz();
        }
        setIsConnected(false);
        return false;
      }
    },
    [isSupported, onData, addLog]
  );

  // Manual test injection method (for testing without physical hardware or com0com)
  const injectSimulatedData = useCallback(
    (sample) => {
      const parsed = {
        fat: sample.fat !== undefined ? Number(sample.fat).toFixed(2) : null,
        snf: sample.snf !== undefined ? Number(sample.snf).toFixed(2) : null,
        clr: sample.clr !== undefined ? Number(sample.clr).toFixed(2) : null,
        weight: sample.weight !== undefined ? Number(sample.weight).toFixed(2) : null,
        raw: sample.raw || "SIMULATED_SAMPLE"
      };
      addLog(`SIMULATED IN: FAT=${parsed.fat} SNF=${parsed.snf} WT=${parsed.weight}`);
      setLatestData(parsed);
      if (onData) onData(parsed);
    },
    [onData, addLog]
  );

  useEffect(() => {
    return () => {
      if (keepReadingRef.current) {
        disconnect();
      }
    };
  }, [disconnect]);

  return {
    isSupported,
    isConnected,
    portName,
    error,
    latestData,
    rawLogs,
    connect,
    disconnect,
    injectSimulatedData,
    clearLogs: () => setRawLogs([])
  };
}
