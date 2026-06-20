import api from "./http/client";

export function login(credentials) {
  return api.post("/auth/login", credentials);
}

export function register(payload) {
  return api.post("/auth/register", payload);
}

export function forgotPassword(email) {
  return api.post("/auth/forgot-password", { email }).then((res) => res.data);
}

export function verifyResetToken(token) {
  return api.post("/auth/verify-reset-token", { token }).then((res) => res.data);
}

export function resetPassword(token, newPassword) {
  return api.post("/auth/reset-password", { token, newPassword });
}
