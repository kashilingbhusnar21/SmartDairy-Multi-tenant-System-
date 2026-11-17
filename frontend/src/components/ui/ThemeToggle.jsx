import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ className = "", showLabel = false }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-xl transition-all duration-200 border flex items-center gap-2 select-none active:scale-95 ${
        isDark
          ? "bg-slate-900 border-slate-700 text-amber-300 hover:bg-slate-800 hover:text-amber-200 shadow-sm shadow-slate-950/50"
          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-xs"
      } ${className}`}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle color theme"
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 rotate-0 transition-transform duration-300 text-amber-400" />
        ) : (
          <Moon className="w-4 h-4 rotate-0 transition-transform duration-300 text-indigo-600" />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-semibold">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}
