import { useEffect, useState, useMemo } from "react";
import { getFarmerMilkCollections } from "../services/farmer";
import { Milk, Calendar, TrendingUp } from "lucide-react";

function FarmerMilkCollectionsPage() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFarmerMilkCollections()
      .then((res) => {
        console.log("MILK COLLECTIONS API RESPONSE:", res);
        setCollections(Array.isArray(res) ? res : res?.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalQuantity = useMemo(() => 
    (collections || []).reduce((sum, col) => sum + (Number(col?.quantityLiters) || 0), 0),
    [collections]
  );
  const totalAmount = useMemo(() => 
    (collections || []).reduce((sum, col) => sum + (Number(col?.totalAmount) || 0), 0),
    [collections]
  );

  // Precompute formatted values for display
  const formattedCollections = useMemo(() => {
    const safeCollections = Array.isArray(collections) ? collections : [];
    return safeCollections.map(col => ({
      ...col,
      quantity: Number(col?.quantityLiters) || 0,
      rate: Number(col?.ratePerLiter) || 0,
      amount: Number(col?.totalAmount) || 0,
      displayDate: col?.date ? new Date(col.date).toLocaleDateString() : 'N/A'
    }));
  }, [collections]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Milk Collections</h1>
        <p className="text-slate-600">View your milk collection history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Quantity</p>
              <p className="text-2xl font-bold text-slate-800">{totalQuantity.toFixed(2)} L</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Milk className="text-emerald-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Value</p>
              <p className="text-2xl font-bold text-slate-800">₹{totalAmount.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Collection History</h2>
        </div>
        <div className="p-6">
          {(!collections || collections.length === 0) ? (
            <p className="text-slate-500 text-center py-4">No milk collections found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border border-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-300">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 border border-slate-300">Date</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 border border-slate-300">Quantity (L)</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 border border-slate-300">Rate (₹)</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 border border-slate-300">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {formattedCollections.map((collection, index) => (
                      <tr
                          key={collection.id}
                          className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-slate-100 transition-colors`}
                      >
                      <td className="py-3 px-4 text-sm text-slate-800 border border-slate-200">
                        {collection.displayDate}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-800 text-right border border-slate-200">{collection.quantity.toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm text-slate-800 text-right border border-slate-200">₹{collection.rate.toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-emerald-600 text-right border border-slate-200">
                        ₹{collection.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FarmerMilkCollectionsPage;



