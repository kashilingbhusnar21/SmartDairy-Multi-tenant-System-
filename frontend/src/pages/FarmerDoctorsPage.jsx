import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import ErrorState from "../components/ui/ErrorState";
import PageLoader from "../components/ui/PageLoader";
import { getDoctors, createDoctorRating, updateDoctorRating, getMyRatingForDoctor } from "../services/doctors";
import { getErrorMessage } from "../utils/errorMessage";

function FarmerDoctorsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [existingRating, setExistingRating] = useState(null);
  const [saving, setSaving] = useState(false);
  const [ratingForm, setRatingForm] = useState({
    rating: 5,
    comment: "",
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const loadDoctors = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getDoctors(debouncedSearch);
      setDoctors(data.filter((d) => d.active));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load doctors"));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  const handleOpenRatingModal = async (doctor) => {
    setSelectedDoctor(doctor);
    try {
      const rating = await getMyRatingForDoctor(doctor.id);
      if (rating) {
        setExistingRating(rating);
        setRatingForm({
          rating: rating.rating,
          comment: rating.comment || "",
        });
      } else {
        setExistingRating(null);
        setRatingForm({
          rating: 5,
          comment: "",
        });
      }
      setShowRatingModal(true);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load rating"));
    }
  };

  const handleCloseRatingModal = () => {
    setShowRatingModal(false);
    setSelectedDoctor(null);
    setExistingRating(null);
    setRatingForm({
      rating: 5,
      comment: "",
    });
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) return;

    setSaving(true);
    try {
      if (existingRating) {
        await updateDoctorRating(existingRating.id, ratingForm);
        toast.success("Rating updated successfully");
      } else {
        await createDoctorRating(selectedDoctor.id, ratingForm);
        toast.success("Rating submitted successfully");
      }
      handleCloseRatingModal();
      loadDoctors();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to submit rating"));
    } finally {
      setSaving(false);
    }
  };

  const handleCall = (mobileNumber) => {
    window.location.href = `tel:${mobileNumber}`;
  };

  const renderStars = (rating, interactive = false, onChange = null) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : undefined}
            onClick={() => interactive && onChange && onChange(star)}
            disabled={!interactive}
            className={`text-2xl ${interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""} ${
              star <= rating ? "text-amber-500" : "text-slate-300"
            }`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return <PageLoader label="Loading doctors…" />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Veterinary Doctors</h2>
        <p className="text-slate-600 text-sm mt-1">
          Contact veterinary doctors for your livestock needs and rate their services
        </p>
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
            <input
              type="search"
              placeholder="Search doctors by name or specialization..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {doctors.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <p className="text-slate-500">No doctors available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 text-lg">{doctor.fullName}</h3>
                      {doctor.specialization && (
                        <p className="text-sm text-emerald-600 font-medium mt-1">{doctor.specialization}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
                      <span className="text-amber-500 text-sm">★</span>
                      <span className="text-sm font-semibold text-slate-700">
                        {doctor.averageRating.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {doctor.clinicAddress && (
                    <p className="text-sm text-slate-600 mb-3 flex items-start gap-2">
                      <svg
                        className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {doctor.clinicAddress}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mb-4">
                    <svg
                      className="w-4 h-4 text-slate-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <a
                      href={`tel:${doctor.mobileNumber}`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleCall(doctor.mobileNumber);
                      }}
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      {doctor.mobileNumber}
                    </a>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-500">{doctor.totalRatings} ratings</span>
                    <button
                      onClick={() => handleOpenRatingModal(doctor)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
                    >
                      Rate Doctor
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showRatingModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              {existingRating ? "Update Rating" : "Rate Doctor"}
            </h3>
            <p className="text-sm text-slate-600 mb-4">{selectedDoctor.fullName}</p>

            <form onSubmit={handleSubmitRating} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Your Rating
                </label>
                <div className="flex justify-center py-2">
                  {renderStars(ratingForm.rating, true, (rating) =>
                    setRatingForm({ ...ratingForm, rating })
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Comment (optional)
                </label>
                <textarea
                  value={ratingForm.comment}
                  onChange={(e) => setRatingForm({ ...ratingForm, comment: e.target.value })}
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Share your experience..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseRatingModal}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving ? "Submitting..." : existingRating ? "Update" : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FarmerDoctorsPage;
