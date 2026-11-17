import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import FarmerSidebar from "./FarmerSidebar";
import ThemeToggle from "../ui/ThemeToggle";
import { getFarmerProfile } from "../../services/farmer";
import { UserCheck } from "lucide-react";

function FarmerLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [farmer, setFarmer] = useState(null);

  useEffect(() => {
    getFarmerProfile().then(setFarmer).catch(() => setFarmer(null));
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
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
        <FarmerSidebar onNavigate={() => setMobileOpen(false)} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* FARMER HEADER */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors duration-200">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 lg:hidden transition-colors"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-1 h-9 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full" />
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Farmer Passbook</p>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  Welcome, {farmer?.fullName?.split(" ")[0] || "Farmer"}
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <ThemeToggle />

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs shadow-xs">
                <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{farmer?.fullName || "Farmer"}</p>
                <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">ID #{farmer?.id || "N/A"}</p>
              </div>
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

export default FarmerLayout;
