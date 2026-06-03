import { apiRequest } from "./ApiClient";
import {
  ORDER_STATUS,
  ORDER_TYPE,
  PAYMENT_STATUS,
} from "../constants/orderConfig";

const ORDER_SUCCESS_SESSION_KEY = "gundam-last-order-success";

const API_TO_UI_STATUS = {
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

export function mapBackendOrderForStorefront(order = {}) {
  const shipment = Array.isArray(order.shipments) ? order.shipments[0] : null;
  const payment = Array.isArray(order.payments) ? order.payments[0] : null;

  return {
    id: order.id,
    backendOrderId: order.id,
    orderCode: order.orderNo || order.orderCode || order.id,
    orderNo: order.orderNo || "",
    orderType: ORDER_TYPE.NORMAL,

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
    shippingMethod: shipment?.shippingMethod || order.shippingMethod || "FAST",

    shippingInfo: {
      carrier: shipment?.carrier || "",
      trackingCode: shipment?.trackingCode || "",
      fee: Number(shipment?.fee || order.shippingFee || 0),
      status: shipment?.status || "",
      note: shipment?.note || "",
    },

    status: API_TO_UI_STATUS[order.status] || order.status || ORDER_STATUS.PLACED,

    timeline: [
      {
        status: API_TO_UI_STATUS[order.status] || order.status || ORDER_STATUS.PLACED,
        time: order.updatedAt || order.createdAt,
        title: "Đồng bộ từ PostgreSQL",
        note: `Backend order status: ${order.status || ORDER_STATUS.PLACED}`,
      },
    ],

    preorder: order.preorder || null,
    cancelRequest: null,
    returnRequest: null,
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
