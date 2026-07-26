import { apiRequest } from "./ApiClient";

export async function validateStorefrontVoucherApi(payload = {}) {
  const data = await apiRequest("/api/vouchers/validate", {
    method: "POST",
    token: "",
    body: JSON.stringify(payload),
  });

  return data;
}

const VOUCHER_MESSAGE_MAP_VI = {
  "Voucher code is required.": "Vui lòng nhập mã giảm giá.",
  "Voucher is invalid or inactive.": "Mã giảm giá không hợp lệ hoặc đã hết hiệu lực.",
  "Voucher is not effective at this time.": "Mã giảm giá chưa/không còn hiệu lực ở thời điểm này.",
  "Voucher usage limit reached.": "Mã giảm giá đã hết lượt sử dụng.",
  "Voucher customer usage limit reached.": "Bạn đã dùng hết số lượt cho phép của mã này.",
  "Voucher does not apply to selected products.": "Mã giảm giá không áp dụng cho sản phẩm trong giỏ.",
  "Voucher applied.": "Áp dụng mã giảm giá thành công.",
};

export function translateVoucherMessage(message = "", lang = "vi") {
  const raw = String(message || "").trim();
  if (!raw || lang === "en") return raw;

  if (VOUCHER_MESSAGE_MAP_VI[raw]) return VOUCHER_MESSAGE_MAP_VI[raw];

  const minOrderMatch = raw.match(/^Minimum order is ([\d,.]+)đ\.?$/i);
  if (minOrderMatch) {
    return `Đơn tối thiểu ${minOrderMatch[1]}đ để dùng mã này.`;
  }

  return raw;
}
