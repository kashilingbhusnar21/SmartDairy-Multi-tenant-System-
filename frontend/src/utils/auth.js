const TOKEN_KEY = "smart_dairy_token";
const ROLE_KEY = "smart_dairy_role";
const EMAIL_KEY = "smart_dairy_email";

/** Supports token, accessToken, or jwt (and nested data.*) from typical Spring / custom APIs */
export function extractTokenFromAuthPayload(data) {
  if (data == null || typeof data !== "object") return "";
  const nested = data.data;
  return (
    data.token ||
    data.accessToken ||
    data.jwt ||
    (nested && typeof nested === "object" && (nested.token || nested.accessToken || nested.jwt)) ||
    ""
  );
}

export function saveAuth(auth) {
  if (!auth || typeof auth !== "object") return;
  const token = extractTokenFromAuthPayload(auth);
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  if (auth.role != null && auth.role !== "") {
    localStorage.setItem(ROLE_KEY, String(auth.role));
  }
  if (auth.email) {
    localStorage.setItem(EMAIL_KEY, auth.email);
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(EMAIL_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRole() {
  return localStorage.getItem(ROLE_KEY);
}

export function getEmail() {
  return localStorage.getItem(EMAIL_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}
