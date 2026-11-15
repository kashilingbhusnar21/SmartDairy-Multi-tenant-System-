import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createMilkCollection, getMilkCollection, updateMilkCollection } from "../services/milkCollections";
import ErrorState from "../components/ui/ErrorState";
import FarmerSelect from "../components/ui/FarmerSelect";
import { getErrorMessage } from "../utils/errorMessage";
import { getOperationalRecordDateWindow } from "../utils/recordDateWindow";
import { todayISO } from "../utils/dateUtils";

function MilkCollectionFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const operationalDateWindow = getOperationalRecordDateWindow();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    farmerId: "",
    quantityLiters: "",
    fatPercentage: "",
    snfPercentage: "",
    date: todayISO(),
    shift: "MORNING"
  });

  useEffect(() => {
    if (id) {
      setLoading(true);
      getMilkCollection(id)
        .then(response => {
          const collection = response;
          setFormData({
            farmerId: collection.farmerId,
            quantityLiters: collection.quantityLiters,
            fatPercentage: collection.fatPercentage,
            snfPercentage: collection.snfPercentage,
            date: collection.date,
            shift: collection.shift
          });
        })
        .catch(() => setError("Failed to fetch milk collection"))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const qty = Number(formData.quantityLiters);
    const fat = Number(formData.fatPercentage);
    const snf = Number(formData.snfPercentage);

    if (isNaN(qty) || qty < 0.1 || qty > 1000) {
      setError("Validation Error: Quantity must be between 0.10 and 1000.00 Liters.");
      return;
    }
    if (isNaN(fat) || fat < 2.0 || fat > 12.0) {
      setError("Validation Error: FAT % must be between 2.0% and 12.0% (e.g. 3.5% - 8.5%).");
      return;
    }
    if (isNaN(snf) || snf < 6.0 || snf > 12.0) {
      setError("Validation Error: SNF % must be between 6.0% and 12.0% (standard is 8.0% - 9.5%).");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (id) {
        await updateMilkCollection(id, formData);
      } else {
        await createMilkCollection(formData);
      }
      navigate("/milk-collections");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save milk collection"));
    } finally {
      setLoading(false);
    }
  };

  if (error && !formData.farmerId) return <ErrorState message={error} />;

  return (
    <main className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">
          {id ? "Edit Milk Collection" : "Add Milk Collection"}
        </h2>
        <p className="text-slate-600 mt-2">
          {id ? "Update milk collection details" : "Record new milk collection"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <FarmerSelect
            name="farmerId"
            value={formData.farmerId}
            onChange={handleChange}
            required
            label="Farmer"
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Collection Date *
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              min={!id ? operationalDateWindow.min : undefined}
              max={!id ? operationalDateWindow.max : undefined}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Shift *
            </label>
            <select
              name="shift"
              value={formData.shift}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            >
              <option value="MORNING">Morning</option>
              <option value="EVENING">Evening</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Quantity (Liters) * <span className="text-xs text-slate-400 font-normal">(0.1 - 1000 L)</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.1"
              max="1000"
              name="quantityLiters"
              value={formData.quantityLiters}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Fat (%) * <span className="text-xs text-slate-400 font-normal">(2.0% - 12.0%)</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="2.0"
              max="12.0"
              name="fatPercentage"
              value={formData.fatPercentage}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              SNF (%) * <span className="text-xs text-slate-400 font-normal">(6.0% - 12.0%)</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="6.0"
              max="12.0"
              name="snfPercentage"
              value={formData.snfPercentage}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : (id ? "Update" : "Save")}
          </button>
          <button
            type="button"
            onClick={() => navigate("/milk-collections")}
            className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}

export default MilkCollectionFormPage;
