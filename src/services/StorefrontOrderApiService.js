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
    orderType: draft.orderType === "preorder" ? "preorder" : "normal",
    preorder: draft.orderType === "preorder"
      ? {
          eta: draft.preorder?.eta || "",
          depositRate: Number(draft.preorder?.depositRate || 0.3),
          fullAmount: Number(draft.preorder?.fullAmount || pricing.subtotal || 0),
          depositAmount: Number(draft.preorder?.depositAmount || pricing.total || 0),
          remainingAmount: Number(draft.preorder?.remainingAmount || 0),
        }
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
    items: (draft.items || []).map((item) => ({
      productId: normalizeProductId(item),
      sku: item.sku || "",
      slug: item.slug || "",
      variantId: item.variantId || item.backendVariantId || "",
      variantSku: item.variantSku || "",
      quantity: Number(item.quantity) || 1,
      expectedPrice: Number(item.price) || 0,
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

