import { apiRequest, clearPublicApiCache } from "./ApiClient";

export async function listAdminShippingMethodsApi() {
  const data = await apiRequest("/api/admin/shipping-methods");
  return Array.isArray(data?.shippingMethods) ? data.shippingMethods : [];
}

export async function createAdminShippingMethodApi(payload) {
  const data = await apiRequest("/api/admin/shipping-methods", {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });

  if (!data?.success || !data?.shippingMethod) {
    throw new Error(data?.message || "Backend did not create the shipping method.");
  }

  clearPublicApiCache(["/api/shipping-methods"]);
  return data.shippingMethod;
}

export async function updateAdminShippingMethodApi(id, payload) {
  const data = await apiRequest(`/api/admin/shipping-methods/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload || {}),
  });

  if (!data?.success || !data?.shippingMethod) {
    throw new Error(data?.message || "Backend did not update the shipping method.");
  }

  clearPublicApiCache(["/api/shipping-methods"]);
  return data.shippingMethod;
}

export async function deleteAdminShippingMethodApi(id) {
  const data = await apiRequest(`/api/admin/shipping-methods/${id}`, { method: "DELETE" });
  clearPublicApiCache(["/api/shipping-methods"]);
  return data;
}
