import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import ErrorState from "../components/ui/ErrorState";
import PageLoader from "../components/ui/PageLoader";
import Pagination from "../components/ui/Pagination";
import { usePagination } from "../hooks/usePagination";
import { deleteMilkCollection, listDailyCollections } from "../services/milkCollections";
import { generatePaymentFromCollection, generateBatchPayments } from "../services/payments";
import { getErrorMessage } from "../utils/errorMessage";
import { todayISO } from "../utils/dateUtils";

const PAGE_SIZE = 8;

function MilkCollectionListPage() {
  const [date, setDate] = useState(todayISO());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shiftFilter, setShiftFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Batch payment modal state
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchDate, setBatchDate] = useState(todayISO());
  const [batchShift, setBatchShift] = useState("");
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResult, setBatchResult] = useState(null);

  const load = useCallback(async (targetDate) => {
    try {
      setLoading(true);
      setError("");
      const data = await listDailyCollections(targetDate);
      setRows(data);
    } catch (err) {
      setError(getErrorMessage(err, "Error occurred"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(date);
    // initial load only; date changes load via handleDateChange
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(() => {
    const list = rows.filter((r) => {
      if (shiftFilter && r.shift !== shiftFilter) return false;
      if (statusFilter) {
        const itemStatus = r.paymentStatus || "UNPAID";
        if (itemStatus !== statusFilter) return false;
      }
      return true;
    });

    // Priority ordering: UNPAID first (needs action), then PENDING, then PAID (already settled)
    const priorityMap = {
      UNPAID: 0,
      PENDING: 1,
      PAID: 2,
    };

    return [...list].sort((a, b) => {
      const pA = priorityMap[a.paymentStatus || "UNPAID"] ?? 0;
      const pB = priorityMap[b.paymentStatus || "UNPAID"] ?? 0;
      if (pA !== pB) return pA - pB;
      // Secondary: newest ID first within each group
      return (b.id || 0) - (a.id || 0);
    });
  }, [rows, shiftFilter, statusFilter]);

  const { page, setPage, pageItems, totalPages, total, pageSize } = usePagination(
    filteredRows,
    PAGE_SIZE
  );

  const handleDateChange = (e) => {
    const value = e.target.value;
    setDate(value);
    load(value);
  };

  const handleGeneratePayment = async (collectionId) => {
    try {
      await generatePaymentFromCollection(collectionId);
      toast.success("Payment generated successfully");
      load(date); // refresh to update badge to PENDING
    } catch (err) {
      toast.error(getErrorMessage(err, "Payment failed"));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this milk collection?")) return;
    try {
      await deleteMilkCollection(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast.success("Milk collection deleted successfully");
    } catch (err) {
      toast.error(getErrorMessage(err, "Error occurred"));
    }
  };

  const openBatchModal = () => {
    setBatchDate(date);
    setBatchShift(shiftFilter);
    setBatchResult(null);
    setShowBatchModal(true);
  };

  const handleRunBatch = async () => {
    try {
      setBatchLoading(true);
      const res = await generateBatchPayments({
        date: batchDate,
        shift: batchShift || null,
      });
      setBatchResult(res);
      toast.success(
        `Batch processed: ${res.successCount} created, ${res.skippedCount} skipped, ${res.failedCount} failed.`
      );
      load(date); // refresh rows so statuses update
    } catch (err) {
      toast.error(getErrorMessage(err, "Batch payment generation failed"));
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Milk Collection List</h2>
          <p className="text-slate-600 text-sm">View milk records and track payment settlement status</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openBatchModal}
            className="inline-flex justify-center items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm cursor-pointer"
          >
            ⚡ Batch Pay All
          </button>
          <Link
            to="/milk-collections/add"
            className="inline-flex justify-center px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
          >
            Add Milk Collection
          </Link>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:flex-wrap gap-4 items-start lg:items-end bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Date</label>
          <input
            type="date"
            value={date}
            onChange={handleDateChange}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Shift</label>
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white min-w-[130px]"
          >
            <option value="">All Shifts</option>
            <option value="MORNING">Morning</option>
            <option value="EVENING">Evening</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Payment</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white min-w-[130px]"
          >
            <option value="">All Status</option>
            <option value="UNPAID">○ Unpaid</option>
            <option value="PENDING">● Pending</option>
            <option value="PAID">● Paid</option>
          </select>
        </div>
      </div>

      <ErrorState message={error} onRetry={() => load(date)} />

      {loading ? (
        <PageLoader label="Loading..." />
      ) : !error && rows.length === 0 ? (
        <p className="text-slate-600 text-sm py-8 text-center">No milk collections found for this date</p>
      ) : !error && filteredRows.length === 0 ? (
        <p className="text-slate-600 text-sm py-8 text-center">No milk collections found matching your filter</p>
      ) : !error ? (
        <>
          <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-slate-100 border-b-2 border-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-slate-300">ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-slate-300">Farmer Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-slate-300">Shift</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700 border-b border-slate-300">Total Quantity (L)</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700 border-b border-slate-300">Fat %</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700 border-b border-slate-300">SNF %</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700 border-b border-slate-300">Rate/Liter</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700 border-b border-slate-300">Total Amount</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-700 border-b border-slate-300">Payment Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pageItems.map((r, index) => {
                  const paymentStatus = r.paymentStatus || "UNPAID";

                  return (
                    <tr
                      key={r.id}
                      className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-slate-100 transition-colors`}
                    >
                      <td className="px-4 py-3 border-b border-slate-200 font-mono text-xs">{r.id}</td>
                      <td className="px-4 py-3 border-b border-slate-200 font-medium text-slate-900">{r.farmerName}</td>
                      <td className="px-4 py-3 border-b border-slate-200">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${r.shift === "MORNING" ? "bg-amber-100 text-amber-800" : "bg-indigo-100 text-indigo-800"}`}>
                          {r.shift}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right border-b border-slate-200">{r.quantityLiters}</td>
                      <td className="px-4 py-3 text-right border-b border-slate-200">{r.fatPercentage}</td>
                      <td className="px-4 py-3 text-right border-b border-slate-200">{r.snfPercentage}</td>
                      <td className="px-4 py-3 text-right border-b border-slate-200">₹{r.ratePerLiter}</td>
                      <td className="px-4 py-3 text-right border-b border-slate-200 font-bold text-slate-800">₹{r.totalAmount}</td>

                      {/* Payment Status Badge */}
                      <td className="px-4 py-3 text-center border-b border-slate-200 whitespace-nowrap">
                        {paymentStatus === "PAID" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ● PAID
                          </span>
                        ) : paymentStatus === "PENDING" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            ● PENDING
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            ○ UNPAID
                          </span>
                        )}
                      </td>

                      {/* Smart Contextual Actions */}
                      <td className="px-4 py-3 border-b border-slate-200 space-x-2 whitespace-nowrap">
                        <Link
                          to={`/milk-collections/${r.id}/edit`}
                          className="text-emerald-700 hover:underline text-xs"
                        >
                          Edit
                        </Link>

                        {paymentStatus === "PAID" ? (
                          <span className="text-emerald-700 font-semibold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ✓ Settled
                          </span>
                        ) : paymentStatus === "PENDING" ? (
                          <Link
                            to="/payments"
                            className="text-amber-800 font-semibold text-xs bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-200 inline-block"
                            title="Go to Payment Dashboard to disburse"
                          >
                            In Payments →
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleGeneratePayment(r.id)}
                            className="text-blue-700 hover:underline font-bold text-xs"
                          >
                            Pay
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(r.id)}
                          className="text-red-600 hover:underline text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Batch Payment Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800">Batch Payment Generation</h3>
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Generate pending payments for all milk collections on the selected date and shift. Outstanding cattle feed deductions are automatically applied.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Date</label>
                <input
                  type="date"
                  value={batchDate}
                  onChange={(e) => setBatchDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Shift</label>
                <select
                  value={batchShift}
                  onChange={(e) => setBatchShift(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="">All Shifts (Morning & Evening)</option>
                  <option value="MORNING">Morning Shift Only</option>
                  <option value="EVENING">Evening Shift Only</option>
                </select>
              </div>

              {batchResult && (
                <div className="mt-4 p-4 rounded-xl border bg-slate-50 space-y-2 text-sm">
                  <div className="font-semibold text-slate-800">Batch Results:</div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs font-medium">
                    <div className="p-2 bg-slate-200 rounded">
                      <div>Total</div>
                      <div className="text-base font-bold text-slate-700">{batchResult.totalProcessed}</div>
                    </div>
                    <div className="p-2 bg-emerald-100 text-emerald-800 rounded">
                      <div>Created</div>
                      <div className="text-base font-bold">{batchResult.successCount}</div>
                    </div>
                    <div className="p-2 bg-amber-100 text-amber-800 rounded">
                      <div>Skipped</div>
                      <div className="text-base font-bold">{batchResult.skippedCount}</div>
                    </div>
                    <div className="p-2 bg-rose-100 text-rose-800 rounded">
                      <div>Failed</div>
                      <div className="text-base font-bold">{batchResult.failedCount}</div>
                    </div>
                  </div>

                  {batchResult.details && batchResult.details.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto text-xs space-y-1 bg-white p-2 rounded border border-slate-200">
                      {batchResult.details.map((d, i) => (
                        <div key={i} className="text-slate-600">{d}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleRunBatch}
                disabled={batchLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
              >
                {batchLoading ? "Processing..." : "Generate Payments"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MilkCollectionListPage;
