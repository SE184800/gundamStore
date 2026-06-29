import { apiRequest, getStoredAdminToken } from "./ApiClient";

function getProductPayload(product = {}) {
  return {
    productId: product.backendProductId || product.productId || product.id || "",
    sku: product.sku || "",
    slug: product.slug || "",
  };
}

export async function registerRestockAlert(product, payload = {}) {
  const data = await apiRequest("/api/restock-alerts", {
    method: "POST",
    token: "",
    body: JSON.stringify({
      ...getProductPayload(product),
      name: payload.name || "",
      phone: payload.phone || "",
      note: payload.note || "",
    }),
  });

  if (!data?.success) {
    throw new Error(data?.message || "Unable to register restock alert.");
  }

  return data.alert;
}

export async function getRestockAlerts(status = "all") {
  const query = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  const data = await apiRequest(`/api/restock-alerts/admin${query}`, {
    token: getStoredAdminToken(),
  });

  return data.alerts || [];
}

export function getRestockAlertSummary(rows = []) {
  return {
    total: rows.length,
    pending: rows.filter((row) => row.status === "PENDING").length,
    notified: rows.filter((row) => row.status === "NOTIFIED").length,
  };
}

export async function markRestockAlertNotified(id) {
  const data = await apiRequest(`/api/restock-alerts/admin/${encodeURIComponent(id)}/notified`, {
    method: "PATCH",
    token: getStoredAdminToken(),
  });

  return data.alert;
}

export async function deleteRestockAlert(id) {
  return apiRequest(`/api/restock-alerts/admin/${encodeURIComponent(id)}`, {
    method: "DELETE",
    token: getStoredAdminToken(),
  });
}
