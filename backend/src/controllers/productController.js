import { prisma } from "../config/prisma.js";

const PRODUCT_KEY_ALIASES = {
  "prod-action-base-5": {
    sku: "ACTION-BASE-5-CLEAR",
    slug: "action-base-5-clear",
  },
  "action-base-5-clear": {
    sku: "ACTION-BASE-5-CLEAR",
    slug: "action-base-5-clear",
  },

  "prod-hg-aerial": {
    sku: "HG-AERIAL-144-BD",
    slug: "hg-1-144-gundam-aerial",
  },
  "hg-aerial-144-bd": {
    sku: "HG-AERIAL-144-BD",
    slug: "hg-1-144-gundam-aerial",
  },
  "hg-1-144-gundam-aerial": {
    sku: "HG-AERIAL-144-BD",
    slug: "hg-1-144-gundam-aerial",
  },

  "prod-mg-freedom": {
    sku: "MG-FREEDOM-100-VER20",
    slug: "mg-1-100-freedom-gundam-ver-2-0",
  },
  "mg-freedom": {
    sku: "MG-FREEDOM-100-VER20",
    slug: "mg-1-100-freedom-gundam-ver-2-0",
  },
  "mg-1-100-freedom-gundam-ver-2-0": {
    sku: "MG-FREEDOM-100-VER20",
    slug: "mg-1-100-freedom-gundam-ver-2-0",
  },

  "prod-rg-hi-nu": {
    sku: "RG-HINU-144-BD",
    slug: "rg-1-144-hi-nu-gundam",
  },
  "prod-rg-hinu": {
    sku: "RG-HINU-144-BD",
    slug: "rg-1-144-hi-nu-gundam",
  },
  "rg-1-144-hi-nu-gundam": {
    sku: "RG-HINU-144-BD",
    slug: "rg-1-144-hi-nu-gundam",
  },
};

function normalizeProductKey(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ν]/g, "v")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function listStorefrontProducts(req, res, next) {
  try {
    const products = await prisma.product.findMany({
      where: {
        active: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 200,
    });

    res.json({
      success: true,
      products,
    });
  } catch (err) {
    next(err);
  }
}

export async function getStorefrontProductByKey(req, res, next) {
  try {
    const key = String(req.params.key || "").trim();
    const normalizedKey = normalizeProductKey(key);
    const alias = PRODUCT_KEY_ALIASES[normalizedKey];

    const orConditions = [
      { id: key },
      { slug: key },
      { sku: key },
      { nameVi: { contains: key, mode: "insensitive" } },
      { nameEn: { contains: key, mode: "insensitive" } },
    ];

    if (alias?.sku) {
      orConditions.push({ sku: alias.sku });
    }

    if (alias?.slug) {
      orConditions.push({ slug: alias.slug });
    }

    const product = await prisma.product.findFirst({
      where: {
        active: true,
        OR: orConditions,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
        key,
        normalizedKey,
        alias,
      });
    }

    res.json({
      success: true,
      product,
    });
  } catch (err) {
    next(err);
  }
}


function sanitizeAdminProductInput(body = {}) {
  const sku = String(body.sku || "").trim().toUpperCase();
  const slug = String(body.slug || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const nameVi = String(body.nameVi || body.name?.vi || body.title || "").trim();
  const nameEn = String(body.nameEn || body.name?.en || body.nameVi || body.name?.vi || "").trim();
  const description = String(body.description || body.descriptionVi || body.short?.vi || "").trim();

  const price = Math.max(0, Number(body.price || 0));
  const stock = Math.max(0, Number(body.stock || 0));
  const active = body.active !== false;

  if (!sku) {
    const error = new Error("SKU is required.");
    error.status = 400;
    throw error;
  }

  if (!slug) {
    const error = new Error("Slug is required.");
    error.status = 400;
    throw error;
  }

  if (!nameVi) {
    const error = new Error("Vietnamese product name is required.");
    error.status = 400;
    throw error;
  }

  return {
    sku,
    slug,
    nameVi,
    nameEn: nameEn || nameVi,
    description,
    price,
    stock,
    active,
  };
}

export async function listAdminProducts(req, res, next) {
  try {
    const products = await prisma.product.findMany({
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

export async function createAdminProduct(req, res, next) {
  try {
    const payload = sanitizeAdminProductInput(req.body);

    const product = await prisma.product.create({
      data: payload,
    });

    res.status(201).json({
      success: true,
      product,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateAdminProduct(req, res, next) {
  try {
    const id = String(req.params.id || "").trim();
    const payload = sanitizeAdminProductInput(req.body);

    const product = await prisma.product.update({
      where: { id },
      data: payload,
    });

    res.json({
      success: true,
      product,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteAdminProduct(req, res, next) {
  try {
    const id = String(req.params.id || "").trim();

    const product = await prisma.product.update({
      where: { id },
      data: { active: false },
    });

    res.json({
      success: true,
      product,
      message: "Product deactivated.",
    });
  } catch (err) {
    next(err);
  }
}
