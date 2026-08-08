import { apiRequest, getStoredAccountToken } from "./ApiClient";
import { mapBackendOrderForStorefront } from "./StorefrontOrderLookupApiService";

function looksLikeBackendId(value = "") {
  return /^c[a-z0-9]{10,}$/i.test(String(value || ""));
}

function normalizeProductId(item = {}) {
  const id = item.backendProductId || item.productId || "";
  return looksLikeBackendId(id) ? id : "";
}

function normalizePaymentMethod(method = "COD") {
  const value = String(method || "COD").trim().toUpperCase();

  if (value === "BANK") return "BANK_TRANSFER";
  if (value === "MOMO") return "WALLET";

  return ["COD", "BANK_TRANSFER", "CARD", "WALLET"].includes(value) ? value : "COD";
}

export function buildCreateOrderPayload({
  customer,
  draft,
  pricing,
}) {
  return {
    // Server always recomputes deposit/remaining per-item from each
    // product's real depositType/depositValue and ignores any of that math
    // sent from the client — only preorder.eta is read (backend/API_REFERENCE.md
    // §1.3 POST /api/orders/). Sending fake numbers here would be dead weight.
    orderType: draft.orderType === "preorder" ? "preorder" : "normal",
    preorder: draft.orderType === "preorder"
      ? { eta: draft.preorder?.eta || "" }
      : null,
    customerName: customer.name,
    customerPhone: customer.phone,
    customerEmail: customer.email || "",
    customerAddress: [customer.address, customer.ward, customer.district, customer.province].filter(Boolean).join(", "),
    shippingFee: Number(pricing.shippingFee) || 0,
    discount: Number(pricing.discount || 0) + Number(pricing.shippingDiscount || 0),
    paymentMethod: normalizePaymentMethod(customer.paymentMethod),
    paymentReference: customer.paymentReference || "",
    note: customer.note || "",
    preferredDeliveryTime: customer.preferredDeliveryTime || "",
    items: (draft.items || []).map((item) => ({
      productId: normalizeProductId(item),
      sku: item.sku || "",
      slug: item.slug || "",
      variantId: item.variantId || item.backendVariantId || "",
      variantSku: item.variantSku || "",
      quantity: Number(item.quantity) || 1,
      expectedPrice: Number(item.price) || 0,
      ...(item.flashSaleItemId ? { flashSaleItemId: item.flashSaleItemId } : {}),
    })),
  };
}

export async function createStorefrontOrderApi(payload) {
  const data = await apiRequest("/api/orders", {
    method: "POST",
    body: JSON.stringify(payload),
    token: getStoredAccountToken(),
  });

  if (!data?.success || !data.order) {
    const error = new Error(data?.message || "Backend did not return created order.");
    error.data = data;
    throw error;
  }

  return data.order;
}


export async function getMyStorefrontOrdersApi() {
  const data = await apiRequest("/api/orders/my", {
    token: getStoredAccountToken(),
  });

  return Array.isArray(data?.orders)
    ? data.orders.map(mapBackendOrderForStorefront)
    : [];
}

export async function getMyStorefrontOrderByIdApi(id = "") {
  const cleanId = String(id || "").trim();

  if (!cleanId) {
    throw new Error("Order id is required.");
  }

  const data = await apiRequest(`/api/orders/my/${encodeURIComponent(cleanId)}`, {
    token: getStoredAccountToken(),
  });

  if (!data?.success || !data.order) {
    throw new Error(data?.message || "Order not found.");
  }

  return mapBackendOrderForStorefront(data.order);
}


export async function claimMyStorefrontOrderPaidApi(id = "") {
  const cleanId = String(id || "").trim();

  if (!cleanId) {
    throw new Error("Order id is required.");
  }

  const data = await apiRequest(`/api/orders/my/${encodeURIComponent(cleanId)}/claim-paid`, {
    method: "PATCH",
    token: getStoredAccountToken(),
  });

  if (!data?.success || !data.order) {
    throw new Error(data?.message || "Cannot mark order as claimed paid.");
  }

  return mapBackendOrderForStorefront(data.order);
}

export async function cancelMyStorefrontOrderApi(id = "", payload = {}) {
  const cleanId = String(id || "").trim();

  if (!cleanId) {
    throw new Error("Order id is required.");
  }

  const data = await apiRequest(`/api/orders/my/${encodeURIComponent(cleanId)}/cancel`, {
    method: "PATCH",
    token: getStoredAccountToken(),
    body: JSON.stringify({
      reason: payload.reason || "",
      note: payload.note || "",
    }),
  });

  if (!data?.success || !data.order) {
    throw new Error(data?.message || "Cannot cancel order.");
  }

  return mapBackendOrderForStorefront(data.order);
}

