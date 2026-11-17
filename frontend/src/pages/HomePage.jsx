import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDailyStats } from "../services/milkCollections";
import { getPaymentDashboardStats } from "../services/payments";
import { todayISO } from "../utils/dateUtils";
import { getAutoShift, formatShiftLabel } from "../utils/shiftUtils";
import { StatCardSkeleton } from "../components/ui/Skeleton";
import {
  Milk,
  DollarSign,
  FileText,
  Clock,
  CheckCircle2,
  Calendar,
  Zap,
  UserPlus,
  ShoppingBag,
  CreditCard,
  Bot,
  ArrowUpRight,
  Sun,
  Moon,
  TrendingUp,
  AlertCircle
} from "lucide-react";

function HomePage() {
  const [stats, setStats] = useState(null);
  const [payStats, setPayStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const currentShift = getAutoShift();
  const todayStr = todayISO();

  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);
    Promise.all([
      getDailyStats(todayStr).catch(() => null),
      getPaymentDashboardStats().catch(() => null),
    ])
      .then(([milk, pay]) => {
        if (!cancelled) {
          setStats(milk);
          setPayStats(pay);
        }
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [todayStr]);

  // Calculations for visual metrics
  const totalLiters = stats ? Number(stats.totalQuantityLiters || 0) : 0;
  const totalIntakeAmount = stats ? Number(stats.totalAmount || 0) : 0;
  const entriesCount = stats ? Number(stats.entriesCount || 0) : 0;
  const avgRatePerLiter = totalLiters > 0 ? (totalIntakeAmount / totalLiters).toFixed(2) : "0.00";

  const pendingAmount = payStats ? Number(payStats.pendingTotalAmount || 0) : 0;
  const paidWeekAmount = payStats ? Number(payStats.paidThisWeekTotal || 0) : 0;
  const totalSettlementFlow = pendingAmount + paidWeekAmount;
  const settlementPercent = totalSettlementFlow > 0 ? Math.round((paidWeekAmount / totalSettlementFlow) * 100) : 0;

  return (
    <main className="space-y-6">
      
      {/* 1. TOP OPERATIONAL BANNER */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-lg border border-slate-700/60 relative overflow-hidden">
        {/* Glow & Backdrop Accents */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Cloud Session
              </span>
              <span className="text-slate-400 text-xs font-mono">&bull; Date: {todayStr}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Operations & Milk Telemetry Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Real-time monitoring of daily milk intake, dynamic FAT/SNF rates, and 10-day farmer payment settlements.
            </p>
          </div>

          {/* Quick Shift Card */}
          <div className="bg-slate-950/70 border border-slate-700/80 rounded-2xl p-4 flex items-center gap-4 shrink-0 shadow-inner">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-xs ${
                currentShift === "MORNING"
                  ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                  : "bg-indigo-500/15 border-indigo-500/30 text-indigo-400"
              }`}
            >
              {currentShift === "MORNING" ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Current Intake Shift</div>
              <div className="text-base font-bold text-white flex items-center gap-1.5">
                <span>{formatShiftLabel(currentShift)}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                Avg Rate: <strong className="text-emerald-400">₹{avgRatePerLiter}/L</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. RAPID QUICK ACTION COMMAND BAR */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80">
        <div className="flex items-center justify-between mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
          <span>Quick Actions & Workflows</span>
          <span className="text-[11px] font-mono text-emerald-600 font-semibold">One-Click Dispatch</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          <Link
            to="/rapid-collection"
            className="p-3 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex flex-col items-center justify-center text-center gap-1.5 shadow-sm shadow-emerald-600/20 active:scale-95 transition-all group"
          >
            <Zap className="w-5 h-5 fill-white/20 group-hover:scale-110 transition-transform" />
            <span>Rapid 4G POS</span>
          </Link>

          <Link
            to="/milk-collections/add"
            className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-xs flex flex-col items-center justify-center text-center gap-1.5 active:scale-95 transition-all hover:border-slate-300"
          >
            <Milk className="w-5 h-5 text-emerald-600" />
            <span>Manual Milk Entry</span>
          </Link>

          <Link
            to="/farmers/add"
            className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-xs flex flex-col items-center justify-center text-center gap-1.5 active:scale-95 transition-all hover:border-slate-300"
          >
            <UserPlus className="w-5 h-5 text-blue-600" />
            <span>Register Farmer</span>
          </Link>

          <Link
            to="/payments"
            className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-xs flex flex-col items-center justify-center text-center gap-1.5 active:scale-95 transition-all hover:border-slate-300"
          >
            <CreditCard className="w-5 h-5 text-purple-600" />
            <span>10-Day Settlements</span>
          </Link>

          <Link
            to="/feed-purchases"
            className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-xs flex flex-col items-center justify-center text-center gap-1.5 active:scale-95 transition-all hover:border-slate-300"
          >
            <ShoppingBag className="w-5 h-5 text-amber-600" />
            <span>Cattle Feed Sale</span>
          </Link>

          <Link
            to="/admin/ai-chat"
            className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-xs flex flex-col items-center justify-center text-center gap-1.5 active:scale-95 transition-all hover:border-slate-300"
          >
            <Bot className="w-5 h-5 text-teal-600" />
            <span>AI Advisor</span>
          </Link>

        </div>
      </section>

      {/* 3. KEY OPERATIONAL METRICS */}
      {statsLoading ? (
        <div className="grid md:grid-cols-3 gap-5">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Card 1: Today's Total Liters */}
          <article className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <Milk className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Live Intake
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Today&apos;s Milk Collected
            </h3>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-black text-slate-900 font-mono">
                {stats ? stats.totalQuantityLiters : "0.00"}
              </span>
              <span className="text-sm font-bold text-slate-500">Liters</span>
            </div>
            <p className="text-slate-500 text-xs">
              Across <strong className="text-slate-800">{entriesCount}</strong> farmer intakes today
            </p>
          </article>

          {/* Card 2: Today's Milk Valuation */}
          <article className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3.5 bg-teal-50 text-teal-600 rounded-xl border border-teal-100">
                <DollarSign className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold font-mono text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200/60">
                Valuation
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Today&apos;s Gross Payout Due
            </h3>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-black text-slate-900 font-mono">
                ₹{stats ? Number(stats.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "0.00"}
              </span>
            </div>
            <p className="text-slate-500 text-xs">
              Redis-calculated average: <strong className="text-slate-800 font-mono">₹{avgRatePerLiter}/L</strong>
            </p>
          </article>

          {/* Card 3: Today's Intake Entries */}
          <article className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 hover:shadow-md transition-all hover:-translate-y-0.5 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                <FileText className="w-6 h-6" />
              </div>
              <Link
                to="/milk-collections"
                className="text-[11px] font-bold font-mono text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
              >
                <span>View Feed</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Intake Transactions
            </h3>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-black text-slate-900 font-mono">
                {entriesCount}
              </span>
              <span className="text-sm font-bold text-slate-500">Batches</span>
            </div>
            <p className="text-slate-500 text-xs">
              Direct telemetry & manual logged intake
            </p>
          </article>

        </section>
      )}

      {/* 4. FINANCIAL SETTLEMENT SUMMARY */}
      <section className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">10-Day Billing & Payout Settlements</h2>
            <p className="text-xs text-slate-500">
              Overview of farmer payments and pending settlement debt deductions.
            </p>
          </div>
          <Link
            to="/payments"
            className="self-start sm:self-auto inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
          >
            <span>Open Settlement Console</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          
          {/* Pending Payments */}
          <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/70">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Unpaid / Pending
              </span>
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-950 font-mono">
              ₹{payStats ? Number(payStats.pendingTotalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "--"}
            </div>
            <p className="text-xs text-amber-800/80 mt-1">
              Across <strong className="font-semibold text-amber-950">{payStats?.pendingCount ?? "--"}</strong> pending vouchers
            </p>
          </div>

          {/* Paid This Week */}
          <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/70">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Settled This Week
              </span>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-950 font-mono">
              ₹{payStats ? Number(payStats.paidThisWeekTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "--"}
            </div>
            <p className="text-xs text-emerald-800/80 mt-1">
              <strong className="font-semibold text-emerald-950">{payStats?.paidThisWeekCount ?? "--"}</strong> settlements disbursed
            </p>
          </div>

          {/* Paid This Month */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Settled This Month
              </span>
              <Calendar className="w-5 h-5 text-slate-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              ₹{payStats ? Number(payStats.paidThisMonthTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "--"}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              <strong className="font-semibold text-slate-900">{payStats?.paidThisMonthCount ?? "--"}</strong> monthly batch payments
            </p>
          </div>

        </div>

        {/* Progress Bar of Settlement Health */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
            <span>Settlement Clearance Rate (Week)</span>
            <span className="font-mono text-emerald-700 font-bold">{settlementPercent}% Cleared</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(settlementPercent, 100)}%` }}
            />
          </div>
        </div>
      </section>

    </main>
  );
}

export default HomePage;
