import { useEffect, useState, useMemo } from "react";
import { getFarmerFeedPurchases } from "../services/farmer";
import { ShoppingBag, Calendar, Package } from "lucide-react";

const FEED_TYPE_OPTIONS = [
  { value: 'CATTLE_FEED', label: 'Cattle Feed' },
  { value: 'SILAGE', label: 'Silage' },
  { value: 'GREEN_FODDER', label: 'Green Fodder' },
  { value: 'DRY_FODDER', label: 'Dry Fodder' },
  { value: 'MINERAL_MIX', label: 'Mineral Mix' },
  { value: 'CONCENTRATE_FEED', label: 'Concentrate Feed' },
  { value: 'CALF_STARTER', label: 'Calf Starter' },
  { value: 'PROTEIN_SUPPLEMENT', label: 'Protein Supplement' },
  { value: 'OTHER', label: 'Other' },
];

function formatFeedType(value) {
  if (!value) return 'N/A';
  const normalizedValue = value.toUpperCase();
  const option = FEED_TYPE_OPTIONS.find(opt => opt.value === normalizedValue);
  return option ? option.label : value;
}

function FarmerFeedPurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFarmerFeedPurchases()
      .then((res) => {
        console.log("FEED PURCHASES API RESPONSE:", res);
        setPurchases(Array.isArray(res) ? res : res?.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalSpent = useMemo(() => 
    (purchases || []).reduce((sum, purchase) => sum + (Number(purchase?.totalAmount) || 0), 0),
    [purchases]
  );
  const totalQuantity = useMemo(() => 
    (purchases || []).reduce((sum, purchase) => sum + (Number(purchase?.feedQuantity) || 0), 0),
    [purchases]
  );

  // Precompute formatted values for display
  const formattedPurchases = useMemo(() => {
    const safePurchases = Array.isArray(purchases) ? purchases : [];
    return safePurchases.map(purchase => ({
      ...purchase,
      quantity: Number(purchase?.feedQuantity) || 0,
      rate: Number(purchase?.ratePerUnit) || 0,
      amount: Number(purchase?.totalAmount) || 0,
      displayDate: purchase?.feedDate ? new Date(purchase.feedDate).toLocaleDateString() : 'N/A',
      unitType: purchase?.unitType || 'kg'
    }));
  }, [purchases]);

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
        <h1 className="text-2xl font-bold text-slate-800">Feed Purchases</h1>
        <p className="text-slate-600">View your feed purchase history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Spent</p>
              <p className="text-2xl font-bold text-slate-800">₹{totalSpent.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="text-emerald-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Quantity</p>
              <p className="text-2xl font-bold text-slate-800">{totalQuantity.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Purchase History</h2>
        </div>
        <div className="p-6">
          {(!purchases || purchases.length === 0) ? (
            <p className="text-slate-500 text-center py-4">No feed purchases found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Feed Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Quantity</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Rate (₹/kg)</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {formattedPurchases.map((purchase) => (
                    <tr key={purchase.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm text-slate-800">
                        {purchase.displayDate}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-800">{formatFeedType(purchase?.feedType) || "N/A"}</td>
                      <td className="py-3 px-4 text-sm text-slate-800">{purchase.quantity.toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm text-slate-800">₹{purchase.rate.toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-emerald-600">
                        ₹{purchase.amount.toFixed(2)}
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

export default FarmerFeedPurchasesPage;
