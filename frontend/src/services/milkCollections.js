import api from "./api";

export function listDailyCollections(date) {
  return api
    .get("/milk-collections", { params: { date } })
    .then((res) => res.data);
}

export function getMilkCollection(id) {
  return api.get(`/milk-collections/${id}`).then((res) => res.data);
}

export function listFarmerCollections(farmerId) {
  return api.get(`/milk-collections/farmer/${farmerId}`).then((res) => res.data);
}

export function createMilkCollection(payload) {
  return api.post("/milk-collections", payload).then((res) => res.data);
}

export function updateMilkCollection(id, payload) {
  return api.put(`/milk-collections/${id}`, payload).then((res) => res.data);
}

export function deleteMilkCollection(id) {
  return api.delete(`/milk-collections/${id}`);
}

export function getDailyStats(date) {
  return api
    .get("/milk-collections/stats/daily", { params: { date } })
    .then((res) => res.data);
}

