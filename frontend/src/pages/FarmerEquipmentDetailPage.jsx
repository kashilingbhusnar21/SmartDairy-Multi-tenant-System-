import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ErrorState from "../components/ui/ErrorState";
import PageLoader from "../components/ui/PageLoader";
import { getEquipmentById } from "../services/vendors";
import { getErrorMessage } from "../utils/errorMessage";

function FarmerEquipmentDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [equipment, setEquipment] = useState(null);

  const loadEquipment = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getEquipmentById(id);
      setEquipment(data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load equipment details"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEquipment();
  }, [loadEquipment]);

  const handleCall = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  if (loading) {
    return <PageLoader label="Loading equipment details…" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-slate-600 hover:text-slate-800 mb-2 flex items-center gap-1"
        >
          ← Back
        </button>
        <h2 className="text-2xl font-bold text-slate-800">Equipment Details</h2>
      </div>

      <ErrorState
        message={error}
        onRetry={() => {
          setLoading(true);
          setError("");
          loadEquipment();
        }}
      />

      {error ? null : equipment ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {equipment.imageUrl && (
            <div className="aspect-video bg-slate-100">
              <img
                src={equipment.imageUrl}
                alt={equipment.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-3xl font-bold text-slate-900">{equipment.name}</h3>
              {equipment.companyName && (
                <p className="text-lg text-slate-600 mt-1">{equipment.companyName}</p>
              )}
              <p className="text-2xl font-bold text-emerald-600 mt-2">
                ₹{equipment.price?.toLocaleString()}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500 mb-1">Vendor</p>
                <p className="font-semibold text-slate-900">{equipment.vendorName}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500 mb-1">Phone Number</p>
                <a
                  href={`tel:${equipment.vendorPhone}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleCall(equipment.vendorPhone);
                  }}
                  className="font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  {equipment.vendorPhone}
                </a>
              </div>
              {equipment.vendorShopAddress && (
                <div className="bg-slate-50 rounded-lg p-4 md:col-span-2">
                  <p className="text-sm text-slate-500 mb-1">Shop Address</p>
                  <p className="font-semibold text-slate-900">{equipment.vendorShopAddress}</p>
                </div>
              )}
            </div>

            {equipment.description && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Description</h4>
                <p className="text-slate-600 whitespace-pre-wrap">{equipment.description}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <a
                href={`tel:${equipment.vendorPhone}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleCall(equipment.vendorPhone);
                }}
                className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 text-center flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                Call Vendor
              </a>
              {equipment.vendorShopAddress && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(equipment.vendorShopAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 text-center flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  View on Map
                </a>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default FarmerEquipmentDetailPage;
