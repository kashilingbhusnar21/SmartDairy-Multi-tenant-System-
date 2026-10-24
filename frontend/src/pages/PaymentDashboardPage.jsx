import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { listFarmers } from "../services/farmers";
import {
  getPaymentDashboardStats,
  listPayments,
  markPaymentPaid,
  batchMarkPaid,
} from "../services/payments";
import PageLoader from "../components/ui/PageLoader";
import ErrorState from "../components/ui/ErrorState";
import FarmerSelect from "../components/ui/FarmerSelect";
import { getErrorMessage } from "../utils/errorMessage";
import { todayISO } from "../utils/dateUtils";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function resolveFarmerName(payment) {
  return (
    payment?.farmerName ||
    payment?.farmerFullName ||
    payment?.farmer?.fullName ||
    payment?.farmer?.name ||
    "Unknown farmer"
  );
}

function resolveAmount(payment) {
  const net = payment?.netAmount ?? payment?.amount;
  const gross = payment?.grossAmount ?? payment?.totalAmount;

  return {
    gross: gross ?? 0,
    net: net ?? 0,
    feed: payment?.feedDeductionAmount ?? payment?.feedDeduction ?? 0,
  };
}

function PaymentDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    status: "PENDING",
    farmerId: "",
  });

  const [farmers, setFarmers] = useState([]);

  // Single payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    paymentDate: todayISO(),
    paymentMethod: "CASH",
    remarks: "Paid manually",
  });

  // Batch mark as paid state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const [batchForm, setBatchForm] = useState({
    paymentDate: todayISO(),
    paymentMethod: "CASH",
    remarks: "Batch payment",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [paymentsData, statsData, farmersData] = await Promise.all([
        listPayments(),
        getPaymentDashboardStats(),
        listFarmers(),
      ]);

      setPayments(asArray(paymentsData));
      setStats(statsData && typeof statsData === "object" ? statsData : null);
      setFarmers(asArray(farmersData));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to fetch payment data"));
      setPayments([]);
      setStats(null);
      setFarmers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = useMemo(() => {
    return asArray(payments).filter((payment) => {
      if (filters.status && payment.status !== filters.status) return false;

      if (
        filters.farmerId &&
        payment.farmerId !== Number(filters.farmerId)
      ) {
        return false;
      }

      return true;
    });
  }, [payments, filters]);

  // All pending payments in currently visible filtered list
  const pendingVisiblePayments = useMemo(() => {
    return filteredPayments.filter((p) => p.status === "PENDING" && p.id);
  }, [filteredPayments]);

  const allPendingSelected =
    pendingVisiblePayments.length > 0 &&
    pendingVisiblePayments.every((p) => selectedIds.has(p.id));

  const toggleSelectAll = () => {
    if (allPendingSelected) {
      // Deselect all visible pending
      const next = new Set(selectedIds);
      pendingVisiblePayments.forEach((p) => next.delete(p.id));
      setSelectedIds(next);
    } else {
      // Select all visible pending
      const next = new Set(selectedIds);
      pendingVisiblePayments.forEach((p) => next.add(p.id));
      setSelectedIds(next);
    }
  };

  const toggleSelectOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const selectedTotalAmount = useMemo(() => {
    let total = 0;
    payments.forEach((p) => {
      if (selectedIds.has(p.id)) {
        const amt = resolveAmount(p);
        total += Number(amt.net) || 0;
      }
    });
    return total;
  }, [payments, selectedIds]);

  const markAsPaid = (paymentId) => {
    setSelectedPaymentId(paymentId);
    setPaymentForm({
      paymentDate: todayISO(),
      paymentMethod: "CASH",
      remarks: "Paid manually",
    });
    setShowPaymentModal(true);
  };

  const submitSinglePayment = async () => {
    try {
      await markPaymentPaid(selectedPaymentId, {
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod,
        remarks: paymentForm.remarks,
      });

      toast.success("Payment marked as paid successfully");

      const [refreshedPayments, statsData] = await Promise.all([
        listPayments(),
        getPaymentDashboardStats(),
      ]);
      setPayments(asArray(refreshedPayments));
      setStats(statsData && typeof statsData === "object" ? statsData : null);

      const next = new Set(selectedIds);
      next.delete(selectedPaymentId);
      setSelectedIds(next);

      setShowPaymentModal(false);
      setSelectedPaymentId(null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to mark payment as paid"));
    }
  };

  const openBatchModal = () => {
    // If no individual rows selected, auto-select all pending payments
    if (selectedIds.size === 0) {
      const allPending = new Set(pendingVisiblePayments.map((p) => p.id));
      if (allPending.size === 0) {
        toast.error("No pending payments available to settle");
        return;
      }
      setSelectedIds(allPending);
    }

    setBatchForm({
      paymentDate: todayISO(),
      paymentMethod: "CASH",
      remarks: "Batch payment",
    });
    setBatchResult(null);
    setShowBatchModal(true);
  };

  const submitBatchPayment = async () => {
    if (selectedIds.size === 0) return;
    try {
      setBatchLoading(true);
      const res = await batchMarkPaid({
        paymentIds: Array.from(selectedIds),
        paymentDate: batchForm.paymentDate,
        paymentMethod: batchForm.paymentMethod,
        remarks: batchForm.remarks,
      });
      setBatchResult(res);

      toast.success(
        `Batch settlement: ${res.successCount} marked as paid, ${res.failedCount} failed.`
      );

      const [refreshedPayments, statsData] = await Promise.all([
        listPayments(),
        getPaymentDashboardStats(),
      ]);
      setPayments(asArray(refreshedPayments));
      setStats(statsData && typeof statsData === "object" ? statsData : null);

      if (res.paidPaymentIds && res.paidPaymentIds.length > 0) {
        const next = new Set(selectedIds);
        res.paidPaymentIds.forEach((id) => next.delete(id));
        setSelectedIds(next);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Batch payment settlement failed"));
    } finally {
      setBatchLoading(false);
    }
  };

  if (loading) return <PageLoader label="Loading payment dashboard..." />;
  if (error && payments.length === 0) return <ErrorState message={error} />;

  return (
    <main className="max-w-7xl mx-auto space-y-6">
      {/* Header with Always-Visible Batch Mark as Paid button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Payment Dashboard</h2>
          <p className="text-slate-600 mt-1">Manage farmer payments, batch settlements, and ledger updates</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openBatchModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all cursor-pointer"
          >
            <span>⚡ Batch Mark as Paid</span>
            {pendingVisiblePayments.length > 0 && (
              <span className="bg-emerald-800/80 px-2 py-0.5 rounded-full text-xs font-bold">
                {selectedIds.size > 0 ? `${selectedIds.size} Selected` : `${pendingVisiblePayments.length} Pending`}
              </span>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {stats && (
        <div className="grid md:grid-cols-4 gap-5">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm text-slate-500">Pending Payments</h3>
            <p className="text-3xl font-bold text-amber-700 my-2">{stats.pendingCount}</p>
            <p className="text-slate-600 text-sm">₹{stats.pendingTotalAmount} unpaid</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm text-slate-500">Paid This Week</h3>
            <p className="text-3xl font-bold text-emerald-700 my-2">₹{stats.paidThisWeekTotal}</p>
            <p className="text-slate-600 text-sm">{stats.paidThisWeekCount} transactions</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm text-slate-500">Paid This Month</h3>
            <p className="text-3xl font-bold text-emerald-700 my-2">₹{stats.paidThisMonthTotal}</p>
            <p className="text-slate-600 text-sm">{stats.paidThisMonthCount} transactions</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm text-slate-500">Total Amount</h3>
            <p className="text-3xl font-bold text-blue-700 my-2">₹{stats.totalAmount}</p>
            <p className="text-slate-600 text-sm">{stats.totalCount} payments</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-base font-semibold text-slate-800 mb-3">Filters</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  status: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
            </select>
          </div>

          <FarmerSelect
            farmers={farmers}
            value={filters.farmerId}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                farmerId: e.target.value,
              }))
            }
            label="Farmer"
            emptyOption="All Farmers"
          />
        </div>
      </div>

      {/* Selected Items Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 px-5 py-3 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-900 text-sm">
            <span className="font-bold text-base text-emerald-800">{selectedIds.size}</span> payments selected
            <span className="text-slate-400">•</span>
            <span>Total Settlement: <strong className="text-emerald-800 text-base">₹{selectedTotalAmount.toFixed(2)}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openBatchModal}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              ⚡ Proceed to Settle ({selectedIds.size})
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-slate-600 hover:text-slate-800 underline px-2 py-1"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b-2 border-slate-300">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={allPendingSelected}
                    onChange={toggleSelectAll}
                    disabled={pendingVisiblePayments.length === 0}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                    title="Select/Deselect all pending payments"
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Farmer</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Collection ID</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Gross</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Feed Deduction</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Net Amount</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Payment Date</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Method</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredPayments.map((payment, idx) => {
                const amount = resolveAmount(payment);
                const isPending = payment.status === "PENDING";
                const isSelected = selectedIds.has(payment.id);

                return (
                  <tr
                    key={payment.id || `${payment.farmerId}-${idx}`}
                    className={`${isSelected ? "bg-emerald-50/70" : idx % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-slate-100 transition-colors`}
                  >
                    <td className="px-4 py-3">
                      {isPending ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(payment.id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                        />
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 font-medium text-slate-900">
                      {resolveFarmerName(payment)}
                    </td>

                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                      {payment.milkCollectionId ? `#${payment.milkCollectionId}` : "—"}
                    </td>

                    <td className="px-4 py-3 text-right text-slate-800">
                      ₹{amount.gross}
                    </td>

                    <td className="px-4 py-3 text-right text-rose-700 font-medium">
                      ₹{amount.feed}
                    </td>

                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      ₹{amount.net}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                          payment.status === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {payment.paymentDate ? String(payment.paymentDate) : "—"}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {payment.paymentMethod || "—"}
                    </td>

                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {isPending ? (
                        <button
                          type="button"
                          onClick={() => markAsPaid(payment.id)}
                          disabled={!payment.id}
                          className="px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded hover:bg-emerald-700 transition-colors cursor-pointer"
                        >
                          Mark as Paid
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-semibold text-xs">✓ Settled</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No payment records found matching current filters</p>
          </div>
        )}
      </div>

      {/* Single Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Mark Payment as Paid</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({
                      ...prev,
                      paymentDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({
                      ...prev,
                      paymentMethod: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
                <textarea
                  value={paymentForm.remarks}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({
                      ...prev,
                      remarks: e.target.value,
                    }))
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitSinglePayment}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 cursor-pointer"
              >
                Save Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Mark as Paid Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800">Batch Mark as Paid</h2>
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 flex justify-between items-center text-sm">
              <span className="text-emerald-800 font-medium">Selected Payments:</span>
              <span className="font-bold text-emerald-900">
                {selectedIds.size} payments (Total: ₹{selectedTotalAmount.toFixed(2)})
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={batchForm.paymentDate}
                  onChange={(e) =>
                    setBatchForm((prev) => ({
                      ...prev,
                      paymentDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                <select
                  value={batchForm.paymentMethod}
                  onChange={(e) =>
                    setBatchForm((prev) => ({
                      ...prev,
                      paymentMethod: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
                <textarea
                  value={batchForm.remarks}
                  onChange={(e) =>
                    setBatchForm((prev) => ({
                      ...prev,
                      remarks: e.target.value,
                    }))
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              {batchResult && (
                <div className="mt-4 p-4 rounded-xl border bg-slate-50 space-y-2 text-sm">
                  <div className="font-semibold text-slate-800">Settlement Summary:</div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-medium">
                    <div className="p-2 bg-slate-200 rounded">
                      <div>Total</div>
                      <div className="text-base font-bold text-slate-700">{batchResult.totalProcessed}</div>
                    </div>
                    <div className="p-2 bg-emerald-100 text-emerald-800 rounded">
                      <div>Paid</div>
                      <div className="text-base font-bold">{batchResult.successCount}</div>
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
                onClick={submitBatchPayment}
                disabled={batchLoading || selectedIds.size === 0}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
              >
                {batchLoading ? "Settling Payments..." : `Settle ${selectedIds.size} Payments`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default PaymentDashboardPage;
