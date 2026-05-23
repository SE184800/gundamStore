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
