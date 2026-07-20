import { useState } from "react";
import toast from "react-hot-toast";
import FarmerSelect from "../components/ui/FarmerSelect";
import {
  getFinancialAccount,
  getTransactions,
  addAdvance,
  recoverAdvance,
  addLoan,
  recoverLoan,
  addOther,
  recoverOther,
} from "../services/financialLedger";

function FinancialLedgerPage() {
  const [farmerId, setFarmerId] = useState("");
  const [farmer, setFarmer] = useState(null);
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddAdvance, setShowAddAdvance] = useState(false);
  const [showRecoverAdvance, setShowRecoverAdvance] = useState(false);
  const [showAddLoan, setShowAddLoan] = useState(false);
  const [showRecoverLoan, setShowRecoverLoan] = useState(false);
  const [showAddOther, setShowAddOther] = useState(false);
  const [showRecoverOther, setShowRecoverOther] = useState(false);
  const [amount, setAmount] = useState("");

  const loadFinancialData = async (selectedFarmer) => {
    if (!selectedFarmer) return;
    
    setLoading(true);
    try {
      const [accountData, transactionsData] = await Promise.all([
        getFinancialAccount(selectedFarmer.id),
        getTransactions(selectedFarmer.id),
      ]);
      setAccount(accountData);
      setTransactions(transactionsData);
    } catch (err) {
      toast.error("Failed to load financial data");
      setAccount(null);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFarmerFound = (selectedFarmer) => {
    setFarmer(selectedFarmer);
    loadFinancialData(selectedFarmer);
  };

  const handleFarmerChange = (e) => {
    setFarmerId(e.target.value);
    if (!e.target.value) {
      setFarmer(null);
      setAccount(null);
      setTransactions([]);
    }
  };

  const executeOperation = async (operation, payload) => {
    setActionLoading(true);
    try {
      const result = await operation(payload);
      setAccount(result);
      setAmount("");
      toast.success("Operation successful");
      await loadFinancialData(farmer);
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddAdvance = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    executeOperation(addAdvance, { farmerId: farmer.id, amount: parseFloat(amount) });
    setShowAddAdvance(false);
  };

  const handleRecoverAdvance = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (parseFloat(amount) > account.pendingAdvance) {
      toast.error("Amount cannot exceed pending advance");
      return;
    }
    executeOperation(recoverAdvance, { farmerId: farmer.id, amount: parseFloat(amount) });
    setShowRecoverAdvance(false);
  };

  const handleAddLoan = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    executeOperation(addLoan, { farmerId: farmer.id, amount: parseFloat(amount) });
    setShowAddLoan(false);
  };

  const handleRecoverLoan = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (parseFloat(amount) > account.pendingLoan) {
      toast.error("Amount cannot exceed pending loan");
      return;
    }
    executeOperation(recoverLoan, { farmerId: farmer.id, amount: parseFloat(amount) });
    setShowRecoverLoan(false);
  };

  const handleAddOther = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    executeOperation(addOther, { farmerId: farmer.id, amount: parseFloat(amount) });
    setShowAddOther(false);
  };

  const handleRecoverOther = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (parseFloat(amount) > account.pendingOther) {
      toast.error("Amount cannot exceed pending other");
      return;
    }
    executeOperation(recoverOther, { farmerId: farmer.id, amount: parseFloat(amount) });
    setShowRecoverOther(false);
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "₹0.00";
    const parsed = parseFloat(value);
    if (Number.isNaN(parsed)) return "₹0.00";
    return `₹${parsed.toFixed(2)}`;
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

  return (
    <main className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Financial Ledger</h2>
        <p className="text-slate-600 mt-2">Manage farmer financial accounts and transactions</p>
      </div>

      <div className="space-y-6">
        <FarmerSelect
          value={farmerId}
          onChange={handleFarmerChange}
          onFarmerFound={handleFarmerFound}
          required
          label="Farmer"
          placeholder="Enter Farmer ID to load financial data"
        />

        {loading && (
          <div className="text-center py-8">
            <p className="text-slate-600">Loading financial data...</p>
          </div>
        )}

        {account && !loading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-600 mb-2">Pending Advance</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(account.pendingAdvance)}</p>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-600 mb-2">Pending Loan</p>
                <p className="text-2xl font-bold text-amber-600">{formatCurrency(account.pendingLoan)}</p>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-600 mb-2">Pending Other</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(account.pendingOther)}</p>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-600 mb-2">Total Pending</p>
                <p className="text-2xl font-bold text-slate-800">{formatCurrency(account.totalPending)}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Financial Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Advance</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddAdvance(true)}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowRecoverAdvance(true)}
                      disabled={actionLoading || account.pendingAdvance <= 0}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                    >
                      Recover
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Loan</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddLoan(true)}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 text-sm font-medium"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowRecoverLoan(true)}
                      disabled={actionLoading || account.pendingLoan <= 0}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                    >
                      Recover
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Other</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddOther(true)}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowRecoverOther(true)}
                      disabled={actionLoading || account.pendingOther <= 0}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                    >
                      Recover
                    </button>
                  </div>
                </div>
              </div>

              {(showAddAdvance || showRecoverAdvance || showAddLoan || showRecoverLoan || showAddOther || showRecoverOther) && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="0.00"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (showAddAdvance) handleAddAdvance();
                        else if (showRecoverAdvance) handleRecoverAdvance();
                        else if (showAddLoan) handleAddLoan();
                        else if (showRecoverLoan) handleRecoverLoan();
                        else if (showAddOther) handleAddOther();
                        else if (showRecoverOther) handleRecoverOther();
                      }}
                      disabled={actionLoading}
                      className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {actionLoading ? "Processing..." : "Confirm"}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddAdvance(false);
                        setShowRecoverAdvance(false);
                        setShowAddLoan(false);
                        setShowRecoverLoan(false);
                        setShowAddOther(false);
                        setShowRecoverOther(false);
                        setAmount("");
                      }}
                      className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">Transaction History</h3>
              </div>
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <p>No transactions found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Running Balance</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Reference</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                            {transaction.transactionDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                            {getTransactionTypeLabel(transaction.transactionType)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">
                            {formatCurrency(transaction.runningBalance ?? transaction.balanceAfter)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                            {transaction.referenceId || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700 max-w-xs truncate">
                            {transaction.description || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default FinancialLedgerPage;