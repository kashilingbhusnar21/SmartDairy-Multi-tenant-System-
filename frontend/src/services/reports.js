import api from "./api";

async function downloadBlob(path, params, filename) {
  const format = params.format || "pdf";
  const res = await api.get(path, {
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
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export function downloadDailyMilkReport(date, format) {
  return downloadBlob(
    "/reports/milk/daily",
    { date, format },
    `milk-daily-${date}.${format === "xlsx" ? "xlsx" : "pdf"}`
  );
}

export function downloadWeeklyMilkReport(from, to, format) {
  return downloadBlob(
    "/reports/milk/weekly",
    { from, to, format },
    `milk-weekly-${from}-to-${to}.${format === "xlsx" ? "xlsx" : "pdf"}`
  );
}

export function downloadMonthlyMilkReport(year, month, format) {
  return downloadBlob(
    "/reports/milk/monthly",
    { year, month, format },
    `milk-monthly-${year}-${month}.${format === "xlsx" ? "xlsx" : "pdf"}`
  );
}

export function downloadFarmerMilkReport(farmerId, from, to, format) {
  return downloadBlob(
    "/reports/milk/farmer",
    { farmerId, from, to, format },
    `milk-farmer-${farmerId}.${format === "xlsx" ? "xlsx" : "pdf"}`
  );
}
