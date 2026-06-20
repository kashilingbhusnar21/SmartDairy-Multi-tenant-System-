function ErrorState({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <span>{message}</span>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 font-medium text-red-900 text-xs"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

export default ErrorState;
