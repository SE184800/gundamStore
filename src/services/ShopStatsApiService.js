import { apiRequest } from "./ApiClient";

export async function getShopStatsApi() {
  const data = await apiRequest("/api/shop/stats");

  if (!data?.success || !data.stats) {
    throw new Error(data?.message || "Cannot load shop stats.");
  }

  return data.stats;
}
