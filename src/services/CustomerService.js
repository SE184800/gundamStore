import { getOrders } from "./OrderService";

export function getCustomers() {
  const map = {};

  getOrders().forEach((order) => {
    const phone = order.customer?.phone;
    if (!phone) return;

    if (!map[phone]) {
      map[phone] = {
        name: order.customer?.name || "",
        phone,
        address: order.customer?.address || "",
        orderCount: 0,
        totalSpent: 0,
        lastOrderAt: order.createdAt,
      };
    }

    map[phone].orderCount += 1;
    map[phone].totalSpent += Number(order.total) || 0;

    if (order.createdAt > map[phone].lastOrderAt) {
      map[phone].lastOrderAt = order.createdAt;
    }
  });

  return Object.values(map);
}
