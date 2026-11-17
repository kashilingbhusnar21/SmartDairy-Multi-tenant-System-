import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import BrandLogo from "./ui/BrandLogo";
import ThemeToggle from "./ui/ThemeToggle";
import { ArrowRight, Zap, Menu, X } from "lucide-react";

function PublicHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-slate-950/90 dark:bg-slate-950/95 backdrop-blur-md shadow-xs border-b border-slate-800 py-3"
          : "bg-transparent border-b border-transparent py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <BrandLogo size="md" variant="light" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
          <a href="#features" className="hover:text-emerald-400 transition-colors">
            Core Platform
          </a>
          <a href="#iot-gateway" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
            <span>4G IoT Gateway</span>
          </a>
          <a href="#architecture" className="hover:text-emerald-400 transition-colors">
            Architecture
          </a>
          <a href="#performance" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>JMeter 5K Benchmarks</span>
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-2.5">
          <ThemeToggle />

          <Link
            to="/login"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all active:scale-95"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <span>Register Dairy</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-5 py-4 space-y-3 animate-fade-in shadow-2xl">
          <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-300">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-emerald-400"
            >
              Core Platform
            </a>
            <a
              href="#iot-gateway"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-emerald-400 flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Autonomous 4G Gateway</span>
            </a>
            <a
              href="#architecture"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-emerald-400"
            >
              High-Availability Architecture
            </a>
          </nav>
          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-xl border border-slate-700 font-bold text-xs text-slate-200"
            >
              Sign In to Console
            </Link>
            <Link
              to="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 font-black text-xs text-slate-950 shadow-md shadow-emerald-500/20"
            >
              Register New Dairy Center
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default PublicHeader;
