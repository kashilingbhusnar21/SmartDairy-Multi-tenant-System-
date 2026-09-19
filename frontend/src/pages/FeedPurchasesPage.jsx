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
import { getOperationalRecordDateWindow } from "../utils/recordDateWindow";

const PAGE_SIZE = 10;

const FEED_TYPE_OPTIONS = [
  { value: 'CATTLE_FEED', label: 'Cattle Feed' },
  { value: 'SILAGE', label: 'Silage' },
  { value: 'GREEN_FODDER', label: 'Green Fodder' },
  { value: 'DRY_FODDER', label: 'Dry Fodder' },
  { value: 'MINERAL_MIX', label: 'Mineral Mix' },
  { value: 'CONCENTRATE_FEED', label: 'Concentrate Feed' },
  { value: 'CALF_STARTER', label: 'Calf Starter' },
  { value: 'PROTEIN_SUPPLEMENT', label: 'Protein Supplement' },
  { value: 'OTHER', label: 'Other' },
];

const COMPANY_NAME_OPTIONS = [
  { value: 'AMUL', label: 'Amul' },
  { value: 'NANDINI', label: 'Nandini' },
  { value: 'GODREJ_AGROVET', label: 'Godrej Agrovet' },
  { value: 'KMF', label: 'KMF' },
  { value: 'SKM_FEEDS', label: 'SKM Feeds' },
  { value: 'SUGUNA_FEEDS', label: 'Suguna Feeds' },
  { value: 'ANF_FEEDS', label: 'ANF Feeds' },
  { value: 'CP_FEEDS', label: 'CP Feeds' },
  { value: 'LOCAL', label: 'Local' },
  { value: 'OTHER', label: 'Other' },
];

function formatFeedType(value) {
  if (!value) return 'N/A';
  const normalizedValue = value.toUpperCase();
  const option = FEED_TYPE_OPTIONS.find(opt => opt.value === normalizedValue);
  return option ? option.label : value;
}

function formatCompanyName(value) {
  if (!value) return 'N/A';
  const normalizedValue = value.toUpperCase();
  const option = COMPANY_NAME_OPTIONS.find(opt => opt.value === normalizedValue);
  return option ? option.label : value;
}

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
  const operationalDateWindow = getOperationalRecordDateWindow();
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
    feedType: "CATTLE_FEED",
    feedCompanyName: "",
    feedQuantity: "1",
    unitType: "KG",
    ratePerUnit: "0",
    notes: "",
    customFeedType: "",
    customCompanyName: "",
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

  const onSelectChange = (name, value) => {
    setForm((p) => ({ ...p, [name]: value, [name === 'feedType' ? 'customFeedType' : 'customCompanyName']: '' }));
  };

  const submit = async (e) => {
    e.preventDefault();
    
    // Validation for OTHER custom inputs
    if (form.feedType === 'OTHER' && (!form.customFeedType || form.customFeedType.trim() === '')) {
      toast.error('Please enter a custom feed type');
      return;
    }
    if (form.feedCompanyName === 'OTHER' && (!form.customCompanyName || form.customCompanyName.trim() === '')) {
      toast.error('Please enter a custom company name');
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = {
        farmerId: Number(form.farmerId),
        feedDate: form.feedDate,
        feedType: form.feedType === 'OTHER' ? form.customFeedType.toUpperCase().trim() : form.feedType,
        feedCompanyName: form.feedCompanyName === 'OTHER' ? form.customCompanyName.toUpperCase().trim() : form.feedCompanyName,
        feedQuantity: Number(form.feedQuantity),
        unitType: form.unitType,
        ratePerUnit: Number(form.ratePerUnit),
        notes: form.notes || undefined,
      };
      const created = await createFeedPurchase(payload);
      toast.success(created.smsNotification || "Feed purchase saved");
      setForm((p) => ({ ...p, feedCompanyName: "", feedQuantity: "1", ratePerUnit: "0", notes: "", customFeedType: "", customCompanyName: "" }));
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
          <input
            name="feedDate"
            type="date"
            value={form.feedDate}
            onChange={onChange}
            min={operationalDateWindow.min}
            max={operationalDateWindow.max}
            required
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">Feed Type</label>
          <select
            name="feedType"
            value={form.feedType}
            onChange={(e) => onSelectChange('feedType', e.target.value)}
            required
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full"
          >
            {FEED_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {form.feedType === 'OTHER' && (
            <input
              name="customFeedType"
              value={form.customFeedType}
              onChange={onChange}
              required
              placeholder="Enter custom feed type"
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full mt-2"
            />
          )}
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">Company</label>
          <select
            name="feedCompanyName"
            value={form.feedCompanyName}
            onChange={(e) => onSelectChange('feedCompanyName', e.target.value)}
            required
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full"
          >
            <option value="">Select company</option>
            {COMPANY_NAME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {form.feedCompanyName === 'OTHER' && (
            <input
              name="customCompanyName"
              value={form.customCompanyName}
              onChange={onChange}
              required
              placeholder="Enter custom company name"
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full mt-2"
            />
          )}
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-xs text-slate-600 mb-1">Quantity</label>
            <input name="feedQuantity" value={form.feedQuantity} onChange={onChange} required placeholder="Quantity" className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full" />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-slate-600 mb-1">Rate</label>
            <input name="ratePerUnit" value={form.ratePerUnit} onChange={onChange} required placeholder="Rate" className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full" />
          </div>
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
          <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-slate-100 border-b-2 border-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Farmer ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Farmer Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Company</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Qty</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Rate</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Total</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pageItems.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">{r.feedDate}</td>
                    <td className="px-4 py-3">{r.farmerId}</td>
                    <td className="px-4 py-3">{r.farmerName}</td>
                    <td className="px-4 py-3">{formatFeedType(r.feedType)}</td>
                    <td className="px-4 py-3">{formatCompanyName(r.feedCompanyName)}</td>
                    <td className="px-4 py-3 text-right">{r.feedQuantity}</td>
                    <td className="px-4 py-3 text-right">{r.ratePerUnit}</td>
                    <td className="px-4 py-3 text-right">₹ {r.totalAmount}</td>
                    <td className="px-4 py-3 text-right">₹ {r.remainingAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 ? <p className="p-4 text-sm text-slate-500 text-center">No feed purchases found.</p> : null}
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
