import { getOrders, saveOrders, PAYMENT_STATUS } from "./OrderService";

export const PAYMENT_EVENT_TYPE = {
  CUSTOMER_PAYMENT_NOTE: "CustomerPaymentNote",
  ADMIN_CONFIRM_PAYMENT: "AdminConfirmPayment",
  ADMIN_REJECT_PAYMENT: "AdminRejectPayment",
  REFUND_NOTE: "RefundNote",
};

function nowIso() {
  return new Date().toISOString();
}

export function getPaymentSummary() {
  const orders = getOrders();

  return {
    totalOrders: orders.length,
    unpaid: orders.filter((order) => order.paymentStatus === PAYMENT_STATUS.UNPAID).length,
    paid: orders.filter((order) => order.paymentStatus === PAYMENT_STATUS.PAID).length,
    refunded: orders.filter((order) => order.paymentStatus === PAYMENT_STATUS.REFUNDED).length,
    totalPaidAmount: orders
      .filter((order) => order.paymentStatus === PAYMENT_STATUS.PAID)
      .reduce((sum, order) => sum + (Number(order.total) || 0), 0),
  };
}

export function addPaymentEvent(orderId, event = {}) {
  const now = nowIso();

  const orders = getOrders().map((order) => {
    if (order.id !== orderId && order.orderCode !== orderId) return order;

    const paymentEvents = Array.isArray(order.paymentEvents) ? order.paymentEvents : [];

    return {
      ...order,
      paymentEvents: [
        ...paymentEvents,
        {
          id: `PAY-${Date.now()}`,
          type: event.type || PAYMENT_EVENT_TYPE.CUSTOMER_PAYMENT_NOTE,
          amount: Number(event.amount) || 0,
          method: event.method || order.paymentMethod || "COD",
          note: String(event.note || "").trim(),
          createdAt: now,
          createdBy: event.createdBy || "system",
        },
      ],
      updatedAt: now,
      timeline: [
        ...(order.timeline || []),
        {
          status: order.status,
          time: now,
          title: event.title || "Cập nhật thanh toán",
          note: event.note || "Đã ghi nhận cập nhật thanh toán.",
        },
      ],
    };
  });

  saveOrders(orders);
  return orders;
}

export function confirmOrderPayment(orderId, amount = 0, note = "") {
  const now = nowIso();

  const orders = getOrders().map((order) => {
    if (order.id !== orderId && order.orderCode !== orderId) return order;

    const paymentEvents = Array.isArray(order.paymentEvents) ? order.paymentEvents : [];

    return {
      ...order,
      paymentStatus: PAYMENT_STATUS.PAID,
      paymentConfirmedAt: now,
      paymentEvents: [
        ...paymentEvents,
        {
          id: `PAY-${Date.now()}`,
          type: PAYMENT_EVENT_TYPE.ADMIN_CONFIRM_PAYMENT,
          amount: Number(amount) || Number(order.total) || 0,
          method: order.paymentMethod || "COD",
          note: note || "Admin confirmed payment.",
          createdAt: now,
          createdBy: "admin",
        },
      ],
      updatedAt: now,
      timeline: [
        ...(order.timeline || []),
        {
          status: order.status,
          time: now,
          title: "Xác nhận thanh toán",
          note: note || "Admin đã xác nhận thanh toán cho đơn hàng.",
        },
      ],
    };
  });

  saveOrders(orders);
  return orders;
}

export function markOrderRefunded(orderId, amount = 0, note = "") {
  const now = nowIso();

  const orders = getOrders().map((order) => {
    if (order.id !== orderId && order.orderCode !== orderId) return order;

    const paymentEvents = Array.isArray(order.paymentEvents) ? order.paymentEvents : [];

    return {
      ...order,
      paymentStatus: PAYMENT_STATUS.REFUNDED,
      refundAmount: Number(amount) || Number(order.total) || 0,
      refundedAt: now,
      paymentEvents: [
        ...paymentEvents,
        {
          id: `PAY-${Date.now()}`,
          type: PAYMENT_EVENT_TYPE.REFUND_NOTE,
          amount: Number(amount) || Number(order.total) || 0,
          method: order.paymentMethod || "COD",
          note: note || "Admin marked order as refunded.",
          createdAt: now,
          createdBy: "admin",
        },
      ],
      updatedAt: now,
      timeline: [
        ...(order.timeline || []),
        {
          status: order.status,
          time: now,
          title: "Ghi nhận hoàn tiền",
          note: note || "Admin đã ghi nhận hoàn tiền cho đơn hàng.",
        },
      ],
    };
  });

  saveOrders(orders);
  return orders;
}
