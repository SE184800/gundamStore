import { apiRequest } from "./ApiClient";

export async function getInventoryDashboardApi() {
  const data = await apiRequest("/api/inventory/dashboard");

  if (!data?.success) {
    throw new Error(data?.message || "Cannot load inventory dashboard.");
  }

  return {
    summary: data.summary || {},
    products: Array.isArray(data.products) ? data.products : [],
  };
}

export async function getPurchaseReceiptsApi() {
  const data = await apiRequest("/api/inventory/receipts");

  if (!data?.success || !Array.isArray(data.receipts)) {
    throw new Error(data?.message || "Cannot load purchase receipts.");
  }

  return data.receipts;
}

export async function createPurchaseReceiptApi(payload = {}) {
  const data = await apiRequest("/api/inventory/receipts", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!data?.success || !data.receipt) {
    throw new Error(data?.message || "Create purchase receipt failed.");
  }

  return data.receipt;
}

export async function getInventoryTransactionsApi(productId = "") {
  const query = productId ? `?productId=${encodeURIComponent(productId)}` : "";
  const data = await apiRequest(`/api/inventory/transactions${query}`);

  if (!data?.success || !Array.isArray(data.transactions)) {
    throw new Error(data?.message || "Cannot load inventory transactions.");
  }

  return data.transactions;
}

export async function getStockAdjustmentsApi() {
  const data = await apiRequest("/api/inventory/adjustments");

  if (!data?.success || !Array.isArray(data.adjustments)) {
    throw new Error(data?.message || "Cannot load stock adjustments.");
  }

  return data.adjustments;
}

export async function createStockAdjustmentApi(payload = {}) {
  const data = await apiRequest("/api/inventory/adjustments", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!data?.success || !data.adjustment) {
    throw new Error(data?.message || "Create stock adjustment failed.");
  }

  return data;
}

export async function getStockCountsApi() {
  const data = await apiRequest("/api/inventory/stock-counts");

  if (!data?.success || !Array.isArray(data.counts)) {
    throw new Error(data?.message || "Cannot load stock counts.");
  }

  return data.counts;
}

export async function createStockCountApi(payload = {}) {
  const data = await apiRequest("/api/inventory/stock-counts", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!data?.success || !data.count) {
    throw new Error(data?.message || "Create stock count failed.");
  }

  return data.count;
}
