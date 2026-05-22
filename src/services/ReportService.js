import { getOrders } from "./OrderService";

export function getSalesReport() {
  const orders = getOrders();

  const revenue = orders.reduce(
    (sum, order) => sum + (Number(order.total) || 0),
    0
  );

  const statusCount = orders.reduce((acc, order) => {
    acc[order.status || "Placed"] = (acc[order.status || "Placed"] || 0) + 1;
    return acc;
  }, {});

  const productMap = {};

  orders.forEach((order) => {
    (order.items || []).forEach((item) => {
      if (!productMap[item.id]) {
        productMap[item.id] = {
          id: item.id,
          name: item.name,
          quantity: 0,
          revenue: 0,
        };
      }

      productMap[item.id].quantity += item.quantity || 1;
      productMap[item.id].revenue +=
        (Number(item.price) || 0) * (item.quantity || 1);
    });
  });

  return {
    totalOrders: orders.length,
    revenue,
    statusCount,
    topProducts: Object.values(productMap).sort(
      (a, b) => b.quantity - a.quantity
    ),
  };
}
