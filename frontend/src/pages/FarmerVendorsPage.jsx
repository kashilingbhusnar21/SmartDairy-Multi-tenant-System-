import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ErrorState from "../components/ui/ErrorState";
import PageLoader from "../components/ui/PageLoader";
import { getVendors } from "../services/vendors";
import { getErrorMessage } from "../utils/errorMessage";

function FarmerVendorsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [vendors, setVendors] = useState([]);

  const loadVendors = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getVendors();
      setVendors(data.filter((v) => v.active));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load vendors"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  if (loading) {
    return <PageLoader label="Loading vendors…" />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Equipment Vendors</h2>
        <p className="text-slate-600 text-sm mt-1">
          Browse local vendor shops for dairy equipment and machinery
        </p>
      </div>

      <ErrorState
        message={error}
        onRetry={() => {
          setLoading(true);
          setError("");
          loadVendors();
        }}
      />

      {error ? null : (
        <>
          {vendors.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <p className="text-slate-500">No vendors available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendors.map((vendor) => (
                <div
                  key={vendor.id}
                  onClick={() => navigate(`/farmers/equipment/vendor/${vendor.id}`)}
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 text-lg">{vendor.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <svg
                          className="w-4 h-4 text-slate-400 flex-shrink-0"
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
                        <span className="text-sm text-slate-600">{vendor.phone}</span>
                      </div>
                      {vendor.shopAddress && (
                        <div className="flex items-center gap-2 mt-1">
                          <svg
                            className="w-4 h-4 text-slate-400 flex-shrink-0"
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
                          <span className="text-xs text-slate-500 flex-1">{vendor.shopAddress}</span>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vendor.shopAddress)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                          >
                            Map
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-500">{vendor.equipmentCount} equipment</span>
                    <span className="text-xs text-emerald-600 font-medium">View Products →</span>
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

export default FarmerVendorsPage;
