import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import ErrorState from "../components/ui/ErrorState";
import PageLoader from "../components/ui/PageLoader";
import { createFarmer, getFarmer, updateFarmer } from "../services/farmers";
import { getErrorMessage } from "../utils/errorMessage";

const emptyForm = {
  fullName: "",
  mobileNumber: "",
  village: "",
  address: "",
  aadhaarNumber: "",
  bankAccountNumber: "",
  ifscCode: "",
  password: "",
};

function FarmerFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loadingFarmer, setLoadingFarmer] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    setLoadingFarmer(true);
    setLoadError("");
    getFarmer(id)
      .then((data) => {
        if (cancelled) return;
        setForm({
          fullName: data.fullName,
          mobileNumber: data.mobileNumber,
          village: data.village,
          address: data.address || "",
          aadhaarNumber: data.aadhaarNumber,
          bankAccountNumber: data.bankAccountNumber,
          ifscCode: data.ifscCode,
        });
      })
      .catch((err) => {
        if (!cancelled) setLoadError(getErrorMessage(err, "Failed to load farmer"));
      })
      .finally(() => {
        if (!cancelled) setLoadingFarmer(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const name = (form.fullName || "").trim();
    const mobile = (form.mobileNumber || "").trim();
    const village = (form.village || "").trim();
    const aadhaar = (form.aadhaarNumber || "").trim();
    const bankAcc = (form.bankAccountNumber || "").trim();
    const ifsc = (form.ifscCode || "").trim().toUpperCase();

    // 1. Full Name Validation: Letters only, no numbers (e.g. blocks 878678t78876)
    if (!/^[a-zA-Z\s.'-]+$/.test(name) || name.length < 2) {
      const msg = "Validation Error: Full Name must contain only letters and spaces (e.g. Ramesh Patil). Numbers and digits like '" + name + "' are not allowed.";
      setError(msg);
      toast.error(msg);
      return;
    }

    // 2. Mobile Number Validation: 10 Indian digits
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      const msg = "Validation Error: Mobile Number must be a valid 10-digit Indian number starting with 6, 7, 8, or 9 (e.g. 9876543210).";
      setError(msg);
      toast.error(msg);
      return;
    }

    // 3. Village Name Validation: Letters only
    if (!/^[a-zA-Z\s.'-]+$/.test(village) || village.length < 2) {
      const msg = "Validation Error: Village name must contain only letters and spaces (e.g. Sangli).";
      setError(msg);
      toast.error(msg);
      return;
    }

    // 4. Aadhaar Number Validation: Exactly 12 digits, cannot be all identical
    if (!/^\d{12}$/.test(aadhaar)) {
      const msg = "Validation Error: Aadhaar Number must be exactly 12 numeric digits (e.g. 123412341234).";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (/^(\d)\1{11}$/.test(aadhaar)) {
      const msg = "Validation Error: Aadhaar Number cannot be all repeated identical digits (e.g. 777777777777).";
      setError(msg);
      toast.error(msg);
      return;
    }

    // 5. Bank Account Number Validation: 9 to 18 digits (blocks xxxxxxxxxxxxxxx)
    if (!/^\d{9,18}$/.test(bankAcc)) {
      const msg = "Validation Error: Bank Account Number must contain 9 to 18 numeric digits (e.g. 123456789012). Dummy text like 'xxxxxxxxxxxxxxx' is not allowed.";
      setError(msg);
      toast.error(msg);
      return;
    }

    // 6. IFSC Code Validation: Exactly 11 characters, standard format
    if (ifsc.length !== 11) {
      const msg = `Validation Error: IFSC Code must be exactly 11 characters. You entered ${ifsc.length} characters (e.g. SBIN0001234 has 3 zeros after SBIN, total 11 chars).`;
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
      const msg = "Validation Error: Invalid IFSC format. Must start with 4 bank letters, 5th character must be '0', followed by 6 alphanumeric branch characters (e.g. SBIN0001234).";
      setError(msg);
      toast.error(msg);
      return;
    }

    setSubmitting(true);
    try {
      const sanitizedForm = {
        ...form,
        fullName: name,
        mobileNumber: mobile,
        village: village,
        aadhaarNumber: aadhaar,
        bankAccountNumber: bankAcc,
        ifscCode: ifsc,
      };

      if (isEdit) {
        await updateFarmer(id, sanitizedForm);
        toast.success("Farmer updated");
      } else {
        await createFarmer(sanitizedForm);
        toast.success("Farmer created");
      }
      navigate("/farmers");
    } catch (err) {
      const msg = getErrorMessage(err, "Save failed");
      const data = err?.response?.data;
      if (data && typeof data === "object" && !data.error) {
        setError(Object.values(data).join(", "));
        toast.error(Object.values(data).join(", "));
      } else {
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (isEdit && loadingFarmer) {
    return <PageLoader label="Loading farmer…" />;
  }

  return (
    <main className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">
        {isEdit ? "Edit Farmer" : "Add Farmer"}
      </h2>
      <ErrorState
        message={loadError}
        onRetry={() => {
          setLoadError("");
          setLoadingFarmer(true);
          getFarmer(id)
            .then((data) => {
              setLoadError("");
              setForm({
                fullName: data.fullName,
                mobileNumber: data.mobileNumber,
                village: data.village,
                address: data.address || "",
                aadhaarNumber: data.aadhaarNumber,
                bankAccountNumber: data.bankAccountNumber,
                ifscCode: data.ifscCode,
              });
            })
            .catch((err) => setLoadError(getErrorMessage(err, "Failed to load farmer")))
            .finally(() => setLoadingFarmer(false));
        }}
      />
      {loadError ? null : (
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Full Name <span className="text-xs text-slate-400 font-normal">(letters only)</span>
          </label>
          <input
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            placeholder="e.g. Ramesh Patil"
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Mobile Number <span className="text-xs text-slate-400 font-normal">(10 digits)</span>
          </label>
          <input
            name="mobileNumber"
            value={form.mobileNumber}
            onChange={handleChange}
            maxLength={10}
            placeholder="e.g. 9876543210"
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Village <span className="text-xs text-slate-400 font-normal">(letters only)</span>
          </label>
          <input
            name="village"
            value={form.village}
            onChange={handleChange}
            placeholder="e.g. Sangli"
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            rows={2}
            placeholder="e.g. Near Bus Stand, Main Road"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Aadhaar Number <span className="text-xs text-slate-400 font-normal">(12 digits)</span>
          </label>
          <input
            name="aadhaarNumber"
            value={form.aadhaarNumber}
            onChange={handleChange}
            maxLength={12}
            placeholder="e.g. 123412341234"
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Bank Account Number <span className="text-xs text-slate-400 font-normal">(9 - 18 digits)</span>
          </label>
          <input
            name="bankAccountNumber"
            value={form.bankAccountNumber}
            onChange={handleChange}
            maxLength={18}
            placeholder="e.g. 123456789012"
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            IFSC Code <span className="text-xs text-slate-400 font-normal">(11 characters e.g. SBIN0001234)</span>
          </label>
          <input
            name="ifscCode"
            value={form.ifscCode}
            onChange={handleChange}
            maxLength={11}
            placeholder="e.g. SBIN0001234 (total 11 chars)"
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {!isEdit && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Password <span className="text-slate-500">(Optional - leave blank to set later)</span></label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              minLength={6}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Enter initial password for farmer login"
            />
          </div>
        )}

        {error ? (
          <p className="md:col-span-2 text-sm text-red-600">{error}</p>
        ) : null}

        <div className="md:col-span-2 flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => navigate("/farmers")}
            className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? "Saving…" : isEdit ? "Update Farmer" : "Create Farmer"}
          </button>
        </div>
      </form>
      )}
    </main>
  );
}

export default FarmerFormPage;

