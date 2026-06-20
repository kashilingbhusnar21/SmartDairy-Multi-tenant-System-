import api from "./api";

export function getMyDairyProfile() {
  return api.get("/dairy-profile/me").then((res) => res.data);
}

export function updateMyDairyProfile(payload) {
  return api.put("/dairy-profile/me", payload).then((res) => res.data);
}
