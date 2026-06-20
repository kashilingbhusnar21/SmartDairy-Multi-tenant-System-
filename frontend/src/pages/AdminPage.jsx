import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import toast from "react-hot-toast";
import api from "../services/api";
import { getDashboardOverview } from "../services/dashboard";
import { getErrorMessage } from "../utils/errorMessage";
import {
  downloadDailyMilkReport,
  downloadFarmerMilkReport,
  downloadMonthlyMilkReport,
  downloadWeeklyMilkReport,
} from "../services/reports";

function isoWeekRange() {
  const d = new Date();
  const day = d.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diffToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (x) => x.toISOString().slice(0, 10);
  return { start: fmt(mon), end: fmt(sun) };
}

const chartColors = {
  milk: "#059669",
  amount: "#0d9488",
  payment: "#6366f1",
  grid: "#e2e8f0",
};

function AdminPage() {
  const [secureMessage, setSecureMessage] = useState("");
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const today = new Date();
  const [milkYear, setMilkYear] = useState(today.getFullYear());
  const [milkMonth, setMilkMonth] = useState(today.getMonth() + 1);
  const week = isoWeekRange();
  const [payFrom, setPayFrom] = useState(week.start);
  const [payTo, setPayTo] = useState(week.end);
  const [farmerSearch, setFarmerSearch] = useState("");
  const [debouncedFarmer, setDebouncedFarmer] = useState("");

  const [repDaily, setRepDaily] = useState(today.toISOString().slice(0, 10));
  const [repWeekFrom, setRepWeekFrom] = useState(week.start);
  const [repWeekTo, setRepWeekTo] = useState(week.end);
  const [repMonthY, setRepMonthY] = useState(today.getFullYear());
  const [repMonthM, setRepMonthM] = useState(today.getMonth() + 1);
  const [repFarmerId, setRepFarmerId] = useState("");
  const [repFarmerFrom, setRepFarmerFrom] = useState(week.start);
  const [repFarmerTo, setRepFarmerTo] = useState(week.end);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedFarmer(farmerSearch.trim()), 400);
    return () => clearTimeout(t);
  }, [farmerSearch]);

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getDashboardOverview({
        milkYear,
        milkMonth,
        paymentWeekStart: payFrom,
        paymentWeekEnd: payTo,
        farmerNameContains: debouncedFarmer || undefined,
      });
      setOverview(data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load dashboard"));
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, [milkYear, milkMonth, payFrom, payTo, debouncedFarmer]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    api
      .get("/secure/admin")
      .then((res) => setSecureMessage(res.data.message))
      .catch(() => setSecureMessage(""));
  }, []);

  const milkChartData =
    overview?.monthlyMilkByDay?.map((d) => ({
      label: d.date?.slice(5) ?? d.date,
      quantityLiters: Number(d.quantityLiters),
      totalAmount: Number(d.totalAmount),
    })) ?? [];

  const farmerChartData =
    overview?.farmerMilkCollection?.map((f) => ({
      name:
        f.farmerName?.length > 14 ? `${f.farmerName.slice(0, 12)}…` : f.farmerName,
      fullName: f.farmerName,
      quantityLiters: Number(f.quantityLiters),
    })) ?? [];

  const paymentChartData =
    overview?.weeklyPaymentByDay?.map((p) => ({
      label: p.date?.slice(5) ?? p.date,
      amount: Number(p.amount),
    })) ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/30">
      <header className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
          <p className="text-emerald-100 text-sm font-medium tracking-wide uppercase">
            Smart Dairy
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold mt-1">Admin dashboard</h1>
          <p className="text-emerald-100/90 mt-2 max-w-2xl text-sm sm:text-base">
            Live KPIs, milk trends, farmer contributions, and payment activity. Filter charts and
            export reports as PDF or Excel.
          </p>
          {secureMessage ? (
            <p className="mt-4 text-xs text-emerald-200/90 border border-white/20 rounded-lg px-3 py-2 inline-block">
              {secureMessage}
            </p>
          ) : null}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">
            {error}
          </div>
        ) : null}

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "Total farmers",
              value: overview?.totalFarmers ?? "—",
              sub: "Registered in the system",
              accent: "from-emerald-500 to-teal-600",
            },
            {
              title: "Milk today",
              value: overview ? `${overview.milkCollectedTodayLiters} L` : "—",
              sub: "Total collected today",
              accent: "from-teal-500 to-cyan-600",
            },
            {
              title: "Pending payments",
              value: overview?.pendingPaymentsCount ?? "—",
              sub: overview ? `₹ ${overview.pendingPaymentsTotal} outstanding` : "",
              accent: "from-amber-500 to-orange-600",
            },
            {
              title: "Chart period",
              value: `${milkYear}-${String(milkMonth).padStart(2, "0")}`,
              sub: "Milk charts use this month",
              accent: "from-slate-600 to-slate-800",
            },
          ].map((card) => (
            <article
              key={card.title}
              className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-sm p-5"
            >
              <div
                className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 bg-gradient-to-br ${card.accent}`}
              />
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {card.title}
              </h3>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{card.value}</p>
              <p className="text-sm text-slate-500 mt-1">{card.sub}</p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Filters</h2>
          <div className="flex flex-col lg:flex-row lg:flex-wrap gap-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Milk chart month</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={milkYear}
                    onChange={(e) => setMilkYear(Number(e.target.value))}
                    className="w-24 border border-slate-300 rounded-lg px-2 py-2 text-sm"
                    min={2000}
                    max={2100}
                  />
                  <input
                    type="number"
                    value={milkMonth}
                    onChange={(e) => setMilkMonth(Number(e.target.value))}
                    className="w-20 border border-slate-300 rounded-lg px-2 py-2 text-sm"
                    min={1}
                    max={12}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Payment chart week
                </label>
                <div className="flex gap-2 flex-wrap">
                  <input
                    type="date"
                    value={payFrom}
                    onChange={(e) => setPayFrom(e.target.value)}
                    className="border border-slate-300 rounded-lg px-2 py-2 text-sm"
                  />
                  <input
                    type="date"
                    value={payTo}
                    onChange={(e) => setPayTo(e.target.value)}
                    className="border border-slate-300 rounded-lg px-2 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Search farmers (chart)
              </label>
              <input
                type="search"
                placeholder="Filter farmer-wise milk by name…"
                value={farmerSearch}
                onChange={(e) => setFarmerSearch(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          {loading ? (
            <p className="text-sm text-slate-500 mt-4">Refreshing charts…</p>
          ) : null}
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-1">Monthly milk collection</h2>
            <p className="text-sm text-slate-500 mb-4">Liters and amount per day</p>
            <div className="h-[300px] w-full min-w-0">
              {milkChartData.length === 0 && !loading ? (
                <p className="text-slate-500 text-sm py-12 text-center">No milk data for this month.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={milkChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="L" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="R" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                      formatter={(value, name) => [
                        name === "totalAmount" ? `₹ ${value}` : `${value} L`,
                        name === "totalAmount" ? "Amount" : "Liters",
                      ]}
                    />
                    <Legend />
                    <Line
                      yAxisId="L"
                      type="monotone"
                      dataKey="quantityLiters"
                      name="Liters"
                      stroke={chartColors.milk}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      yAxisId="R"
                      type="monotone"
                      dataKey="totalAmount"
                      name="Amount (₹)"
                      stroke={chartColors.amount}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-1">Weekly payment summary</h2>
            <p className="text-sm text-slate-500 mb-4">Paid amounts by payment date</p>
            <div className="h-[300px] w-full min-w-0">
              {paymentChartData.length === 0 && !loading ? (
                <p className="text-slate-500 text-sm py-12 text-center">
                  No paid transactions in this range.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                      formatter={(v) => [`₹ ${v}`, "Paid"]}
                    />
                    <Bar dataKey="amount" name="Paid (₹)" fill={chartColors.payment} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>
        </div>

        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Farmer-wise milk collection</h2>
          <p className="text-sm text-slate-500 mb-4">Total liters in selected month (filtered by search)</p>
          <div className="h-[min(420px,60vh)] w-full min-w-0">
            {farmerChartData.length === 0 && !loading ? (
              <p className="text-slate-500 text-sm py-12 text-center">No farmers match this filter.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={farmerChartData}
                  margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fontSize: 10 }}
                    interval={0}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                    formatter={(v, _n, item) => [`${v} L`, item?.payload?.fullName || "Farmer"]}
                  />
                  <Bar dataKey="quantityLiters" fill={chartColors.milk} radius={[0, 6, 6, 0]} name="Liters" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Reports & export</h2>
          <p className="text-sm text-slate-500 mb-6">
            Download milk collection reports as PDF or Excel (.xlsx).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ReportCard title="Daily milk report">
              <input
                type="date"
                value={repDaily}
                onChange={(e) => setRepDaily(e.target.value)}
                className="border border-slate-300 rounded-lg px-2 py-2 text-sm w-full mb-3"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => downloadDailyMilkReport(repDaily, "pdf")}
                  className="flex-1 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-900"
                >
                  PDF
                </button>
                <button
                  type="button"
                  onClick={() => downloadDailyMilkReport(repDaily, "xlsx")}
                  className="flex-1 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm font-medium hover:bg-slate-50"
                >
                  Excel
                </button>
              </div>
            </ReportCard>

            <ReportCard title="Weekly milk report">
              <div className="flex gap-2 mb-3">
                <input
                  type="date"
                  value={repWeekFrom}
                  onChange={(e) => setRepWeekFrom(e.target.value)}
                  className="border border-slate-300 rounded-lg px-2 py-2 text-sm flex-1"
                />
                <input
                  type="date"
                  value={repWeekTo}
                  onChange={(e) => setRepWeekTo(e.target.value)}
                  className="border border-slate-300 rounded-lg px-2 py-2 text-sm flex-1"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => downloadWeeklyMilkReport(repWeekFrom, repWeekTo, "pdf")}
                  className="flex-1 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-900"
                >
                  PDF
                </button>
                <button
                  type="button"
                  onClick={() => downloadWeeklyMilkReport(repWeekFrom, repWeekTo, "xlsx")}
                  className="flex-1 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm font-medium hover:bg-slate-50"
                >
                  Excel
                </button>
              </div>
            </ReportCard>

            <ReportCard title="Monthly milk report">
              <div className="flex gap-2 mb-3">
                <input
                  type="number"
                  value={repMonthY}
                  onChange={(e) => setRepMonthY(Number(e.target.value))}
                  className="border border-slate-300 rounded-lg px-2 py-2 text-sm w-28"
                />
                <input
                  type="number"
                  value={repMonthM}
                  onChange={(e) => setRepMonthM(Number(e.target.value))}
                  className="border border-slate-300 rounded-lg px-2 py-2 text-sm w-20"
                  min={1}
                  max={12}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => downloadMonthlyMilkReport(repMonthY, repMonthM, "pdf")}
                  className="flex-1 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-900"
                >
                  PDF
                </button>
                <button
                  type="button"
                  onClick={() => downloadMonthlyMilkReport(repMonthY, repMonthM, "xlsx")}
                  className="flex-1 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm font-medium hover:bg-slate-50"
                >
                  Excel
                </button>
              </div>
            </ReportCard>

            <ReportCard title="Farmer-wise milk report">
              <input
                type="number"
                placeholder="Farmer ID"
                value={repFarmerId}
                onChange={(e) => setRepFarmerId(e.target.value)}
                className="border border-slate-300 rounded-lg px-2 py-2 text-sm w-full mb-2"
              />
              <div className="flex gap-2 mb-3">
                <input
                  type="date"
                  value={repFarmerFrom}
                  onChange={(e) => setRepFarmerFrom(e.target.value)}
                  className="border border-slate-300 rounded-lg px-2 py-2 text-sm flex-1"
                />
                <input
                  type="date"
                  value={repFarmerTo}
                  onChange={(e) => setRepFarmerTo(e.target.value)}
                  className="border border-slate-300 rounded-lg px-2 py-2 text-sm flex-1"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!repFarmerId) {
                      toast.error("Enter farmer ID");
                      return;
                    }
                    downloadFarmerMilkReport(repFarmerId, repFarmerFrom, repFarmerTo, "pdf");
                  }}
                  className="flex-1 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-900"
                >
                  PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!repFarmerId) {
                      toast.error("Enter farmer ID");
                      return;
                    }
                    downloadFarmerMilkReport(repFarmerId, repFarmerFrom, repFarmerTo, "xlsx");
                  }}
                  className="flex-1 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm font-medium hover:bg-slate-50"
                >
                  Excel
                </button>
              </div>
            </ReportCard>
          </div>
        </section>
      </main>
    </div>
  );
}

function ReportCard({ title, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
      <h3 className="font-medium text-slate-800 mb-2">{title}</h3>
      {children}
    </div>
  );
}

export default AdminPage;
