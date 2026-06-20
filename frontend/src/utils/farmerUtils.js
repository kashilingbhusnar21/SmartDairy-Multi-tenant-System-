export function formatFarmerLabel(farmer) {
  const name = farmer.fullName || farmer.name || "Farmer";
  const village = farmer.village || "";
  return `#${farmer.id} - ${name}${village ? ` - ${village}` : ""}`;
}

export function filterFarmers(farmers, query) {
  const trimmed = (query || "").trim().toLowerCase();
  if (!trimmed) {
    return farmers;
  }

  return farmers.filter((farmer) => {
    const id = String(farmer.id);
    const name = (farmer.fullName || farmer.name || "").toLowerCase();
    const village = (farmer.village || "").toLowerCase();
    return id.includes(trimmed) || name.includes(trimmed) || village.includes(trimmed);
  });
}
