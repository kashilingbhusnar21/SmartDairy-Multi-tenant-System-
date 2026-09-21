import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import ErrorState from "../components/ui/ErrorState";
import PageLoader from "../components/ui/PageLoader";
import {
  getVendors,
  getInactiveVendors,
  createVendor,
  updateVendor,
  deleteVendor,
  deactivateVendor,
  activateVendor,
} from "../services/vendors";
import { getErrorMessage } from "../utils/errorMessage";

function AdminVendorsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [vendors, setVendors] = useState([]);
  const [inactiveVendors, setInactiveVendors] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    shopAddress: "",
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const loadVendors = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = showInactive
        ? await getInactiveVendors(debouncedSearch)
        : await getVendors(debouncedSearch);
      if (showInactive) {
        setInactiveVendors(data);
      } else {
        setVendors(data);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load vendors"));
    } finally {
      setLoading(false);
    }
  }, [showInactive, debouncedSearch]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const handleOpenModal = (vendor = null) => {
    if (vendor) {
      setEditingVendor(vendor);
      setForm({
        name: vendor.name,
        phone: vendor.phone,
        shopAddress: vendor.shopAddress || "",
      });
    } else {
      setEditingVendor(null);
      setForm({
        name: "",
        phone: "",
        shopAddress: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVendor(null);
    setForm({
      name: "",
      phone: "",
      shopAddress: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingVendor) {
        await updateVendor(editingVendor.id, form);
        toast.success("Vendor updated successfully");
      } else {
        await createVendor(form);
        toast.success("Vendor added successfully");
      }
      handleCloseModal();
      loadVendors();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save vendor"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this vendor? This will also delete all equipment associated with this vendor.")) return;
    try {
      await deleteVendor(id);
      toast.success("Vendor deleted successfully");
      loadVendors();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete vendor"));
    }
  };

  const handleToggleActive = async (vendor) => {
    try {
      if (vendor.active) {
        await deactivateVendor(vendor.id);
        toast.success("Vendor deactivated");
      } else {
        await activateVendor(vendor.id);
        toast.success("Vendor activated");
      }
      loadVendors();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update vendor status"));
    }
  };

  const displayVendors = showInactive ? inactiveVendors : vendors;

  if (loading) {
    return <PageLoader label="Loading vendors…" />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Vendor Management</h2>
          <p className="text-slate-600 text-sm mt-1">
            Add and manage equipment vendors for your dairy farmers
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
        >
          Add Vendor
        </button>
      </div>

      <ErrorState
        message={error}
        onRetry={() => {
          setLoading(true);
          setError("");
          loadVendors();
        }}
      />

      {error ? null : (
        <>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowInactive(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    !showInactive
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Active ({vendors.length})
                </button>
                <button
                  onClick={() => setShowInactive(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    showInactive
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Inactive ({inactiveVendors.length})
                </button>
              </div>
              <input
                type="search"
                placeholder="Search vendors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full sm:w-64"
              />
            </div>
          </div>

          {displayVendors.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <p className="text-slate-500">No vendors found</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">
                        Name
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">
                        Phone
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">
                        Shop Address
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">
                        Equipment Count
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">
                        Status
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {displayVendors.map((vendor) => (
                      <tr key={vendor.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{vendor.name}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{vendor.phone}</td>
                        <td className="px-4 py-3 text-slate-700 text-sm">
                          {vendor.shopAddress ? (
                            <div className="flex items-center gap-2">
                              <span className="truncate max-w-xs">{vendor.shopAddress}</span>
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vendor.shopAddress)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 text-xs font-medium flex-shrink-0"
                              >
                                Map
                              </a>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{vendor.equipmentCount || 0}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              vendor.active
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {vendor.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal(vendor)}
                              className="px-3 py-1 rounded text-xs font-medium text-slate-700 hover:bg-slate-100"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleActive(vendor)}
                              className="px-3 py-1 rounded text-xs font-medium text-slate-700 hover:bg-slate-100"
                            >
                              {vendor.active ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              onClick={() => handleDelete(vendor.id)}
                              className="px-3 py-1 rounded text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              {editingVendor ? "Edit Vendor" : "Add New Vendor"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Vendor Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g., Shree Agro Equipments"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  minLength={10}
                  maxLength={15}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g., 9876543210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Shop Address
                </label>
                <input
                  type="text"
                  value={form.shopAddress}
                  onChange={(e) => setForm({ ...form, shopAddress: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g., Main Market, City"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingVendor ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminVendorsPage;
