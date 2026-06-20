import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createMilkCollection, getMilkCollection, updateMilkCollection } from "../services/milkCollections";
import ErrorState from "../components/ui/ErrorState";
import FarmerSelect from "../components/ui/FarmerSelect";

function MilkCollectionFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    farmerId: "",
    quantityLiters: "",
    fatPercentage: "",
    snfPercentage: "",
    date: new Date().toISOString().split('T')[0],
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
      setError("Failed to save milk collection");
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
              Quantity (Liters) *
            </label>
            <input
              type="number"
              step="0.1"
              name="quantityLiters"
              value={formData.quantityLiters}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="0.0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Fat (%)
            </label>
            <input
              type="number"
              step="0.1"
              name="fatPercentage"
              value={formData.fatPercentage}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="0.0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              SNF (%)
            </label>
            <input
              type="number"
              step="0.1"
              name="snfPercentage"
              value={formData.snfPercentage}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="0.0"
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
