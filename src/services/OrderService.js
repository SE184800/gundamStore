import { normalizeItems, calcSubtotal } from "./PricingService";
import { reduceStock, restoreStock } from "./InventoryService";
import {
  ORDER_TYPE,
  ORDER_STATUS,
  PAYMENT_STATUS,
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  getNextOrderStatus,
  getAllowedNextOrderStatuses,
  canTransitionOrderStatus,
  isTerminalOrderStatus,
} from "../constants/orderConfig";

const CMS_KEY = "gundam-cms-state";

export {
  ORDER_TYPE,
  ORDER_STATUS,
  PAYMENT_STATUS,
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  getNextOrderStatus,
  getAllowedNextOrderStatuses,
  canTransitionOrderStatus,
  isTerminalOrderStatus,
};

function readCms() {
  try {
    return JSON.parse(localStorage.getItem(CMS_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeCms(cms) {
  localStorage.setItem(CMS_KEY, JSON.stringify(cms || {}));
}

function normalizeOrder(order = {}) {
  const items = normalizeItems(order.items || []);
  const subtotal = calcSubtotal(items);
  const shippingFee = Number(order.shippingFee) || 0;
  const discount = Number(order.discount) || 0;
  const shippingDiscount = Number(order.shippingDiscount) || 0;
  const total = Math.max(0, subtotal + shippingFee - discount - shippingDiscount);

  return {
    ...order,
    orderType: order.orderType || ORDER_TYPE.NORMAL,
    status: order.status || ORDER_STATUS.PLACED,
    paymentStatus: order.paymentStatus || PAYMENT_STATUS.UNPAID,
    items,
    subtotal,
    shippingFee,
    discount,
    shippingDiscount,
    total,
    timeline: Array.isArray(order.timeline) ? order.timeline : [],
  };
}

export function getOrders() {
  try {
    const cms = readCms();
    const orders = Array.isArray(cms.orders) ? cms.orders : [];
    const fixedOrders = orders.map(normalizeOrder);

    writeCms({ ...cms, orders: fixedOrders });
    return fixedOrders;
  } catch {
    return [];
  }
}

export function saveOrders(orders) {
  const cms = readCms();
  writeCms({ ...cms, orders: Array.isArray(orders) ? orders.map(normalizeOrder) : [] });
}

export function createOrder(payload) {
  const now = new Date().toISOString();
  const items = normalizeItems(payload.items || []);
  const subtotal = calcSubtotal(items);
  const shippingFee = Number(payload.shippingFee) || 0;
  const discount = Number(payload.discount) || 0;
  const shippingDiscount = Number(payload.shippingDiscount) || 0;
  const total = Math.max(0, subtotal + shippingFee - discount - shippingDiscount);
  const orderType = payload.orderType || ORDER_TYPE.NORMAL;

  const order = {
    id: "ORD-" + Date.now(),
    orderCode: "GS-" + Date.now(),
    orderType,
    createdAt: now,
    updatedAt: now,

    customer: payload.customer,
    items,

    subtotal,
    shippingFee,
    discount,
    shippingDiscount,
    total,

    voucherCode: payload.voucherCode || "",
    paymentMethod: payload.paymentMethod || "COD",
    paymentStatus: payload.paymentStatus || PAYMENT_STATUS.UNPAID,
    shippingMethod: payload.shippingMethod || "FAST",

    preorder: payload.preorder || null,

    status: payload.status || ORDER_STATUS.PLACED,

    timeline: [
      {
        status: payload.status || ORDER_STATUS.PLACED,
        time: now,
        title: orderType === ORDER_TYPE.PREORDER ? "Tạo đơn pre-order" : "Đặt hàng thành công",
        note:
          orderType === ORDER_TYPE.PREORDER
            ? "Khách hàng đã tạo đơn pre-order."
            : "Khách hàng đã tạo đơn hàng.",
      },
    ],

    cancelRequest: null,
    returnRequest: null,
    adminNote: "",
  };

  reduceStock(order.items);

  const orders = getOrders();
  saveOrders([order, ...orders]);

  return order;
}

export function getOrderById(orderId) {
  return getOrders().find((order) => order.id === orderId || order.orderCode === orderId);
}

export function updateOrderStatus(orderId, status, note = "", options = {}) {
  const now = new Date().toISOString();
  const orders = getOrders();
  const currentOrder = orders.find((order) => order.id === orderId || order.orderCode === orderId);

  if (!currentOrder) {
    throw new Error("Order not found.");
  }

  const currentStatus = currentOrder.status || ORDER_STATUS.PLACED;
  const force = options.force === true;

  if (!force && !canTransitionOrderStatus(currentStatus, status)) {
    throw new Error(`Invalid status transition: ${currentStatus} → ${status}`);
  }

  if (status === ORDER_STATUS.CANCELLED && currentStatus !== ORDER_STATUS.CANCELLED) {
    restoreStock(currentOrder.items || []);
  }

  const nextOrders = orders.map((order) =>
    order.id === currentOrder.id
      ? {
          ...order,
          status,
          updatedAt: now,
          cancelRequest:
            status === ORDER_STATUS.CANCELLED
              ? {
                  ...(order.cancelRequest || {}),
                  status: "Approved",
                  resolvedAt: now,
                  reason: note || order.cancelRequest?.reason || "",
                }
              : order.cancelRequest,
          timeline: [
            ...(order.timeline || []),
            {
              status,
              time: now,
              title: `Cập nhật: ${getOrderStatusLabel(status, "vi")}`,
              note: note || `Đơn hàng chuyển sang trạng thái ${getOrderStatusLabel(status, "vi")}.`,
            },
          ],
        }
      : order
  );

  saveOrders(nextOrders);
  return nextOrders;
}

export function updatePaymentStatus(orderId, paymentStatus) {
  const orders = getOrders().map((order) =>
    order.id === orderId || order.orderCode === orderId
      ? {
          ...order,
          paymentStatus,
          updatedAt: new Date().toISOString(),
        }
      : order
  );

  saveOrders(orders);
  return orders;
}

export function requestCancelOrder(orderId, reason = "", note = "") {
  const now = new Date().toISOString();

  const orders = getOrders().map((order) =>
    order.id === orderId || order.orderCode === orderId
      ? {
          ...order,
          cancelRequest: {
            requested: true,
            reason,
            note,
            status: "Pending",
            requestedAt: now,
          },
          updatedAt: now,
          timeline: [
            ...(order.timeline || []),
            {
              status: order.status,
              time: now,
              title: "Yêu cầu hủy đơn",
              note: note || reason || "Khách hàng đã gửi yêu cầu hủy đơn.",
            },
          ],
        }
      : order
  );

  saveOrders(orders);
  return orders;
}

export function deleteOrder(orderId) {
  const orders = getOrders().filter((order) => order.id !== orderId && order.orderCode !== orderId);
  saveOrders(orders);
  return orders;
}

export function updateOrderShipping(orderId, shippingInfo = {}) {
  const now = new Date().toISOString();

  const orders = getOrders().map((order) =>
    order.id === orderId || order.orderCode === orderId
      ? {
          ...order,
          shippingInfo: {
            ...(order.shippingInfo || {}),
            ...shippingInfo,
          },
          updatedAt: now,
          timeline: [
            ...(order.timeline || []),
            {
              status: order.status,
              time: now,
              title: "Cập nhật vận chuyển",
              note: `Carrier: ${shippingInfo.carrier || "-"}, Tracking: ${shippingInfo.trackingCode || "-"}`,
            },
          ],
        }
      : order
  );

  saveOrders(orders);
  return orders;
}

export function updateOrderAdminNote(orderId, adminNote = "") {
  const orders = getOrders().map((order) =>
    order.id === orderId || order.orderCode === orderId
      ? {
          ...order,
          adminNote,
          updatedAt: new Date().toISOString(),
        }
      : order
  );

  saveOrders(orders);
  return orders;
}
