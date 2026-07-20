import { useEffect, useState } from "react";
import api from "../services/api";
import PageLoader from "../components/ui/PageLoader";
import { getDailyStats } from "../services/milkCollections";
import { getPaymentDashboardStats } from "../services/payments";
import { Milk, DollarSign, FileText, Clock, CheckCircle, Calendar, Shield, Activity } from "lucide-react";

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
    <main className="max-w-7xl mx-auto">

      {statsLoading ? (
        <PageLoader label="Loading..." />
      ) : (
        <>
          {/* Milk Statistics */}
          <section className="grid md:grid-cols-3 gap-6 mb-8">
            <article className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-emerald-100 rounded-xl">
                  <Milk className="w-7 h-7 text-emerald-600" />
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Today</span>
              </div>
              <h3 className="text-sm font-semibold text-slate-600 mb-1">Total Milk</h3>
              <p className="text-3xl font-bold text-slate-800 mb-1">
                {stats ? `${stats.totalQuantityLiters} L` : "--"}
              </p>
              <p className="text-slate-500 text-sm">Liters collected</p>
            </article>
            <article className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-emerald-100 rounded-xl">
                  <DollarSign className="w-7 h-7 text-emerald-600" />
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Today</span>
              </div>
              <h3 className="text-sm font-semibold text-slate-600 mb-1">Total Amount</h3>
              <p className="text-3xl font-bold text-slate-800 mb-1">
                {stats ? `₹ ${stats.totalAmount}` : "--"}
              </p>
              <p className="text-slate-500 text-sm">Total value</p>
            </article>
            <article className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-emerald-100 rounded-xl">
                  <FileText className="w-7 h-7 text-emerald-600" />
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Today</span>
              </div>
              <h3 className="text-sm font-semibold text-slate-600 mb-1">Today's Entries</h3>
              <p className="text-3xl font-bold text-slate-800 mb-1">
                {stats ? stats.entriesCount : "--"}
              </p>
              <p className="text-slate-500 text-sm">Milk collections</p>
            </article>
          </section>

          {/* Payment Statistics */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Payment Summary</h2>
          </div>
          <section className="grid md:grid-cols-3 gap-6 mb-8">
            <article className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-amber-100 rounded-xl">
                  <Clock className="w-7 h-7 text-amber-600" />
                </div>
              </div>
              <h3 className="text-sm font-semibold text-slate-600 mb-1">Pending Payments</h3>
              <p className="text-3xl font-bold text-slate-800 mb-1">
                {payStats ? payStats.pendingCount : "--"}
              </p>
              <p className="text-slate-500 text-sm">₹ {payStats?.pendingTotalAmount ?? "--"} unpaid total</p>
            </article>
            <article className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-emerald-100 rounded-xl">
                  <CheckCircle className="w-7 h-7 text-emerald-600" />
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Week</span>
              </div>
              <h3 className="text-sm font-semibold text-slate-600 mb-1">Paid This Week</h3>
              <p className="text-3xl font-bold text-slate-800 mb-1">
                {payStats ? `₹ ${payStats.paidThisWeekTotal}` : "--"}
              </p>
              <p className="text-slate-500 text-sm">{payStats?.paidThisWeekCount ?? "--"} transactions</p>
            </article>
            <article className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-emerald-100 rounded-xl">
                  <Calendar className="w-7 h-7 text-emerald-600" />
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Month</span>
              </div>
              <h3 className="text-sm font-semibold text-slate-600 mb-1">Paid This Month</h3>
              <p className="text-3xl font-bold text-slate-800 mb-1">
                {payStats ? `₹ ${payStats.paidThisMonthTotal}` : "--"}
              </p>
              <p className="text-slate-500 text-sm">{payStats?.paidThisMonthCount ?? "--"} transactions</p>
            </article>
          </section>
        </>
      )}

      {/* API Status Card */}
      <section className="mt-8 bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-emerald-100 rounded-xl">
            <Shield className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="font-semibold text-slate-800">Protected API Status</h3>
        </div>
        <p className="text-slate-600 text-sm ml-12">{secureMessage}</p>
      </section>
    </main>
  );
}

export default HomePage;
