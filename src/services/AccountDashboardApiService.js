import { apiRequest, getStoredAccountToken } from "./ApiClient";
import { mapBackendOrderForStorefront } from "./StorefrontOrderLookupApiService";

export async function getMyAccountDashboardApi() {
  const data = await apiRequest("/api/account/dashboard", {
    token: getStoredAccountToken(),
  });

  if (!data?.success || !data.dashboard) {
    throw new Error(data?.message || "Cannot load account dashboard.");
  }

  return {
    ...data.dashboard,
    recentOrders: (data.dashboard.recentOrders || []).map(mapBackendOrderForStorefront),
    activeOrders: (data.dashboard.activeOrders || []).map(mapBackendOrderForStorefront),
  };
}

