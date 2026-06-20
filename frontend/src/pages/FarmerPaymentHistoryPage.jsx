import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import ErrorState from "../components/ui/ErrorState";
import PageLoader from "../components/ui/PageLoader";
import Pagination from "../components/ui/Pagination";
import { usePagination } from "../hooks/usePagination";
import { downloadPaymentReceipt, listFarmerPayments } from "../services/payments";
import { getErrorMessage } from "../utils/errorMessage";

const PAGE_SIZE = 8;

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatDate(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString();
}

function FarmerPaymentHistoryPage() {
  const { farmerId } = useParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!farmerId) {
      setError("Invalid farmer route. Farmer ID is missing.");
      setRows([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const data = await listFarmerPayments(farmerId);
      setRows(asArray(data));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load payments"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [farmerId]);

  useEffect(() => {
    load();
  }, [load]);

  const { page, setPage, pageItems, totalPages, total, pageSize } = usePagination(rows, PAGE_SIZE);
  const farmerName = rows[0]?.farmerName || rows[0]?.farmerFullName || "Farmer";

  const handleReceipt = async (id) => {
    try {
      await downloadPaymentReceipt(id);
      toast.success("Receipt downloaded");
    } catch (err) {
      toast.error(getErrorMessage(err, "Download failed"));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link to="/farmers" className="text-emerald-700 text-sm hover:underline">
          ← Back to farmers
        </Link>
        <div className="mt-2">
          <Link to={`/farmers/${farmerId}/bill`} className="text-indigo-700 text-sm hover:underline">
            Open farmer bill preview
          </Link>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mt-4">Farmer payment history</h2>
        <p className="text-slate-600 text-sm">Farmer: {farmerName} (ID: {farmerId})</p>
      </div>

      <ErrorState message={error} onRetry={load} />

      {loading ? (
        <PageLoader label="Loading payments…" />
      ) : !error && rows.length === 0 ? (
        <p className="text-slate-600 text-sm py-8 text-center">No payments for this farmer.</p>
      ) : !error ? (
        <>
          <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Payment ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Collection</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Gross</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Feed</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Net</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Date</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Method</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{p.id}</td>
                    <td className="px-3 py-2">{p.milkCollectionId}</td>
                    <td className="px-3 py-2">₹ {p.grossAmount ?? p.amount}</td>
                    <td className="px-3 py-2 text-rose-700">₹ {p.feedDeductionAmount ?? "0.00"}</td>
                    <td className="px-3 py-2 font-medium">₹ {p.amount}</td>
                    <td className="px-3 py-2">{formatDate(p.paymentDate)}</td>
                    <td className="px-3 py-2">{p.status}</td>
                    <td className="px-3 py-2">{p.paymentMethod || "—"}</td>
                    <td className="px-3 py-2">
                      {p.status === "PAID" ? (
                        <button
                          type="button"
                          onClick={() => handleReceipt(p.id)}
                          className="text-emerald-700 hover:underline"
                        >
                          PDF
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </>
      ) : null}
    </div>
  );
}

export default FarmerPaymentHistoryPage;
