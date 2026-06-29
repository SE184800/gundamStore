import { apiRequest } from "./ApiClient";

export async function getAdminDashboardKpisApi() {
  const data = await apiRequest("/dashboard/admin/kpis");

  if (!data?.success) {
    throw new Error(data?.message || "Cannot load dashboard KPIs.");
  }

  return data;
}
