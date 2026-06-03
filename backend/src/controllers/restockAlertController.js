import { z } from "zod";
import { prisma } from "../config/prisma.js";

function cleanText(value = "", max = 255) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizeVietnamPhone(value = "") {
  const raw = String(value || "").replace(/[\s.\-()]/g, "").trim();

  if (raw.startsWith("+84")) return `0${raw.slice(3)}`;
  if (raw.startsWith("84")) return `0${raw.slice(2)}`;

  return raw.replace(/[^0-9]/g, "");
}

function isValidVietnamPhone(value = "") {
  const phone = normalizeVietnamPhone(value);
  return /^0(3|5|7|8|9)\d{8}$/.test(phone);
}

function mapAlert(row = {}) {
  return {
    id: row.id,
    productId: row.productId,
    productName: row.productName,
    productSlug: row.productSlug || "",
    sku: row.sku || "",
    grade: row.grade || "",
    scale: row.scale || "",
    name: row.name,
    phone: row.phone,
    note: row.note || "",
    status: row.status,
    notifiedAt: row.notifiedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const createRestockAlertSchema = z.object({
  productId: z.string().max(120).optional().or(z.literal("")),
  sku: z.string().max(120).optional().or(z.literal("")),
  slug: z.string().max(160).optional().or(z.literal("")),
  name: z.string().min(2).max(120),
  phone: z
    .string()
    .min(8)
    .max(20)
    .refine(isValidVietnamPhone, "Số điện thoại Việt Nam không hợp lệ."),
  note: z.string().max(300).optional().or(z.literal("")),
});

async function resolveProduct(body = {}) {
  const conditions = [
    body.productId ? { id: body.productId } : null,
    body.sku ? { sku: body.sku } : null,
    body.slug ? { slug: body.slug } : null,
  ].filter(Boolean);

  if (conditions.length === 0) return null;

  return prisma.product.findFirst({
    where: {
      active: true,
      OR: conditions,
    },
  });
}

export async function createRestockAlert(req, res, next) {
  try {
    const body = createRestockAlertSchema.parse(req.body || {});
    const phone = normalizeVietnamPhone(body.phone);
    const product = await resolveProduct(body);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm.",
      });
    }

    const duplicated = await prisma.restockAlert.findFirst({
      where: {
        productId: product.id,
        phone,
        status: "PENDING",
      },
    });

    if (duplicated) {
      return res.status(409).json({
        success: false,
        message: "Số điện thoại này đã đăng ký báo hàng cho sản phẩm.",
        alert: mapAlert(duplicated),
      });
    }

    const alert = await prisma.restockAlert.create({
      data: {
        productId: product.id,
        productName: product.nameVi || product.nameEn || product.sku,
        productSlug: product.slug || null,
        sku: product.sku || null,
        grade: product.grade || null,
        scale: product.scale || null,
        name: cleanText(body.name, 120),
        phone,
        note: cleanText(body.note || "", 300) || null,
        status: "PENDING",
      },
    });

    return res.status(201).json({
      success: true,
      alert: mapAlert(alert),
    });
  } catch (err) {
    next(err);
  }
}

export async function listAdminRestockAlerts(req, res, next) {
  try {
    const status = cleanText(req.query.status || "", 30).toUpperCase();

    const rows = await prisma.restockAlert.findMany({
      where: status && status !== "ALL" ? { status } : {},
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    return res.json({
      success: true,
      alerts: rows.map(mapAlert),
      summary: {
        total: rows.length,
        pending: rows.filter((row) => row.status === "PENDING").length,
        notified: rows.filter((row) => row.status === "NOTIFIED").length,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function markRestockAlertNotified(req, res, next) {
  try {
    const id = cleanText(req.params.id || "", 120);

    const alert = await prisma.restockAlert.update({
      where: { id },
      data: {
        status: "NOTIFIED",
        notifiedAt: new Date(),
      },
    });

    return res.json({
      success: true,
      alert: mapAlert(alert),
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteRestockAlert(req, res, next) {
  try {
    const id = cleanText(req.params.id || "", 120);

    await prisma.restockAlert.delete({
      where: { id },
    });

    return res.json({
      success: true,
    });
  } catch (err) {
    next(err);
  }
}
