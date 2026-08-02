import { apiRequest } from "./ApiClient";

export async function getStorefrontShippingMethodsApi() {
  const data = await apiRequest("/api/shipping-methods", { method: "GET", token: "" });

  if (!data?.success || !Array.isArray(data.shippingMethods) || !data.shippingMethods.length) {
    throw new Error(data?.message || "Cannot load shipping methods.");
  }

  return data.shippingMethods;
}
