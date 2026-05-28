import { apiRequest, getStoredAccountToken } from "./ApiClient";
import { mapBackendOrderForStorefront } from "./StorefrontOrderLookupApiService";

const PRODUCT_ALIASES = {
  "prod-hg-aerial": {
    sku: "HG-AERIAL-144-BD",
    slug: "hg-1-144-gundam-aerial",
  },
  "hg-aerial-144-bd": {
    sku: "HG-AERIAL-144-BD",
    slug: "hg-1-144-gundam-aerial",
  },
  "hg-1-144-gundam-aerial": {
    sku: "HG-AERIAL-144-BD",
    slug: "hg-1-144-gundam-aerial",
  },

  "prod-action-base-5": {
    sku: "ACTION-BASE-5-CLEAR",
    slug: "action-base-5-clear",
  },
  "action-base-5-clear": {
    sku: "ACTION-BASE-5-CLEAR",
    slug: "action-base-5-clear",
  },

  "prod-rg-hinu": {
    sku: "RG-HINU-144-BD",
    slug: "rg-1-144-hi-nu-gundam",
  },
  "rg-1-144-hi-v-gundam": {
    sku: "RG-HINU-144-BD",
    slug: "rg-1-144-hi-nu-gundam",
  },
  "rg-1-144-hi-nu-gundam": {
    sku: "RG-HINU-144-BD",
    slug: "rg-1-144-hi-nu-gundam",
  },

  "prod-mg-freedom": {
    sku: "MG-FREEDOM-100-VER20",
    slug: "mg-1-100-freedom-gundam-ver-2-0",
  },
  "mg-freedom": {
    sku: "MG-FREEDOM-100-VER20",
    slug: "mg-1-100-freedom-gundam-ver-2-0",
  },
  "mg-1-100-freedom-gundam-ver-2-0": {
    sku: "MG-FREEDOM-100-VER20",
    slug: "mg-1-100-freedom-gundam-ver-2-0",
  },
};

function textOf(value = "") {
  if (!value) return "";
  if (typeof value === "string") return value;
  return [value.vi, value.en, value.name, value.title].filter(Boolean).join(" ");
}

function buildSearchText(item = {}) {
  return [
    item.id,
    item.productId,
    item.backendProductId,
    item.sku,
    item.slug,
    item.name,
    item.title,
    item.productName,
  ]
    .map(textOf)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getProductAlias(item = {}) {
  const searchText = buildSearchText(item);
  const keys = [item.productId, item.id, item.slug, item.sku]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());

  for (const key of keys) {
    if (PRODUCT_ALIASES[key]) return PRODUCT_ALIASES[key];
  }

  if (searchText.includes("freedom")) {
    return {
      sku: "MG-FREEDOM-100-VER20",
      slug: "mg-1-100-freedom-gundam-ver-2-0",
    };
  }

  if (searchText.includes("aerial")) {
    return {
      sku: "HG-AERIAL-144-BD",
      slug: "hg-1-144-gundam-aerial",
    };
  }

  if (searchText.includes("action base")) {
    return {
      sku: "ACTION-BASE-5-CLEAR",
      slug: "action-base-5-clear",
    };
  }

  if (searchText.includes("hi-v") || searchText.includes("hi-ν") || searchText.includes("hi-nu")) {
    return {
      sku: "RG-HINU-144-BD",
      slug: "rg-1-144-hi-nu-gundam",
    };
  }

  return {};
}

function looksLikeBackendId(value = "") {
  return /^c[a-z0-9]{10,}$/i.test(String(value || ""));
}

function normalizeProductId(item = {}) {
  const id = item.backendProductId || item.productId || "";
  return looksLikeBackendId(id) ? id : "";
}

function normalizeSku(item = {}) {
  const alias = getProductAlias(item);
  return alias.sku || item.sku || "";
}

function normalizeSlug(item = {}) {
  const alias = getProductAlias(item);
  return alias.slug || item.slug || "";
}

export function buildCreateOrderPayload({
  customer,
  draft,
  pricing,
}) {
  return {
    customerName: customer.name,
    customerPhone: customer.phone,
    customerEmail: customer.email || "",
    customerAddress: [customer.address, customer.province].filter(Boolean).join(", "),
    shippingFee: Number(pricing.shippingFee) || 0,
    discount: Number(pricing.discount || 0) + Number(pricing.shippingDiscount || 0),
    note: customer.note || "",
    items: (draft.items || []).map((item) => ({
      productId: normalizeProductId(item),
      sku: normalizeSku(item),
      slug: normalizeSlug(item),
      quantity: Number(item.quantity) || 1,
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
    throw new Error("Backend did not return created order.");
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
