import { apiRequest, getApiBaseUrl, getStoredAdminToken } from "./ApiClient";

export async function getAdminAuditLogsApi(params = {}) {
  const query = new URLSearchParams();

  if (params.period) query.set("period", params.period);
  if (params.action && params.action !== "ALL") query.set("action", params.action);
  if (params.entity && params.entity !== "ALL") query.set("entity", params.entity);
  if (params.actorId) query.set("actorId", params.actorId);
  if (params.orderId) query.set("orderId", params.orderId);
  if (params.q) query.set("q", params.q);
  if (params.take) query.set("take", params.take);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const data = await apiRequest(`/api/audit/admin/logs${suffix}`);

  if (!data?.success || !Array.isArray(data.logs)) {
    throw new Error(data?.message || "Cannot load audit logs.");
  }

  return data;
}

export async function downloadAdminAuditLogsCsv(params = {}) {
  const query = new URLSearchParams();

  if (params.period) query.set("period", params.period);
  if (params.action && params.action !== "ALL") query.set("action", params.action);
  if (params.entity && params.entity !== "ALL") query.set("entity", params.entity);
  if (params.actorId) query.set("actorId", params.actorId);
  if (params.orderId) query.set("orderId", params.orderId);
  if (params.q) query.set("q", params.q);
  if (params.take) query.set("take", params.take);

  const baseUrl = getApiBaseUrl();
  const token = getStoredAdminToken();
  const suffix = query.toString() ? `?${query.toString()}` : "";

  const response = await fetch(`${baseUrl}/api/audit/admin/export${suffix}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Audit export failed: ${response.status}`);
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get("content-disposition") || "";
  const match = contentDisposition.match(/filename="([^"]+)"/);
  const filename = match?.[1] || "gundam-audit-logs.csv";

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}
