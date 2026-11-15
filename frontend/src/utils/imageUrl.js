/**
 * Helper to construct an absolute URL for media / uploads.
 * If the path is relative (e.g. "/uploads/equipment/abc.png"),
 * it prepends the backend host resolved from VITE_API_BASE_URL.
 */
export const getImageUrl = (url) => {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
  // Remove trailing /api or /api/
  const serverOrigin = apiBase.replace(/\/api\/?$/, "");
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${serverOrigin}${cleanPath}`;
};
