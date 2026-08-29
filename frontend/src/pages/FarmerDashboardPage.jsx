import { useEffect, useState, useMemo } from "react";
import { getFarmerProfile, getFarmerMilkCollections, getFarmerPayments } from "../services/farmer";
import { LayoutDashboard, Milk, CreditCard, TrendingUp } from "lucide-react";

function FarmerDashboardPage() {
  const [farmer, setFarmer] = useState(null);
  const [milkCollections, setMilkCollections] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [farmerRes, milkRes, paymentsRes] = await Promise.all([
          getFarmerProfile(),
          getFarmerMilkCollections(),
          getFarmerPayments(),
        ]);
        console.log("FARMER PROFILE API RESPONSE:", farmerRes);
        console.log("MILK COLLECTIONS API RESPONSE:", milkRes);
        console.log("PAYMENTS API RESPONSE:", paymentsRes);
        setFarmer(typeof farmerRes === 'object' && !Array.isArray(farmerRes) ? farmerRes?.data || farmerRes || null : farmerRes || null);
        setMilkCollections(Array.isArray(milkRes) ? milkRes : milkRes?.data || []);
        setPayments(Array.isArray(paymentsRes) ? paymentsRes : paymentsRes?.data || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalMilk = useMemo(() => 
    (milkCollections || []).reduce((sum, col) => sum + (Number(col?.quantityLiters) || 0), 0),
    [milkCollections]
  );
  const totalPayments = useMemo(() => 
    (payments || []).reduce((sum, pay) => sum + (Number(pay?.amount) || 0), 0),
    [payments]
  );

  // Precompute formatted values for display
  const formattedCollections = useMemo(() => {
    const collections = Array.isArray(milkCollections) ? milkCollections : [];
    return collections.map(col => ({
      ...col,
      quantity: Number(col?.quantityLiters) || 0,
      rate: Number(col?.ratePerLiter) || 0,
      displayDate: col?.date ? new Date(col.date).toLocaleDateString() : 'N/A'
    }));
  }, [milkCollections]);

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
        <h1 className="text-2xl font-bold text-slate-800">Farmer Dashboard</h1>
        <p className="text-slate-600">Welcome back, {farmer?.fullName || farmer?.name || "Farmer"}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Milk Collected</p>
              <p className="text-2xl font-bold text-slate-800">{totalMilk.toFixed(2)} L</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Milk className="text-emerald-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Payments</p>
              <p className="text-2xl font-bold text-slate-800">₹{totalPayments.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Collections Count</p>
              <p className="text-2xl font-bold text-slate-800">{(milkCollections || []).length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Recent Milk Collections</h2>
        </div>
        <div className="p-6">
          {(!milkCollections || milkCollections.length === 0) ? (
            <p className="text-slate-500 text-center py-4">No milk collections found</p>
          ) : (
            <div className="space-y-3">
              {formattedCollections.slice(0, 5).map((collection) => (
                <div key={collection.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800">{collection.quantity.toFixed(2)} L</p>
                    <p className="text-sm text-slate-500">{collection.displayDate}</p>
                  </div>
                  <p className="text-emerald-600 font-semibold">₹{collection.rate.toFixed(2)}/L</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FarmerDashboardPage;
