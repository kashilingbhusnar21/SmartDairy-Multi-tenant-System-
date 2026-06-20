import { useEffect, useRef, useState } from "react";
import { lookupFarmerById } from "../../services/farmers";
import { getErrorMessage } from "../../utils/errorMessage";

function FarmerSelect({
  value,
  onChange,
  onFarmerFound,
  name = "farmerId",
  required = false,
  label = "Farmer",
  className = "",
  inputClassName,
  searchClassName = "w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500",
  detailsClassName = "mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900",
  errorClassName = "text-xs text-red-600 mt-1",
  placeholder = "Enter Farmer ID",
}) {
  const inputRef = useRef(null);
  const [farmerIdInput, setFarmerIdInput] = useState(value ? String(value) : "");
  const [farmer, setFarmer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (value && String(value) !== farmerIdInput) {
      setFarmerIdInput(String(value));
    }
  }, [value]);

  useEffect(() => {
    const trimmed = farmerIdInput.trim();

    if (!trimmed) {
      setFarmer(null);
      setError("");
      notifyChange("");
      return;
    }

    if (!/^\d+$/.test(trimmed)) {
      setFarmer(null);
      setError("Farmer ID must contain numbers only");
      notifyChange("");
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const data = await lookupFarmerById(trimmed);
        setFarmer(data);
        notifyChange(String(data.id));
        onFarmerFound?.(data);
      } catch (err) {
        setFarmer(null);
        notifyChange("");
        if (err?.response?.status === 404) {
          setError("Farmer ID not found for this dairy admin");
        } else {
          setError(getErrorMessage(err, "Unable to fetch farmer details"));
        }
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [farmerIdInput]);

  useEffect(() => {
    if (!inputRef.current) return;

    if (loading) {
      inputRef.current.setCustomValidity("Wait for farmer lookup to finish");
    } else if (error) {
      inputRef.current.setCustomValidity(error);
    } else if (required && farmerIdInput.trim() && !farmer) {
      inputRef.current.setCustomValidity("Enter a valid Farmer ID");
    } else {
      inputRef.current.setCustomValidity("");
    }
  }, [error, farmer, farmerIdInput, loading, required]);

  const notifyChange = (nextValue) => {
    onChange?.({ target: { name, value: nextValue } });
  };

  const resolvedInputClassName = inputClassName || searchClassName;

  return (
    <div className={className}>
      {label ? (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
          {required ? " *" : ""}
        </label>
      ) : null}

      <input
        ref={inputRef}
        type="text"
        value={farmerIdInput}
        onChange={(event) => setFarmerIdInput(event.target.value)}
        placeholder={placeholder}
        className={resolvedInputClassName}
        inputMode="numeric"
        autoComplete="off"
        required={required}
      />

      <input
        type="hidden"
        name={name}
        value={value ?? ""}
        required={required}
      />

      {loading ? (
        <p className="text-xs text-slate-500 mt-1">Fetching farmer details...</p>
      ) : null}

      {error ? <p className={errorClassName}>{error}</p> : null}

      {farmer ? (
        <div className={detailsClassName}>
          <p className="font-semibold">{farmer.fullName}</p>
          <p>Village: {farmer.village || "-"}</p>
          <p>Mobile: {farmer.mobileNumber || "-"}</p>
        </div>
      ) : null}
    </div>
  );
}

export default FarmerSelect;
