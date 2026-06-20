import api from "./api";

export function createFeedPurchase(payload) {
  return api.post("/feed-purchases", payload).then((res) => res.data);
}

export function listFeedPurchases(params) {
  return api.get("/feed-purchases", { params }).then((res) => res.data);
}

export function getFeedSummary(from, to) {
  return api.get("/feed-purchases/summary", { params: { from, to } }).then((res) => res.data);
}

export function getFeedChart(from, to) {
  return api.get("/feed-purchases/chart", { params: { from, to } }).then((res) => res.data);
}

export async function downloadFeedExport(from, to, farmerId, format = "pdf") {
  const params = { from, to, format };
  if (farmerId) params.farmerId = farmerId;
  const res = await api.get("/feed-purchases/export", { params, responseType: "blob" });
  const mime =
    format === "xlsx"
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "application/pdf";
  const blob = new Blob([res.data], { type: mime });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `feed-purchases-${from}-to-${to}.${format === "xlsx" ? "xlsx" : "pdf"}`;
  a.click();
  window.URL.revokeObjectURL(url);
}
