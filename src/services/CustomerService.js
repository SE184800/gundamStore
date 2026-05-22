import { getOrders } from "./OrderService";

export function getCustomers() {
  const orders = getOrders();
  const map = {};

  orders.forEach((order) => {
    const phone = order.customer?.phone;
    if (!phone) return;

    if (!map[phone]) {
      map[phone] = {
        name: order.customer?.name || "",
        phone,
        address: order.customer?.address || "",
        orderCount: 0,
        totalSpent: 0,
      };
    }

    map[phone].orderCount += 1;
    map[phone].totalSpent += Number(order.total) || 0;
  });

  return Object.values(map);
}
