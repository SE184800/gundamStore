const ORDER_ERROR_MESSAGES = {
  VALIDATION_ERROR: {
    vi: "Thông tin đơn hàng chưa hợp lệ. Vui lòng kiểm tra lại.",
    en: "Order information is invalid. Please check again.",
  },
  PRODUCT_NOT_FOUND: {
    vi: "Sản phẩm không còn tồn tại. Vui lòng tải lại giỏ hàng.",
    en: "Product no longer exists. Please reload your cart.",
  },
  VARIANT_NOT_FOUND: {
    vi: "Phân loại sản phẩm không còn tồn tại. Vui lòng chọn lại.",
    en: "This product variant no longer exists. Please choose again.",
  },
  PRODUCT_INACTIVE: {
    vi: "Sản phẩm hiện đã ngừng kinh doanh.",
    en: "This product is no longer available.",
  },
  OUT_OF_STOCK: {
    vi: "Sản phẩm đã hết hàng.",
    en: "This product is out of stock.",
  },
  INSUFFICIENT_STOCK: {
    vi: "Số lượng trong kho không đủ. Vui lòng giảm số lượng.",
    en: "Not enough stock available. Please reduce the quantity.",
  },
  PREORDER_CLOSED: {
    vi: "Đợt pre-order này đã đóng.",
    en: "This pre-order batch is closed.",
  },
  PREORDER_LIMIT_REACHED: {
    vi: "Đã đạt giới hạn số lượng pre-order.",
    en: "The pre-order limit has been reached.",
  },
  PRICE_CHANGED: {
    vi: "Giá sản phẩm đã thay đổi. Giỏ hàng của bạn đã được cập nhật giá mới, vui lòng kiểm tra lại trước khi đặt hàng.",
    en: "The product price has changed. Your cart has been updated with the new price — please review before ordering.",
  },
  ORDER_ALREADY_CREATED: {
    vi: "Đơn hàng này đã được tạo trước đó.",
    en: "This order has already been created.",
  },
};

const DEFAULT_MESSAGE = {
  vi: "Không thể tạo đơn hàng. Vui lòng thử lại.",
  en: "Cannot create the order. Please try again.",
};

// Codes where the backend's `detail` identifies a single failing cart line
// (product/variant/SKU) — for these we prefix the message with that item's
// real name instead of leaving the customer to guess which product failed.
const ITEM_SPECIFIC_CODES = new Set([
  "PRODUCT_NOT_FOUND",
  "VARIANT_NOT_FOUND",
  "PRODUCT_INACTIVE",
  "OUT_OF_STOCK",
  "INSUFFICIENT_STOCK",
  "PREORDER_CLOSED",
  "PREORDER_LIMIT_REACHED",
]);

export function getOrderErrorCode(error) {
  return error?.data?.code || "";
}

export function getOrderErrorDetail(error) {
  return error?.data?.detail || null;
}

export function isItemSpecificOrderError(code) {
  return ITEM_SPECIFIC_CODES.has(code);
}

export function getOrderErrorMessage(error, lang = "vi") {
  const code = getOrderErrorCode(error);
  const entry = ORDER_ERROR_MESSAGES[code];
  if (entry) return lang === "en" ? entry.en : entry.vi;
  return lang === "en" ? DEFAULT_MESSAGE.en : DEFAULT_MESSAGE.vi;
}

// Finds which cart line a backend item-specific error refers to, matching on
// whatever identifiers the backend's `detail` payload included.
export function findDraftItemForOrderError(items = [], detail = null) {
  if (!detail || !Array.isArray(items) || !items.length) return null;

  return (
    (detail.sku && items.find((item) => item.sku === detail.sku || item.variantSku === detail.sku)) ||
    (detail.variantId && items.find((item) => item.variantId === detail.variantId)) ||
    (detail.productId &&
      items.find((item) => item.productId === detail.productId || item.id === detail.productId)) ||
    null
  );
}

// Builds the final customer-facing message for an order-creation error,
// naming the specific product when the backend told us which one failed
// (e.g. "Tên sản phẩm: chỉ còn 3 sản phẩm trong kho." instead of a generic
// "not enough stock" that leaves the customer guessing which cart line it is).
export function getDetailedOrderErrorMessage(error, lang = "vi", itemName = "") {
  const code = getOrderErrorCode(error);
  const detail = getOrderErrorDetail(error);
  const baseMessage = getOrderErrorMessage(error, lang);

  if (!itemName || !isItemSpecificOrderError(code)) return baseMessage;

  if (code === "INSUFFICIENT_STOCK" && Number.isFinite(Number(detail?.availableStock))) {
    return lang === "en"
      ? `"${itemName}": only ${detail.availableStock} left in stock.`
      : `"${itemName}": chỉ còn ${detail.availableStock} sản phẩm trong kho.`;
  }

  return `"${itemName}": ${baseMessage}`;
}
