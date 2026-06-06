import { z } from "zod";
import { prisma } from "../config/prisma.js";

const voucherSchema = z.object({
  code: z.string().min(2).max(40),
  nameVi: z.string().min(2).max(160),
  nameEn: z.string().max(160).optional().or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
  type: z.enum(["PERCENT", "AMOUNT", "FREESHIP"]).default("PERCENT"),
  value: z.number().int().min(0),
  maxDiscount: z.number().int().min(0).default(0),
  minOrder: z.number().int().min(0).default(0),
  usageLimit: z.number().int().min(0).default(0),
  usageLimitPerCustomer: z.number().int().min(0).default(0),
  startDate: z.string().min(4),
  endDate: z.string().optional().or(z.literal("")),
  active: z.boolean().default(true),
  stackable: z.boolean().default(false),
  firstOrderOnly: z.boolean().default(false),
  productIds: z.array(z.string()).optional().default([]),
  categoryIds: z.array(z.string()).optional().default([]),
  note: z.string().max(500).optional().or(z.literal("")),
});

function normalizeCode(code = "") {
  return String(code || "").trim().toUpperCase();
}

function intValue(value = 0) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
}

function toDate(value, fallback = new Date()) {
  const date = value ? new Date(value) : fallback;
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function parseJsonList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function sanitizeVoucherInput(body = {}) {
  const parsed = voucherSchema.parse({
    ...body,
    code: normalizeCode(body.code),
    value: intValue(body.value),
    maxDiscount: intValue(body.maxDiscount),
    minOrder: intValue(body.minOrder),
    usageLimit: intValue(body.usageLimit),
    usageLimitPerCustomer: intValue(body.usageLimitPerCustomer),
    active: body.active !== false,
    stackable: body.stackable === true,
    firstOrderOnly: body.firstOrderOnly === true,
  });

  if (parsed.type === "PERCENT" && parsed.value > 100) {
    const error = new Error("Percent voucher cannot exceed 100%.");
    error.status = 400;
    throw error;
  }

  const startDate = toDate(parsed.startDate);
  const endDate = parsed.endDate ? toDate(parsed.endDate) : null;

  if (endDate && endDate < startDate) {
    const error = new Error("Voucher end date must be after start date.");
    error.status = 400;
    throw error;
  }

  return {
    code: parsed.code,
    nameVi: parsed.nameVi,
    nameEn: parsed.nameEn || parsed.nameVi,
    description: parsed.description || null,
    type: parsed.type,
    value: parsed.value,
    maxDiscount: parsed.maxDiscount,
    minOrder: parsed.minOrder,
    usageLimit: parsed.usageLimit,
    usageLimitPerCustomer: parsed.usageLimitPerCustomer,
    startDate,
    endDate,
    active: parsed.active,
    stackable: parsed.stackable,
    firstOrderOnly: parsed.firstOrderOnly,
    productIds: parsed.productIds || [],
    categoryIds: parsed.categoryIds || [],
    note: parsed.note || null,
  };
}

export async function resolveVoucherDiscount({
  code,
  subtotal = 0,
  shippingFee = 0,
  items = [],
  customerId = null,
  customerPhone = "",
  now = new Date(),
} = {}) {
  const normalizedCode = normalizeCode(code);

  if (!normalizedCode) {
    return {
      valid: false,
      code: "",
      message: "Voucher code is required.",
      discount: 0,
      shippingDiscount: 0,
      voucher: null,
    };
  }

  const voucher = await prisma.voucher.findUnique({
    where: { code: normalizedCode },
  });

  if (!voucher || voucher.active === false) {
    return {
      valid: false,
      code: normalizedCode,
      message: "Voucher is invalid or inactive.",
      discount: 0,
      shippingDiscount: 0,
      voucher: null,
    };
  }

  if (voucher.startDate > now || (voucher.endDate && voucher.endDate < now)) {
    return {
      valid: false,
      code: normalizedCode,
      message: "Voucher is not effective at this time.",
      discount: 0,
      shippingDiscount: 0,
      voucher,
    };
  }

  const safeSubtotal = intValue(subtotal);
  const safeShipping = intValue(shippingFee);

  if (safeSubtotal < intValue(voucher.minOrder)) {
    return {
      valid: false,
      code: normalizedCode,
      message: `Minimum order is ${intValue(voucher.minOrder).toLocaleString("vi-VN")}đ.`,
      discount: 0,
      shippingDiscount: 0,
      voucher,
    };
  }

  if (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) {
    return {
      valid: false,
      code: normalizedCode,
      message: "Voucher usage limit reached.",
      discount: 0,
      shippingDiscount: 0,
      voucher,
    };
  }

  if (voucher.usageLimitPerCustomer > 0 && (customerId || customerPhone)) {
    const redeemed = await prisma.voucherRedemption.count({
      where: {
        voucherId: voucher.id,
        OR: [
          customerId ? { customerId } : undefined,
          customerPhone ? { order: { customerPhone } } : undefined,
        ].filter(Boolean),
      },
    });

    if (redeemed >= voucher.usageLimitPerCustomer) {
      return {
        valid: false,
        code: normalizedCode,
        message: "Voucher customer usage limit reached.",
        discount: 0,
        shippingDiscount: 0,
        voucher,
      };
    }
  }

  const productIds = parseJsonList(voucher.productIds);
  const categoryIds = parseJsonList(voucher.categoryIds);

  if (productIds.length || categoryIds.length) {
    const applicable = (items || []).some((item) => {
      return (
        productIds.includes(String(item.productId || item.id || "")) ||
        categoryIds.includes(String(item.categoryId || item.product?.categoryId || ""))
      );
    });

    if (!applicable) {
      return {
        valid: false,
        code: normalizedCode,
        message: "Voucher does not apply to selected products.",
        discount: 0,
        shippingDiscount: 0,
        voucher,
      };
    }
  }

  let discount = 0;
  let shippingDiscount = 0;

  if (voucher.type === "PERCENT") {
    const raw = Math.round(safeSubtotal * intValue(voucher.value) / 100);
    discount = voucher.maxDiscount > 0 ? Math.min(raw, voucher.maxDiscount) : raw;
  } else if (voucher.type === "AMOUNT") {
    discount = Math.min(intValue(voucher.value), safeSubtotal);
  } else if (voucher.type === "FREESHIP") {
    const cap = voucher.maxDiscount > 0 ? voucher.maxDiscount : intValue(voucher.value);
    shippingDiscount = Math.min(safeShipping, cap || safeShipping);
  }

  return {
    valid: true,
    code: voucher.code,
    message: "Voucher applied.",
    discount: Math.max(0, discount),
    shippingDiscount: Math.max(0, shippingDiscount),
    voucher,
  };
}

export async function listAdminVouchers(req, res, next) {
  try {
    const vouchers = await prisma.voucher.findMany({
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });

    res.json({ success: true, vouchers });
  } catch (error) {
    next(error);
  }
}

export async function createAdminVoucher(req, res, next) {
  try {
    const payload = sanitizeVoucherInput(req.body);

    const voucher = await prisma.voucher.create({
      data: payload,
    });

    res.json({ success: true, voucher });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminVoucher(req, res, next) {
  try {
    const payload = sanitizeVoucherInput(req.body);

    const voucher = await prisma.voucher.update({
      where: { id: req.params.id },
      data: payload,
    });

    res.json({ success: true, voucher });
  } catch (error) {
    next(error);
  }
}

export async function deleteAdminVoucher(req, res, next) {
  try {
    const voucher = await prisma.voucher.update({
      where: { id: req.params.id },
      data: { active: false },
    });

    res.json({ success: true, voucher });
  } catch (error) {
    next(error);
  }
}

export async function validateStorefrontVoucher(req, res, next) {
  try {
    const result = await resolveVoucherDiscount({
      code: req.body?.code,
      subtotal: req.body?.subtotal,
      shippingFee: req.body?.shippingFee,
      items: req.body?.items || [],
      customerId: req.user?.id || null,
      customerPhone: req.body?.customerPhone || "",
    });

    res.status(result.valid ? 200 : 400).json({
      success: result.valid,
      ...result,
      voucher: result.voucher
        ? {
            id: result.voucher.id,
            code: result.voucher.code,
            nameVi: result.voucher.nameVi,
            nameEn: result.voucher.nameEn,
            type: result.voucher.type,
            value: result.voucher.value,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
}
