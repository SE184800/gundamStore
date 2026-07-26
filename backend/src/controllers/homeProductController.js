import { prisma } from "../config/prisma.js";
import { decorateProductWithCommercialPrice } from "../services/commercialPriceResolver.js";
import { rewriteMediaUrl, rewriteMediaUrlsInObject } from "../services/mediaStorageService.js";

const HOME_PRODUCTS_LIMIT = 24;
const HOME_PRODUCTS_MAX_LIMIT = 100;

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

function normalizeCollection(value = "") {
  return normalizeProductKey(value).replace(/-/g, "_");
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

function getCollectionKeys(product = {}) {
  const groups = (product.groupItems || []).map((item) => item.group).filter(Boolean);
  const keys = groups.flatMap((group) => {
    const code = String(group.code || "").trim().toUpperCase();
    const slug = String(group.slug || "").trim();
    const name = group.nameVi || group.nameEn || "";
    const mapped = {
      NEW_ARRIVALS: "new_arrivals",
      PREORDER: "preorder",
      ORDER_ITEMS: "order_items",
      BEST_SELLERS: "best_sellers",
      SALE_PRODUCTS: "sale_products",
      SALES: "sales",
      TOOLS: "tools",
    }[code];
    return [mapped, normalizeCollection(code), normalizeCollection(slug), normalizeCollection(name)].filter(Boolean);
  });

  const status = normalizeCollection(product.status || "");
  if (status.includes("pre")) keys.push("preorder", "order_items");
  if (status.includes("sale")) keys.push("sale_products", "sales");
  return Array.from(new Set(keys.filter(Boolean)));
}

function hasProductStock(product = {}) {
  return Number(product.stock || 0) > 0 || canSellWithoutStock(product.status);
}

function primaryImage(product = {}) {
  const image = product.images?.[0] || null;
  const storagePath = image?.storagePath || "";

  return {
    imageUrl: rewriteMediaUrl(product.imageUrl || image?.cardUrl || image?.url || "", storagePath ? `${storagePath}/card.webp` : ""),
    thumbUrl: rewriteMediaUrl(image?.thumbUrl || image?.cardUrl || image?.url || "", storagePath ? `${storagePath}/thumb.webp` : ""),
    cardUrl: rewriteMediaUrl(image?.cardUrl || image?.url || product.imageUrl || "", storagePath ? `${storagePath}/card.webp` : ""),
    detailUrl: rewriteMediaUrl(image?.detailUrl || image?.cardUrl || image?.url || product.imageUrl || "", storagePath ? `${storagePath}/detail.webp` : ""),
    sizeBytes: image?.sizeBytes || 0,
  };
}

function toLightweightHomeProduct(product = {}) {
  const decorated = decorateProductWithCommercialPrice(product);
  const sellableVariants = getSellableVariants(product);
  const hasVariants = (product.variants || []).some((variant) => variant.active !== false);
  const firstVariant = sellableVariants[0] || null;
  const totalVariantStock = sellableVariants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0);
  const image = primaryImage(product);
  const groups = (product.groupItems || [])
    .map((item) => item.group)
    .filter(Boolean)
    .map((group) => ({ id: group.id, code: group.code, slug: group.slug, nameVi: group.nameVi, nameEn: group.nameEn }));

  const variantPrice = firstVariant ? Number(firstVariant.price || 0) : 0;
  const variantOldPrice = firstVariant ? Number(firstVariant.oldPrice || 0) : 0;
  const price = firstVariant ? variantPrice : Number(decorated.price || 0);
  const compareAtPrice = firstVariant ? variantOldPrice : Number(decorated.compareAtPrice || decorated.oldPrice || 0);
  const stock = firstVariant ? totalVariantStock : Number(product.stock || 0);
  const sellable = firstVariant
    ? variantPrice > 0 && (totalVariantStock > 0 || canSellWithoutStock(firstVariant.status))
    : Boolean(decorated.sellable && price > 0 && hasProductStock(product));

  return rewriteMediaUrlsInObject({
    id: product.id,
    sku: product.sku,
    slug: product.slug,
    nameVi: product.nameVi,
    nameEn: product.nameEn || product.nameVi,
    shortVi: product.shortVi || "",
    shortEn: product.shortEn || product.shortVi || "",
    price,
    oldPrice: compareAtPrice,
    finalPrice: price,
    compareAtPrice,
    stock,
    status: firstVariant?.status || product.status,
    active: product.active !== false,
    imageUrl: image.cardUrl || image.imageUrl,
    thumbUrl: image.thumbUrl,
    cardUrl: image.cardUrl,
    detailUrl: image.detailUrl,
    categoryId: product.categoryId,
    category: product.category
      ? { id: product.category.id, code: product.category.code, slug: product.category.slug, nameVi: product.category.nameVi, nameEn: product.category.nameEn }
      : null,
    groups,
    collections: getCollectionKeys(product),
    sold: Number(product.sold || 0),
    rating: Number(product.rating || 0),
    hasVariants,
    minVariantPrice: firstVariant ? variantPrice : 0,
    totalStock: stock,
    sellable,
    activePromotion: decorated.activePromotion || null,
    discountAmount: Number(decorated.discountAmount || 0),
  });
}

export async function listHomeProducts(req, res, next) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(HOME_PRODUCTS_MAX_LIMIT, Math.max(1, Number.parseInt(req.query.limit, 10) || HOME_PRODUCTS_LIMIT));

    const products = await prisma.product.findMany({
      where: {
        active: true,
        OR: [
          { price: { gt: 0 } },
          {
            variants: {
              some: {
                active: true,
                price: { gt: 0 },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        sku: true,
        slug: true,
        nameVi: true,
        nameEn: true,
        shortVi: true,
        shortEn: true,
        price: true,
        oldPrice: true,
        stock: true,
        status: true,
        active: true,
        imageUrl: true,
        categoryId: true,
        sold: true,
        rating: true,
        category: { select: { id: true, code: true, slug: true, nameVi: true, nameEn: true } },
        images: {
          where: { active: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          take: 1,
          select: { url: true, thumbUrl: true, cardUrl: true, detailUrl: true, storagePath: true, sizeBytes: true, alt: true },
        },
        variants: {
          where: { active: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: { id: true, sku: true, price: true, oldPrice: true, stock: true, status: true, active: true, sortOrder: true },
        },
        groupItems: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: { group: { select: { id: true, code: true, slug: true, nameVi: true, nameEn: true } } },
        },
        promotionProducts: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            promotion: {
              select: { id: true, code: true, nameVi: true, nameEn: true, type: true, value: true, priority: true, active: true, startDate: true, endDate: true },
            },
          },
        },
        prices: {
          where: { active: true },
          orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
          take: 5,
          select: { id: true, price: true, oldPrice: true, active: true, startDate: true, endDate: true, createdAt: true },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    });

    const homeProducts = products
      .map(toLightweightHomeProduct)
      .filter((product) => product.sellable && Number(product.finalPrice || product.price || 0) > 0);

    return res.json({ success: true, products: homeProducts, meta: { page, limit, count: homeProducts.length, lightweight: true } });
  } catch (err) {
    next(err);
  }
}
