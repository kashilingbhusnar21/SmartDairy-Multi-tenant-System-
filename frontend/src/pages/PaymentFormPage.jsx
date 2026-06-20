import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ErrorState from "../components/ui/ErrorState";
import FarmerSelect from "../components/ui/FarmerSelect";
import { listDailyCollections } from "../services/milkCollections";
import { generatePaymentFromCollection } from "../services/payments";
import { getErrorMessage } from "../utils/errorMessage";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function PaymentFormPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState([]);
  const [selectedFarmer, setSelectedFarmer] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("");
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState("");

  useEffect(() => {
    if (selectedFarmer) {
      const loadCollections = async () => {
        try {
          const data = await listDailyCollections(date);
          const farmerCollections = asArray(data).filter(
            (c) => c.farmerId === Number(selectedFarmer)
          );
          setCollections(farmerCollections);
        } catch (err) {
          setError(getErrorMessage(err, "Failed to load collections"));
          setCollections([]);
        }
      };
      loadCollections();
    } else {
      setCollections([]);
    }
  }, [selectedFarmer, date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCollection) {
      setError("Please select a milk collection");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await generatePaymentFromCollection(Number(selectedCollection));
      toast.success("Payment created successfully");
      navigate("/payments");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create payment"));
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setDate(e.target.value);
    setSelectedCollection("");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Add Payment</h2>
        <p className="text-slate-600 text-sm mt-1">
          Generate payment from milk collection record
        </p>
      </div>

      <ErrorState message={error} onRetry={() => setError("")} />

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={handleDateChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>

          <FarmerSelect
            value={selectedFarmer}
            onChange={(e) => {
              setSelectedFarmer(e.target.value);
              setSelectedCollection("");
            }}
            required
            label="Farmer"
          />

          {selectedFarmer && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Milk Collection
              </label>
              <select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                required
              >
                <option value="">Select a collection</option>
                {asArray(collections).map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {(collection.shift || collection.morningEvening)} - {(collection.totalQuantity || collection.quantityLiters || 0)}L - {(collection.fat || collection.fatPercentage || 0)}% FAT - {(collection.snf || collection.snfPercentage || 0)}% SNF - Total: {collection.totalAmount}
                  </option>
                ))}
              </select>
              {collections.length === 0 && (
                <p className="text-slate-500 text-sm mt-2">
                  No milk collections found for this farmer on selected date
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || !selectedCollection}
              className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed hover:bg-emerald-700 transition-colors"
            >
              {loading ? "Creating Payment..." : "Create Payment"}
            </button>
            <Link
              to="/payments"
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PaymentFormPage;
