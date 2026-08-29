const TOKEN_KEY = "token";
const ROLE_KEY = "role";
const EMAIL_KEY = "email";
const FARMER_ID_KEY = "farmerId";
const FARMER_NAME_KEY = "farmerName";

/** Supports token, accessToken, or jwt (and nested data.*) from typical Spring / custom APIs */
export function extractTokenFromAuthPayload(data) {
  console.log("extractTokenFromAuthPayload - Input data:", data);
  console.log("TOKEN SOURCE CHECK:", {
    token: data?.token,
    accessToken: data?.accessToken,
    jwt: data?.jwt,
    nested: data?.data
  });
  if (data == null || typeof data !== "object") {
    console.log("extractTokenFromAuthPayload - Invalid data");
    return "";
  }
  const nested = data.data;
  const token = data.token || data.accessToken || data.jwt || (nested && typeof nested === "object" && (nested.token || nested.accessToken || nested.jwt)) || "";
  console.log("extractTokenFromAuthPayload - Extracted token:", token);
  return token;
}

export function saveAuth(auth, role = "ADMIN") {
  console.log("DATA RECEIVED IN saveAuth:", auth);
  console.log("saveAuth - Role:", role);
  if (!auth || typeof auth !== "object") {
    console.log("saveAuth - Invalid auth object");
    return;
  }

  const token =
    auth?.token ||
    auth?.accessToken ||
    auth?.jwt ||
    auth?.data?.token ||
    auth?.data?.accessToken ||
    auth?.data?.jwt;

  console.log("saveAuth - Token to save:", token);
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    console.log("saveAuth - Token saved to localStorage with key:", TOKEN_KEY);
  } else {
    console.log("saveAuth - No token to save!");
  }
  localStorage.setItem(ROLE_KEY, role);
  console.log("saveAuth - Role saved to localStorage with key:", ROLE_KEY);
  
  if (role === "FARMER") {
    if (auth.farmerId) {
      localStorage.setItem(FARMER_ID_KEY, String(auth.farmerId));
    }
    if (auth.farmerName) {
      localStorage.setItem(FARMER_NAME_KEY, auth.farmerName);
    }
  } else {
    if (auth.email) {
      localStorage.setItem(EMAIL_KEY, auth.email);
    }
  }
  
  console.log("LOCALSTORAGE TOKEN AFTER SAVE:", localStorage.getItem(TOKEN_KEY));
  console.log("saveAuth - Final localStorage state:", {
    token: localStorage.getItem(TOKEN_KEY),
    role: localStorage.getItem(ROLE_KEY)
  });
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(FARMER_ID_KEY);
  localStorage.removeItem(FARMER_NAME_KEY);
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

export function getFarmerId() {
  return localStorage.getItem(FARMER_ID_KEY);
}

export function getFarmerName() {
  return localStorage.getItem(FARMER_NAME_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}
