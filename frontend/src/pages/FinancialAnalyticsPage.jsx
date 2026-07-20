import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  getFinancialAnalytics,
  getFinancialAnalyticsByFarmer,
  getFinancialAnalyticsWithFilters,
} from "../services/financialLedger";
import PageLoader from "../components/ui/PageLoader";
import ErrorState from "../components/ui/ErrorState";
import FarmerSelect from "../components/ui/FarmerSelect";
import { listFarmers } from "../services/farmers";

function FinancialAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");
  const [farmers, setFarmers] = useState([]);

  const [filters, setFilters] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
    farmerId: "",
    pendingType: "",
  });

  const [page, setPage] = useState(0);
  const [size] = useState(20);

  useEffect(() => {
    fetchFarmers();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [filters, page]);

  const fetchFarmers = async () => {
    try {
      const farmersData = await listFarmers();
      setFarmers(Array.isArray(farmersData) ? farmersData : []);
    } catch (err) {
      console.error("Failed to fetch farmers:", err);
      setFarmers([]);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      let data;
      if (filters.farmerId) {
        data = await getFinancialAnalyticsByFarmer(
          filters.farmerId,
          filters.from,
          filters.to,
          page,
          size
        );
      } else if (filters.pendingType) {
        data = await getFinancialAnalyticsWithFilters(
          filters.from,
          filters.to,
          filters.pendingType,
          page,
          size
        );
      } else {
        data = await getFinancialAnalytics(filters.from, filters.to, page, size);
      }
      setAnalytics(data);
      setError("");
    } catch (err) {
      setError("Failed to load financial analytics");
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "₹0.00";
    return `₹${parseFloat(value).toFixed(2)}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getTransactionTypeLabel = (type) => {
    const labels = {
      ADVANCE_ADDED: "Advance Added",
      ADVANCE_RECOVERED: "Advance Recovered",
      LOAN_ADDED: "Loan Added",
      LOAN_RECOVERED: "Loan Recovered",
      OTHER_ADDED: "Other Added",
      OTHER_RECOVERED: "Other Recovered",
      MANUAL_ADJUSTMENT: "Manual Adjustment",
      FEED_PURCHASE_ADDED: "Feed Purchase Added",
      PAYMENT_RELEASED: "Payment Released",
    };
    return labels[type] || type;
  };

  const getTransactionTypeColor = (type) => {
    if (type.includes("RECOVERED") || type === "PAYMENT_RELEASED")
      return "text-emerald-600";
    if (type.includes("ADDED")) return "text-amber-600";
    return "text-slate-600";
  };

  if (loading && !analytics) return <PageLoader label="Loading financial analytics..." />;

  return (
    <main className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">
          Financial Analytics Dashboard
        </h2>
        <p className="text-slate-600 mt-2">
          Overview of financial status, pending balances, and transaction activity
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Filters</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, from: e.target.value }))
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, to: e.target.value }))
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <FarmerSelect
            farmers={farmers}
            value={filters.farmerId}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, farmerId: e.target.value }))
            }
            label="Farmer"
            emptyOption="All Farmers"
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Pending Type
            </label>
            <select
              value={filters.pendingType}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, pendingType: e.target.value }))
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">All Types</option>
              <option value="advance">Advance</option>
              <option value="loan">Loan</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {analytics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-600 mb-2">Total Bill</p>
              <p className="text-2xl font-bold text-slate-800">
                {formatCurrency(analytics.totalBill)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {formatDate(analytics.dateFrom)} - {formatDate(analytics.dateTo)}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-600 mb-2">Total Paid</p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(analytics.totalPaid)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {formatDate(analytics.dateFrom)} - {formatDate(analytics.dateTo)}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-600 mb-2">Bill Pending Balance</p>
              <p className="text-2xl font-bold text-amber-600">
                {formatCurrency(analytics.billPendingBalance)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Bill - Paid - Deductions</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-600 mb-2">Monthly Recovery</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(analytics.totalRecovered)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Advance + Loan + Other</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-600 mb-2">
                Total Pending Advance
              </p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(analytics.totalPendingAdvance)}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-600 mb-2">
                Total Pending Loan
              </p>
              <p className="text-2xl font-bold text-amber-600">
                {formatCurrency(analytics.totalPendingLoan)}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-600 mb-2">
                Total Pending Other
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(analytics.totalPendingOther)}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-600 mb-2">
                Total Pending Balance
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {formatCurrency(analytics.totalPendingBalance)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-600 mb-2">
                Total Recoveries This Month
              </p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(analytics.totalRecovered)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {formatDate(analytics.dateFrom)} - {formatDate(analytics.dateTo)}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-600 mb-2">
                Payments Released
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(analytics.totalPaymentsReleased)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {formatDate(analytics.dateFrom)} - {formatDate(analytics.dateTo)}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-600 mb-2">
                Farmers With Pending Balances
              </p>
              <p className="text-2xl font-bold text-amber-600">
                {analytics.farmersWithPendingBalances}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-600 mb-2">
                Net Financial Exposure
              </p>
              <p
                className={`text-2xl font-bold ${
                  analytics.netFinancialExposure >= 0
                    ? "text-slate-800"
                    : "text-red-600"
                }`}
              >
                {formatCurrency(analytics.netFinancialExposure)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">
                Farmer Financial Status
              </h3>
            </div>
            {analytics.farmerStatusList &&
            analytics.farmerStatusList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Farmer ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Farmer Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Pending Advance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Pending Loan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Pending Other
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Total Pending
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Last Transaction Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {analytics.farmerStatusList.map((farmer) => (
                      <tr key={farmer.farmerId} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                          {farmer.farmerId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {farmer.farmerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600">
                          {formatCurrency(farmer.pendingAdvance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-600">
                          {formatCurrency(farmer.pendingLoan)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                          {formatCurrency(farmer.pendingOther)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">
                          {formatCurrency(farmer.totalPending)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                          {formatDate(farmer.lastTransactionDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <p>No farmers with pending balances</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">
                Recent Transaction Activity
              </h3>
            </div>
            {analytics.recentTransactions &&
            analytics.recentTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Farmer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {analytics.recentTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                          {formatDate(transaction.transactionDate)}
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTransactionTypeColor(
                            transaction.transactionType
                          )}`}
                        >
                          {getTransactionTypeLabel(transaction.transactionType)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                          {transaction.farmerName}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700 max-w-xs truncate">
                          {transaction.description || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <p>No recent transactions</p>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}

export default FinancialAnalyticsPage;
