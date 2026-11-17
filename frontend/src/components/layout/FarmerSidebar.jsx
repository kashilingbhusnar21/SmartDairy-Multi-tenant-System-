import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { clearAuth, getFarmerName } from "../../utils/auth";
import BrandLogo from "../ui/BrandLogo";
import { useTheme } from "../../context/ThemeContext";
import {
  LayoutDashboard,
  User,
  Milk,
  CreditCard,
  ShoppingBag,
  LogOut,
  Menu,
  X,
  Bot,
  Stethoscope,
  Store,
  ChevronRight
} from "lucide-react";

const navClass = ({ isActive }) =>
  `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 ${
    isActive
      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-semibold"
      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-slate-800/80 active:scale-[0.99]"
  }`;

function FarmerSidebar({ onNavigate }) {
  const navigate = useNavigate();
  const farmerName = getFarmerName();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isDark } = useTheme();

  const handleNav = () => {
    onNavigate?.();
    if (window.innerWidth < 1024) {
      setIsCollapsed(true);
    }
  };

  const logout = () => {
    clearAuth();
    toast.success("Logged out successfully");
    navigate("/login");
    onNavigate?.();
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        aria-label="Toggle navigation"
      >
        {isCollapsed ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar Overlay for Mobile */}
      {isCollapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-30"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 z-40 h-screen bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 shadow-sm transition-all duration-300 ease-in-out ${
          isCollapsed ? "-translate-x-full" : "translate-x-0"
        } w-72 flex flex-col`}
      >
        {/* Brand Section */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <BrandLogo size="md" variant={isDark ? "light" : "dark"} />
          <div className="mt-3 px-3 py-1.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-emerald-700 dark:text-emerald-400 font-sans text-[11px] font-bold">PORTAL:</span>
              <span className="text-emerald-900 dark:text-emerald-200 font-semibold truncate max-w-[140px]" title={farmerName || "Farmer"}>
                {farmerName || "Farmer"}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto scrollbar-hide">
          <div className="space-y-1">
            <p className="px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              Farmer Self-Service
            </p>
            <NavLink to="/farmer/dashboard" className={navClass} onClick={handleNav}>
              <div className="flex items-center gap-3">
                <LayoutDashboard size={18} className="shrink-0 stroke-[1.8]" />
                <span>Passbook & Stats</span>
              </div>
            </NavLink>
            <NavLink to="/farmer/profile" className={navClass} onClick={handleNav}>
              <div className="flex items-center gap-3">
                <User size={18} className="shrink-0 stroke-[1.8]" />
                <span>KYC & Profile</span>
              </div>
            </NavLink>
            <NavLink to="/farmer/milk-collections" className={navClass} onClick={handleNav}>
              <div className="flex items-center gap-3">
                <Milk size={18} className="shrink-0 stroke-[1.8]" />
                <span>My Milk Deliveries</span>
              </div>
            </NavLink>
            <NavLink to="/farmer/payments" className={navClass} onClick={handleNav}>
              <div className="flex items-center gap-3">
                <CreditCard size={18} className="shrink-0 stroke-[1.8]" />
                <span>Payouts & Settlements</span>
              </div>
            </NavLink>
            <NavLink to="/farmer/feed-purchases" className={navClass} onClick={handleNav}>
              <div className="flex items-center gap-3">
                <ShoppingBag size={18} className="shrink-0 stroke-[1.8]" />
                <span>Cattle Feed Invoices</span>
              </div>
            </NavLink>
          </div>

          <div className="space-y-1">
            <p className="px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              Advisory & Equipment
            </p>
            <NavLink to="/farmer/ai-chat" className={navClass} onClick={handleNav}>
              <div className="flex items-center gap-3">
                <Bot size={18} className="text-teal-600 dark:text-teal-400 shrink-0 stroke-[1.8]" />
                <span>AI Agronomy Advisor</span>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 px-1.5 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                TRILINGUAL
              </span>
            </NavLink>
            <NavLink to="/farmer/doctors" className={navClass} onClick={handleNav}>
              <div className="flex items-center gap-3">
                <Stethoscope size={18} className="shrink-0 stroke-[1.8]" />
                <span>Doctor Consultation</span>
              </div>
            </NavLink>
            <NavLink to="/farmers/vendors" className={navClass} onClick={handleNav}>
              <div className="flex items-center gap-3">
                <Store size={18} className="shrink-0 stroke-[1.8]" />
                <span>Dairy Equipment Store</span>
              </div>
            </NavLink>
          </div>
        </nav>

        {/* Logout Section */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium text-slate-600 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-950/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <LogOut size={18} className="stroke-[1.8]" />
              <span>Sign Out</span>
            </div>
            <ChevronRight size={16} className="opacity-40" />
          </button>
        </div>
      </aside>
    </>
  );
}

export default FarmerSidebar;
