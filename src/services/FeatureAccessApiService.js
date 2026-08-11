import { apiRequest, getStoredAdminToken } from "./ApiClient";

// Public storefront rules — used at app load to decide whether a "soft"
// feature (review submit, event registration, restock alert) should block
// guests. Wishlist is intentionally never part of this list: its real route
// (/api/account/wishlist) is hard-locked behind requireAuth in the backend
// and can't be toggled through this table (see backend/API_REFERENCE.md 1.15).
export async function getFeatureAccessRules() {
  const data = await apiRequest("/api/feature-access", { token: "" });
  return Array.isArray(data?.rules) ? data.rules : [];
}

export async function getAdminFeatureAccessRules() {
  const data = await apiRequest("/api/admin/feature-access", {
    token: getStoredAdminToken(),
  });
  return Array.isArray(data?.rules) ? data.rules : [];
}

export async function updateAdminFeatureAccessRule(featureCode, requiresAuth) {
  const data = await apiRequest(`/api/admin/feature-access/${encodeURIComponent(featureCode)}`, {
    method: "PATCH",
    token: getStoredAdminToken(),
    body: JSON.stringify({ requiresAuth }),
  });

  if (!data?.success || !data?.rule) {
    throw new Error(data?.message || "Unable to update feature access rule.");
  }

  return data.rule;
}
