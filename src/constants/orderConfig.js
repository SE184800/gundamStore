export const ORDER_TYPE = {
  NORMAL: "normal",
  PREORDER: "preorder",
};

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

export const ORDER_STATUS_SEQUENCE = [
  ORDER_STATUS.PLACED,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PACKING,
  ORDER_STATUS.SHIPPING,
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.COMPLETED,
];

export const ORDER_STATUS_OPTIONS = Object.values(ORDER_STATUS);

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PLACED]: { vi: "Chờ xác nhận", en: "Placed" },
  [ORDER_STATUS.CONFIRMED]: { vi: "Đã xác nhận", en: "Confirmed" },
  [ORDER_STATUS.PACKING]: { vi: "Đang đóng gói", en: "Packing" },
  [ORDER_STATUS.SHIPPING]: { vi: "Đang giao", en: "Shipping" },
  [ORDER_STATUS.DELIVERED]: { vi: "Đã giao", en: "Delivered" },
  [ORDER_STATUS.COMPLETED]: { vi: "Hoàn tất", en: "Completed" },
  [ORDER_STATUS.CANCELLED]: { vi: "Đã hủy", en: "Cancelled" },
  [ORDER_STATUS.REFUNDED]: { vi: "Đã hoàn tiền", en: "Refunded" },
};

export const ORDER_STATUS_TONE_CLASS = {
  [ORDER_STATUS.PLACED]: "bg-slate-100 text-slate-700",
  [ORDER_STATUS.CONFIRMED]: "bg-amber-100 text-amber-700",
  [ORDER_STATUS.PACKING]: "bg-purple-100 text-purple-700",
  [ORDER_STATUS.SHIPPING]: "bg-blue-100 text-blue-700",
  [ORDER_STATUS.DELIVERED]: "bg-emerald-100 text-emerald-700",
  [ORDER_STATUS.COMPLETED]: "bg-green-100 text-green-700",
  [ORDER_STATUS.CANCELLED]: "bg-red-100 text-red-700",
  [ORDER_STATUS.REFUNDED]: "bg-orange-100 text-orange-700",
};

export const ORDER_ALLOWED_TRANSITIONS = {
  [ORDER_STATUS.PLACED]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PACKING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PACKING]: [ORDER_STATUS.SHIPPING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SHIPPING]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.REFUNDED],
  [ORDER_STATUS.COMPLETED]: [ORDER_STATUS.REFUNDED],
  [ORDER_STATUS.CANCELLED]: [],
  [ORDER_STATUS.REFUNDED]: [],
};

export const PAYMENT_STATUS = {
  UNPAID: "Unpaid",
  PAID: "Paid",
  REFUNDED: "Refunded",
};

export const PAYMENT_STATUS_OPTIONS = Object.values(PAYMENT_STATUS);

export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUS.UNPAID]: { vi: "Chưa thanh toán", en: "Unpaid" },
  [PAYMENT_STATUS.PAID]: { vi: "Đã thanh toán", en: "Paid" },
  [PAYMENT_STATUS.REFUNDED]: { vi: "Đã hoàn tiền", en: "Refunded" },
};

export const PAYMENT_METHODS = [
  { value: "COD", label: { vi: "COD - Thanh toán khi nhận hàng", en: "COD - Cash on delivery" } },
  { value: "BANK", label: { vi: "Chuyển khoản ngân hàng", en: "Bank transfer" } },
  { value: "MOMO", label: { vi: "Ví MoMo", en: "MoMo wallet" } },
];

export const SHIPPING_METHODS = [
  {
    value: "FAST",
    fee: 30000,
    label: { vi: "Giao nhanh", en: "Fast delivery" },
    desc: { vi: "Dự kiến 1-3 ngày", en: "Estimated 1-3 days" },
  },
  {
    value: "EXPRESS",
    fee: 60000,
    label: { vi: "Hỏa tốc", en: "Express delivery" },
    desc: { vi: "Ưu tiên xử lý, nội thành", en: "Priority handling, urban areas" },
  },
];

export const CANCEL_REASONS = [
  { value: "changed_mind", label: { vi: "Đổi ý không mua nữa", en: "Changed mind" } },
  { value: "wrong_item", label: { vi: "Đặt nhầm sản phẩm", en: "Wrong item ordered" } },
  { value: "duplicate_order", label: { vi: "Đặt trùng đơn", en: "Duplicate order" } },
  { value: "payment_issue", label: { vi: "Vấn đề thanh toán", en: "Payment issue" } },
  { value: "other", label: { vi: "Lý do khác", en: "Other reason" } },
];

export const PREORDER_STATUS = {
  DEPOSIT_PENDING: "DepositPending",
  DEPOSIT_PAID: "DepositPaid",
  WAITING_ARRIVAL: "WaitingArrival",
  READY_FOR_BALANCE: "ReadyForBalance",
  BALANCE_PAID: "BalancePaid",
};

export function getLocalized(value, lang = "vi", fallback = "") {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  return value[lang] || value.vi || value.en || fallback;
}

export function getOrderStatusLabel(status, lang = "vi") {
  return getLocalized(ORDER_STATUS_LABELS[status], lang, status || "-");
}

export function getPaymentStatusLabel(status, lang = "vi") {
  return getLocalized(PAYMENT_STATUS_LABELS[status], lang, status || "-");
}

export function getOrderStatusToneClass(status) {
  return ORDER_STATUS_TONE_CLASS[status] || ORDER_STATUS_TONE_CLASS[ORDER_STATUS.PLACED];
}

export function getAllowedNextOrderStatuses(status) {
  return ORDER_ALLOWED_TRANSITIONS[status] || [];
}

export function canTransitionOrderStatus(fromStatus, toStatus) {
  if (!fromStatus || !toStatus) return false;
  if (fromStatus === toStatus) return true;
  return getAllowedNextOrderStatuses(fromStatus).includes(toStatus);
}

export function getNextOrderStatus(status) {
  const index = ORDER_STATUS_SEQUENCE.indexOf(status);
  if (index < 0) return ORDER_STATUS.CONFIRMED;
  return ORDER_STATUS_SEQUENCE[index + 1] || null;
}

export function isTerminalOrderStatus(status) {
  return [ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED, ORDER_STATUS.COMPLETED].includes(status);
}

export function getOrderStatusOptions(lang = "vi", includeAll = false) {
  const base = ORDER_STATUS_SEQUENCE
    .concat([ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED])
    .map((value) => ({
      value,
      label: getOrderStatusLabel(value, lang),
    }));

  return includeAll ? [{ value: "all", label: lang === "en" ? "All" : "Tất cả" }, ...base] : base;
}

export function getPaymentStatusOptions(lang = "vi") {
  return Object.values(PAYMENT_STATUS).map((value) => ({
    value,
    label: getPaymentStatusLabel(value, lang),
  }));
}

export function getShippingMethod(value) {
  return SHIPPING_METHODS.find((item) => item.value === value) || SHIPPING_METHODS[0];
}

export function maskPhone(phone = "") {
  const raw = String(phone || "").replace(/\s+/g, "");
  if (raw.length < 7) return raw;
  return `${raw.slice(0, 3)}***${raw.slice(-3)}`;
}

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
