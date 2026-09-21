import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ErrorState from "../components/ui/ErrorState";
import PageLoader from "../components/ui/PageLoader";
import { getEquipmentByVendor, getVendors } from "../services/vendors";
import { getErrorMessage } from "../utils/errorMessage";

function FarmerEquipmentListPage() {
  const navigate = useNavigate();
  const { vendorId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [equipment, setEquipment] = useState([]);
  const [vendor, setVendor] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [equipmentData, vendorsData] = await Promise.all([
        getEquipmentByVendor(vendorId),
        getVendors()
      ]);
      setEquipment(equipmentData);
      const vendorInfo = vendorsData.find(v => v.id === parseInt(vendorId));
      setVendor(vendorInfo);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load equipment"));
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return <PageLoader label="Loading equipment…" />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <button
          onClick={() => navigate("/farmers/vendors")}
          className="text-sm text-slate-600 hover:text-slate-800 mb-2 flex items-center gap-1"
        >
          ← Back to Vendors
        </button>
        <h2 className="text-2xl font-bold text-slate-800">
          {vendor ? vendor.name : "Equipment"}
        </h2>
        <p className="text-slate-600 text-sm mt-1">
          Browse equipment available from this vendor
        </p>
      </div>

      <ErrorState
        message={error}
        onRetry={() => {
          setLoading(true);
          setError("");
          loadData();
        }}
      />

      {error ? null : (
        <>
          {equipment.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <p className="text-slate-500">No equipment available from this vendor</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {equipment.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/farmers/equipment/${item.id}`)}
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer"
                >
                  {item.imageUrl && (
                    <div className="aspect-video bg-slate-100 rounded-lg mb-3 overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <h3 className="font-semibold text-slate-900 text-lg mb-2">{item.name}</h3>
                  {item.companyName && (
                    <p className="text-sm text-slate-500 mb-2">{item.companyName}</p>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-emerald-600">
                      ₹{item.price?.toLocaleString()}
                    </span>
                  </div>

                  {item.description && (
                    <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-500">{item.vendorName}</span>
                    <span className="text-xs text-emerald-600 font-medium">View Details →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default FarmerEquipmentListPage;
