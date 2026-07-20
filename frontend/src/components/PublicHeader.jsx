import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";

function PublicHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-20 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-slate-200'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-emerald-800 hover:text-emerald-700 transition-colors duration-300">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" fill="currentColor" className="text-emerald-600"/>
            <path d="M12 22V12M2 7L12 12L22 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Smart Dairy
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `transition-all duration-300 hover:text-emerald-700 ${
                isActive ? "text-emerald-700 font-semibold" : "text-slate-700"
              }`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/login"
            className={({ isActive }) =>
              `transition-all duration-300 hover:text-emerald-700 ${
                isActive ? "text-emerald-700 font-semibold" : "text-slate-700"
              }`
            }
          >
            Login
          </NavLink>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors duration-300"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <nav className="md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-4 space-y-3 animate-fade-in">
          <NavLink
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `block py-2 transition-all duration-300 hover:text-emerald-700 ${
                isActive ? "text-emerald-700 font-semibold" : "text-slate-700"
              }`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/login"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `block py-2 transition-all duration-300 hover:text-emerald-700 ${
                isActive ? "text-emerald-700 font-semibold" : "text-slate-700"
              }`
            }
          >
            Login
          </NavLink>
        </nav>
      )}
    </header>
  );
}

export default PublicHeader;
