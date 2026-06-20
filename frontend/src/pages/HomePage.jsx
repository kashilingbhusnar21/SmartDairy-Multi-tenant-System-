import { useEffect, useState } from "react";
import api from "../services/api";
import PageLoader from "../components/ui/PageLoader";
import { getDailyStats } from "../services/milkCollections";
import { getPaymentDashboardStats } from "../services/payments";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function HomePage() {
  const [secureMessage, setSecureMessage] = useState("");
  const [stats, setStats] = useState(null);
  const [payStats, setPayStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    api
      .get("/secure/farmer")
      .then((response) => setSecureMessage(response.data.message))
      .catch(() => setSecureMessage("Could not verify API (check role / network)."));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);
    Promise.all([
      getDailyStats(todayISO()).catch(() => null),
      getPaymentDashboardStats().catch(() => null),
    ]).then(([milk, pay]) => {
      if (!cancelled) {
        setStats(milk);
        setPayStats(pay);
      }
    }).finally(() => {
      if (!cancelled) setStatsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Dashboard</h2>
        <p className="text-slate-600 mt-2">
          Overview of your dairy operations
        </p>
      </div>

      {statsLoading ? (
        <PageLoader label="Loading..." />
      ) : (
        <>
          <section className="grid md:grid-cols-3 gap-5 mb-8">
            <article className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-sm text-slate-500">Total Milk Today</h3>
              <p className="text-3xl font-bold text-emerald-700 my-2">
                {stats ? `${stats.totalQuantityLiters} L` : "--"}
              </p>
              <p className="text-slate-600 text-sm">Liters collected</p>
            </article>
            <article className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-sm text-slate-500">Total Amount Today</h3>
              <p className="text-3xl font-bold text-emerald-700 my-2">
                {stats ? `₹ ${stats.totalAmount}` : "--"}
              </p>
              <p className="text-slate-600 text-sm">Total value</p>
            </article>
            <article className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-sm text-slate-500">Today's Entries</h3>
              <p className="text-3xl font-bold text-emerald-700 my-2">
                {stats ? stats.entriesCount : "--"}
              </p>
              <p className="text-slate-600 text-sm">Milk collections</p>
            </article>
          </section>

          <h3 className="text-lg font-semibold text-slate-800 mb-3">Payment Summary</h3>
          <section className="grid md:grid-cols-3 gap-5 mb-8">
            <article className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-sm text-slate-500">Pending payments</h3>
              <p className="text-3xl font-bold text-amber-700 my-2">
                {payStats ? payStats.pendingCount : "--"}
              </p>
              <p className="text-slate-600 text-sm">₹ {payStats?.pendingTotalAmount ?? "--"} unpaid total</p>
            </article>
            <article className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-sm text-slate-500">Paid this week</h3>
              <p className="text-3xl font-bold text-emerald-700 my-2">
                {payStats ? `₹ ${payStats.paidThisWeekTotal}` : "--"}
              </p>
              <p className="text-slate-600 text-sm">{payStats?.paidThisWeekCount ?? "--"} transactions</p>
            </article>
            <article className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-sm text-slate-500">Paid this month</h3>
              <p className="text-3xl font-bold text-emerald-700 my-2">
                {payStats ? `₹ ${payStats.paidThisMonthTotal}` : "--"}
              </p>
              <p className="text-slate-600 text-sm">{payStats?.paidThisMonthCount ?? "--"} transactions</p>
            </article>
          </section>
        </>
      )}

      <section className="mt-8 bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-1">Protected API Status</h3>
        <p className="text-slate-600 text-sm">{secureMessage}</p>
      </section>
    </main>
  );
}

export default HomePage;
