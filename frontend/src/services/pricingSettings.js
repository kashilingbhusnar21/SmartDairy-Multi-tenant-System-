import api from "./api";

export function getPricingSettings() {
  return api.get("/pricing-settings").then((res) => res.data);
}

export function updatePricingSettings(payload) {
  return api.put("/pricing-settings", payload).then((res) => res.data);
}

export function calculateMilkRate({ fatPercentage, snfPercentage, quantityLiters }) {
  return api
    .get("/pricing-settings/calculate", {
      params: { fatPercentage, snfPercentage, quantityLiters },
    })
    .then((res) => res.data);
}
