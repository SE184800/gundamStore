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

const API_TO_UI_PAYMENT_STATUS = {
  UNPAID: PAYMENT_STATUS.UNPAID,
  PARTIAL: "Partial",
  PAID: PAYMENT_STATUS.PAID,
  REFUNDED: PAYMENT_STATUS.REFUNDED,
};

export function mapBackendOrderForStorefront(order = {}) {
  const shipment = Array.isArray(order.shipments) ? order.shipments[0] : null;
  const payment = Array.isArray(order.payments) ? order.payments[0] : null;

  return {
    id: order.id,
    orderCode: order.orderNo || order.id,
    orderNo: order.orderNo || "",
    orderType: ORDER_TYPE.NORMAL,

    createdAt: order.createdAt,
    updatedAt: order.updatedAt,

    customer: {
      name: order.customerName || "",
      phone: order.customerPhone || "",
      email: order.customerEmail || "",
      address: order.customerAddress || "",
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
    paymentMethod: payment?.method || "COD",
    paymentStatus:
      API_TO_UI_PAYMENT_STATUS[order.paymentStatus] || PAYMENT_STATUS.UNPAID,
    shippingMethod: shipment?.shippingMethod || "FAST",

    shippingInfo: {
      carrier: shipment?.carrier || "",
      trackingCode: shipment?.trackingCode || "",
      fee: Number(shipment?.fee || order.shippingFee || 0),
      status: shipment?.status || "",
      note: shipment?.note || "",
    },

    status: API_TO_UI_STATUS[order.status] || ORDER_STATUS.PLACED,

    timeline: [
      {
        status: API_TO_UI_STATUS[order.status] || ORDER_STATUS.PLACED,
        time: order.updatedAt || order.createdAt,
        title: "Đồng bộ từ PostgreSQL",
        note: `Backend order status: ${order.status}`,
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

export async function getStorefrontOrderByIdFromApi(id = "") {
  const data = await apiRequest(`/api/orders/public/${encodeURIComponent(id)}`, {
    token: "",
  });

  if (!data?.success || !data.order) {
    throw new Error("Backend did not return order.");
  }

  return mapBackendOrderForStorefront(data.order);
}
