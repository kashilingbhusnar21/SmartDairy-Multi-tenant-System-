import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import ErrorState from "../components/ui/ErrorState";
import PageLoader from "../components/ui/PageLoader";
import FarmerSelect from "../components/ui/FarmerSelect";
import { exportFarmerBill, previewFarmerBill } from "../services/farmerBill";
import { getErrorMessage } from "../utils/errorMessage";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function monthStartISO() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function FarmerBillPage() {
  const { farmerId } = useParams();
  const [selectedFarmerId, setSelectedFarmerId] = useState(farmerId || "");
  const [from, setFrom] = useState(monthStartISO());
  const [to, setTo] = useState(todayISO());
  const [advancePayment, setAdvancePayment] = useState("0");
  const [loanAmount, setLoanAmount] = useState("0");
  const [otherDeductions, setOtherDeductions] = useState("0");
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await previewFarmerBill({
        farmerId: Number(selectedFarmerId),
        from,
        to,
        advancePayment: Number(advancePayment || 0),
        loanAmount: Number(loanAmount || 0),
        otherDeductions: Number(otherDeductions || 0),
      });
      setBill(data);
    } catch (e) {
      setError(getErrorMessage(e, "Failed to preview bill"));
      setBill(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedFarmerId) {
      load();
    } else {
      setLoading(false);
    }
  }, []);

  const onExport = async (format) => {
    try {
      await exportFarmerBill(
        {
          farmerId: Number(selectedFarmerId),
          from,
          to,
          advancePayment: Number(advancePayment || 0),
          loanAmount: Number(loanAmount || 0),
          otherDeductions: Number(otherDeductions || 0),
        },
        format
      );
      toast.success("Download started");
    } catch (e) {
      toast.error(getErrorMessage(e, "Export failed"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div>
          <Link to={`/farmers/${farmerId}/payments`} className="text-emerald-700 text-sm hover:underline">
            ← Back to payments
          </Link>
          <h2 className="text-2xl font-bold text-slate-800 mt-3">Farmer Bill</h2>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => window.print()} className="px-3 py-2 rounded-lg border border-slate-300 text-sm">Print</button>
          <button type="button" onClick={() => onExport("pdf")} className="px-3 py-2 rounded-lg bg-slate-800 text-white text-sm">Download PDF</button>
          <button type="button" onClick={() => onExport("xlsx")} className="px-3 py-2 rounded-lg border border-slate-300 text-sm">Download Excel</button>
        </div>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-4 grid md:grid-cols-6 gap-3">
        <div>
          <FarmerSelect
            value={selectedFarmerId}
            onChange={(e) => {
              setSelectedFarmerId(e.target.value);
              setBill(null);
            }}
            required
            label="Farmer ID"
            searchClassName="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">Advance</label>
          <input type="number" value={advancePayment} onChange={(e) => setAdvancePayment(e.target.value)} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">Loan</label>
          <input type="number" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">Other</label>
          <input type="number" value={otherDeductions} onChange={(e) => setOtherDeductions(e.target.value)} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm" />
        </div>
        <div className="flex items-end">
          <button type="button" onClick={load} disabled={!selectedFarmerId} className="w-full px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed">Preview</button>
        </div>
      </section>

      <ErrorState message={error} onRetry={load} />
      {loading ? (
        <PageLoader label="Loading bill preview…" />
      ) : bill ? (
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 print:shadow-none">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              {bill.dairyLogo ? <img src={bill.dairyLogo} alt="Dairy logo" className="h-14 w-14 object-cover rounded border border-slate-200" /> : null}
              <div>
                <h3 className="text-xl font-bold text-slate-900">{bill.dairyName}</h3>
                <p className="text-sm text-slate-600">Owner: {bill.ownerName}</p>
                <p className="text-sm text-slate-600">Address: {bill.dairyAddress}</p>
                <p className="text-sm text-slate-600">Contact: {bill.contactNumber}</p>
              </div>
            </div>
            <div className="text-sm text-slate-700">
              <p><strong>Invoice No:</strong> {bill.invoiceNumber}</p>
              <p><strong>Date Range:</strong> {bill.from} to {bill.to}</p>
              <p><strong>Farmer:</strong> {bill.farmerName} ({bill.farmerId})</p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Milk Type</th>
                  <th className="px-3 py-2 text-right">Liters</th>
                  <th className="px-3 py-2 text-right">Fat</th>
                  <th className="px-3 py-2 text-right">SNF</th>
                  <th className="px-3 py-2 text-right">Rate</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map((r, idx) => (
                  <tr key={`${r.date}-${idx}`} className="border-t border-slate-100">
                    <td className="px-3 py-2">{r.date}</td>
                    <td className="px-3 py-2">{r.milkType}</td>
                    <td className="px-3 py-2 text-right">{r.liters}</td>
                    <td className="px-3 py-2 text-right">{r.fat}</td>
                    <td className="px-3 py-2 text-right">{r.snf}</td>
                    <td className="px-3 py-2 text-right">{r.rate}</td>
                    <td className="px-3 py-2 text-right">{r.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-lg p-3 text-sm">
              <p><strong>Total Milk Quantity:</strong> {bill.totalMilkQuantity} L</p>
              <p><strong>Average Fat:</strong> {bill.averageFat}</p>
              <p><strong>Average SNF:</strong> {bill.averageSnf}</p>
              <p><strong>Average Rate:</strong> {bill.averageRate}</p>
              <p><strong>Total Amount:</strong> ₹ {bill.totalAmount}</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-3 text-sm">
              <p><strong>Feed Deduction:</strong> ₹ {bill.feedDeduction}</p>
              <p><strong>Advance Payment:</strong> ₹ {bill.advancePayment}</p>
              <p><strong>Loan Amount:</strong> ₹ {bill.loanAmount}</p>
              <p><strong>Other Deductions:</strong> ₹ {bill.otherDeductions}</p>
              <p className="mt-2"><strong>Final Payable Amount:</strong> ₹ {bill.finalPayableAmount}</p>
              <p><strong>Remaining Balance:</strong> ₹ {bill.remainingBalance}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 pt-4">
            <div>
              <p className="text-sm text-slate-700">Farmer Signature</p>
              <div className="mt-6 border-b border-slate-400 w-56" />
            </div>
            <div>
              <p className="text-sm text-slate-700">Dairy Owner Signature</p>
              <div className="mt-6 border-b border-slate-400 w-56" />
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default FarmerBillPage;
