import { apiRequest } from "./ApiClient";

export async function getStorefrontActivePromotionsApi() {
  const data = await apiRequest("/api/promotions/public/active");

  if (!data?.success || !Array.isArray(data.promotions)) {
    throw new Error(data?.message || "Cannot load promotions.");
  }

  return data.promotions;
}
