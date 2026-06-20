import api from "./api";

export function generatePaymentFromCollection(milkCollectionId) {
  return api
    .post(`/payments/from-collection/${milkCollectionId}`)
    .then((res) => res.data);
}

export function listPayments(status) {
  const params = status ? { status } : undefined;
  return api.get("/payments", { params }).then((res) => res.data);
}

export function listPendingPayments() {
  return api.get("/payments/pending").then((res) => res.data);
}

export function listFarmerPayments(farmerId) {
  return api.get(`/payments/farmer/${farmerId}`).then((res) => res.data);
}

export function markPaymentPaid(id, payload) {
  return api.put(`/payments/${id}/mark-paid`, payload).then((res) => res.data);
}

export function getPaymentDashboardStats() {
  return api.get("/payments/stats/dashboard").then((res) => res.data);
}

export function getWeeklySummary(from, to) {
  return api
    .get("/payments/summary/weekly", { params: { from, to } })
    .then((res) => res.data);
}

export function getMonthlySummary(year, month) {
  return api
    .get("/payments/summary/monthly", { params: { year, month } })
    .then((res) => res.data);
}

export async function downloadPaymentReceipt(id) {
  const res = await api.get(`/payments/${id}/receipt`, { responseType: "blob" });
  const blob = new Blob([res.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `payment-receipt-${id}.pdf`;
  a.click();
  window.URL.revokeObjectURL(url);
}
