import { useState, useEffect } from "react";
import { listFarmers } from "../services/farmers";
import {
  getPaymentDashboardStats,
  listPayments,
  markPaymentPaid,
} from "../services/payments";
import PageLoader from "../components/ui/PageLoader";
import ErrorState from "../components/ui/ErrorState";
import FarmerSelect from "../components/ui/FarmerSelect";
import { getErrorMessage } from "../utils/errorMessage";

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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: "CASH",
    remarks: "Paid manually",
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

  const filteredPayments = asArray(payments).filter((payment) => {
    if (filters.status && payment.status !== filters.status) return false;

    if (
      filters.farmerId &&
      payment.farmerId !== Number(filters.farmerId)
    ) {
      return false;
    }

    return true;
  });

  const markAsPaid = async (paymentId) => {
    setSelectedPaymentId(paymentId);
    setPaymentForm({
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: "CASH",
      remarks: "Paid manually",
    });
    setShowPaymentModal(true);
  };

  const submitPayment = async () => {
    try {
      await markPaymentPaid(selectedPaymentId, {
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod,
        remarks: paymentForm.remarks,
      });

      const refreshedPayments = await listPayments();
      setPayments(asArray(refreshedPayments));

      const statsData = await getPaymentDashboardStats();
      setStats(statsData && typeof statsData === "object" ? statsData : null);

      setShowPaymentModal(false);
      setSelectedPaymentId(null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to mark payment as paid"));
    }
  };

  if (loading) return <PageLoader label="Loading payment dashboard..." />;
  if (error && payments.length === 0) return <ErrorState message={error} />;

  return (
    <main className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">
          Payment Dashboard
        </h2>
        <p className="text-slate-600 mt-2">
          Manage farmer payments and billing
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {stats && (
        <div className="grid md:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm text-slate-500">Pending Payments</h3>
            <p className="text-3xl font-bold text-amber-700 my-2">
              {stats.pendingCount}
            </p>
            <p className="text-slate-600 text-sm">
              ₹{stats.pendingTotalAmount} unpaid
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm text-slate-500">Paid This Week</h3>
            <p className="text-3xl font-bold text-emerald-700 my-2">
              ₹{stats.paidThisWeekTotal}
            </p>
            <p className="text-slate-600 text-sm">
              {stats.paidThisWeekCount} transactions
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm text-slate-500">Paid This Month</h3>
            <p className="text-3xl font-bold text-emerald-700 my-2">
              ₹{stats.paidThisMonthTotal}
            </p>
            <p className="text-slate-600 text-sm">
              {stats.paidThisMonthCount} transactions
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm text-slate-500">Total Amount</h3>
            <p className="text-3xl font-bold text-blue-700 my-2">
              ₹{stats.totalAmount}
            </p>
            <p className="text-slate-600 text-sm">
              {stats.totalCount} payments
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Filters</h3>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Status
            </label>

            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  status: e.target.value,
                }))
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
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

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Farmer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Collection ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Gross
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Feed Deduction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Net Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Payment Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredPayments.map((payment) => {
                const amount = resolveAmount(payment);

                return (
                  <tr
                    key={
                      payment.id ||
                      `${payment.farmerId}-${payment.milkCollectionId || "na"}`
                    }
                    className="hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {resolveFarmerName(payment)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {payment.milkCollectionId || "—"}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      ₹{amount.gross}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-rose-700">
                      ₹{amount.feed}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      ₹{amount.net}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          payment.status === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {payment.paymentDate
                        ? new Date(payment.paymentDate).toLocaleDateString()
                        : "—"}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {payment.paymentMethod || "—"}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {payment.status === "PENDING" ? (
                        <button
                          onClick={() => markAsPaid(payment.id)}
                          disabled={!payment.id}
                          className="px-3 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700"
                        >
                          Mark as Paid
                        </button>
                      ) : (
                        <span className="text-emerald-600 text-xs">Paid</span>
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
            <p className="text-slate-500">No payment records found</p>
          </div>
        )}
      </div>
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Mark Payment as Paid
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Payment Date
              </label>
              <input
                type="date"
                value={paymentForm.paymentDate}
                onChange={(e) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    paymentDate: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Payment Method
              </label>
              <select
                value={paymentForm.paymentMethod}
                onChange={(e) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    paymentMethod: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Remarks
              </label>
              <textarea
                value={paymentForm.remarks}
                onChange={(e) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    remarks: e.target.value,
                  }))
                }
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={submitPayment}
                className="px-4 py-2 bg-green-600 text-white rounded-lg"
              >
                Save Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default PaymentDashboardPage;