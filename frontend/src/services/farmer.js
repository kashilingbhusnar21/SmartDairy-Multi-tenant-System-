import api from "./api";

export function getFarmerProfile() {
  return api.get("/farmer/profile").then((res) => res.data);
}

export function getFarmerMilkCollections() {
  return api.get("/farmer/milk-collections").then((res) => res.data);
}

export function getFarmerPayments() {
  return api.get("/farmer/payments").then((res) => res.data);
}

export function getFarmerFeedPurchases() {
  return api.get("/farmer/feed-purchases").then((res) => res.data);
}
