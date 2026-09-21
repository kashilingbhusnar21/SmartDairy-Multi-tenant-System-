import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import ErrorState from "../components/ui/ErrorState";
import PageLoader from "../components/ui/PageLoader";
import {
  getAllEquipment,
  getInactiveEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  deactivateEquipment,
  activateEquipment,
  getVendors,
  uploadEquipmentImage,
} from "../services/vendors";
import { getErrorMessage } from "../utils/errorMessage";

function AdminEquipmentPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [equipment, setEquipment] = useState([]);
  const [inactiveEquipment, setInactiveEquipment] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    vendorId: "",
    name: "",
    companyName: "",
    price: "",
    description: "",
    imageUrl: "",
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [equipmentData, vendorsData] = await Promise.all([
        showInactive ? getInactiveEquipment(debouncedSearch) : getAllEquipment(debouncedSearch),
        getVendors()
      ]);
      if (showInactive) {
        setInactiveEquipment(equipmentData);
      } else {
        setEquipment(equipmentData);
      }
      setVendors(vendorsData.filter(v => v.active));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load equipment"));
    } finally {
      setLoading(false);
    }
  }, [showInactive, debouncedSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = (equip = null) => {
    if (equip) {
      setEditingEquipment(equip);
      setForm({
        vendorId: equip.vendorId,
        name: equip.name,
        companyName: equip.companyName || "",
        price: equip.price,
        description: equip.description || "",
        imageUrl: equip.imageUrl || "",
      });
    } else {
      setEditingEquipment(null);
      setForm({
        vendorId: "",
        name: "",
        companyName: "",
        price: "",
        description: "",
        imageUrl: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEquipment(null);
    setForm({
      vendorId: "",
      name: "",
      companyName: "",
      price: "",
      description: "",
      imageUrl: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
      };
      if (editingEquipment) {
        await updateEquipment(editingEquipment.id, payload);
        toast.success("Equipment updated successfully");
      } else {
        await createEquipment(payload);
        toast.success("Equipment added successfully");
      }
      handleCloseModal();
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save equipment"));
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setUploading(true);
    try {
      const imageUrl = await uploadEquipmentImage(file);
      setForm({ ...form, imageUrl });
      toast.success("Image uploaded successfully");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to upload image"));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this equipment?")) return;
    try {
      await deleteEquipment(id);
      toast.success("Equipment deleted successfully");
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete equipment"));
    }
  };

  const handleToggleActive = async (equip) => {
    try {
      if (equip.active) {
        await deactivateEquipment(equip.id);
        toast.success("Equipment deactivated");
      } else {
        await activateEquipment(equip.id);
        toast.success("Equipment activated");
      }
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update equipment status"));
    }
  };

  const displayEquipment = showInactive ? inactiveEquipment : equipment;

  if (loading) {
    return <PageLoader label="Loading equipment…" />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Equipment Management</h2>
          <p className="text-slate-600 text-sm mt-1">
            Add and manage equipment for your vendors
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
        >
          Add Equipment
        </button>
      </div>

      <ErrorState
        message={error}
        onRetry={() => {
          setLoading(true);
          setError("");
          loadData();
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
                  Active ({equipment.length})
                </button>
                <button
                  onClick={() => setShowInactive(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    showInactive
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Inactive ({inactiveEquipment.length})
                </button>
              </div>
              <input
                type="search"
                placeholder="Search equipment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full sm:w-64"
              />
            </div>
          </div>

          {displayEquipment.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <p className="text-slate-500">No equipment found</p>
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
                        Company
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">
                        Vendor
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">
                        Price
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
                    {displayEquipment.map((equip) => (
                      <tr key={equip.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{equip.name}</div>
                          {equip.imageUrl && (
                            <div className="text-xs text-slate-500 mt-1">Has image</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-700 text-sm">{equip.companyName || "-"}</td>
                        <td className="px-4 py-3 text-slate-700">{equip.vendorName}</td>
                        <td className="px-4 py-3 text-slate-700">₹{equip.price?.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              equip.active
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {equip.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal(equip)}
                              className="px-3 py-1 rounded text-xs font-medium text-slate-700 hover:bg-slate-100"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleActive(equip)}
                              className="px-3 py-1 rounded text-xs font-medium text-slate-700 hover:bg-slate-100"
                            >
                              {equip.active ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              onClick={() => handleDelete(equip.id)}
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
          <div className="bg-white rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              {editingEquipment ? "Edit Equipment" : "Add New Equipment"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Vendor *
                </label>
                <select
                  required
                  value={form.vendorId}
                  onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select a vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Equipment Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g., Milking Machine"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g., John Deere"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g., 15000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Describe the equipment..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Equipment Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
                {uploading && (
                  <p className="text-xs text-slate-500 mt-1">Uploading...</p>
                )}
                {form.imageUrl && (
                  <div className="mt-2">
                    <img
                      src={form.imageUrl}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, imageUrl: "" })}
                      className="text-xs text-red-600 hover:text-red-700 mt-1"
                    >
                      Remove image
                    </button>
                  </div>
                )}
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
                  {saving ? "Saving..." : editingEquipment ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminEquipmentPage;
