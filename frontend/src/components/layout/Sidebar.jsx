import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { clearAuth, getEmail, getRole } from "../../utils/auth";
import {
  LayoutDashboard,
  Users,
  Milk,
  CreditCard,
  ShoppingBag,
  BookOpen,
  BarChart3,
  Receipt,
  Shield,
  Settings,
  FileText,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const navClass = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
    isActive
      ? "bg-emerald-600 text-white shadow-lg border-l-4 border-emerald-400"
      : "text-slate-700 hover:bg-emerald-50 hover:translate-x-1"
  }`;

function Sidebar({ onNavigate }) {
  const navigate = useNavigate();
  const role = getRole();
  const email = getEmail();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleNav = () => {
    onNavigate?.();
    if (window.innerWidth < 1024) {
      setIsCollapsed(true);
    }
  };

  const logout = () => {
    clearAuth();
    toast.success('Logged out successfully');
    navigate("/login");
    onNavigate?.();
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors"
      >
        {isCollapsed ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar Overlay for Mobile */}
      {isCollapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 z-40 h-screen bg-[#F8FAFC] border-r border-slate-200 shadow-xl transition-transform duration-300 ease-in-out ${
          isCollapsed ? '-translate-x-full' : 'translate-x-0'
        } w-[260px] flex flex-col rounded-r-2xl`}
      >
        {/* Brand Section */}
        <div className="p-6 border-b border-slate-200/60">
          <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full mb-4" />
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🐄</span>
            <h1 className="text-xl font-bold text-slate-800">Smart Dairy</h1>
          </div>
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">
            Admin Panel
          </p>
          <p className="text-xs text-slate-400 truncate" title={email || ""}>
            {email || "Signed in"}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavLink to="/home" className={navClass} onClick={handleNav}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/farmers" className={navClass} onClick={handleNav}>
            <Users size={18} />
            <span>Farmers</span>
          </NavLink>
          <NavLink to="/milk-collections" className={navClass} onClick={handleNav}>
            <Milk size={18} />
            <span>Milk Collection</span>
          </NavLink>
          <NavLink to="/payments" className={navClass} onClick={handleNav}>
            <CreditCard size={18} />
            <span>Payments</span>
          </NavLink>
          <NavLink to="/feed-purchases" className={navClass} onClick={handleNav}>
            <ShoppingBag size={18} />
            <span>Feed Purchases</span>
          </NavLink>
          <NavLink to="/financial-ledger" className={navClass} onClick={handleNav}>
            <BookOpen size={18} />
            <span>Financial Ledger</span>
          </NavLink>
          <NavLink to="/financial-analytics" className={navClass} onClick={handleNav}>
            <BarChart3 size={18} />
            <span>Financial Analytics</span>
          </NavLink>
          <NavLink to="/farmers" className={navClass} onClick={handleNav}>
            <Receipt size={18} />
            <span>Farmer Bills</span>
          </NavLink>
          {role === "ADMIN" ? (
            <>
              <div className="pt-4 pb-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4">
                  Admin
                </p>
              </div>
              <NavLink to="/admin" className={navClass} onClick={handleNav}>
                <Shield size={18} />
                <span>Admin Dashboard</span>
              </NavLink>
              <NavLink to="/admin/settings" className={navClass} onClick={handleNav}>
                <Settings size={18} />
                <span>Milk Pricing</span>
              </NavLink>
              <NavLink to="/milk-reports" className={navClass} onClick={handleNav}>
                <FileText size={18} />
                <span>Advanced Reports</span>
              </NavLink>
            </>
          ) : null}
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-slate-200/60">
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-700 transition-all duration-200 hover:translate-x-1"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
