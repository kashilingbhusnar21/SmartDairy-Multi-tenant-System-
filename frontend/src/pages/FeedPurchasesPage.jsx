import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ErrorState from "../components/ui/ErrorState";
import PageLoader from "../components/ui/PageLoader";
import Pagination from "../components/ui/Pagination";
import FarmerSelect from "../components/ui/FarmerSelect";
import { usePagination } from "../hooks/usePagination";
import {
  createFeedPurchase,
  downloadFeedExport,
  getFeedChart,
  getFeedSummary,
  listFeedPurchases,
} from "../services/feedPurchases";
import { getErrorMessage } from "../utils/errorMessage";

const PAGE_SIZE = 10;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function monthRangeISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth();
  return {
    from: new Date(y, m, 1).toISOString().slice(0, 10),
    to: new Date(y, m + 1, 0).toISOString().slice(0, 10),
  };
}

function FeedPurchasesPage() {
  const m = monthRangeISO();
  const [from, setFrom] = useState(m.from);
  const [to, setTo] = useState(m.to);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [chart, setChart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filterFarmerId, setFilterFarmerId] = useState("");
  const [form, setForm] = useState({
    farmerId: "",
    feedDate: todayISO(),
    feedType: "Cattle Feed",
    feedCompanyName: "",
    feedQuantity: "1",
    unitType: "KG",
    ratePerUnit: "0",
    notes: "",
  });


  const filteredRows = useMemo(() => {
    if (!filterFarmerId) return rows;
    return rows.filter((r) => r.farmerId === parseInt(filterFarmerId));
  }, [rows, filterFarmerId]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [r, s, c] = await Promise.all([
        listFeedPurchases({ from, to }),
        getFeedSummary(from, to),
        getFeedChart(from, to),
      ]);
      setRows(r);
      setSummary(s);
      setChart(c);
    } catch (e) {
      setError(getErrorMessage(e, "Failed to load feed purchases"));
      setRows([]);
      setSummary(null);
      setChart([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [from, to]);

  const { page, setPage, pageItems, totalPages, total, pageSize } = usePagination(filteredRows, PAGE_SIZE);

  const liveTotal = useMemo(() => {
    const q = Number(form.feedQuantity);
    const r = Number(form.ratePerUnit);
    if (!Number.isFinite(q) || !Number.isFinite(r)) return 0;
    return (q * r).toFixed(2);
  }, [form.feedQuantity, form.ratePerUnit]);

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        farmerId: Number(form.farmerId),
        feedDate: form.feedDate,
        feedType: form.feedType,
        feedCompanyName: form.feedCompanyName,
        feedQuantity: Number(form.feedQuantity),
        unitType: form.unitType,
        ratePerUnit: Number(form.ratePerUnit),
        notes: form.notes || undefined,
      };
      const created = await createFeedPurchase(payload);
      toast.success(created.smsNotification || "Feed purchase saved");
      setForm((p) => ({ ...p, feedCompanyName: "", feedQuantity: "1", ratePerUnit: "0", notes: "" }));
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Create failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const exportFile = async (format) => {
    try {
      await downloadFeedExport(from, to, undefined, format);
      toast.success("Download started");
    } catch (err) {
      toast.error(getErrorMessage(err, "Export failed"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Feed purchases</h2>
          <p className="text-slate-600 text-sm">Create feed entries, track deductions, and export reports.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => exportFile("pdf")} className="px-3 py-2 rounded-lg bg-slate-800 text-white text-sm">PDF</button>
          <button type="button" onClick={() => exportFile("xlsx")} className="px-3 py-2 rounded-lg border border-slate-300 text-sm">Excel</button>
        </div>
      </div>

      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-5 grid md:grid-cols-4 gap-3">
        <FarmerSelect
          name="farmerId"
          value={form.farmerId}
          onChange={onChange}
          required
          label="Farmer"
          className=""
          searchClassName="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full mb-2"
        />
        <div>
          <label className="block text-xs text-slate-600 mb-1">Date</label>
          <input name="feedDate" type="date" value={form.feedDate} onChange={onChange} required className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">Feed Type</label>
          <input name="feedType" value={form.feedType} onChange={onChange} required placeholder="Feed type" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">Company</label>
          <input name="feedCompanyName" value={form.feedCompanyName} onChange={onChange} required placeholder="Company" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">Quantity</label>
          <input name="feedQuantity" value={form.feedQuantity} onChange={onChange} required placeholder="Quantity" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">Unit</label>
          <input name="unitType" value={form.unitType} onChange={onChange} required placeholder="Unit" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">Rate</label>
          <input name="ratePerUnit" value={form.ratePerUnit} onChange={onChange} required placeholder="Rate" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">Total</label>
          <input value={`Total: ${liveTotal}`} readOnly className="border border-emerald-200 bg-emerald-50 rounded-lg px-3 py-2 text-sm font-medium text-emerald-800" />
        </div>
        <div className="md:col-span-4">
          <label className="block text-xs text-slate-600 mb-1">Notes</label>
          <input name="notes" value={form.notes} onChange={onChange} placeholder="Notes" className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full" />
        </div>
        <div className="md:col-span-4 flex justify-end">
          <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60">{submitting ? "Saving..." : "Add Feed Purchase"}</button>
        </div>
      </form>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-slate-600 mb-1">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <FarmerSelect
            value={filterFarmerId}
            onChange={(e) => setFilterFarmerId(e.target.value)}
            label="Filter by Farmer"
            searchClassName="border border-slate-300 rounded-lg px-2 py-1.5 text-sm w-full mb-2"
            placeholder="Enter Farmer ID or leave empty"
          />
        </div>
      </div>

      <ErrorState message={error} onRetry={load} />

      {loading ? (
        <PageLoader label="Loading feed data…" />
      ) : (
        <>
          <section className="grid md:grid-cols-3 gap-4">
            <Card title="Feed purchases" value={summary?.purchaseCount ?? 0} />
            <Card title="Total feed amount" value={`₹ ${summary?.totalAmount ?? "0.00"}`} />
            <Card title="Outstanding deduction" value={`₹ ${summary?.outstandingAmount ?? "0.00"}`} />
          </section>
          <section className="bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="font-semibold text-slate-800 mb-2">Feed amount trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`₹ ${v}`, "Amount"]} />
                  <Bar dataKey="amount" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
          <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Farmer ID</th>
                  <th className="px-3 py-2 text-left">Farmer Name</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Company</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Rate</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2 text-right">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{r.feedDate}</td>
                    <td className="px-3 py-2">{r.farmerId}</td>
    <td className="px-3 py-2">{r.farmerName}</td>
                    <td className="px-3 py-2">{r.feedType}</td>
                    <td className="px-3 py-2">{r.feedCompanyName}</td>
                    <td className="px-3 py-2 text-right">{r.feedQuantity} {r.unitType}</td>
                    <td className="px-3 py-2 text-right">{r.ratePerUnit}</td>
                    <td className="px-3 py-2 text-right">₹ {r.totalAmount}</td>
                    <td className="px-3 py-2 text-right">₹ {r.remainingAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 ? <p className="p-4 text-sm text-slate-500">No feed purchases found.</p> : null}
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

function Card({ title, value }) {
  return (
    <article className="bg-white rounded-xl p-4 border border-slate-200">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="text-xl font-bold text-slate-900 mt-1">{value}</p>
    </article>
  );
}

export default FeedPurchasesPage;
