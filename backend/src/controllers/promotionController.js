import { prisma } from "../config/prisma.js";

function intValue(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.round(n));
}

function parseDate(value, fallback = null) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date;
}

function normalizeCode(value = "") {
  return String(value || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function sanitizePromotion(body = {}) {
  const nameVi = String(body.nameVi || body.name?.vi || "").trim();
  const code = normalizeCode(body.code || nameVi);
  const type = String(body.type || "PERCENT").trim().toUpperCase();
  const value = intValue(body.value, 0);
  const startDate = parseDate(body.startDate, new Date());
  const endDate = parseDate(body.endDate, null);

  if (!code || !nameVi) {
    const error = new Error("Promotion code and Vietnamese name are required.");
    error.status = 400;
    throw error;
  }

  if (!["PERCENT", "FIXED"].includes(type)) {
    const error = new Error("Promotion type must be PERCENT or FIXED.");
    error.status = 400;
    throw error;
  }

  if (value <= 0) {
    const error = new Error("Promotion value must be greater than zero.");
    error.status = 400;
    throw error;
  }

  if (type === "PERCENT" && value > 100) {
    const error = new Error("Percent discount cannot be greater than 100.");
    error.status = 400;
    throw error;
  }

  if (endDate && endDate < startDate) {
    const error = new Error("End date must be after start date.");
    error.status = 400;
    throw error;
  }

  return {
    code,
    nameVi,
    nameEn: String(body.nameEn || body.name?.en || nameVi).trim(),
    type,
    value,
    startDate,
    endDate,
    active: body.active !== false,
    priority: intValue(body.priority, 0),
    note: String(body.note || "").trim() || null,
  };
}

function promotionInclude() {
  return {
    products: {
      include: {
        product: {
          include: {
            category: true,
            supplier: true,
            images: {
              where: { active: true },
              orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    },
  };
}

export async function listAdminPromotions(req, res, next) {
  try {
    const promotions = await prisma.promotion.findMany({
      include: promotionInclude(),
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: 300,
    });

    res.json({ success: true, promotions });
  } catch (err) {
    next(err);
  }
}

export async function createAdminPromotion(req, res, next) {
  try {
    const payload = sanitizePromotion(req.body);
    const productIds = Array.isArray(req.body.productIds) ? req.body.productIds.filter(Boolean) : [];

    const promotion = await prisma.$transaction(async (tx) => {
      const created = await tx.promotion.create({ data: payload });

      if (productIds.length) {
        await tx.promotionProduct.createMany({
          data: productIds.map((productId) => ({
            promotionId: created.id,
            productId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.promotion.findUnique({
        where: { id: created.id },
        include: promotionInclude(),
      });
    });

    res.status(201).json({ success: true, promotion });
  } catch (err) {
    next(err);
  }
}

export async function updateAdminPromotion(req, res, next) {
  try {
    const id = String(req.params.id || "").trim();
    const payload = sanitizePromotion(req.body);
    const productIds = Array.isArray(req.body.productIds) ? req.body.productIds.filter(Boolean) : [];

    const promotion = await prisma.$transaction(async (tx) => {
      await tx.promotion.update({
        where: { id },
        data: payload,
      });

      await tx.promotionProduct.deleteMany({ where: { promotionId: id } });

      if (productIds.length) {
        await tx.promotionProduct.createMany({
          data: productIds.map((productId) => ({
            promotionId: id,
            productId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.promotion.findUnique({
        where: { id },
        include: promotionInclude(),
      });
    });

    res.json({ success: true, promotion });
  } catch (err) {
    next(err);
  }
}

export async function deactivateAdminPromotion(req, res, next) {
  try {
    const id = String(req.params.id || "").trim();

    const promotion = await prisma.promotion.update({
      where: { id },
      data: { active: false },
      include: promotionInclude(),
    });

    res.json({ success: true, promotion });
  } catch (err) {
    next(err);
  }
}

export async function listPublicActivePromotions(req, res, next) {
  try {
    const now = new Date();

    const promotions = await prisma.promotion.findMany({
      where: {
        active: true,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      include: promotionInclude(),
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: 100,
    });

    res.json({ success: true, promotions });
  } catch (err) {
    next(err);
  }
}
