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
    setSubmitting(true);
    try {
      if (isEdit) {
        await updateFarmer(id, form);
        toast.success("Farmer updated");
      } else {
        await createFarmer(form);
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
          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
          <input
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
          <input
            name="mobileNumber"
            value={form.mobileNumber}
            onChange={handleChange}
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Village</label>
          <input
            name="village"
            value={form.village}
            onChange={handleChange}
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            rows={2}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Aadhaar Number</label>
          <input
            name="aadhaarNumber"
            value={form.aadhaarNumber}
            onChange={handleChange}
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Bank Account Number</label>
          <input
            name="bankAccountNumber"
            value={form.bankAccountNumber}
            onChange={handleChange}
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">IFSC Code</label>
          <input
            name="ifscCode"
            value={form.ifscCode}
            onChange={handleChange}
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase"
          />
        </div>

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

