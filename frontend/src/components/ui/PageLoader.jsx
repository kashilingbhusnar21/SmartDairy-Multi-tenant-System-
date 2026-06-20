function PageLoader({ label = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-600">
      <div
        className="h-10 w-10 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin"
        aria-hidden
      />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export default PageLoader;
