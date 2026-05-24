import { apiRequest } from "./ApiClient";
import {
  ORDER_STATUS,
  ORDER_TYPE,
  PAYMENT_STATUS,
} from "../constants/orderConfig";

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

const UI_TO_API_STATUS = Object.fromEntries(
  Object.entries(API_TO_UI_STATUS).map(([api, ui]) => [ui, api])
);

const API_TO_UI_PAYMENT_STATUS = {
  UNPAID: PAYMENT_STATUS.UNPAID,
  PARTIAL: "Partial",
  PAID: PAYMENT_STATUS.PAID,
  REFUNDED: PAYMENT_STATUS.REFUNDED,
};

const UI_TO_API_PAYMENT_STATUS = {
  [PAYMENT_STATUS.UNPAID]: "UNPAID",
  Partial: "PARTIAL",
  [PAYMENT_STATUS.PAID]: "PAID",
  [PAYMENT_STATUS.REFUNDED]: "REFUNDED",
};

const UI_TO_API_PAYMENT_METHOD = {
  COD: "COD",
  BANK: "BANK_TRANSFER",
  BANK_TRANSFER: "BANK_TRANSFER",
  CARD: "CARD",
  WALLET: "WALLET",
  MOMO: "WALLET",
};

export function toBackendOrderStatus(status = "") {
  return UI_TO_API_STATUS[status] || "PLACED";
}

export function toBackendPaymentStatus(status = "") {
  return UI_TO_API_PAYMENT_STATUS[status] || "UNPAID";
}

export function toBackendPaymentMethod(method = "") {
  return UI_TO_API_PAYMENT_METHOD[method] || "COD";
}

export function mapBackendOrder(order = {}) {
  const shipment = Array.isArray(order.shipments) ? order.shipments[0] : null;
  const payment = Array.isArray(order.payments) ? order.payments[0] : null;

  const uiStatus = API_TO_UI_STATUS[order.status] || ORDER_STATUS.PLACED;
  const uiPaymentStatus =
    API_TO_UI_PAYMENT_STATUS[order.paymentStatus] || PAYMENT_STATUS.UNPAID;

  return {
    id: order.id,
    orderCode: order.orderNo || order.id,
    orderType: ORDER_TYPE.NORMAL,

    createdAt: order.createdAt,
    updatedAt: order.updatedAt,

    customer: {
      name: order.customerName || "",
      phone: order.customerPhone || "",
      email: order.customerEmail || "",
      address: order.customerAddress || "",
    },

    items: (order.items || []).map((item) => ({
      id: item.id,
      productId: item.productId,
      sku: item.sku,
      name: item.name,
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
    })),

    subtotal: Number(order.subtotal) || 0,
    shippingFee: Number(order.shippingFee) || 0,
    discount: Number(order.discount) || 0,
    shippingDiscount: 0,
    total: Number(order.total) || 0,

    voucherCode: "",
    paymentMethod: payment?.method || "COD",
    paymentStatus: uiPaymentStatus,
    shippingMethod: shipment?.shippingMethod || "FAST",

    shippingInfo: {
      carrier: shipment?.carrier || "",
      trackingCode: shipment?.trackingCode || "",
      eta: "",
      fee: shipment?.fee || order.shippingFee || 0,
      status: shipment?.status || "",
    },

    status: uiStatus,

    timeline: [
      {
        status: uiStatus,
        time: order.updatedAt || order.createdAt,
        title: `Backend status: ${uiStatus}`,
        note: "Synced from PostgreSQL backend.",
      },
    ],

    preorder: null,
    cancelRequest: null,
    returnRequest: null,
    adminNote: order.note || "",

    source: "backend",
    backendRaw: order,
  };
}

export async function getAdminOrdersFromApi() {
  const data = await apiRequest("/api/orders/admin");

  if (!data?.success || !Array.isArray(data.orders)) {
    throw new Error("Backend did not return valid orders.");
  }

  return data.orders.map(mapBackendOrder);
}

export async function updateAdminOrderStatusApi(orderId, status, note = "") {
  const data = await apiRequest(`/api/orders/admin/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status: toBackendOrderStatus(status),
      note,
    }),
  });

  if (!data?.success || !data.order) {
    throw new Error("Backend did not return updated order.");
  }

  return mapBackendOrder(data.order);
}

export async function updateAdminOrderPaymentApi(orderId, paymentStatus, options = {}) {
  const data = await apiRequest(`/api/orders/admin/${orderId}/payment`, {
    method: "PATCH",
    body: JSON.stringify({
      paymentStatus: toBackendPaymentStatus(paymentStatus),
      method: toBackendPaymentMethod(options.method || "COD"),
      amount: Number(options.amount || 0),
      reference: options.reference || "",
      note: options.note || "",
    }),
  });

  if (!data?.success || !data.order) {
    throw new Error("Backend did not return updated payment order.");
  }

  return mapBackendOrder(data.order);
}

export async function updateAdminOrderShippingApi(orderId, shippingInfo = {}) {
  const data = await apiRequest(`/api/orders/admin/${orderId}/shipping`, {
    method: "PATCH",
    body: JSON.stringify({
      carrier: shippingInfo.carrier || "",
      trackingCode: shippingInfo.trackingCode || "",
      shippingMethod: shippingInfo.shippingMethod || "FAST",
      status: shippingInfo.status || "SHIPPING",
      fee: Number(shippingInfo.fee || 0),
      note: shippingInfo.note || "",
    }),
  });

  if (!data?.success || !data.order) {
    throw new Error("Backend did not return updated shipping order.");
  }

  return mapBackendOrder(data.order);
}
