const CMS_KEY = "gundam-cms-state";

export const ORDER_STATUS = {
  PLACED: "Placed",
  CONFIRMED: "Confirmed",
  PACKING: "Packing",
  SHIPPING: "Shipping",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export const PAYMENT_STATUS = {
  UNPAID: "Unpaid",
  PAID: "Paid",
  REFUNDED: "Refunded",
};

export function getOrders() {
  try {
    const cms = JSON.parse(localStorage.getItem(CMS_KEY) || "{}");
    return Array.isArray(cms.orders) ? cms.orders : [];
  } catch {
    return [];
  }
}

export function saveOrders(orders) {
  const cms = JSON.parse(localStorage.getItem(CMS_KEY) || "{}");
  localStorage.setItem(CMS_KEY, JSON.stringify({ ...cms, orders }));
}

export function createOrder(payload) {
  const now = new Date().toISOString();

  const order = {
    id: "ORD-" + Date.now(),
    orderCode: "GS-" + Date.now(),
    createdAt: now,
    updatedAt: now,

    customer: payload.customer,
    items: payload.items || [],

    subtotal: Number(payload.subtotal) || 0,
    shippingFee: Number(payload.shippingFee) || 0,
    discount: Number(payload.discount) || 0,
    shippingDiscount: Number(payload.shippingDiscount) || 0,
    total: Number(payload.total) || 0,

    voucherCode: payload.voucherCode || "",
    paymentMethod: payload.paymentMethod || "COD",
    paymentStatus: PAYMENT_STATUS.UNPAID,
    shippingMethod: payload.shippingMethod || "FAST",

    status: ORDER_STATUS.PLACED,

    timeline: [
      {
        status: ORDER_STATUS.PLACED,
        time: now,
        title: "Đặt hàng thành công",
        note: "Khách hàng đã tạo đơn hàng.",
      },
    ],

    adminNote: "",
  };

  const orders = getOrders();
  saveOrders([order, ...orders]);

  return order;
}

export function getOrderById(orderId) {
  return getOrders().find((order) => order.id === orderId);
}

export function updateOrderStatus(orderId, status, note = "") {
  const now = new Date().toISOString();

  const orders = getOrders().map((order) =>
    order.id === orderId
      ? {
          ...order,
          status,
          updatedAt: now,
          timeline: [
            ...(order.timeline || []),
            {
              status,
              time: now,
              title: `Cập nhật: ${status}`,
              note: note || `Đơn hàng chuyển sang trạng thái ${status}.`,
            },
          ],
        }
      : order
  );

  saveOrders(orders);
  return orders;
}

export function updatePaymentStatus(orderId, paymentStatus) {
  const orders = getOrders().map((order) =>
    order.id === orderId
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

export function deleteOrder(orderId) {
  const orders = getOrders().filter((order) => order.id !== orderId);
  saveOrders(orders);
  return orders;
}
