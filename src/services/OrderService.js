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

export function getOrders() {
  const cms = JSON.parse(localStorage.getItem(CMS_KEY) || "{}");
  return cms.orders || [];
}

export function saveOrders(orders) {
  const cms = JSON.parse(localStorage.getItem(CMS_KEY) || "{}");
  localStorage.setItem(CMS_KEY, JSON.stringify({ ...cms, orders }));
}

export function createOrder(payload) {
  const order = {
    id: "ORD-" + Date.now(),
    orderCode: "GS-" + Date.now(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: ORDER_STATUS.PLACED,
    paymentStatus: "Unpaid",
    timeline: [
      {
        status: ORDER_STATUS.PLACED,
        time: new Date().toISOString(),
        note: "Khách hàng đã đặt hàng.",
      },
    ],
    ...payload,
  };

  const orders = getOrders();
  saveOrders([order, ...orders]);

  return order;
}

export function updateOrderStatus(orderId, status, note = "") {
  const orders = getOrders();

  const updated = orders.map((order) =>
    order.id === orderId
      ? {
          ...order,
          status,
          updatedAt: new Date().toISOString(),
          timeline: [
            ...(order.timeline || []),
            {
              status,
              time: new Date().toISOString(),
              note: note || `Cập nhật trạng thái: ${status}`,
            },
          ],
        }
      : order
  );

  saveOrders(updated);
  return updated;
}

export function deleteOrder(orderId) {
  const updated = getOrders().filter((order) => order.id !== orderId);
  saveOrders(updated);
  return updated;
}

export function getOrderById(orderId) {
  return getOrders().find((order) => order.id === orderId);
}
