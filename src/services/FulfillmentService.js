import { getOrders, saveOrders, ORDER_STATUS, updateOrderStatus } from "./OrderService";

export const FULFILLMENT_EVENT_TYPE = {
  PICKING_STARTED: "PickingStarted",
  PACKING_STARTED: "PackingStarted",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERY_NOTE: "DeliveryNote",
};

function nowIso() {
  return new Date().toISOString();
}

export function getFulfillmentSummary() {
  const orders = getOrders();

  return {
    toConfirm: orders.filter((order) => order.status === ORDER_STATUS.PLACED).length,
    toPack: orders.filter((order) => order.status === ORDER_STATUS.CONFIRMED).length,
    packing: orders.filter((order) => order.status === ORDER_STATUS.PACKING).length,
    shipping: orders.filter((order) => order.status === ORDER_STATUS.SHIPPING).length,
    missingTracking: orders.filter(
      (order) => order.status === ORDER_STATUS.SHIPPING && !order.shippingInfo?.trackingCode
    ).length,
  };
}

export function addFulfillmentEvent(orderId, event = {}) {
  const now = nowIso();

  const orders = getOrders().map((order) => {
    if (order.id !== orderId && order.orderCode !== orderId) return order;

    const fulfillmentEvents = Array.isArray(order.fulfillmentEvents)
      ? order.fulfillmentEvents
      : [];

    return {
      ...order,
      fulfillmentEvents: [
        ...fulfillmentEvents,
        {
          id: `FUL-${Date.now()}`,
          type: event.type || FULFILLMENT_EVENT_TYPE.DELIVERY_NOTE,
          note: String(event.note || "").trim(),
          createdAt: now,
          createdBy: event.createdBy || "admin",
        },
      ],
      updatedAt: now,
      timeline: [
        ...(order.timeline || []),
        {
          status: order.status,
          time: now,
          title: event.title || "Cập nhật xử lý đơn",
          note: event.note || "Đã ghi nhận cập nhật xử lý đơn.",
        },
      ],
    };
  });

  saveOrders(orders);
  return orders;
}

export function startPicking(orderId, note = "") {
  addFulfillmentEvent(orderId, {
    type: FULFILLMENT_EVENT_TYPE.PICKING_STARTED,
    title: "Bắt đầu soạn hàng",
    note: note || "Admin bắt đầu soạn hàng.",
  });

  return updateOrderStatus(orderId, ORDER_STATUS.CONFIRMED, note || "Bắt đầu soạn hàng.", { force: true });
}

export function startPacking(orderId, note = "") {
  addFulfillmentEvent(orderId, {
    type: FULFILLMENT_EVENT_TYPE.PACKING_STARTED,
    title: "Bắt đầu đóng gói",
    note: note || "Admin bắt đầu đóng gói đơn.",
  });

  return updateOrderStatus(orderId, ORDER_STATUS.PACKING, note || "Bắt đầu đóng gói.", { force: true });
}

export function markPackedAndReadyToShip(orderId, note = "") {
  return addFulfillmentEvent(orderId, {
    type: FULFILLMENT_EVENT_TYPE.PACKED,
    title: "Đã đóng gói",
    note: note || "Đơn hàng đã đóng gói, sẵn sàng bàn giao vận chuyển.",
  });
}

export function markShipped(orderId, shippingInfo = {}, note = "") {
  const now = nowIso();

  const orders = getOrders().map((order) => {
    if (order.id !== orderId && order.orderCode !== orderId) return order;

    const fulfillmentEvents = Array.isArray(order.fulfillmentEvents)
      ? order.fulfillmentEvents
      : [];

    return {
      ...order,
      status: ORDER_STATUS.SHIPPING,
      shippingInfo: {
        ...(order.shippingInfo || {}),
        carrier: shippingInfo.carrier || order.shippingInfo?.carrier || "",
        trackingCode: shippingInfo.trackingCode || order.shippingInfo?.trackingCode || "",
        eta: shippingInfo.eta || order.shippingInfo?.eta || "",
      },
      fulfillmentEvents: [
        ...fulfillmentEvents,
        {
          id: `FUL-${Date.now()}`,
          type: FULFILLMENT_EVENT_TYPE.SHIPPED,
          note: note || "Đơn hàng đã bàn giao vận chuyển.",
          createdAt: now,
          createdBy: "admin",
        },
      ],
      updatedAt: now,
      timeline: [
        ...(order.timeline || []),
        {
          status: ORDER_STATUS.SHIPPING,
          time: now,
          title: "Đã bàn giao vận chuyển",
          note:
            note ||
            `Carrier: ${shippingInfo.carrier || "-"}, Tracking: ${shippingInfo.trackingCode || "-"}`,
        },
      ],
    };
  });

  saveOrders(orders);
  return orders;
}
