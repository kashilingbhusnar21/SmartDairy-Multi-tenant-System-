import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import ErrorState from "../components/ui/ErrorState";
import PageLoader from "../components/ui/PageLoader";
import Pagination from "../components/ui/Pagination";
import { usePagination } from "../hooks/usePagination";
import { deleteMilkCollection, listDailyCollections } from "../services/milkCollections";
import { generatePaymentFromCollection } from "../services/payments";
import { getErrorMessage } from "../utils/errorMessage";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const PAGE_SIZE = 8;

function MilkCollectionListPage() {
  const [date, setDate] = useState(todayISO());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shiftFilter, setShiftFilter] = useState("");

  const load = useCallback(async (targetDate) => {
    try {
      setLoading(true);
      setError("");
      const data = await listDailyCollections(targetDate);
      setRows(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Error occurred'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(date);
    // initial load only; date changes load via handleDateChange
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (shiftFilter && r.shift !== shiftFilter) return false;
      return true;
    });
  }, [rows, shiftFilter]);

  const { page, setPage, pageItems, totalPages, total, pageSize } = usePagination(
    filteredRows,
    PAGE_SIZE
  );

  const handleDateChange = (e) => {
    const value = e.target.value;
    setDate(value);
    load(value);
  };

  const handleGeneratePayment = async (collectionId) => {
    try {
      await generatePaymentFromCollection(collectionId);
      toast.success('Payment processed successfully');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Payment failed'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this milk collection?')) return;
    try {
      await deleteMilkCollection(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast.success('Milk collection deleted successfully');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Error occurred'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Milk Collection List</h2>
          <p className="text-slate-600 text-sm">View and manage milk collection records</p>
        </div>
        <Link
          to="/milk-collections/add"
          className="inline-flex justify-center px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
        >
          Add Milk Collection
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row lg:flex-wrap gap-4 items-start lg:items-end">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Date</label>
          <input
            type="date"
            value={date}
            onChange={handleDateChange}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Shift</label>
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white min-w-[140px]"
          >
            <option value="">All</option>
            <option value="MORNING">Morning</option>
            <option value="EVENING">Evening</option>
          </select>
        </div>
      </div>

      <ErrorState message={error} onRetry={() => load(date)} />

      {loading ? (
        <PageLoader label="Loading..." />
      ) : !error && rows.length === 0 ? (
        <p className="text-slate-600 text-sm py-8 text-center">No milk collections found</p>
      ) : !error && filteredRows.length === 0 ? (
        <p className="text-slate-600 text-sm py-8 text-center">No milk collections found</p>
      ) : !error ? (
        <>
          <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Farmer Name</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Shift</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Total Quantity (L)</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Fat %</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">SNF %</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Rate/Liter</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Total Amount</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{r.id}</td>
                    <td className="px-3 py-2">{r.farmerName}</td>
                    <td className="px-3 py-2">{r.shift}</td>
                    <td className="px-3 py-2">{r.quantityLiters}</td>
                    <td className="px-3 py-2">{r.fatPercentage}</td>
                    <td className="px-3 py-2">{r.snfPercentage}</td>
                    <td className="px-3 py-2">{r.ratePerLiter}</td>
                    <td className="px-3 py-2">{r.totalAmount}</td>
                    <td className="px-3 py-2 space-x-2 whitespace-nowrap">
                      <Link
                        to={`/milk-collections/${r.id}/edit`}
                        className="text-emerald-700 hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleGeneratePayment(r.id)}
                        className="text-slate-800 hover:underline"
                      >
                        Pay
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </>
      ) : null}
    </div>
  );
}

export default MilkCollectionListPage;
