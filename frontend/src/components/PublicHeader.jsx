import { Link, NavLink } from "react-router-dom";

function PublicHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold text-emerald-800">
          Smart Dairy
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <NavLink
            to="/login"
            className={({ isActive }) =>
              isActive ? "text-emerald-700" : "text-slate-600 hover:text-emerald-700"
            }
          >
            Login
          </NavLink>
          <NavLink
            to="/register"
            className={({ isActive }) =>
              isActive
                ? "text-emerald-700"
                : "text-slate-600 hover:text-emerald-700"
            }
          >
            Register
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default PublicHeader;
