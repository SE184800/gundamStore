import { apiRequest } from "./ApiClient";
import {
  ORDER_STATUS,
  ORDER_TYPE,
  PAYMENT_STATUS,
} from "../constants/orderConfig";

const ORDER_SUCCESS_SESSION_KEY = "gundam-last-order-success";
const JUST_PLACED_ORDER_KEY = "gundam-order-just-placed";
const JUST_PLACED_ORDER_TTL_MS = 10 * 60 * 1000;

export const API_TO_UI_STATUS = {
  PLACED: ORDER_STATUS.PLACED,
  CONFIRMED: ORDER_STATUS.CONFIRMED,
  PACKING: ORDER_STATUS.PACKING,
  SHIPPING: ORDER_STATUS.SHIPPING,
  DELIVERED: ORDER_STATUS.DELIVERED,
  COMPLETED: ORDER_STATUS.COMPLETED,
  CANCELLED: ORDER_STATUS.CANCELLED,
  REFUNDED: ORDER_STATUS.REFUNDED,
};

const API_TO_UI_PAYMENT_STATUS = {
  UNPAID: PAYMENT_STATUS.UNPAID,
  PARTIAL: "Partial",
  PAID: PAYMENT_STATUS.PAID,
  REFUNDED: PAYMENT_STATUS.REFUNDED,
};

function cleanContact(value = "") {
  return String(value || "").trim();
}

function getOrderKeys(order = {}) {
  return Array.from(
    new Set(
      [
        order.id,
        order.orderCode,
        order.orderNo,
        order.backendOrderId,
      ]
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    )
  );
}

function readSuccessStore() {
  try {
    return JSON.parse(sessionStorage.getItem(ORDER_SUCCESS_SESSION_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeSuccessStore(store = {}) {
  try {
    sessionStorage.setItem(ORDER_SUCCESS_SESSION_KEY, JSON.stringify(store || {}));
  } catch {
    // sessionStorage can be unavailable in strict browser modes.
  }
}

function buildOrderTimeline(order = {}, shipment = null) {
  const status = API_TO_UI_STATUS[order.status] || order.status || ORDER_STATUS.PLACED;
  const rows = [
    {
      status: ORDER_STATUS.PLACED,
      time: order.createdAt,
      title: "ÄÃ£ Ä‘áº·t hÃ ng",
      note: "ÄÆ¡n hÃ ng Ä‘Ã£ Ä‘Æ°á»£c ghi nháº­n trÃªn há»‡ thá»‘ng.",
    },
  ];

  if (["CONFIRMED", "PACKING", "SHIPPING", "DELIVERED", "COMPLETED"].includes(order.status)) {
    rows.push({
      status: ORDER_STATUS.CONFIRMED,
      time: order.confirmedAt || order.updatedAt,
      title: "ÄÃ£ xÃ¡c nháº­n",
      note: "Shop Ä‘Ã£ xÃ¡c nháº­n Ä‘Æ¡n hÃ ng.",
    });
  }

  if (["PACKING", "SHIPPING", "DELIVERED", "COMPLETED"].includes(order.status)) {
    rows.push({
      status: ORDER_STATUS.PACKING,
      time: shipment?.createdAt || order.updatedAt,
      title: "Äang Ä‘Ã³ng gÃ³i",
      note: "ÄÆ¡n hÃ ng Ä‘ang Ä‘Æ°á»£c chuáº©n bá»‹.",
    });
  }

  if (["SHIPPING", "DELIVERED", "COMPLETED"].includes(order.status)) {
    rows.push({
      status: ORDER_STATUS.SHIPPING,
      time: shipment?.updatedAt || order.updatedAt,
      title: "Äang giao hÃ ng",
      note: [shipment?.carrier, shipment?.trackingCode].filter(Boolean).join(" Â· ") || "ÄÆ¡n hÃ ng Ä‘Ã£ bÃ n giao váº­n chuyá»ƒn.",
    });
  }

  if (["DELIVERED", "COMPLETED"].includes(order.status)) {
    rows.push({
      status: ORDER_STATUS.DELIVERED,
      time: order.updatedAt,
      title: "ÄÃ£ giao hÃ ng",
      note: "ÄÆ¡n hÃ ng Ä‘Ã£ Ä‘Æ°á»£c giao.",
    });
  }

  if (order.status === "COMPLETED") {
    rows.push({
      status: ORDER_STATUS.COMPLETED,
      time: order.updatedAt,
      title: "HoÃ n táº¥t",
      note: "ÄÆ¡n hÃ ng Ä‘Ã£ hoÃ n táº¥t.",
    });
  }

  if (["CANCELLED", "REFUNDED"].includes(order.status)) {
    rows.push({
      status,
      time: order.cancelledAt || order.updatedAt,
      title: order.status === "CANCELLED" ? "ÄÃ£ há»§y" : "ÄÃ£ hoÃ n tiá»n",
      note: order.cancelReason || "ÄÆ¡n hÃ ng Ä‘Ã£ á»Ÿ tráº¡ng thÃ¡i cuá»‘i.",
    });
  }

  return rows.filter((item) => item.time || item.status === ORDER_STATUS.PLACED);
}

export function mapOrderSummaryForStorefront(order = {}) {
  return {
    orderNo: order.orderNo || "",
    createdAt: order.createdAt || "",
    status: API_TO_UI_STATUS[order.status] || order.status || ORDER_STATUS.PLACED,
    total: Number(order.total) || 0,
    itemCount: Number(order.itemCount) || 0,
  };
}

export function mapBackendOrderForStorefront(order = {}) {
  const shipments = Array.isArray(order.shipments)
    ? [...order.shipments].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    : [];
  const shipment = shipments[0] || null;
  const payment = Array.isArray(order.payments) ? order.payments[0] : null;

  // POST /api/orders/ nests deposit numbers under order.preorder; the GET
  // lookup/my/admin endpoints instead add flat depositAmount/remainingAmount
  // aliases (of preorderDepositAmount/preorderRemainingAmount) directly on
  // the order — read whichever shape is present (backend/API_REFERENCE.md
  // §1.3, §1.3 GET /api/orders/my/:id).
  const nestedPreorder = order.preorder || {};
  const depositAmount = Number(
    order.depositAmount ?? nestedPreorder.depositAmount ?? order.preorderDepositAmount ?? 0
  ) || 0;
  const remainingAmount = Number(
    order.remainingAmount ?? nestedPreorder.remainingAmount ?? order.preorderRemainingAmount ?? 0
  ) || 0;
  const fullAmount = Number(nestedPreorder.fullAmount ?? order.preorderFullAmount ?? 0) || 0;
  const eta = nestedPreorder.eta || order.preorderEta || "";

  return {
    id: order.id,
    backendOrderId: order.id,
    orderCode: order.orderNo || order.orderCode || "",
    orderNo: order.orderNo || "",
    orderType: order.orderType === "preorder" ? ORDER_TYPE.PREORDER : ORDER_TYPE.NORMAL,
    preorder:
      order.orderType === "preorder"
        ? { eta, fullAmount, depositAmount, remainingAmount }
        : null,
    depositAmount,
    remainingAmount,

    createdAt: order.createdAt,
    updatedAt: order.updatedAt,

    customer: {
      name: order.customerName || order.customer?.name || "",
      phone: order.customerPhone || order.customer?.phone || "",
      email: order.customerEmail || order.customer?.email || "",
      address: order.customerAddress || order.customer?.address || "",
      province: "",
      note: order.note || "",
    },

    items: (order.items || []).map((item) => ({
      id: item.id,
      backendProductId: item.productId,
      productId: item.productId,
      sku: item.sku,
      slug: "",
      name: item.name,
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      selected: true,
    })),

    subtotal: Number(order.subtotal) || 0,
    shippingFee: Number(order.shippingFee) || 0,
    discount: Number(order.discount) || 0,
    shippingDiscount: 0,
    total: Number(order.total) || 0,

    voucherCode: "",
    paymentMethod: payment?.method || order.paymentMethod || "COD",
    paymentStatus:
      API_TO_UI_PAYMENT_STATUS[order.paymentStatus] || order.paymentStatus || PAYMENT_STATUS.UNPAID,
    bankInfo: order.bankInfo || null,
    shippingMethod: shipment?.shippingMethod || order.shippingMethod || "FAST",

    shippingInfo: {
      carrier: shipment?.carrier || "",
      trackingCode: shipment?.trackingCode || "",
      fee: Number(shipment?.fee || order.shippingFee || 0),
      status: shipment?.status || "",
      method: shipment?.shippingMethod || order.shippingMethod || "FAST",
      note: shipment?.note || "",
      updatedAt: shipment?.updatedAt || "",
    },

    status: API_TO_UI_STATUS[order.status] || order.status || ORDER_STATUS.PLACED,

    timeline: buildOrderTimeline(order, shipment),

    cancelRequest: null,
    returnRequest: (order.complaintTickets || []).find((ticket) => ["RETURN", "REFUND"].includes(ticket.type)) || null,
    supportTickets: order.complaintTickets || [],
    adminNote: order.note || "",

    source: order.source || "backend",
    backendRaw: order.backendRaw || order,
  };
}

export function saveOrderSuccessSnapshot(order = {}, contact = {}) {
  const mappedOrder = order.source === "backend" || order.backendRaw
    ? order
    : {
      ...order,
      source: order.source || "local",
    };

  const lookup = {
    phone: cleanContact(contact.phone || order.customer?.phone || ""),
    email: cleanContact(contact.email || order.customer?.email || ""),
  };

  const record = {
    order: mappedOrder,
    lookup,
    savedAt: new Date().toISOString(),
  };

  const store = readSuccessStore();
  getOrderKeys(mappedOrder).forEach((key) => {
    store[key] = record;
  });

  writeSuccessStore(store);
  return record;
}

export function getOrderSuccessSnapshot(id = "") {
  const key = String(id || "").trim();
  if (!key) return null;

  const store = readSuccessStore();
  return store[key] || null;
}

export function saveJustPlacedOrderFlag({ orderNo = "", total = 0, phone = "" } = {}) {
  const code = cleanContact(orderNo);
  if (!code) return;

  try {
    sessionStorage.setItem(
      JUST_PLACED_ORDER_KEY,
      JSON.stringify({ orderNo: code, total: Number(total) || 0, phone: cleanContact(phone), ts: Date.now() })
    );
  } catch {
    // sessionStorage can be unavailable in strict browser modes.
  }
}

// One-time read: the banner should only appear right after checkout, not on
// every later visit to the homepage, so this clears the flag as it reads it.
export function consumeJustPlacedOrderFlag() {
  try {
    const raw = sessionStorage.getItem(JUST_PLACED_ORDER_KEY);
    sessionStorage.removeItem(JUST_PLACED_ORDER_KEY);

    if (!raw) return null;

    const data = JSON.parse(raw);
    if (!data?.orderNo || Date.now() - Number(data.ts || 0) > JUST_PLACED_ORDER_TTL_MS) return null;

    return data;
  } catch {
    return null;
  }
}

function buildPublicOrderPath(id = "", lookup = {}) {
  const params = new URLSearchParams();
  if (lookup.phone) params.set("phone", cleanContact(lookup.phone));
  if (lookup.email) params.set("email", cleanContact(lookup.email));

  const query = params.toString();
  return `/api/orders/public/${encodeURIComponent(id)}${query ? `?${query}` : ""}`;
}

export async function getStorefrontOrderByIdFromApi(id = "", lookup = {}) {
  const data = await apiRequest(buildPublicOrderPath(id, lookup), {
    token: "",
  });

  if (!data?.success || !data.order) {
    throw new Error("Backend did not return order.");
  }

  return mapBackendOrderForStorefront(data.order);
}

