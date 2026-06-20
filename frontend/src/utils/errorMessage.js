export function getErrorMessage(error, fallback = "Something went wrong") {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;
  if (typeof data === "string") return data;
  if (data.error) return data.error;
  if (typeof data === "object") {
    const first = Object.values(data).find((v) => typeof v === "string");
    if (first) return first;
  }
  return fallback;
}
