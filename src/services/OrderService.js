import { normalizeItems, calcSubtotal } from "./PricingService";
import { reduceStock, restoreStock, logOrderStockReservation, logOrderStockRestore } from "./InventoryService";
import {
  ORDER_TYPE,
  ORDER_STATUS,
  PAYMENT_STATUS,
  PREORDER_STATUS,
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  getNextOrderStatus,
  getAllowedNextOrderStatuses,
  canTransitionOrderStatus,
  isTerminalOrderStatus,
  normalizePhone,
  canCustomerCancelDirect,
  canCustomerRequestCancel,
  canCustomerRequestReturn,
} from "../constants/orderConfig";

const CMS_KEY = "gundam-cms-state";

export {
  ORDER_TYPE,
  ORDER_STATUS,
  PAYMENT_STATUS,
  PREORDER_STATUS,
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  getNextOrderStatus,
  getAllowedNextOrderStatuses,
  canTransitionOrderStatus,
  isTerminalOrderStatus,
  canCustomerCancelDirect,
  canCustomerRequestCancel,
  canCustomerRequestReturn,
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
  const orderType = payload.orderType || ORDER_TYPE.NORMAL;
  const isPreorder = orderType === ORDER_TYPE.PREORDER;

  const subtotal = calcSubtotal(items);
  const shippingFee = isPreorder ? 0 : Number(payload.shippingFee) || 0;
  const discount = isPreorder ? 0 : Number(payload.discount) || 0;
  const shippingDiscount = isPreorder ? 0 : Number(payload.shippingDiscount) || 0;

  const preorder = isPreorder
    ? {
        status: payload.preorder?.status || PREORDER_STATUS.DEPOSIT_PENDING,
        eta: payload.preorder?.eta || "",
        fullAmount: Number(payload.preorder?.fullAmount || subtotal || 0),
        depositRate: Number(payload.preorder?.depositRate || 0.3),
        depositAmount: Number(payload.preorder?.depositAmount || payload.total || 0),
        remainingAmount: Number(payload.preorder?.remainingAmount || 0),
        depositStatus: payload.preorder?.depositStatus || PAYMENT_STATUS.UNPAID,
        balanceStatus: payload.preorder?.balanceStatus || PAYMENT_STATUS.UNPAID,
      }
    : null;

  const total = isPreorder
    ? Number(preorder?.depositAmount || payload.total || 0)
    : Math.max(0, subtotal + shippingFee - discount - shippingDiscount);

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

    voucherCode: isPreorder ? "" : payload.voucherCode || "",
    paymentMethod: payload.paymentMethod || "COD",
    paymentStatus: payload.paymentStatus || PAYMENT_STATUS.UNPAID,
    shippingMethod: payload.shippingMethod || "FAST",

    preorder,

    status: payload.status || ORDER_STATUS.PLACED,

    timeline: [
      {
        status: payload.status || ORDER_STATUS.PLACED,
        time: now,
        title: isPreorder ? "Tạo đơn pre-order" : "Đặt hàng thành công",
        note: isPreorder
          ? `Khách hàng đã tạo đơn pre-order. Tiền cọc: ${preorder.depositAmount.toLocaleString("vi-VN")}đ.`
          : "Khách hàng đã tạo đơn hàng.",
      },
    ],

    cancelRequest: null,
    returnRequest: null,
    adminNote: "",
  };

  reduceStock(order.items);
  logOrderStockReservation(order);

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
    logOrderStockRestore(currentOrder, "Stock restored because order was cancelled.");
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


export function findOrderForSecureLookup(orderCode = "", phone = "") {
  const code = String(orderCode || "").trim().toLowerCase();
  const normalizedPhone = normalizePhone(phone);

  if (!code || !normalizedPhone) return null;

  return (
    getOrders().find((order) => {
      const orderId = String(order.id || "").toLowerCase();
      const publicCode = String(order.orderCode || "").toLowerCase();
      const customerPhone = normalizePhone(order.customer?.phone || "");

      return (orderId === code || publicCode === code) && customerPhone === normalizedPhone;
    }) || null
  );
}

export function cancelOrderDirectly(orderId, reason = "", note = "") {
  const order = getOrderById(orderId);

  if (!order) {
    throw new Error("Order not found.");
  }

  if (!canCustomerCancelDirect(order.status)) {
    throw new Error("This order cannot be cancelled directly.");
  }

  return updateOrderStatus(
    order.id,
    ORDER_STATUS.CANCELLED,
    note || reason || "Khách hàng đã hủy đơn.",
    { force: false }
  );
}

export function requestReturnOrder(orderId, reason = "", note = "") {
  const now = new Date().toISOString();
  const order = getOrderById(orderId);

  if (!order) {
    throw new Error("Order not found.");
  }

  if (!canCustomerRequestReturn(order.status)) {
    throw new Error("This order is not eligible for return/refund request.");
  }

  const orders = getOrders().map((item) =>
    item.id === order.id || item.orderCode === order.id
      ? {
          ...item,
          returnRequest: {
            requested: true,
            reason,
            note,
            status: "Pending",
            requestedAt: now,
          },
          updatedAt: now,
          timeline: [
            ...(item.timeline || []),
            {
              status: item.status,
              time: now,
              title: "Yêu cầu trả hàng/hoàn tiền",
              note: note || reason || "Khách hàng đã gửi yêu cầu trả hàng/hoàn tiền.",
            },
          ],
        }
      : item
  );

  saveOrders(orders);
  return orders;
}


function updatePreorderOrder(orderId, updater, timelineTitle, timelineNote = "") {
  const now = new Date().toISOString();
  const order = getOrderById(orderId);

  if (!order) {
    throw new Error("Order not found.");
  }

  if (order.orderType !== ORDER_TYPE.PREORDER || !order.preorder) {
    throw new Error("This is not a preorder order.");
  }

  const orders = getOrders().map((item) => {
    if (item.id !== order.id && item.orderCode !== order.id) return item;

    const nextValue = updater(item, now);

    return {
      ...item,
      ...nextValue,
      updatedAt: now,
      timeline: [
        ...(item.timeline || []),
        {
          status: nextValue.status || item.status,
          time: now,
          title: timelineTitle,
          note: timelineNote || timelineTitle,
        },
      ],
    };
  });

  saveOrders(orders);
  return orders;
}

export function confirmPreorderDeposit(orderId, adminNote = "") {
  return updatePreorderOrder(
    orderId,
    (order) => ({
      preorder: {
        ...(order.preorder || {}),
        status: PREORDER_STATUS.DEPOSIT_PAID,
        depositStatus: PAYMENT_STATUS.PAID,
        depositConfirmedAt: new Date().toISOString(),
      },
      paymentStatus: PAYMENT_STATUS.PAID,
      status: order.status === ORDER_STATUS.PLACED ? ORDER_STATUS.CONFIRMED : order.status,
    }),
    "Xác nhận cọc pre-order",
    adminNote || "Admin đã xác nhận tiền cọc pre-order."
  );
}

export function updatePreorderEta(orderId, eta = "", adminNote = "") {
  const cleanEta = String(eta || "").trim();

  if (!cleanEta) {
    throw new Error("ETA is required.");
  }

  return updatePreorderOrder(
    orderId,
    (order) => ({
      preorder: {
        ...(order.preorder || {}),
        eta: cleanEta,
      },
    }),
    "Cập nhật ETA pre-order",
    adminNote || `ETA mới: ${cleanEta}`
  );
}

export function markPreorderWaitingArrival(orderId, adminNote = "") {
  return updatePreorderOrder(
    orderId,
    (order) => ({
      preorder: {
        ...(order.preorder || {}),
        status: PREORDER_STATUS.WAITING_ARRIVAL,
      },
    }),
    "Pre-order đang chờ hàng về",
    adminNote || "Đơn pre-order đã chuyển sang trạng thái chờ hàng về."
  );
}

export function markPreorderReadyForBalance(orderId, adminNote = "") {
  return updatePreorderOrder(
    orderId,
    (order) => ({
      preorder: {
        ...(order.preorder || {}),
        status: PREORDER_STATUS.READY_FOR_BALANCE,
        readyForBalanceAt: new Date().toISOString(),
      },
    }),
    "Hàng pre-order đã về",
    adminNote || "Hàng đã về, cần thông báo khách thanh toán phần còn lại."
  );
}

export function confirmPreorderBalance(orderId, adminNote = "") {
  return updatePreorderOrder(
    orderId,
    (order) => ({
      preorder: {
        ...(order.preorder || {}),
        status: PREORDER_STATUS.BALANCE_PAID,
        balanceStatus: PAYMENT_STATUS.PAID,
        balanceConfirmedAt: new Date().toISOString(),
      },
      status: order.status === ORDER_STATUS.PLACED ? ORDER_STATUS.CONFIRMED : order.status,
    }),
    "Xác nhận thanh toán phần còn lại",
    adminNote || "Admin đã xác nhận khách thanh toán phần còn lại."
  );
}


export function requestPreorderBalancePayment(orderId, note = "") {
  const now = new Date().toISOString();
  const order = getOrderById(orderId);

  if (!order) {
    throw new Error("Order not found.");
  }

  if (order.orderType !== ORDER_TYPE.PREORDER || !order.preorder) {
    throw new Error("This is not a preorder order.");
  }

  if (order.preorder.status !== PREORDER_STATUS.READY_FOR_BALANCE) {
    throw new Error("This preorder is not ready for balance payment.");
  }

  if (order.preorder.balanceStatus === PAYMENT_STATUS.PAID) {
    throw new Error("Balance payment was already confirmed.");
  }

  const orders = getOrders().map((item) =>
    item.id === order.id || item.orderCode === order.id
      ? {
          ...item,
          preorder: {
            ...(item.preorder || {}),
            balancePaymentRequest: {
              requested: true,
              status: "Pending",
              note,
              requestedAt: now,
            },
          },
          updatedAt: now,
          timeline: [
            ...(item.timeline || []),
            {
              status: item.status,
              time: now,
              title: "Khách báo đã thanh toán phần còn lại",
              note: note || "Khách hàng đã gửi xác nhận thanh toán phần còn lại cho đơn pre-order.",
            },
          ],
        }
      : item
  );

  saveOrders(orders);
  return orders;
}

export function resolvePreorderBalancePayment(orderId, decision = "Rejected", adminNote = "") {
  const now = new Date().toISOString();
  const order = getOrderById(orderId);

  if (!order) {
    throw new Error("Order not found.");
  }

  if (order.orderType !== ORDER_TYPE.PREORDER || !order.preorder) {
    throw new Error("This is not a preorder order.");
  }

  const approved = decision === "Approved";

  const orders = getOrders().map((item) =>
    item.id === order.id || item.orderCode === order.id
      ? {
          ...item,
          status:
            approved && item.status === ORDER_STATUS.PLACED
              ? ORDER_STATUS.CONFIRMED
              : item.status,
          preorder: {
            ...(item.preorder || {}),
            status: approved ? PREORDER_STATUS.BALANCE_PAID : item.preorder?.status,
            balanceStatus: approved ? PAYMENT_STATUS.PAID : item.preorder?.balanceStatus,
            balanceConfirmedAt: approved ? now : item.preorder?.balanceConfirmedAt,
            balancePaymentRequest: {
              ...(item.preorder?.balancePaymentRequest || {}),
              status: approved ? "Approved" : "Rejected",
              resolvedAt: now,
              adminNote,
            },
          },
          updatedAt: now,
          timeline: [
            ...(item.timeline || []),
            {
              status: approved ? ORDER_STATUS.CONFIRMED : item.status,
              time: now,
              title: approved
                ? "Admin xác nhận thanh toán phần còn lại"
                : "Admin từ chối xác nhận thanh toán phần còn lại",
              note:
                adminNote ||
                (approved
                  ? "Admin đã xác nhận khách thanh toán phần còn lại cho đơn pre-order."
                  : "Admin đã từ chối xác nhận thanh toán phần còn lại."),
            },
          ],
        }
      : item
  );

  saveOrders(orders);
  return orders;
}
