import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import ErrorState from "../components/ui/ErrorState";
import PageLoader from "../components/ui/PageLoader";
import {
  getDoctors,
  getInactiveDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  deactivateDoctor,
  activateDoctor,
} from "../services/doctors";
import { getErrorMessage } from "../utils/errorMessage";

function AdminDoctorsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [inactiveDoctors, setInactiveDoctors] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    mobileNumber: "",
    specialization: "Veterinary",
    clinicAddress: "",
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const loadDoctors = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = showInactive
        ? await getInactiveDoctors(debouncedSearch)
        : await getDoctors(debouncedSearch);
      if (showInactive) {
        setInactiveDoctors(data);
      } else {
        setDoctors(data);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load doctors"));
    } finally {
      setLoading(false);
    }
  }, [showInactive, debouncedSearch]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  const handleOpenModal = (doctor = null) => {
    if (doctor) {
      setEditingDoctor(doctor);
      setForm({
        fullName: doctor.fullName,
        mobileNumber: doctor.mobileNumber,
        specialization: doctor.specialization || "",
        clinicAddress: doctor.clinicAddress || "",
      });
    } else {
      setEditingDoctor(null);
      setForm({
        fullName: "",
        mobileNumber: "",
        specialization: "",
        clinicAddress: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDoctor(null);
    setForm({
      fullName: "",
      mobileNumber: "",
      specialization: "",
      clinicAddress: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingDoctor) {
        await updateDoctor(editingDoctor.id, form);
        toast.success("Doctor updated successfully");
      } else {
        await createDoctor(form);
        toast.success("Doctor added successfully");
      }
      handleCloseModal();
      loadDoctors();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save doctor"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this doctor?")) return;
    try {
      await deleteDoctor(id);
      toast.success("Doctor deleted successfully");
      loadDoctors();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete doctor"));
    }
  };

  const handleToggleActive = async (doctor) => {
    try {
      if (doctor.active) {
        await deactivateDoctor(doctor.id);
        toast.success("Doctor deactivated");
      } else {
        await activateDoctor(doctor.id);
        toast.success("Doctor activated");
      }
      loadDoctors();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update doctor status"));
    }
  };

  const displayDoctors = showInactive ? inactiveDoctors : doctors;

  if (loading) {
    return <PageLoader label="Loading doctors…" />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Doctors Management</h2>
          <p className="text-slate-600 text-sm mt-1">
            Add and manage veterinary doctors for your dairy farmers
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
        >
          Add Doctor
        </button>
      </div>

      <ErrorState
        message={error}
        onRetry={() => {
          setLoading(true);
          setError("");
          loadDoctors();
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
                  Active ({doctors.length})
                </button>
                <button
                  onClick={() => setShowInactive(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    showInactive
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Inactive ({inactiveDoctors.length})
                </button>
              </div>
              <input
                type="search"
                placeholder="Search doctors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full sm:w-64"
              />
            </div>
          </div>

          {displayDoctors.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <p className="text-slate-500">No doctors found</p>
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
                        Mobile
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">
                        Specialization
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">
                        Rating
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
                    {displayDoctors.map((doctor) => (
                      <tr key={doctor.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{doctor.fullName}</div>
                          {doctor.clinicAddress && (
                            <div className="text-xs text-slate-500 mt-1">{doctor.clinicAddress}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{doctor.mobileNumber}</td>
                        <td className="px-4 py-3 text-slate-700">{doctor.specialization || "-"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <span className="text-amber-500">★</span>
                            <span className="text-sm font-medium text-slate-700">
                              {doctor.averageRating.toFixed(1)}
                            </span>
                            <span className="text-xs text-slate-500">({doctor.totalRatings})</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              doctor.active
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {doctor.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal(doctor)}
                              className="px-3 py-1 rounded text-xs font-medium text-slate-700 hover:bg-slate-100"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleActive(doctor)}
                              className="px-3 py-1 rounded text-xs font-medium text-slate-700 hover:bg-slate-100"
                            >
                              {doctor.active ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              onClick={() => handleDelete(doctor.id)}
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
              {editingDoctor ? "Edit Doctor" : "Add New Doctor"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  minLength={10}
                  maxLength={15}
                  value={form.mobileNumber}
                  onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Specialization *
                </label>
                <select
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  required
                >
                  <option value="Veterinary">Veterinary</option>
                  <option value="Livestock">Livestock</option>
                  <option value="Equine">Equine</option>
                  <option value="Bovine">Bovine</option>
                  <option value="Poultry">Poultry</option>
                  <option value="Small Animal">Small Animal</option>
                  <option value="Large Animal">Large Animal</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">Animal health specializations only</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Clinic Address
                </label>
                <textarea
                  value={form.clinicAddress}
                  onChange={(e) => setForm({ ...form, clinicAddress: e.target.value })}
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
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
                  {saving ? "Saving..." : editingDoctor ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDoctorsPage;
