import api from "./api";

/**
 * Service for Machine-to-Machine (M2M) 4G Cellular IoT Ingestion.
 */
export async function emitIoTTelemetry(payload, deviceKey = "EKOMILK_BOOTH_01") {
  const headers = {
    "X-Device-Key": deviceKey,
  };
  const response = await api.post("/iot/milk-intake", payload, { headers });
  return response.data;
}

export async function checkIoTHealth() {
  const response = await api.get("/iot/health");
  return response.data;
}
