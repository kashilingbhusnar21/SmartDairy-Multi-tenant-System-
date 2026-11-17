import { useEffect, useState } from "react";
import { Outlet, Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import { getMyDairyProfile } from "../../services/dairyProfile";
import { getAutoShift, formatShiftLabel } from "../../utils/shiftUtils";
import { getEmail } from "../../utils/auth";
import { Zap, Sun, Moon, Radio, Building2 } from "lucide-react";

function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dairy, setDairy] = useState(null);
  const currentShift = getAutoShift();
  const currentEmail = getEmail() || "Admin";

  useEffect(() => {
    getMyDairyProfile().then(setDairy).catch(() => setDairy(null));
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 shrink-0 transform transition-transform duration-200 ease-out
          lg:translate-x-0
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* EXECUTIVE HEADER */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden transition-colors"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-1 h-9 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    {dairy?.dairyName || "DairyAI Center"}
                  </h1>
                  <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Cloud Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Logged in as <span className="font-semibold text-slate-700">{dairy?.ownerName || currentEmail}</span>
                </p>
              </div>
            </div>
          </div>

          {/* TOP RIGHT CONTROLS: Shift Pill + Rapid POS Quick Launch + Dairy Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Live Shift Pill */}
            <div
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-xs ${
                currentShift === "MORNING"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-indigo-50 text-indigo-800 border-indigo-200"
              }`}
            >
              {currentShift === "MORNING" ? (
                <Sun className="w-3.5 h-3.5 text-amber-600" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
              )}
              <span>{formatShiftLabel(currentShift)}</span>
            </div>

            {/* Quick Rapid POS Button */}
            <Link
              to="/rapid-collection"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 active:scale-95 transition-all"
              title="Launch Rapid 4G Hardware POS"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Rapid POS</span>
            </Link>

            {/* Dairy Avatar */}
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
              {dairy?.dairyLogo ? (
                <img
                  src={dairy.dairyLogo}
                  alt="Dairy logo"
                  className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-xs"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-100 to-teal-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xs shadow-xs">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
