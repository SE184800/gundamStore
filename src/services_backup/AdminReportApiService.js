import { apiRequest, getApiBaseUrl, getStoredAdminToken } from "./ApiClient";

export async function getAdminReportCenterApi(period = "30d") {
  const data = await apiRequest(`/api/reports/admin/summary?period=${encodeURIComponent(period)}`);

  if (!data?.success) {
    throw new Error(data?.message || "Cannot load report center.");
  }

  return data;
}

export async function downloadAdminReportCsv(type = "orders", period = "30d") {
  const baseUrl = getApiBaseUrl();
  const token = getStoredAdminToken();

  const response = await fetch(
    `${baseUrl}/api/reports/admin/export?type=${encodeURIComponent(type)}&period=${encodeURIComponent(period)}`,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Export failed: ${response.status}`);
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get("content-disposition") || "";
  const match = contentDisposition.match(/filename="([^"]+)"/);
  const filename = match?.[1] || `gundam-${type}-${period}.csv`;

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}
