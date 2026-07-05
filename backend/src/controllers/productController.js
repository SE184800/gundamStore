import { prisma } from "../config/prisma.js";
import { decorateProductWithCommercialPrice } from "../services/commercialPriceResolver.js";

const PRODUCT_KEY_ALIASES = {
  "prod-action-base-5": { sku: "ACTION-BASE-5-CLEAR", slug: "action-base-5-clear" },
  "action-base-5-clear": { sku: "ACTION-BASE-5-CLEAR", slug: "action-base-5-clear" },

  "prod-hg-aerial": { sku: "HG-AERIAL-144-BD", slug: "hg-1-144-gundam-aerial" },
  "hg-aerial-144-bd": { sku: "HG-AERIAL-144-BD", slug: "hg-1-144-gundam-aerial" },
  "hg-1-144-gundam-aerial": { sku: "HG-AERIAL-144-BD", slug: "hg-1-144-gundam-aerial" },

  "prod-mg-freedom": { sku: "MG-FREEDOM-100-VER20", slug: "mg-1-100-freedom-gundam-ver-2-0" },
  "mg-freedom": { sku: "MG-FREEDOM-100-VER20", slug: "mg-1-100-freedom-gundam-ver-2-0" },
  "mg-1-100-freedom-gundam-ver-2-0": { sku: "MG-FREEDOM-100-VER20", slug: "mg-1-100-freedom-gundam-ver-2-0" },

  "prod-rg-hi-nu": { sku: "RG-HINU-144-BD", slug: "rg-1-144-hi-nu-gundam" },
  "prod-rg-hinu": { sku: "RG-HINU-144-BD", slug: "rg-1-144-hi-nu-gundam" },
  "rg-1-144-hi-nu-gundam": { sku: "RG-HINU-144-BD", slug: "rg-1-144-hi-nu-gundam" },
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

function makeSlug(value = "") {
  return normalizeProductKey(value);
}

function productInclude() {
  return {
    category: true,
    supplier: true,
    images: {
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    },
    variants: {
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    },
    productReviews: {
      where: { status: "APPROVED" },
      orderBy: [{ verifiedPurchase: "desc" }, { createdAt: "desc" }],
      take: 50,
    },
    groupItems: {
      include: { group: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    },
    promotionProducts: {
      include: { promotion: true },
      orderBy: { createdAt: "desc" },
    },
    prices: {
      where: { active: true },
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
      take: 20,
    },
  };
}



function isSellingPriceActive(priceRow, now = new Date()) {
  if (!priceRow?.active) return false;

  const start = new Date(priceRow.startDate);
  const end = priceRow.endDate ? new Date(priceRow.endDate) : null;

  return start <= now && (!end || now <= end);
}

function decorateProductWithEffectiveSellingPrice(product, now = new Date()) {
  const activePrice = (product.prices || [])
    .filter((row) => isSellingPriceActive(row, now))
    .sort((a, b) => {
      const startDiff = new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      if (startDiff !== 0) return startDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })[0];

  if (!activePrice) return product;

  return {
    ...product,
    price: Number(activePrice.price || product.price || 0),
    oldPrice: Number(activePrice.oldPrice || 0),
    activeSellingPrice: {
      id: activePrice.id,
      price: activePrice.price,
      oldPrice: activePrice.oldPrice,
      startDate: activePrice.startDate,
      endDate: activePrice.endDate,
    },
  };
}

function isPromotionActive(promotion, now = new Date()) {
  if (!promotion?.active) return false;

  const start = new Date(promotion.startDate);
  const end = promotion.endDate ? new Date(promotion.endDate) : null;

  return start <= now && (!end || now <= end);
}

function calculatePromotionPrice(product, promotion) {
  const basePrice = Number(product.price || 0);
  const value = Number(promotion.value || 0);

  let discountAmount = 0;

  if (promotion.type === "PERCENT") {
    discountAmount = Math.round((basePrice * value) / 100);
  } else {
    discountAmount = value;
  }

  const effectivePrice = Math.max(0, basePrice - discountAmount);

  return {
    id: promotion.id,
    code: promotion.code,
    nameVi: promotion.nameVi,
    nameEn: promotion.nameEn,
    type: promotion.type,
    value: promotion.value,
    priority: promotion.priority,
    discountAmount,
    effectivePrice,
    startDate: promotion.startDate,
    endDate: promotion.endDate,
  };
}

function decorateProductWithPromotion(product) {
  return decorateProductWithCommercialPrice(product);
}

function withProductReviewAlias(product = {}) {
  const productReviews = Array.isArray(product.productReviews) ? product.productReviews : [];
  const reviews = Array.isArray(product.reviews) ? product.reviews : productReviews;

  return {
    ...product,
    reviews,
  };
}

function canSellWithoutStock(status = "") {
  const normalized = normalizeProductKey(status);

  return normalized === "preorder" || normalized === "comingsoon";
}

function getSellableVariants(product = {}) {
  return (product.variants || [])
    .filter((variant) => {
      return (
        variant.active !== false &&
        Number(variant.price || 0) > 0 &&
        (Number(variant.stock || 0) > 0 || canSellWithoutStock(variant.status))
      );
    })
    .sort((a, b) => {
      const sortDiff = Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
      if (sortDiff !== 0) return sortDiff;
      return Number(a.price || 0) - Number(b.price || 0);
    });
}

function getSellableVariantInputs(variants = []) {
  return (Array.isArray(variants) ? variants : [])
    .filter((variant) => {
      const status = String(variant?.status || "inStock").trim();
      const normalizedStatus = normalizeProductKey(status);

      return (
        variant &&
        variant.active !== false &&
        normalizedStatus !== "inactive" &&
        normalizedStatus !== "draft" &&
        Number(variant.price || 0) > 0 &&
        (Number(variant.stock || 0) > 0 || canSellWithoutStock(status))
      );
    });
}

function hasActiveVariantInputs(variants = []) {
  return (Array.isArray(variants) ? variants : []).some((variant) => {
    const normalizedStatus = normalizeProductKey(variant?.status || "");
    return variant && variant.active !== false && normalizedStatus !== "inactive";
  });
}

function hasSellableVariantInputs(variants = []) {
  return getSellableVariantInputs(variants).length > 0;
}

function hasSellableStock(product = {}) {
  return Number(product.stock || 0) > 0 || canSellWithoutStock(product.status) || getSellableVariants(product).length > 0;
}

function decorateProductForStorefront(product = {}) {
  const decorated = withProductReviewAlias(decorateProductWithPromotion(product));
  const sellableVariants = getSellableVariants(decorated);

  if (!sellableVariants.length) return decorated;

  const firstVariant = sellableVariants[0];

  return {
    ...decorated,
    variants: sellableVariants,
    hasVariants: true,
    sellable: true,
    price: Number(firstVariant.price || 0),
    finalPrice: Number(firstVariant.price || 0),
    oldPrice: Number(firstVariant.oldPrice || 0),
    compareAtPrice: Number(firstVariant.oldPrice || 0),
    stock: sellableVariants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0),
    notSellableReason: "",
  };
}

function isStorefrontSellableProduct(product = {}) {
  if (product.hasVariants && getSellableVariants(product).length > 0) return true;

  return product.sellable && Number(product.finalPrice || product.price || 0) > 0 && hasSellableStock(product);
}

function applyAdminProductPublishGuard(payload = {}, source = {}) {
  const sourceVariants = Array.isArray(source.variants) ? source.variants : [];
  const hasVariantRows = hasActiveVariantInputs(sourceVariants);
  const hasSellableVariantRows = hasSellableVariantInputs(sourceVariants);

  if (hasVariantRows) {
    if (payload.active !== false && !hasSellableVariantRows) {
      payload.active = false;
      payload.status = "draft";
      payload.publishBlockedReason = "At least one active variant with price > 0 and sellable stock is required.";
    }

    return payload;
  }

  const hasPrice = Number(payload.price || 0) > 0;
  const hasStock = Number(payload.stock || 0) > 0;
  const allowNoStock = canSellWithoutStock(payload.status);

  if (!hasPrice) {
    payload.price = 0;
    payload.oldPrice = 0;
    payload.active = false;
    payload.status = "draft";
    return payload;
  }

  if (payload.active !== false && !hasStock && !allowNoStock) {
    payload.active = false;
    payload.status = "draft";
    return payload;
  }

  return payload;
}


function intValue(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.round(n));
}

function parseJsonValue(value, fallback) {
  if (value === undefined) return fallback;
  if (value === null) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
}

function normalizeImages(body = {}) {
  const fromImages = Array.isArray(body.images) ? body.images : [];
  const fromMediaGallery = Array.isArray(body.media?.gallery) ? body.media.gallery : [];

  const urls = [
    body.imageUrl,
    body.media?.card,
    body.media?.home,
    body.media?.detailMain,
    ...fromImages,
    ...fromMediaGallery,
  ]
    .map((item) => {
      if (!item) return "";
      if (typeof item === "string") return item;
      return item.url || item.src || "";
    })
    .filter(Boolean);

  return [...new Set(urls)].map((url, index) => ({
    url,
    alt: body.nameVi || body.name?.vi || "",
    type: index === 0 ? "primary" : "gallery",
    sortOrder: index,
    active: true,
  }));
}

function sanitizeAdminProductInput(body = {}) {
  const sku = String(body.sku || "").trim().toUpperCase();
  const slug = makeSlug(body.slug || body.nameVi || body.title || "");
  const nameVi = String(body.nameVi || body.name?.vi || body.title || "").trim();
  const nameEn = String(body.nameEn || body.name?.en || body.nameVi || body.name?.vi || "").trim();

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
    barcode: String(body.barcode || "").trim() || null,
    nameVi,
    nameEn: nameEn || nameVi,
    shortVi: String(body.shortVi || body.short?.vi || "").trim() || null,
    shortEn: String(body.shortEn || body.short?.en || "").trim() || null,
    description: String(body.description || body.descriptionText || body.descriptionVi || body.description?.vi || "").trim() || null,
    descriptionEn: String(body.descriptionEn || body.description?.en || "").trim() || null,
    price: intValue(body.price, 0),
    oldPrice: intValue(body.oldPrice, 0),
    stock: intValue(body.stock, 0),
    status: String(body.status || (body.active === false ? "inactive" : "inStock")).trim() || "inStock",
    active: body.active !== false,
    imageUrl: String(body.imageUrl || body.media?.card || body.images?.[0] || "").trim() || null,
    brand: String(body.brand || "").trim() || null,
    grade: String(body.grade || "").trim() || null,
    scale: String(body.scale || "").trim() || null,
    tone: String(body.tone || "").trim() || null,
    sold: intValue(body.sold, 0),
    rating: Number(body.rating || 0),
    specs: parseJsonValue(body.specs, []),
    boxItems: parseJsonValue(body.boxItems, []),
    media: parseJsonValue(body.media, null),
    categoryId: body.categoryId || null,
    supplierId: body.supplierId || null,
  };
}

async function syncProductImages(tx, productId, body = {}) {
  const images = normalizeImages(body);

  await tx.productImage.deleteMany({ where: { productId } });

  if (!images.length) return;

  await tx.productImage.createMany({
    data: images.map((image) => ({ productId, ...image })),
  });
}

function sanitizeVariantInput(raw = {}, product = {}) {
  const sku = String(raw.sku || "").trim().toUpperCase();
  const nameVi = String(raw.nameVi || raw.name?.vi || raw.option1Value || product.nameVi || "").trim();
  const nameEn = String(raw.nameEn || raw.name?.en || nameVi).trim();
  const status = String(raw.status || "inStock").trim() || "inStock";

  if (!sku) {
    const error = new Error("Variant SKU is required.");
    error.status = 400;
    throw error;
  }

  if (!nameVi) {
    const error = new Error("Variant Vietnamese name is required.");
    error.status = 400;
    throw error;
  }

  const payload = {
    sku,
    barcode: String(raw.barcode || "").trim() || null,
    nameVi,
    nameEn: nameEn || nameVi,
    option1Name: String(raw.option1Name || "").trim() || null,
    option1Value: String(raw.option1Value || "").trim() || null,
    option2Name: String(raw.option2Name || "").trim() || null,
    option2Value: String(raw.option2Value || "").trim() || null,
    price: intValue(raw.price, 0),
    oldPrice: intValue(raw.oldPrice, 0),
    stock: intValue(raw.stock, 0),
    imageUrl: String(raw.imageUrl || "").trim() || null,
    active: raw.active !== false,
    status,
    sortOrder: intValue(raw.sortOrder, 0),
  };

  applyAdminProductPublishGuard(payload);
  return payload;
}

async function syncProductVariants(tx, productId, body = {}, product = {}) {
  if (!Array.isArray(body.variants)) return;

  const keepIds = [];

  for (const raw of body.variants) {
    const payload = sanitizeVariantInput(raw, product);

    if (raw.id) {
      const updated = await tx.productVariant.update({
        where: { id: raw.id },
        data: payload,
      });
      keepIds.push(updated.id);
      continue;
    }

    const existing = await tx.productVariant.findUnique({
      where: { sku: payload.sku },
    });

    if (existing) {
      if (existing.productId !== productId) {
        const error = new Error(`Variant SKU ${payload.sku} already belongs to another product.`);
        error.status = 409;
        throw error;
      }

      const updated = await tx.productVariant.update({
        where: { id: existing.id },
        data: payload,
      });
      keepIds.push(updated.id);
      continue;
    }

    const created = await tx.productVariant.create({
      data: {
        ...payload,
        productId,
      },
    });

    keepIds.push(created.id);
  }

  await tx.productVariant.updateMany({
    where: {
      productId,
      id: { notIn: keepIds.length ? keepIds : ["__none__"] },
    },
    data: {
      active: false,
      status: "inactive",
    },
  });
}
let PRODUCTS_CACHE = null;
let CACHE_EXPIRY = 0;
export async function listStorefrontProducts(req, res, next) {
  try {
    const now = Date.now();

    // 🌟 BƯỚC 2: KIỂM TRA CACHE (Nếu có data và chưa quá 3 phút -> TRẢ VỀ NGAY LẬP TỨC)
    if (PRODUCTS_CACHE && now < CACHE_EXPIRY) {
      // Tốc độ khúc này chỉ mất đúng 1ms, ổn định tuyệt đối, bất chấp mạng yếu hay DB ngủ đông!
      return res.json({
        success: true,
        products: PRODUCTS_CACHE,
      });
    }
    console.time("⏱️ [TOTAL API PRODUCTS]");
    console.time("📥 [1. DATABASE FETCH]");
    const products = await prisma.product.findMany({
      where: {
        active: true,
        price: { gt: 0 },
      },
      include: {
        category: true,
        images: {
          where: { active: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          take: 1, // Trang chủ chỉ cần 1 ảnh đại diện để hiển thị
        },
        variants: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
        promotionProducts: {
          include: { promotion: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: 24, // Giới hạn 24 món thay vì 200 món để xé gió tốc độ
    });
    console.timeEnd("📥 [1. DATABASE FETCH]");
    console.time("⚙️ [2. JAVASCRIPT MAP_FILTER]");
    const sellableProducts = products
      .map(decorateProductForStorefront)
      .filter(isStorefrontSellableProduct);
    console.timeEnd("⚙️ [2. JAVASCRIPT MAP_FILTER]");
    PRODUCTS_CACHE = sellableProducts;
    CACHE_EXPIRY = now + 3 * 60 * 1000;
    res.json({
      success: true,
      products: sellableProducts,
    });
    console.timeEnd("⏱️ [TOTAL API PRODUCTS]");
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

    if (alias?.sku) orConditions.push({ sku: alias.sku });
    if (alias?.slug) orConditions.push({ slug: alias.slug });

    const product = await prisma.product.findFirst({
      where: {
        active: true,
        OR: orConditions,
      },
      include: productInclude(),
    });

    const decoratedProduct = product ? decorateProductForStorefront(product) : null;

    if (!decoratedProduct || !isStorefrontSellableProduct(decoratedProduct)) {
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
      product: decoratedProduct,
    });
  } catch (err) {
    next(err);
  }
}

export async function listAdminProducts(req, res, next) {
  try {
    const products = await prisma.product.findMany({
      include: productInclude(),
      orderBy: { updatedAt: "desc" },
      take: 500,
    });

    res.json({ success: true, products: products.map(withProductReviewAlias) });
  } catch (err) {
    next(err);
  }
}

export async function createAdminProduct(req, res, next) {
  try {
    const payload = sanitizeAdminProductInput(req.body);

    applyAdminProductPublishGuard(payload, req.body);

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({ data: payload });
      await syncProductImages(tx, created.id, req.body);
      await syncProductVariants(tx, created.id, req.body, created);

      return tx.product.findUnique({
        where: { id: created.id },
        include: productInclude(),
      });
    });

    res.status(201).json({ success: true, product: withProductReviewAlias(product) });
  } catch (err) {
    next(err);
  }
}

export async function updateAdminProduct(req, res, next) {
  try {
    const id = String(req.params.id || "").trim();
    const payload = sanitizeAdminProductInput(req.body);
    applyAdminProductPublishGuard(payload, req.body);

    const product = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({ where: { id }, data: payload });
      await syncProductImages(tx, id, req.body);
      await syncProductVariants(tx, id, req.body, updatedProduct);

      return tx.product.findUnique({
        where: { id },
        include: productInclude(),
      });
    });

    res.json({ success: true, product: withProductReviewAlias(product) });
  } catch (err) {
    next(err);
  }
}

export async function deleteAdminProduct(req, res, next) {
  try {
    const id = String(req.params.id || "").trim();

    const product = await prisma.product.update({
      where: { id },
      data: { active: false, status: "inactive" },
      include: productInclude(),
    });

    res.json({ success: true, product: withProductReviewAlias(product), message: "Product deactivated." });
  } catch (err) {
    next(err);
  }
}

function sanitizeCategoryInput(body = {}) {
  const nameVi = String(body.nameVi || body.name?.vi || "").trim();
  const code = String(body.code || body.slug || nameVi || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const slug = makeSlug(body.slug || nameVi || code);

  if (!nameVi || !code || !slug) {
    const error = new Error("Category code, slug and Vietnamese name are required.");
    error.status = 400;
    throw error;
  }

  return {
    code,
    slug,
    nameVi,
    nameEn: String(body.nameEn || body.name?.en || nameVi).trim(),
    description: String(body.description || "").trim() || null,
    active: body.active !== false,
    sortOrder: intValue(body.sortOrder, 0),
  };
}


export async function listStorefrontProductCategories(req, res, next) {
  try {
    const categories = await prisma.productCategory.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { nameVi: "asc" }],
    });

    res.json({
      success: true,
      categories,
    });
  } catch (err) {
    next(err);
  }
}

export async function listAdminProductCategories(req, res, next) {
  try {
    const categories = await prisma.productCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { nameVi: "asc" }],
    });

    res.json({ success: true, categories });
  } catch (err) {
    next(err);
  }
}

export async function createAdminProductCategory(req, res, next) {
  try {
    const category = await prisma.productCategory.create({
      data: sanitizeCategoryInput(req.body),
    });

    res.status(201).json({ success: true, category });
  } catch (err) {
    next(err);
  }
}

export async function updateAdminProductCategory(req, res, next) {
  try {
    const category = await prisma.productCategory.update({
      where: { id: req.params.id },
      data: sanitizeCategoryInput(req.body),
    });

    res.json({ success: true, category });
  } catch (err) {
    next(err);
  }
}

export async function deleteAdminProductCategory(req, res, next) {
  try {
    const category = await prisma.productCategory.update({
      where: { id: req.params.id },
      data: { active: false },
    });

    res.json({ success: true, category });
  } catch (err) {
    next(err);
  }
}

function sanitizeSupplierInput(body = {}) {
  const name = String(body.name || "").trim();
  const code = String(body.code || name || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!name || !code) {
    const error = new Error("Supplier code and name are required.");
    error.status = 400;
    throw error;
  }

  return {
    code,
    name,
    contactName: String(body.contactName || "").trim() || null,
    phone: String(body.phone || "").trim() || null,
    email: String(body.email || "").trim() || null,
    address: String(body.address || "").trim() || null,
    note: String(body.note || "").trim() || null,
    active: body.active !== false,
  };
}

export async function listAdminSuppliers(req, res, next) {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: "asc" },
    });

    res.json({ success: true, suppliers });
  } catch (err) {
    next(err);
  }
}

export async function createAdminSupplier(req, res, next) {
  try {
    const supplier = await prisma.supplier.create({
      data: sanitizeSupplierInput(req.body),
    });

    res.status(201).json({ success: true, supplier });
  } catch (err) {
    next(err);
  }
}

export async function updateAdminSupplier(req, res, next) {
  try {
    const supplier = await prisma.supplier.update({
      where: { id: req.params.id },
      data: sanitizeSupplierInput(req.body),
    });

    res.json({ success: true, supplier });
  } catch (err) {
    next(err);
  }
}

export async function deleteAdminSupplier(req, res, next) {
  try {
    const supplier = await prisma.supplier.update({
      where: { id: req.params.id },
      data: { active: false },
    });

    res.json({ success: true, supplier });
  } catch (err) {
    next(err);
  }
}

function sanitizeGroupInput(body = {}) {
  const nameVi = String(body.nameVi || body.name?.vi || "").trim();
  const code = String(body.code || body.slug || nameVi || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const slug = makeSlug(body.slug || nameVi || code);

  if (!nameVi || !code || !slug) {
    const error = new Error("Group code, slug and Vietnamese name are required.");
    error.status = 400;
    throw error;
  }

  return {
    code,
    slug,
    nameVi,
    nameEn: String(body.nameEn || body.name?.en || nameVi).trim(),
    description: String(body.description || "").trim() || null,
    active: body.active !== false,
    sortOrder: intValue(body.sortOrder, 0),
  };
}

export async function listAdminProductGroups(req, res, next) {
  try {
    const groups = await prisma.productGroup.findMany({
      include: {
        products: {
          include: { product: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
      orderBy: [{ sortOrder: "asc" }, { nameVi: "asc" }],
    });

    res.json({ success: true, groups });
  } catch (err) {
    next(err);
  }
}

export async function createAdminProductGroup(req, res, next) {
  try {
    const group = await prisma.productGroup.create({
      data: sanitizeGroupInput(req.body),
    });

    res.status(201).json({ success: true, group });
  } catch (err) {
    next(err);
  }
}

export async function updateAdminProductGroup(req, res, next) {
  try {
    const group = await prisma.productGroup.update({
      where: { id: req.params.id },
      data: sanitizeGroupInput(req.body),
    });

    res.json({ success: true, group });
  } catch (err) {
    next(err);
  }
}

export async function deleteAdminProductGroup(req, res, next) {
  try {
    const group = await prisma.productGroup.update({
      where: { id: req.params.id },
      data: { active: false },
    });

    res.json({ success: true, group });
  } catch (err) {
    next(err);
  }
}

export async function setAdminProductGroups(req, res, next) {
  try {
    const productId = String(req.params.productId || "").trim();
    const groupIds = Array.isArray(req.body.groupIds) ? req.body.groupIds.filter(Boolean) : [];

    const product = await prisma.$transaction(async (tx) => {
      await tx.productGroupItem.deleteMany({ where: { productId } });

      if (groupIds.length) {
        await tx.productGroupItem.createMany({
          data: groupIds.map((groupId, index) => ({
            productId,
            groupId,
            sortOrder: index,
            featured: Boolean(req.body.featured),
          })),
          skipDuplicates: true,
        });
      }

      return tx.product.findUnique({
        where: { id: productId },
        include: productInclude(),
      });
    });

    res.json({ success: true, product: withProductReviewAlias(product) });
  } catch (err) {
    next(err);
  }
}

export async function getAdminCatalogReference(req, res, next) {
  try {
    const [categories, suppliers, groups] = await Promise.all([
      prisma.productCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { nameVi: "asc" }] }),
      prisma.supplier.findMany({ orderBy: { name: "asc" } }),
      prisma.productGroup.findMany({ orderBy: [{ sortOrder: "asc" }, { nameVi: "asc" }] }),
    ]);

    res.json({ success: true, categories, suppliers, groups });
  } catch (err) {
    next(err);
  }
}

export async function listAdminInventoryLogs(req, res, next) {
  try {
    const productId = String(req.query.productId || "").trim();

    const logs = await prisma.inventoryLog.findMany({
      where: productId ? { productId } : {},
      include: {
        product: true,
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    res.json({
      success: true,
      logs,
    });
  } catch (err) {
    next(err);
  }
}

export async function adjustAdminProductInventory(req, res, next) {
  try {
    const productId = String(req.params.id || "").trim();
    const delta = Number(req.body.delta || req.body.quantity || 0);
    const reason = String(req.body.reason || "").trim();
    const refType = String(req.body.refType || "ADMIN_ADJUSTMENT").trim();

    if (!Number.isFinite(delta) || delta === 0) {
      return res.status(400).json({
        success: false,
        message: "Inventory delta must be a non-zero number.",
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Inventory adjustment reason is required.",
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

      const beforeStock = Number(product.stock || 0);
      const afterStock = beforeStock + Math.round(delta);

      if (afterStock < 0) {
        const error = new Error("Stock cannot be negative.");
        error.status = 400;
        throw error;
      }

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stock: afterStock,
          status: afterStock > 0 && product.status === "outOfStock" ? "inStock" : product.status,
        },
        include: productInclude(),
      });

      const log = await tx.inventoryLog.create({
        data: {
          productId,
          type: delta > 0 ? "IMPORT" : "EXPORT",
          quantity: Math.abs(Math.round(delta)),
          beforeStock,
          afterStock,
          reason,
          refType,
          refId: req.user?.id || null,
        },
      });

      return {
        product: updatedProduct,
        log,
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

function parseDateOnly(value, fallback = null) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date;
}

function isPriceEffective(priceRow, now = new Date()) {
  if (!priceRow?.active) return false;

  const start = new Date(priceRow.startDate);
  const end = priceRow.endDate ? new Date(priceRow.endDate) : null;

  return start <= now && (!end || now <= end);
}

export async function listAdminProductPrices(req, res, next) {
  try {
    const productId = String(req.query.productId || "").trim();

    const prices = await prisma.productPrice.findMany({
      where: productId ? { productId } : {},
      include: {
        product: true,
      },
      orderBy: [
        { startDate: "desc" },
        { createdAt: "desc" },
      ],
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

export async function createAdminProductPrice(req, res, next) {
  try {
    const productId = String(req.params.id || "").trim();

    const price = Math.max(0, Math.round(Number(req.body.price || 0)));
    const oldPrice = Math.max(0, Math.round(Number(req.body.oldPrice || 0)));
    const startDate = parseDateOnly(req.body.startDate, new Date());
    const endDate = parseDateOnly(req.body.endDate, null);
    const active = req.body.active !== false;
    const note = String(req.body.note || "").trim() || null;

    if (!price || price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be greater than zero.",
      });
    }

    if (!startDate) {
      return res.status(400).json({
        success: false,
        message: "Start date is required.",
      });
    }

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

      const row = await tx.productPrice.create({
        data: {
          productId,
          price,
          oldPrice,
          startDate,
          endDate,
          active,
          note,
        },
      });

      let updatedProduct = product;

      if (isPriceEffective(row)) {
        updatedProduct = await tx.product.update({
          where: { id: productId },
          data: {
            price,
            oldPrice,
          },
          include: productInclude(),
        });
      }

      return {
        price: row,
        product: updatedProduct,
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

export async function updateAdminProductPrice(req, res, next) {
  try {
    const id = String(req.params.priceId || "").trim();

    const price = Math.max(0, Math.round(Number(req.body.price || 0)));
    const oldPrice = Math.max(0, Math.round(Number(req.body.oldPrice || 0)));
    const startDate = parseDateOnly(req.body.startDate, new Date());
    const endDate = parseDateOnly(req.body.endDate, null);
    const active = req.body.active !== false;
    const note = String(req.body.note || "").trim() || null;

    if (!price || price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be greater than zero.",
      });
    }

    if (endDate && endDate < startDate) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date.",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const row = await tx.productPrice.update({
        where: { id },
        data: {
          price,
          oldPrice,
          startDate,
          endDate,
          active,
          note,
        },
        include: {
          product: true,
        },
      });

      let updatedProduct = row.product;

      if (isPriceEffective(row)) {
        updatedProduct = await tx.product.update({
          where: { id: row.productId },
          data: {
            price,
            oldPrice,
          },
          include: productInclude(),
        });
      }

      return {
        price: row,
        product: updatedProduct,
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

export async function deactivateAdminProductPrice(req, res, next) {
  try {
    const id = String(req.params.priceId || "").trim();

    const price = await prisma.productPrice.update({
      where: { id },
      data: {
        active: false,
      },
      include: {
        product: true,
      },
    });

    res.json({
      success: true,
      price,
    });
  } catch (err) {
    next(err);
  }
}
