import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { clearAuth, getEmail, getRole } from "../../utils/auth";
import BrandLogo from "../ui/BrandLogo";
import { useTheme } from "../../context/ThemeContext";
import {
  LayoutDashboard,
  Users,
  Milk,
  CreditCard,
  ShoppingBag,
  BookOpen,
  BarChart3,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
  Bot,
  Stethoscope,
  Wrench,
  Store,
  Zap,
  ChevronRight
} from "lucide-react";

const navClass = ({ isActive }) =>
  `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 ${
    isActive
      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-semibold"
      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-slate-800/80 active:scale-[0.99]"
  }`;

function Sidebar({ onNavigate }) {
  const navigate = useNavigate();
  const role = getRole();
  const email = getEmail();
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
          <div className="mt-3 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-slate-400 dark:text-slate-500 font-sans text-[11px] font-bold">TENANT:</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold truncate max-w-[140px]" title={email || "Admin"}>
                {email || "Admin"}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto scrollbar-hide">
          
          {/* GROUP 1: OPERATIONS & TELEMETRY */}
          <div className="space-y-1">
            <p className="px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              Operations & Telemetry
            </p>
            <NavLink to="/home" className={navClass} onClick={handleNav}>
              <div className="flex items-center gap-3">
                <LayoutDashboard size={18} className="shrink-0 stroke-[1.8]" />
                <span>Executive Dashboard</span>
              </div>
            </NavLink>
            <NavLink to="/rapid-collection" className={navClass} onClick={handleNav}>
              <div className="flex items-center gap-3">
                <Zap size={18} className="text-amber-500 fill-amber-500/20 shrink-0 stroke-[1.8]" />
                <span className="font-semibold">Rapid 4G POS</span>
              </div>
              <span className="text-[10px] font-mono font-black uppercase bg-amber-500/15 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md border border-amber-500/30">
                LIVE
              </span>
            </NavLink>
            <NavLink to="/milk-collections" className={navClass} onClick={handleNav}>
              <div className="flex items-center gap-3">
                <Milk size={18} className="shrink-0 stroke-[1.8]" />
                <span>Milk Collections</span>
              </div>
            </NavLink>
            <NavLink to="/farmers" className={navClass} onClick={handleNav}>
              <div className="flex items-center gap-3">
                <Users size={18} className="shrink-0 stroke-[1.8]" />
                <span>Farmer Directory</span>
              </div>
            </NavLink>
          </div>

          {/* GROUP 2: FINANCES & SETTLEMENT */}
          <div className="space-y-1">
            <p className="px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              Finances & Settlement
            </p>
            <NavLink to="/payments" className={navClass} onClick={handleNav}>
              <div className="flex items-center gap-3">
                <CreditCard size={18} className="shrink-0 stroke-[1.8]" />
                <span>Payment Settlements</span>
              </div>
            </NavLink>
            <NavLink to="/feed-purchases" className={navClass} onClick={handleNav}>
              <div className="flex items-center gap-3">
                <ShoppingBag size={18} className="shrink-0 stroke-[1.8]" />
                <span>Cattle Feed Sales</span>
              </div>
            </NavLink>
            <NavLink to="/financial-ledger" className={navClass} onClick={handleNav}>
              <div className="flex items-center gap-3">
                <BookOpen size={18} className="shrink-0 stroke-[1.8]" />
                <span>Farmer Ledgers</span>
              </div>
            </NavLink>
            <NavLink to="/financial-analytics" className={navClass} onClick={handleNav}>
              <div className="flex items-center gap-3">
                <BarChart3 size={18} className="shrink-0 stroke-[1.8]" />
                <span>Financial Analytics</span>
              </div>
            </NavLink>
          </div>

          {/* GROUP 3: ECOSYSTEM & ADMIN */}
          {role === "ADMIN" && (
            <div className="space-y-1">
              <p className="px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Ecosystem & AI
              </p>
              <NavLink to="/admin/settings" className={navClass} onClick={handleNav}>
                <div className="flex items-center gap-3">
                  <Settings size={18} className="shrink-0 stroke-[1.8]" />
                  <span>FAT / SNF Pricing Matrix</span>
                </div>
              </NavLink>
              <NavLink to="/admin/ai-chat" className={navClass} onClick={handleNav}>
                <div className="flex items-center gap-3">
                  <Bot size={18} className="text-teal-600 dark:text-teal-400 shrink-0 stroke-[1.8]" />
                  <span>AI Advisor (Trilingual)</span>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 px-1.5 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                  GPT-120B
                </span>
              </NavLink>
              <NavLink to="/admin/equipment" className={navClass} onClick={handleNav}>
                <div className="flex items-center gap-3">
                  <Wrench size={18} className="shrink-0 stroke-[1.8]" />
                  <span>Equipment Marketplace</span>
                </div>
              </NavLink>
              <NavLink to="/admin/doctors" className={navClass} onClick={handleNav}>
                <div className="flex items-center gap-3">
                  <Stethoscope size={18} className="shrink-0 stroke-[1.8]" />
                  <span>Veterinary Doctors</span>
                </div>
              </NavLink>
              <NavLink to="/admin/vendors" className={navClass} onClick={handleNav}>
                <div className="flex items-center gap-3">
                  <Store size={18} className="shrink-0 stroke-[1.8]" />
                  <span>Equipment Vendors</span>
                </div>
              </NavLink>
              <NavLink to="/admin" end className={navClass} onClick={handleNav}>
                <div className="flex items-center gap-3">
                  <Shield size={18} className="shrink-0 stroke-[1.8]" />
                  <span>Tenant Administration</span>
                </div>
              </NavLink>
            </div>
          )}
        </nav>

        {/* Footer / Logout Section */}
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

export default Sidebar;
