import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { clearAuth, getFarmerName } from "../../utils/auth";
import BrandLogo from "../ui/BrandLogo";
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
  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
    isActive
      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25 font-bold"
      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 active:scale-98"
  }`;

function FarmerSidebar({ onNavigate }) {
  const navigate = useNavigate();
  const farmerName = getFarmerName();
  const [isCollapsed, setIsCollapsed] = useState(false);

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
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white rounded-xl shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        aria-label="Toggle navigation"
      >
        {isCollapsed ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar Overlay for Mobile */}
      {isCollapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 z-40 h-screen bg-white border-r border-slate-200/80 shadow-sm transition-transform duration-300 ease-in-out ${
          isCollapsed ? "-translate-x-full" : "translate-x-0"
        } w-[260px] flex flex-col`}
      >
        {/* Brand Section */}
        <div className="p-5 border-b border-slate-100">
          <BrandLogo size="md" />
          <div className="mt-3 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-between text-[11px] font-mono">
            <span className="text-emerald-700 font-bold">PORTAL:</span>
            <span className="text-emerald-900 font-semibold truncate max-w-[140px]" title={farmerName || "Farmer"}>
              {farmerName || "Farmer"}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto scrollbar-hide text-xs">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Farmer Self-Service
          </p>
          <NavLink to="/farmer/dashboard" className={navClass} onClick={handleNav}>
            <div className="flex items-center gap-2.5">
              <LayoutDashboard size={16} />
              <span>Passbook & Stats</span>
            </div>
          </NavLink>
          <NavLink to="/farmer/profile" className={navClass} onClick={handleNav}>
            <div className="flex items-center gap-2.5">
              <User size={16} />
              <span>KYC & Profile</span>
            </div>
          </NavLink>
          <NavLink to="/farmer/milk-collections" className={navClass} onClick={handleNav}>
            <div className="flex items-center gap-2.5">
              <Milk size={16} />
              <span>My Milk Deliveries</span>
            </div>
          </NavLink>
          <NavLink to="/farmer/payments" className={navClass} onClick={handleNav}>
            <div className="flex items-center gap-2.5">
              <CreditCard size={16} />
              <span>Payouts & Settlements</span>
            </div>
          </NavLink>
          <NavLink to="/farmer/feed-purchases" className={navClass} onClick={handleNav}>
            <div className="flex items-center gap-2.5">
              <ShoppingBag size={16} />
              <span>Cattle Feed Invoices</span>
            </div>
          </NavLink>

          <p className="px-3 pt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Advisory & Equipment
          </p>
          <NavLink to="/farmer/ai-chat" className={navClass} onClick={handleNav}>
            <div className="flex items-center gap-2.5">
              <Bot size={16} className="text-teal-600" />
              <span>AI Agronomy Advisor</span>
            </div>
            <span className="text-[9px] font-mono font-bold uppercase bg-teal-50 text-teal-700 px-1 py-0.2 rounded border border-teal-200">
              TRILINGUAL
            </span>
          </NavLink>
          <NavLink to="/farmer/doctors" className={navClass} onClick={handleNav}>
            <div className="flex items-center gap-2.5">
              <Stethoscope size={16} />
              <span>Doctor Consultation</span>
            </div>
          </NavLink>
          <NavLink to="/farmers/vendors" className={navClass} onClick={handleNav}>
            <div className="flex items-center gap-2.5">
              <Store size={16} />
              <span>Dairy Equipment Store</span>
            </div>
          </NavLink>
        </nav>

        {/* Logout Section */}
        <div className="p-3 border-t border-slate-100">
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50/80 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <LogOut size={16} />
              <span>Sign Out</span>
            </div>
            <ChevronRight size={14} className="opacity-40" />
          </button>
        </div>
      </aside>
    </>
  );
}

export default FarmerSidebar;
