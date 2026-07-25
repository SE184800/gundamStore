import { apiRequest } from "./ApiClient";
import { SHIPPING_METHODS } from "../constants/orderConfig";

export async function getStorefrontShippingMethodsApi() {
  try {
    const data = await apiRequest("/api/shipping-methods", { method: "GET", token: "" });
    if (data?.success && Array.isArray(data.shippingMethods) && data.shippingMethods.length) {
      return data.shippingMethods;
    }
  } catch {
    // fall through to local defaults
  }

  return SHIPPING_METHODS;
}
