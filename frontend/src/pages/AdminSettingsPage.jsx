import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ErrorState from "../components/ui/ErrorState";
import PageLoader from "../components/ui/PageLoader";
import { getMyDairyProfile, updateMyDairyProfile } from "../services/dairyProfile";
import { getPricingSettings, updatePricingSettings } from "../services/pricingSettings";
import { getErrorMessage } from "../utils/errorMessage";

function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profile, setProfile] = useState({
    dairyName: "",
    dairyCode: "",
    ownerName: "",
    contactNumber: "",
    email: "",
    dairyAddress: "",
    dairyLogo: "",
  });
  const [form, setForm] = useState({
    defaultFat: "",
    defaultSnf: "",
    baseRatePerLiter: "",
    fatBonusPerPoint: "",
    snfBonusPerPoint: "",
  });

  useEffect(() => {
    setLoadError("");
    Promise.all([getPricingSettings(), getMyDairyProfile()])
      .then(([s, p]) => {
        setForm({
          defaultFat: String(s.defaultFat),
          defaultSnf: String(s.defaultSnf),
          baseRatePerLiter: String(s.baseRatePerLiter),
          fatBonusPerPoint: String(s.fatBonusPerPoint),
          snfBonusPerPoint: String(s.snfBonusPerPoint),
        });
        setProfile({
          dairyName: p.dairyName || "",
          dairyCode: p.dairyCode || "",
          ownerName: p.ownerName || "",
          contactNumber: p.contactNumber || "",
          email: p.email || "",
          dairyAddress: p.dairyAddress || "",
          dairyLogo: p.dairyLogo || "",
        });
      })
      .catch((e) => setLoadError(getErrorMessage(e, "Failed to load settings")))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfile((prev) => ({ ...prev, dairyLogo: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fat = Number(form.defaultFat);
    const snf = Number(form.defaultSnf);
    const base = Number(form.baseRatePerLiter);
    const fatBonus = Number(form.fatBonusPerPoint);
    const snfBonus = Number(form.snfBonusPerPoint);

    if (isNaN(fat) || fat < 2.0 || fat > 12.0) {
      toast.error("Validation Error: Default FAT % must be between 2.0% and 12.0% (e.g. 3.5% Cow or 6.0% Buffalo).");
      return;
    }
    if (isNaN(snf) || snf < 6.0 || snf > 12.0) {
      toast.error("Validation Error: Default SNF % must be between 6.0% and 12.0% (standard baseline is 8.5%).");
      return;
    }
    if (isNaN(base) || base < 10.0 || base > 200.0) {
      toast.error("Validation Error: Base rate must be between ₹10.00 and ₹200.00 per liter.");
      return;
    }
    if (isNaN(fatBonus) || fatBonus < 0 || fatBonus > 50.0) {
      toast.error("Validation Error: FAT bonus per point must be between ₹0.00 and ₹50.00.");
      return;
    }
    if (isNaN(snfBonus) || snfBonus < 0 || snfBonus > 50.0) {
      toast.error("Validation Error: SNF bonus per point must be between ₹0.00 and ₹50.00.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        defaultFat: fat,
        defaultSnf: snf,
        baseRatePerLiter: base,
        fatBonusPerPoint: fatBonus,
        snfBonusPerPoint: snfBonus,
      };
      await updatePricingSettings(payload);
      toast.success("Pricing settings saved. New collections will use these values.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!profile.dairyName || !profile.dairyName.trim()) {
      toast.error("Validation Error: Dairy Name is required.");
      return;
    }
    if (profile.contactNumber && !/^[6-9]\d{9}$/.test(profile.contactNumber.trim())) {
      toast.error("Validation Error: Contact number must be a valid 10-digit Indian mobile number (e.g. 9876543210).");
      return;
    }
    if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) {
      toast.error("Validation Error: Please enter a valid email address.");
      return;
    }

    setProfileSaving(true);
    try {
      await updateMyDairyProfile(profile);
      toast.success("Dairy profile saved.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Dairy profile save failed"));
    } finally {
      setProfileSaving(false);
    }
  };

  if (loading) {
    return <PageLoader label="Loading pricing settings…" />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Milk pricing settings</h2>
        <p className="text-slate-600 text-sm mt-1">
          Configure default fat/SNF baselines and bonuses. Formula: rate = base + (fat − defaultFat) ×
          fatBonus + (SNF − defaultSNF) × snfBonus; total = rate × liters. Existing saved collection rows are
          not changed.
        </p>
      </div>

      <ErrorState
        message={loadError}
        onRetry={() => {
          setLoading(true);
          setLoadError("");
          getPricingSettings()
            .then((s) => {
              setForm({
                defaultFat: String(s.defaultFat),
                defaultSnf: String(s.defaultSnf),
                baseRatePerLiter: String(s.baseRatePerLiter),
                fatBonusPerPoint: String(s.fatBonusPerPoint),
                snfBonusPerPoint: String(s.snfBonusPerPoint),
              });
            })
            .catch((e) => setLoadError(getErrorMessage(e, "Failed to load settings")))
            .finally(() => setLoading(false));
        }}
      />

      {loadError ? null : (
        <>
        <form
          onSubmit={handleProfileSubmit}
          className="bg-white border border-slate-200 rounded-xl p-6 grid gap-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <h3 className="font-semibold text-slate-800">Dairy profile</h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dairy name</label>
            <input name="dairyName" value={profile.dairyName} onChange={handleProfileChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dairy code <span className="text-emerald-600 font-semibold">(Required for farmer login)</span></label>
            <input name="dairyCode" value={profile.dairyCode} onChange={handleProfileChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono" placeholder="e.g., DAIRY001" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Owner name</label>
            <input name="ownerName" value={profile.ownerName} onChange={handleProfileChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contact number</label>
            <input name="contactNumber" value={profile.contactNumber} onChange={handleProfileChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input name="email" type="email" value={profile.email} onChange={handleProfileChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Dairy address</label>
            <textarea name="dairyAddress" value={profile.dairyAddress} onChange={handleProfileChange} rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Dairy logo</label>
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="w-full text-sm" />
            {profile.dairyLogo ? <img src={profile.dairyLogo} alt="logo preview" className="mt-2 h-16 w-16 object-cover rounded border border-slate-200" /> : null}
          </div>
          <div className="sm:col-span-2 flex justify-end pt-2">
            <button type="submit" disabled={profileSaving} className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60">
              {profileSaving ? "Saving…" : "Save dairy profile"}
            </button>
          </div>
        </form>
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-xl p-6 grid gap-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <h3 className="font-semibold text-slate-800">Milk pricing settings</h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Default fat % <span className="text-xs text-slate-400 font-normal">(2.0% - 12.0%)</span>
            </label>
            <input
              name="defaultFat"
              type="number"
              step="0.01"
              min="2.0"
              max="12.0"
              value={form.defaultFat}
              onChange={handleChange}
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Default SNF % <span className="text-xs text-slate-400 font-normal">(6.0% - 12.0%)</span>
            </label>
            <input
              name="defaultSnf"
              type="number"
              step="0.01"
              min="6.0"
              max="12.0"
              value={form.defaultSnf}
              onChange={handleChange}
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Base rate (₹/L) <span className="text-xs text-slate-400 font-normal">(₹10 - ₹200)</span>
            </label>
            <input
              name="baseRatePerLiter"
              type="number"
              step="0.01"
              min="10.0"
              max="200.0"
              value={form.baseRatePerLiter}
              onChange={handleChange}
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Fat bonus per point (₹) <span className="text-xs text-slate-400 font-normal">(₹0 - ₹50)</span>
            </label>
            <input
              name="fatBonusPerPoint"
              type="number"
              step="0.01"
              min="0.0"
              max="50.0"
              value={form.fatBonusPerPoint}
              onChange={handleChange}
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              SNF bonus per point (₹) <span className="text-xs text-slate-400 font-normal">(₹0 - ₹50)</span>
            </label>
            <input
              name="snfBonusPerPoint"
              type="number"
              step="0.01"
              min="0.0"
              max="50.0"
              value={form.snfBonusPerPoint}
              onChange={handleChange}
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="sm:col-span-2 flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save settings"}
            </button>
          </div>
        </form>
        </>
      )}
    </div>
  );
}

export default AdminSettingsPage;
