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

export function getOrderErrorCode(error) {
  return error?.data?.code || "";
}

export function getOrderErrorMessage(error, lang = "vi") {
  const code = getOrderErrorCode(error);
  const entry = ORDER_ERROR_MESSAGES[code];
  if (entry) return lang === "en" ? entry.en : entry.vi;
  return lang === "en" ? DEFAULT_MESSAGE.en : DEFAULT_MESSAGE.vi;
}
