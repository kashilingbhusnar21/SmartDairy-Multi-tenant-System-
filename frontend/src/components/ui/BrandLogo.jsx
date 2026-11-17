import React from "react";

export default function BrandLogo({ size = "md", variant = "dark", showTagline = true, collapsed = false }) {
  const isSm = size === "sm";
  const isLg = size === "lg";

  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11"
  };

  const titleSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl"
  };

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Modern SVG Geometric Dairy & Cloud Hexagon Logo */}
      <div
        className={`${iconSizes[size] || iconSizes.md} rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-0.5 shadow-md shadow-emerald-500/20 flex items-center justify-center shrink-0 transition-transform hover:scale-105`}
      >
        <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center p-1.5">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-full h-full text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.6)]"
          >
            {/* Outer Hexagon Circuit Shield */}
            <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" className="stroke-emerald-400/50" />
            {/* Modern Milk Droplet Core */}
            <path
              d="M12 6C12 6 8.5 10.5 8.5 13.5C8.5 15.433 10.067 17 12 17C13.933 17 15.5 15.433 15.5 13.5C15.5 10.5 12 6 12 6Z"
              fill="url(#dropletGradient)"
              className="stroke-emerald-300"
              strokeWidth="1.5"
            />
            {/* Sparkle Accent */}
            <circle cx="12" cy="13" r="1.2" fill="#FFFFFF" />
            <defs>
              <linearGradient id="dropletGradient" x1="8.5" y1="6" x2="15.5" y2="17" gradientUnits="userSpaceOnUse">
                <stop stopColor="#10B981" />
                <stop offset="1" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {!collapsed && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`${titleSizes[size] || titleSizes.md} font-black tracking-tight ${
                variant === "light" ? "text-white" : "text-slate-900"
              }`}
            >
              DairyAI
            </span>
            <span className="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
              NEXUS
            </span>
          </div>
          {showTagline && (
            <span className="text-[10px] font-medium text-slate-500 tracking-wider mt-1 uppercase">
              Cloud ERP &bull; 4G IoT
            </span>
          )}
        </div>
      )}
    </div>
  );
}
