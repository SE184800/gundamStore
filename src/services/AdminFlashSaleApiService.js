import { apiRequest } from "./ApiClient";

export async function getAdminFlashSalesApi() {
  const data = await apiRequest("/api/admin/flash-sales");

  if (!data?.success || !Array.isArray(data.campaigns)) {
    throw new Error(data?.message || "Cannot load flash sale campaigns.");
  }

  return data.campaigns;
}

export async function createAdminFlashSaleApi(payload = {}) {
  const data = await apiRequest("/api/admin/flash-sales", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!data?.success || !data.campaign) {
    throw new Error(data?.message || "Create flash sale campaign failed.");
  }

  return data.campaign;
}

export async function updateAdminFlashSaleApi(id, payload = {}) {
  const data = await apiRequest(`/api/admin/flash-sales/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!data?.success || !data.campaign) {
    throw new Error(data?.message || "Update flash sale campaign failed.");
  }

  return data.campaign;
}

export async function deleteAdminFlashSaleApi(id) {
  const data = await apiRequest(`/api/admin/flash-sales/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (!data?.success) {
    throw new Error(data?.message || "Delete flash sale campaign failed.");
  }

  return true;
}

export async function setAdminFlashSaleWindowsApi(id, windows = []) {
  const data = await apiRequest(`/api/admin/flash-sales/${encodeURIComponent(id)}/windows`, {
    method: "PUT",
    body: JSON.stringify({ windows }),
  });

  if (!data?.success) {
    throw new Error(data?.message || "Save flash sale windows failed.");
  }

  return data.campaign || data;
}

export async function setAdminFlashSaleItemsApi(id, items = []) {
  const data = await apiRequest(`/api/admin/flash-sales/${encodeURIComponent(id)}/items`, {
    method: "PUT",
    body: JSON.stringify({ items }),
  });

  if (!data?.success) {
    throw new Error(data?.message || "Save flash sale items failed.");
  }

  return data.campaign || data;
}

export async function bulkGenerateAdminFlashSaleItemsApi(id, payload = {}) {
  const data = await apiRequest(`/api/admin/flash-sales/${encodeURIComponent(id)}/items/bulk-generate`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!data?.success) {
    const error = new Error(data?.message || "Bulk-generate flash sale items failed.");
    error.data = data;
    throw error;
  }

  return data;
}

export async function patchAdminFlashSaleItemApi(id, itemId, payload = {}) {
  const data = await apiRequest(
    `/api/admin/flash-sales/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );

  if (!data?.success || !data.item) {
    throw new Error(data?.message || "Update flash sale item failed.");
  }

  return data.item;
}

export async function deleteAdminFlashSaleItemApi(id, itemId) {
  const data = await apiRequest(
    `/api/admin/flash-sales/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}`,
    { method: "DELETE" }
  );

  if (!data?.success) {
    throw new Error(data?.message || "Delete flash sale item failed.");
  }

  return true;
}
