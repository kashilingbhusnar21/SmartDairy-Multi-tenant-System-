import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import ErrorState from "../components/ui/ErrorState";
import PageLoader from "../components/ui/PageLoader";
import Pagination from "../components/ui/Pagination";
import { usePagination } from "../hooks/usePagination";
import { deactivateFarmer, activateFarmer, listFarmers, resetFarmerPassword } from "../services/farmers";
import { getErrorMessage } from "../utils/errorMessage";

const PAGE_SIZE = 8;

function FarmerListPage() {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [resetPasswordModal, setResetPasswordModal] = useState({
    open: false,
    farmerId: null,
    farmerName: "",
    newPassword: "",
    confirmPassword: "",
    submitting: false,
  });

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

  const handleDeactivate = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this farmer? This will preserve all records but hide the farmer from active lists.')) return;
    try {
      await deactivateFarmer(id);
      load(query);
      toast.success('Farmer deactivated successfully');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Error occurred'));
    }
  };

  const handleActivate = async (id) => {
    try {
      await activateFarmer(id);
      load(query);
      toast.success('Farmer activated successfully');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Error occurred'));
    }
  };

  const openResetPasswordModal = (farmer) => {
    setResetPasswordModal({
      open: true,
      farmerId: farmer.id,
      farmerName: farmer.fullName,
      newPassword: "",
      confirmPassword: "",
      submitting: false,
    });
  };

  const closeResetPasswordModal = () => {
    setResetPasswordModal({
      open: false,
      farmerId: null,
      farmerName: "",
      newPassword: "",
      confirmPassword: "",
      submitting: false,
    });
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    const { farmerId, newPassword, confirmPassword } = resetPasswordModal;

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setResetPasswordModal((prev) => ({ ...prev, submitting: true }));
    try {
      await resetFarmerPassword(farmerId, newPassword);
      toast.success("Password updated successfully");
      closeResetPasswordModal();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to reset password"));
      setResetPasswordModal((prev) => ({ ...prev, submitting: false }));
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
            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-slate-100 border-b-2 border-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-slate-300">ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-slate-300">Farmer Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-slate-300">Phone</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-slate-300">Address</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-slate-300">Aadhaar</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-slate-300">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pageItems.map((f, index) => (
                  <tr
                    key={f.id}
                    className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-slate-100 transition-colors`}
                  >
                    <td className="px-4 py-3 border-b border-slate-200">{f.id}</td>
                    <td className="px-4 py-3 border-b border-slate-200">{f.fullName}</td>
                    <td className="px-4 py-3 border-b border-slate-200">{f.mobileNumber}</td>
                    <td className="px-4 py-3 border-b border-slate-200">{f.village}</td>
                    <td className="px-4 py-3 border-b border-slate-200">{f.aadhaarNumber}</td>
                    <td className="px-4 py-3 border-b border-slate-200">
                      {f.active ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 border-b border-slate-200 space-x-2 whitespace-nowrap">
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
                        onClick={() => openResetPasswordModal(f)}
                        className="text-amber-700 hover:underline"
                      >
                        Set/Reset Password
                      </button>
                      {f.active ? (
                        <button
                          type="button"
                          onClick={() => handleDeactivate(f.id)}
                          className="text-red-600 hover:underline"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleActivate(f.id)}
                          className="text-emerald-600 hover:underline"
                        >
                          Activate
                        </button>
                      )}
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

      {resetPasswordModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-slate-800 mb-1">Set / Reset Password</h2>
            <p className="text-sm text-slate-600 mb-4">
              Set a new login password for <span className="font-semibold">{resetPasswordModal.farmerName}</span>.
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={resetPasswordModal.newPassword}
                  onChange={(e) =>
                    setResetPasswordModal((prev) => ({ ...prev, newPassword: e.target.value }))
                  }
                  minLength={6}
                  required
                  autoComplete="new-password"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={resetPasswordModal.confirmPassword}
                  onChange={(e) =>
                    setResetPasswordModal((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  minLength={6}
                  required
                  autoComplete="new-password"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeResetPasswordModal}
                  disabled={resetPasswordModal.submitting}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetPasswordModal.submitting}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
                >
                  {resetPasswordModal.submitting ? "Saving…" : "Save Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FarmerListPage;
