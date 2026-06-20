import api from "./api";

export function fetchAdvancedMilkReport(from, to, farmerId) {
  const params = { from, to };
  if (farmerId) params.farmerId = farmerId;
  return api.get("/reports/milk/advanced/summary", { params }).then((res) => res.data);
}

export async function downloadAdvancedMilkReport(from, to, farmerId, format) {
  const params = { from, to, format };
  if (farmerId) params.farmerId = farmerId;
  const res = await api.get("/reports/milk/advanced/export", {
    params,
    responseType: "blob",
  });
  const mime =
    format === "xlsx"
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "application/pdf";
  const blob = new Blob([res.data], { type: mime });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `milk-advanced-${from}-to-${to}.${format === "xlsx" ? "xlsx" : "pdf"}`;
  a.click();
  window.URL.revokeObjectURL(url);
}
