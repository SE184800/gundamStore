import { apiRequest } from "./ApiClient";

export async function getActiveFlashSalesApi() {
  const data = await apiRequest("/api/flash-sales/active");

  if (!data?.success || !Array.isArray(data.campaigns)) {
    throw new Error(data?.message || "Cannot load flash sales.");
  }

  return data.campaigns;
}
