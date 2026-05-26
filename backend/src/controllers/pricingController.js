import { prisma } from "../config/prisma.js";

function intValue(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.round(n));
}

function floatValue(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

function parseDate(value, fallback = null) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date;
}

function isEffective(row, now = new Date()) {
  if (!row?.active) return false;

  const start = new Date(row.startDate);
  const end = row.endDate ? new Date(row.endDate) : null;

  return start <= now && (!end || now <= end);
}

function productInclude() {
  return {
    category: true,
    supplier: true,
    images: {
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    },
    prices: {
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
      take: 10,
    },
  };
}

export async function listPricingProducts(req, res, next) {
  try {
    const products = await prisma.product.findMany({
      include: productInclude(),
      orderBy: { updatedAt: "desc" },
      take: 500,
    });

    res.json({
      success: true,
      products,
    });
  } catch (err) {
    next(err);
  }
}

export async function listProductPrices(req, res, next) {
  try {
    const productId = String(req.query.productId || "").trim();

    const prices = await prisma.productPrice.findMany({
      where: productId ? { productId } : {},
      include: { product: true },
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
      take: 500,
    });

    res.json({
      success: true,
      prices,
    });
  } catch (err) {
    next(err);
  }
}

export async function createProductSellingPrice(req, res, next) {
  try {
    const productId = String(req.params.productId || "").trim();

    const marginPercent = floatValue(req.body.marginPercent, 0);
    const oldPrice = intValue(req.body.oldPrice, 0);
    const startDate = parseDate(req.body.startDate, new Date());
    const endDate = parseDate(req.body.endDate, null);
    const active = req.body.active !== false;
    const note = String(req.body.note || "").trim() || null;

    if (endDate && endDate < startDate) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date.",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        const error = new Error("Product not found.");
        error.status = 404;
        throw error;
      }

      const baseCost = Number(product.avgCost || product.lastPurchaseCost || 0);
      const suggestedPrice = Math.round(baseCost * (1 + marginPercent / 100));
      const approvedPrice = intValue(req.body.price, suggestedPrice);

      if (!approvedPrice || approvedPrice <= 0) {
        const error = new Error("Approved selling price must be greater than zero.");
        error.status = 400;
        throw error;
      }

      const priceRow = await tx.productPrice.create({
        data: {
          productId,
          baseCost,
          marginPercent,
          suggestedPrice,
          price: approvedPrice,
          oldPrice,
          startDate,
          endDate,
          active,
          note,
          source: "AVG_COST_MARGIN",
        },
      });

      let updatedProduct = product;

      if (isEffective(priceRow)) {
        updatedProduct = await tx.product.update({
          where: { id: productId },
          data: {
            price: approvedPrice,
            oldPrice,
          },
          include: productInclude(),
        });
      }

      return {
        product: updatedProduct,
        price: priceRow,
      };
    });

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProductSellingPrice(req, res, next) {
  try {
    const priceId = String(req.params.priceId || "").trim();

    const marginPercent = floatValue(req.body.marginPercent, 0);
    const baseCost = intValue(req.body.baseCost, 0);
    const suggestedPrice = intValue(req.body.suggestedPrice, Math.round(baseCost * (1 + marginPercent / 100)));
    const approvedPrice = intValue(req.body.price, suggestedPrice);
    const oldPrice = intValue(req.body.oldPrice, 0);
    const startDate = parseDate(req.body.startDate, new Date());
    const endDate = parseDate(req.body.endDate, null);
    const active = req.body.active !== false;
    const note = String(req.body.note || "").trim() || null;

    if (endDate && endDate < startDate) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date.",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const row = await tx.productPrice.update({
        where: { id: priceId },
        data: {
          baseCost,
          marginPercent,
          suggestedPrice,
          price: approvedPrice,
          oldPrice,
          startDate,
          endDate,
          active,
          note,
          source: "AVG_COST_MARGIN",
        },
        include: { product: true },
      });

      let updatedProduct = row.product;

      if (isEffective(row)) {
        updatedProduct = await tx.product.update({
          where: { id: row.productId },
          data: {
            price: approvedPrice,
            oldPrice,
          },
          include: productInclude(),
        });
      }

      return {
        product: updatedProduct,
        price: row,
      };
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

export async function deactivateProductSellingPrice(req, res, next) {
  try {
    const priceId = String(req.params.priceId || "").trim();

    const price = await prisma.productPrice.update({
      where: { id: priceId },
      data: { active: false },
    });

    res.json({
      success: true,
      price,
    });
  } catch (err) {
    next(err);
  }
}
