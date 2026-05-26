import { apiRequest } from "./ApiClient";

export async function getAdminPromotionsApi() {
  const data = await apiRequest("/api/promotions/admin");

  if (!data?.success || !Array.isArray(data.promotions)) {
    throw new Error(data?.message || "Cannot load promotions.");
  }

  return data.promotions;
}

export async function createAdminPromotionApi(payload = {}) {
  const data = await apiRequest("/api/promotions/admin", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!data?.success || !data.promotion) {
    throw new Error(data?.message || "Create promotion failed.");
  }

  return data.promotion;
}

export async function updateAdminPromotionApi(id, payload = {}) {
  const data = await apiRequest(`/api/promotions/admin/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!data?.success || !data.promotion) {
    throw new Error(data?.message || "Update promotion failed.");
  }

  return data.promotion;
}

export async function deactivateAdminPromotionApi(id) {
  const data = await apiRequest(`/api/promotions/admin/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (!data?.success || !data.promotion) {
    throw new Error(data?.message || "Deactivate promotion failed.");
  }

  return data.promotion;
}
