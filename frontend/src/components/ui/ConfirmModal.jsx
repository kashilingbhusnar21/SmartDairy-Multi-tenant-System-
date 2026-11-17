import React, { useEffect } from "react";
import { AlertTriangle, X, Check, Trash2, ShieldAlert } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger", // 'danger' | 'warning' | 'info'
  onConfirm,
  onCancel,
  loading = false
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      bgIcon: "bg-red-500/10 border-red-500/30 text-red-500",
      btn: "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-500/25",
      border: "border-red-500/40",
      badge: "bg-red-500/10 text-red-600 border-red-500/20"
    },
    warning: {
      bgIcon: "bg-amber-500/10 border-amber-500/30 text-amber-500",
      btn: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/25",
      border: "border-amber-500/40",
      badge: "bg-amber-500/10 text-amber-600 border-amber-500/20"
    },
    info: {
      bgIcon: "bg-cyan-500/10 border-cyan-500/30 text-cyan-500",
      btn: "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/25",
      border: "border-emerald-500/40",
      badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
    }
  };

  const style = variantStyles[variant] || variantStyles.danger;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className={`bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border ${style.border} relative overflow-hidden animate-in zoom-in-95 duration-200`}
      >
        {/* Top Accent Strip */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${
            variant === "danger"
              ? "bg-gradient-to-r from-red-500 via-rose-500 to-red-500"
              : variant === "warning"
              ? "bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500"
              : "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500"
          }`}
        />

        <div className="flex items-start gap-4 mb-4">
          <div
            className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${style.bgIcon}`}
          >
            {variant === "danger" ? (
              <Trash2 className="w-6 h-6" />
            ) : variant === "warning" ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <ShieldAlert className="w-6 h-6" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors active:scale-95 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50 ${style.btn}`}
          >
            {loading ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin mr-1" />
            ) : (
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            )}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
