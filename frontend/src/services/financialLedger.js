import api from "./api";

export function getFinancialAccount(farmerId) {
  return api.get(`/financial-ledger/account/${farmerId}`).then((res) => res.data);
}

export function getTransactions(farmerId) {
  return api.get(`/financial-ledger/transactions/${farmerId}`).then((res) => res.data);
}

export function addAdvance(payload) {
  return api.post("/financial-ledger/advance/add", payload).then((res) => res.data);
}

export function recoverAdvance(payload) {
  return api.post("/financial-ledger/advance/recover", payload).then((res) => res.data);
}

export function addLoan(payload) {
  return api.post("/financial-ledger/loan/add", payload).then((res) => res.data);
}

export function recoverLoan(payload) {
  return api.post("/financial-ledger/loan/recover", payload).then((res) => res.data);
}

export function addOther(payload) {
  return api.post("/financial-ledger/other/add", payload).then((res) => res.data);
}

export function recoverOther(payload) {
  return api.post("/financial-ledger/other/recover", payload).then((res) => res.data);
}

export function getFinancialAnalytics(from, to, page = 0, size = 20) {
  return api.get("/financial-ledger/analytics", {
    params: { from, to, page, size }
  }).then((res) => res.data);
}

export function getFinancialAnalyticsByFarmer(farmerId, from, to, page = 0, size = 20) {
  return api.get(`/financial-ledger/analytics/farmer/${farmerId}`, {
    params: { from, to, page, size }
  }).then((res) => res.data);
}

export function getFinancialAnalyticsWithFilters(from, to, pendingType, page = 0, size = 20) {
  return api.get("/financial-ledger/analytics/filter", {
    params: { from, to, pendingType, page, size }
  }).then((res) => res.data);
}
