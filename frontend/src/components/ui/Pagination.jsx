function Pagination({ page, totalPages, total, pageSize, onPageChange, className = "" }) {
  if (total <= pageSize) return null;

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 px-2 text-sm text-slate-600 ${className}`}
    >
      <p>
        Showing <span className="font-medium text-slate-800">{from}</span>–
        <span className="font-medium text-slate-800">{to}</span> of{" "}
        <span className="font-medium text-slate-800">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
        >
          Previous
        </button>
        <span className="text-slate-500 tabular-nums px-1">
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Pagination;
