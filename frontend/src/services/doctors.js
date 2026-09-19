import client from "./http/client";

export const getDoctors = async (query = "") => {
  const params = query ? { q: query } : {};
  const res = await client.get("/doctors", { params });
  return res.data;
};

export const getDoctorById = async (id) => {
  const res = await client.get(`/doctors/${id}`);
  return res.data;
};

export const createDoctor = async (data) => {
  const res = await client.post("/doctors", data);
  return res.data;
};

export const updateDoctor = async (id, data) => {
  const res = await client.put(`/doctors/${id}`, data);
  return res.data;
};

export const deleteDoctor = async (id) => {
  await client.delete(`/doctors/${id}`);
};

export const deactivateDoctor = async (id) => {
  const res = await client.patch(`/doctors/${id}/deactivate`);
  return res.data;
};

export const activateDoctor = async (id) => {
  const res = await client.patch(`/doctors/${id}/activate`);
  return res.data;
};

export const getInactiveDoctors = async (query = "") => {
  const params = query ? { q: query } : {};
  const res = await client.get("/doctors/inactive", { params });
  return res.data;
};

export const createDoctorRating = async (doctorId, data) => {
  const res = await client.post(`/doctor-ratings/doctor/${doctorId}`, data);
  return res.data;
};

export const updateDoctorRating = async (ratingId, data) => {
  const res = await client.put(`/doctor-ratings/${ratingId}`, data);
  return res.data;
};

export const deleteDoctorRating = async (ratingId) => {
  await client.delete(`/doctor-ratings/${ratingId}`);
};

export const getDoctorRatings = async (doctorId) => {
  const res = await client.get(`/doctor-ratings/doctor/${doctorId}`);
  return res.data;
};

export const getMyDoctorRatings = async () => {
  const res = await client.get("/doctor-ratings/my-ratings");
  return res.data;
};

export const getMyRatingForDoctor = async (doctorId) => {
  const res = await client.get(`/doctor-ratings/my-rating/doctor/${doctorId}`);
  return res.data;
};
