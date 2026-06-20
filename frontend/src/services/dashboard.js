import api from "./api";

export function getDashboardOverview(params) {
  return api.get("/dashboard/overview", { params }).then((res) => res.data);
}
