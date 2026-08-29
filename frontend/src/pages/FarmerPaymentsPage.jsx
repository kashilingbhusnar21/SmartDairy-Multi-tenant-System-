import { useEffect, useState, useMemo } from "react";
import { getFarmerPayments } from "../services/farmer";
import { CreditCard, Calendar, CheckCircle, Clock } from "lucide-react";

function FarmerPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFarmerPayments()
      .then((res) => {
        console.log("PAYMENTS API RESPONSE:", res);
        setPayments(Array.isArray(res) ? res : res?.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalPaid = useMemo(() => 
    (payments || []).reduce((sum, pay) => sum + (Number(pay?.amount) || 0), 0),
    [payments]
  );
  const pendingPayments = useMemo(() => 
    (payments || []).filter(p => p?.status === "PENDING").length,
    [payments]
  );

  // Precompute formatted values for display
  const formattedPayments = useMemo(() => {
    const safePayments = Array.isArray(payments) ? payments : [];
    return safePayments.map(pay => ({
      ...pay,
      amount: Number(pay?.amount) || 0,
      displayDate: pay?.paymentDate ? new Date(pay.paymentDate).toLocaleDateString() : 'N/A'
    }));
  }, [payments]);

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
        <h1 className="text-2xl font-bold text-slate-800">Payments</h1>
        <p className="text-slate-600">View your payment history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Paid</p>
              <p className="text-2xl font-bold text-slate-800">₹{totalPaid.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CreditCard className="text-emerald-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Pending Payments</p>
              <p className="text-2xl font-bold text-slate-800">{pendingPayments}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Payment History</h2>
        </div>
        <div className="p-6">
          {(!payments || payments.length === 0) ? (
            <p className="text-slate-500 text-center py-4">No payments found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Description</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Amount (₹)</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {formattedPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm text-slate-800">
                        {payment.displayDate}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-800">Milk Payment</td>
                      <td className="py-3 px-4 text-sm font-semibold text-slate-800">₹{payment.amount.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          payment?.status === "PAID" 
                            ? "bg-emerald-100 text-emerald-700" 
                            : "bg-orange-100 text-orange-700"
                        }`}>
                          {payment?.status === "PAID" ? (
                            <CheckCircle size={12} />
                          ) : (
                            <Clock size={12} />
                          )}
                          {payment?.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FarmerPaymentsPage;
