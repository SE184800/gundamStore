import { getPromotions } from "./PromotionService";
export const VOUCHERS = [
  {
    code: "GUNDAM10",
    name: "Giảm 10%",
    type: "PERCENT",
    value: 10,
    minOrder: 0,
  },
  {
    code: "FREESHIP",
    name: "Miễn phí vận chuyển",
    type: "FREESHIP",
    value: 30000,
    minOrder: 300000,
  },
  {
    code: "VIP50",
    name: "Giảm 50.000đ",
    type: "AMOUNT",
    value: 50000,
    minOrder: 500000,
  },
];

export function applyVoucher(code, subtotal, shippingFee) {
  const voucher = VOUCHERS.find(
    (v) => v.code === String(code || "").trim().toUpperCase()
  );

  if (!voucher) {
    return {
      valid: false,
      message: "Mã khuyến mãi không hợp lệ.",
      discount: 0,
      shippingDiscount: 0,
      voucher: null,
    };
  }

  if (subtotal < voucher.minOrder) {
    return {
      valid: false,
      message: `Đơn tối thiểu ${voucher.minOrder.toLocaleString("vi-VN")}đ.`,
      discount: 0,
      shippingDiscount: 0,
      voucher,
    };
  }

  if (voucher.type === "PERCENT") {
    return {
      valid: true,
      message: voucher.name,
      discount: Math.round((subtotal * voucher.value) / 100),
      shippingDiscount: 0,
      voucher,
    };
  }

  if (voucher.type === "AMOUNT") {
    return {
      valid: true,
      message: voucher.name,
      discount: voucher.value,
      shippingDiscount: 0,
      voucher,
    };
  }

  if (voucher.type === "FREESHIP") {
    return {
      valid: true,
      message: voucher.name,
      discount: 0,
      shippingDiscount: Math.min(shippingFee, voucher.value),
      voucher,
    };
  }

  return {
    valid: false,
    message: "Mã không áp dụng được.",
    discount: 0,
    shippingDiscount: 0,
    voucher: null,
  };
}


function applyDynamicPromotion(code, subtotal, shippingFee) {
  const normalized = String(code || "").trim().toUpperCase();
  if (!normalized) return null;

  const promo = getPromotions().find((item) => item.active !== false && item.code === normalized);
  if (!promo) return null;

  if ((Number(subtotal) || 0) < (Number(promo.minOrder) || 0)) {
    return {
      valid: false,
      discount: 0,
      shippingDiscount: 0,
      message: `Voucher cần đơn tối thiểu ${(Number(promo.minOrder) || 0).toLocaleString("vi-VN")}đ`,
    };
  }

  if (promo.type === "shipping") {
    const shippingDiscount = Math.min(
      Number(shippingFee) || 0,
      Number(promo.maxDiscount) || Number(promo.value) || 0
    );

    return {
      valid: true,
      discount: 0,
      shippingDiscount,
      message: "Áp dụng freeship thành công.",
    };
  }

  if (promo.type === "percent") {
    const raw = (Number(subtotal) || 0) * ((Number(promo.value) || 0) / 100);
    const discount = Math.min(raw, Number(promo.maxDiscount) || raw);

    return {
      valid: true,
      discount,
      shippingDiscount: 0,
      message: "Áp dụng mã giảm giá thành công.",
    };
  }

  const discount = Math.min(
    Number(promo.value) || 0,
    Number(subtotal) || 0,
    Number(promo.maxDiscount) || Number(promo.value) || 0
  );

  return {
    valid: true,
    discount,
    shippingDiscount: 0,
    message: "Áp dụng mã giảm giá thành công.",
  };
}
