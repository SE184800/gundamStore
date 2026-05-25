import { apiRequest } from "./ApiClient";

export async function getPricingProductsApi() {
  const data = await apiRequest("/api/pricing/products");

  if (!data?.success || !Array.isArray(data.products)) {
    throw new Error(data?.message || "Cannot load pricing products.");
  }

  return data.products;
}

export async function getSellingPricesApi(productId = "") {
  const query = productId ? `?productId=${encodeURIComponent(productId)}` : "";
  const data = await apiRequest(`/api/pricing/prices${query}`);

  if (!data?.success || !Array.isArray(data.prices)) {
    throw new Error(data?.message || "Cannot load selling prices.");
  }

  return data.prices;
}

export async function createSellingPriceApi(productId, payload = {}) {
  const data = await apiRequest(`/api/pricing/products/${encodeURIComponent(productId)}/prices`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!data?.success || !data.price) {
    throw new Error(data?.message || "Create selling price failed.");
  }

  return data;
}

export async function updateSellingPriceApi(priceId, payload = {}) {
  const data = await apiRequest(`/api/pricing/prices/${encodeURIComponent(priceId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!data?.success || !data.price) {
    throw new Error(data?.message || "Update selling price failed.");
  }

  return data;
}

export async function deactivateSellingPriceApi(priceId) {
  const data = await apiRequest(`/api/pricing/prices/${encodeURIComponent(priceId)}`, {
    method: "DELETE",
  });

  if (!data?.success || !data.price) {
    throw new Error(data?.message || "Deactivate selling price failed.");
  }

  return data.price;
}
