import { NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { clearAuth, getEmail, getRole } from "../../utils/auth";

const navClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? "bg-emerald-600 text-white shadow-sm"
      : "text-slate-700 hover:bg-emerald-50"
  }`;

function Sidebar({ onNavigate }) {
  const navigate = useNavigate();
  const role = getRole();
  const email = getEmail();

  const handleNav = () => {
    onNavigate?.();
  };

  const logout = () => {
    clearAuth();
    toast.success('Logged out successfully');
    navigate("/login");
    onNavigate?.();
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="p-5 border-b border-slate-100">
        <p className="text-lg font-bold text-emerald-800 tracking-tight">Smart Dairy</p>
        <p className="text-xs text-slate-500 mt-1 truncate" title={email || ""}>
          {email || "Signed in"}
        </p>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <NavLink to="/home" className={navClass} onClick={handleNav}>
          <span>Home</span>
        </NavLink>
        <NavLink to="/farmers" className={navClass} onClick={handleNav}>
          <span>Farmers</span>
        </NavLink>
        <NavLink to="/milk-collections" className={navClass} onClick={handleNav}>
          <span>Milk Collection</span>
        </NavLink>
        <NavLink to="/payments" className={navClass} onClick={handleNav}>
          <span>Payments</span>
        </NavLink>
        <NavLink to="/feed-purchases" className={navClass} onClick={handleNav}>
          <span>Feed Purchases</span>
        </NavLink>
        <NavLink to="/farmers" className={navClass} onClick={handleNav}>
          <span>Farmer Bills</span>
        </NavLink>
        {role === "ADMIN" ? (
          <>
            <NavLink to="/admin" className={navClass} onClick={handleNav}>
              <span>Admin Dashboard</span>
            </NavLink>
            <NavLink to="/admin/settings" className={navClass} onClick={handleNav}>
              <span>Milk Pricing</span>
            </NavLink>
            <NavLink to="/milk-reports" className={navClass} onClick={handleNav}>
              <span>Advanced Reports</span>
            </NavLink>
          </>
        ) : null}
      </nav>

      <div className="p-3 border-t border-slate-100">
        <button
          type="button"
          onClick={logout}
          className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-800 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
