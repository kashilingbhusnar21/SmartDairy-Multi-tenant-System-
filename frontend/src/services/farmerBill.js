import api from "./api";

export function previewFarmerBill(params) {
  return api.get("/reports/milk/farmer-bill/preview", { params }).then((res) => res.data);
}

export async function exportFarmerBill(params, format = "pdf") {
  const res = await api.get("/reports/milk/farmer-bill/export", {
    params: { ...params, format },
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
  a.download = `farmer-bill-${params.farmerId}-${params.from}-to-${params.to}.${format === "xlsx" ? "xlsx" : "pdf"}`;
  a.click();
  window.URL.revokeObjectURL(url);
}
