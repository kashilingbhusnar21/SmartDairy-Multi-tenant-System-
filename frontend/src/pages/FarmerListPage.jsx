import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import ErrorState from "../components/ui/ErrorState";
import PageLoader from "../components/ui/PageLoader";
import Pagination from "../components/ui/Pagination";
import { usePagination } from "../hooks/usePagination";
import { deleteFarmer, listFarmers } from "../services/farmers";
import { getErrorMessage } from "../utils/errorMessage";

const PAGE_SIZE = 8;

function FarmerListPage() {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const load = useCallback(async (search) => {
    try {
      setLoading(true);
      setError("");
      const data = await listFarmers(search);
      setFarmers(data);
    } catch (err) {
      const msg = getErrorMessage(err, 'Error occurred');
      setError(msg);
      setFarmers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { page, setPage, pageItems, totalPages, total, pageSize } = usePagination(farmers, PAGE_SIZE);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    load(query);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this farmer?')) return;
    try {
      await deleteFarmer(id);
      setFarmers((prev) => prev.filter((f) => f.id !== id));
      toast.success('Farmer deleted successfully');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Error occurred'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Farmers</h2>
          <p className="text-slate-600 text-sm">Manage farmer details and records</p>
        </div>
        <Link
          to="/farmers/add"
          className="inline-flex justify-center px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
        >
          Add Farmer
        </Link>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search farmers by ID, name or village..."
          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              load("");
            }}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
          >
            Clear
          </button>
        </div>
      </form>

      <ErrorState message={error} onRetry={() => load(query)} />

      {loading ? (
        <PageLoader label="Loading..." />
      ) : !error && farmers.length === 0 ? (
        <p className="text-slate-600 text-sm py-8 text-center">No farmers found</p>
      ) : !error ? (
        <>
          <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Farmer Name</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Phone</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Address</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Aadhaar</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((f) => (
                  <tr key={f.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{f.id}</td>
                    <td className="px-3 py-2">{f.fullName}</td>
                    <td className="px-3 py-2">{f.mobileNumber}</td>
                    <td className="px-3 py-2">{f.village}</td>
                    <td className="px-3 py-2">{f.aadhaarNumber}</td>
                    <td className="px-3 py-2 space-x-2 whitespace-nowrap">
                      <Link
                        to={`/farmers/${f.id}/payments`}
                        className="text-slate-700 hover:underline"
                      >
                        Payments
                      </Link>
                      <Link
                        to={`/farmers/${f.id}/bill`}
                        className="text-indigo-700 hover:underline"
                      >
                        View
                      </Link>
                      <Link to={`/farmers/${f.id}/edit`} className="text-emerald-700 hover:underline">
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(f.id)}
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

export default FarmerListPage;
