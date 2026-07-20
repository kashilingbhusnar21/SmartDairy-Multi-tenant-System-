import api from "./api";

export function listFarmers(query) {
  const params = query ? { q: query } : undefined;
  return api.get("/farmers", { params }).then((res) => res.data);
}

export function listInactiveFarmers(query) {
  const params = query ? { q: query } : undefined;
  return api.get("/farmers/inactive", { params }).then((res) => res.data);
}

export function getFarmer(id) {
  return api.get(`/farmers/${id}`).then((res) => res.data);
}

export function lookupFarmerById(id) {
  return api.get(`/farmers/lookup/by-id/${id}`).then((res) => res.data);
}

export function createFarmer(payload) {
  return api.post("/farmers", payload).then((res) => res.data);
}

export function updateFarmer(id, payload) {
  return api.put(`/farmers/${id}`, payload).then((res) => res.data);
}

export function deleteFarmer(id) {
  return api.delete(`/farmers/${id}`);
}

export function deactivateFarmer(id) {
  return api.patch(`/farmers/${id}/deactivate`).then((res) => res.data);
}

export function activateFarmer(id) {
  return api.patch(`/farmers/${id}/activate`).then((res) => res.data);
}
