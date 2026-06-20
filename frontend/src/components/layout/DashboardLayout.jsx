import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { getMyDairyProfile } from "../../services/dairyProfile";

function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dairy, setDairy] = useState(null);

  useEffect(() => {
    getMyDairyProfile().then(setDairy).catch(() => setDairy(null));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

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
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 bg-white/95 backdrop-blur border-b border-slate-200">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {dairy?.dairyLogo ? (
              <img src={dairy.dairyLogo} alt="Dairy logo" className="w-9 h-9 rounded object-cover border border-slate-200" />
            ) : null}
            <div className="min-w-0">
              <p className="font-semibold text-emerald-800 truncate">{dairy?.dairyName || "My Dairy"}</p>
              <p className="text-xs text-slate-500 truncate">{dairy?.ownerName || "Owner Name"} • {dairy?.contactNumber || "NA"}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
