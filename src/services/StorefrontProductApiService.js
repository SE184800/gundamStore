import { apiRequest } from "./ApiClient";
import { resolveMediaUrl, resolveMediaUrls } from "../utils/mediaUrlResolver";

const GROUP_COLLECTION_ALIASES = {
  NEW_ARRIVALS: "new_arrivals",
  PREORDER: "preorder",
  ORDER_ITEMS: "order_items",
  BEST_SELLERS: "best_sellers",
  SALE_PRODUCTS: "sale_products",
  SALES: "sales",
  TOOLS: "tools",
};

async function publicJsonRequest(path) {
  return apiRequest(`/api${path}`, { method: "GET", token: "" });
}

function normalize(value = "") {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ν]/g, "v")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCollection(value = "") {
  return normalize(value).replace(/-/g, "_");
}

function textOf(value = "") {
  if (!value) return "";
  if (typeof value === "string") return value;
  return [value.vi, value.en, value.name, value.title].filter(Boolean).join(" ");
}

function getLocalProductSearchKeys(product = {}) {
  const raw = [product.id, product.productId, product.backendProductId, product.sku, product.slug, product.title, product.name, product.short, product.description]
    .map(textOf)
    .filter(Boolean);
  return Array.from(new Set([...raw.map(normalize), normalize(raw.join(" "))].filter(Boolean)));
}

function getBackendSearchKeys(product = {}) {
  return Array.from(new Set([product.id, product.sku, product.slug, product.nameVi, product.nameEn].filter(Boolean).map(normalize)));
}

function fuzzyMatch(localProduct = {}, backendProduct = {}) {
  const localKeys = getLocalProductSearchKeys(localProduct);
  const backendKeys = getBackendSearchKeys(backendProduct);
  if (!localKeys.length || !backendKeys.length) return false;
  return localKeys.some((localKey) =>
    backendKeys.some((backendKey) => {
      if (!localKey || !backendKey) return false;
      if (localKey === backendKey || localKey.includes(backendKey) || backendKey.includes(localKey)) return true;
      const localWords = new Set(localKey.split("-").filter((word) => word.length >= 3));
      return backendKey.split("-").filter((word) => word.length >= 3 && localWords.has(word)).length >= 2;
    })
  );
}

function getBackendGroups(product = {}) {
  if (Array.isArray(product.groups)) return product.groups;
  if (Array.isArray(product.groupItems)) return product.groupItems.map((item) => item.group).filter(Boolean);
  return [];
}

const HOMEPAGE_GROUP_COLLECTION_ALIASES = {
  new_arrivals: ["new_arrivals", "new_arrival", "new_products", "hang_moi", "hang_moi_ve", "moi_ve"],
  order_items: ["order_items", "preorder", "pre_order", "hang_order", "hang_dat_truoc", "dat_hang", "hang_dat"],
  best_sellers: ["best_sellers", "best_seller", "top_sellers", "hot", "hang_ban_chay", "ban_chay"],
  sale_products: ["sale_products", "sales", "sale", "hang_sale", "hang_sales", "hang_giam_gia", "giam_gia"],
};

function getHomepageCollectionAliases(group = {}) {
  const rawKeys = [group.code, group.slug, group.nameVi, group.nameEn]
    .map(normalizeCollection)
    .filter(Boolean);

  const keys = new Set(rawKeys);

  for (const [canonical, aliases] of Object.entries(HOMEPAGE_GROUP_COLLECTION_ALIASES)) {
    if (aliases.some((alias) => rawKeys.includes(alias))) {
      keys.add(canonical);
    }
  }

  return Array.from(keys);
}

function getBackendCollectionKeys(product = {}) {
  if (Array.isArray(product.collections) && product.collections.length) {
    return Array.from(new Set(product.collections.map(normalizeCollection).filter(Boolean)));
  }

  const keys = getBackendGroups(product).flatMap(getHomepageCollectionAliases);

  // Homepage sections must be driven by explicit product group assignment only.
  // Do not auto-place products into ORDER/HOT/SALE using status, sold count or price.
  return Array.from(new Set(keys.filter(Boolean)));
}

function imageValue(item, preferred = "card") {
  if (!item) return "";
  if (typeof item === "string") return item;
  if (preferred === "thumb") return item.thumbUrl || item.cardUrl || item.detailUrl || item.url || "";
  if (preferred === "detail") return item.detailUrl || item.cardUrl || item.url || "";
  return item.cardUrl || item.url || item.detailUrl || item.thumbUrl || "";
}

function firstImageUrl(product = {}) {
  return product.cardUrl || product.imageUrl || imageValue(product.images?.[0], "card") || product.media?.card || product.media?.home || product.media?.detailMain || product.media?.gallery?.[0] || "";
}

function productMedia(product = {}) {
  const imageUrl = resolveMediaUrl(firstImageUrl(product));
  const images = Array.isArray(product.images)
    ? resolveMediaUrls(product.images.map((item) => imageValue(item, "detail")))
    : resolveMediaUrls(product.detailUrl ? [product.detailUrl] : imageUrl ? [imageUrl] : []);
  const thumbs = Array.isArray(product.images)
    ? resolveMediaUrls(product.images.map((item) => imageValue(item, "thumb")))
    : resolveMediaUrls(product.thumbUrl ? [product.thumbUrl] : []);
  return {
    imageUrl,
    thumbUrl: resolveMediaUrl(product.thumbUrl) || thumbs[0] || imageUrl,
    cardUrl: resolveMediaUrl(product.cardUrl) || imageUrl,
    detailUrl: resolveMediaUrl(product.detailUrl) || images[0] || imageUrl,
    images,
    thumbs,
  };
}

export function mapBackendProductToStorefront(product = {}) {
  const media = productMedia(product);
  const collections = getBackendCollectionKeys(product);
  const groups = getBackendGroups(product);
  const effectivePrice = Number(product.finalPrice ?? product.effectivePrice ?? product.price) || 0;
  const compareAtPrice = Number(product.compareAtPrice ?? product.oldPrice ?? 0);
  const variants = Array.isArray(product.variants) ? product.variants : [];

  return {
    id: product.id,
    backendProductId: product.id,
    productId: product.id,
    sku: product.sku,
    slug: product.slug,
    name: { vi: product.nameVi, en: product.nameEn || product.nameVi },
    title: product.nameVi,
    short: { vi: product.shortVi || product.description || "", en: product.shortEn || product.shortVi || product.description || "" },
    description: product.description || product.shortVi || "",
    descriptionEn: product.descriptionEn || product.shortEn || "",
    price: effectivePrice,
    finalPrice: Number(product.finalPrice ?? effectivePrice) || effectivePrice,
    oldPrice: compareAtPrice,
    compareAtPrice,
    stock: Number(product.stock ?? product.totalStock) || 0,
    status: product.status || (Number(product.stock) > 0 ? "inStock" : "outOfStock"),
    active: product.active !== false,
    variants,
    hasVariants: Boolean(product.hasVariants) || variants.length > 0,
    variantCount: Number(product.variantCount || variants.length || 0),
    priceMin: Number(product.priceMin ?? effectivePrice) || 0,
    priceMax: Number(product.priceMax ?? effectivePrice) || 0,
    oldPriceMin: Number(product.oldPriceMin || 0),
    oldPriceMax: Number(product.oldPriceMax || 0),
    imageUrl: media.imageUrl,
    thumbUrl: media.thumbUrl,
    cardUrl: media.cardUrl,
    detailUrl: media.detailUrl,
    images: media.images,
    thumbs: media.thumbs,
    media: product.media || null,
    brand: product.brand || "",
    grade: product.grade || "",
    scale: product.scale || "",
    tone: product.tone || "",
    sold: Number(product.sold) || 0,
    rating: Number(product.rating) || 0,
    specs: Array.isArray(product.specs) ? product.specs : [],
    boxItems: Array.isArray(product.boxItems) ? product.boxItems : [],
    categoryId: product.categoryId || product.category?.id || "",
    supplierId: product.supplierId || product.supplier?.id || "",
    category: product.category || null,
    supplier: product.supplier || null,
    groups,
    groupItems: product.groupItems || [],
    groupIds: groups.map((group) => group.id).filter(Boolean),
    collections,
    promotion: product.activePromotion || null,
    activePromotion: product.activePromotion || null,
    discountAmount: Number(product.discountAmount || 0),
    sellable: product.sellable !== false,
    availability: product.availability && typeof product.availability === "object" ? product.availability : null,
    preorder: product.preorder && typeof product.preorder === "object" ? product.preorder : null,
    source: "backend",
    backendRaw: product,
  };
}

export function enrichProductsWithBackendIds(localProducts = [], backendProducts = []) {
  if (!Array.isArray(localProducts) || !localProducts.length) return backendProducts.map(mapBackendProductToStorefront);
  return localProducts.map((localProduct) => {
    const matched = backendProducts.find((backendProduct) => fuzzyMatch(localProduct, backendProduct));
    if (!matched) return localProduct;
    const backend = mapBackendProductToStorefront(matched);
    return {
      ...localProduct,
      backendProductId: matched.id,
      productId: matched.id,
      sku: backend.sku || localProduct.sku,
      slug: localProduct.slug || backend.slug,
      name: backend.name,
      title: backend.title,
      short: backend.short,
      description: backend.description || localProduct.description,
      price: backend.price || Number(localProduct.price) || 0,
      oldPrice: backend.oldPrice || Number(localProduct.oldPrice) || 0,
      stock: backend.stock,
      status: backend.status,
      active: backend.active,
      variants: backend.variants || [],
      hasVariants: Boolean(backend.hasVariants),
      imageUrl: backend.imageUrl || resolveMediaUrl(localProduct.imageUrl),
      thumbUrl: backend.thumbUrl || resolveMediaUrl(localProduct.thumbUrl),
      cardUrl: backend.cardUrl || resolveMediaUrl(localProduct.cardUrl),
      detailUrl: backend.detailUrl || resolveMediaUrl(localProduct.detailUrl),
      images: backend.images?.length ? backend.images : resolveMediaUrls(localProduct.images || []),
      thumbs: backend.thumbs?.length ? backend.thumbs : resolveMediaUrls(localProduct.thumbs || []),
      media: backend.media || localProduct.media,
      brand: backend.brand || localProduct.brand,
      grade: backend.grade || localProduct.grade,
      scale: backend.scale || localProduct.scale,
      tone: backend.tone || localProduct.tone,
      sold: backend.sold || Number(localProduct.sold || 0),
      rating: backend.rating || Number(localProduct.rating || 0),
      specs: backend.specs?.length ? backend.specs : localProduct.specs || [],
      boxItems: backend.boxItems?.length ? backend.boxItems : localProduct.boxItems || [],
      categoryId: backend.categoryId,
      supplierId: backend.supplierId,
      category: backend.category,
      supplier: backend.supplier,
      groups: backend.groups,
      groupItems: backend.groupItems,
      groupIds: backend.groupIds,
      collections: backend.collections?.length ? backend.collections : localProduct.collections || [],
      source: "local+backend",
      backendRaw: matched,
    };
  });
}

export async function getStorefrontProductsFromApi() {
  const data = await publicJsonRequest("/products");
  const products = Array.isArray(data?.products) ? data.products : Array.isArray(data?.data) ? data.data : [];
  if (!data?.success || !Array.isArray(products)) throw new Error("Storefront product sync skipped.");
  return products;
}

export async function getStorefrontProductsPageFromApi({
  page = 1,
  limit = 24,
  q = "",
  categoryIds = [],
  stock = "all",
  sort = "popular",
} = {}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (q) params.set("q", q);
  if (stock && stock !== "all") params.set("stock", stock);
  if (sort) params.set("sort", sort);
  const categoryKeys = (Array.isArray(categoryIds) ? categoryIds : [categoryIds]).filter(Boolean);
  if (categoryKeys.length) params.set("categoryIds", categoryKeys.join(","));

  const data = await publicJsonRequest(`/products?${params.toString()}`);
  const products = Array.isArray(data?.products) ? data.products : [];
  if (!data?.success) throw new Error("Storefront product listing sync skipped.");

  return {
    products: dedupeStorefrontProducts(products.map(mapBackendProductToStorefront)),
    meta: {
      page: Number(data.meta?.page) || page,
      limit: Number(data.meta?.limit) || limit,
      total: Number(data.meta?.total) || 0,
      totalPages: Number(data.meta?.totalPages) || 1,
    },
  };
}

// The live API has no brand/grade/scale/price-range query filters (confirmed by
// probing production — total count never changes when those params are sent).
// Shop's brand/grade/scale/price filters page through the whole catalog once
// (backend caps limit at 48/request) and filter client-side instead.
export async function getStorefrontFullCatalogFromApi() {
  const limit = 48;
  let page = 1;
  let all = [];

  while (true) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit), sort: "popular" });
    const data = await publicJsonRequest(`/products?${params.toString()}`);
    const products = Array.isArray(data?.products) ? data.products : [];
    if (!data?.success) throw new Error("Storefront catalog sync skipped.");

    all = all.concat(products.map(mapBackendProductToStorefront));

    const hasNextPage = Boolean(data.meta?.hasNextPage) && products.length > 0;
    if (!hasNextPage) break;
    page += 1;
  }

  return dedupeStorefrontProducts(all);
}

export async function getStorefrontHomeProductsFromApi({ page, limit } = {}) {
  const params = new URLSearchParams();
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));
  const query = params.toString();
  const data = await publicJsonRequest(`/products/home${query ? `?${query}` : ""}`);
  const products = Array.isArray(data?.products) ? data.products : Array.isArray(data?.data) ? data.data : [];
  if (!data?.success || !Array.isArray(products)) throw new Error("Homepage product sync skipped.");
  return products;
}

export async function getStorefrontProductByKeyFromApi(key = "") {
  const data = await publicJsonRequest(`/products/${encodeURIComponent(key)}`);
  if (!data?.success || !data.product) throw new Error("Backend did not return product detail.");
  return data.product;
}

export function mergeLocalProductWithBackendProduct(localProduct = {}, backendProduct = {}) {
  if (!backendProduct?.id) return localProduct;
  return enrichProductsWithBackendIds([localProduct], [backendProduct])[0] || localProduct;
}

export function dedupeStorefrontProducts(products = []) {
  const seen = new Set();
  return (products || []).filter((product) => {
    const key = String(product.backendProductId || product.id || product.sku || product.slug || "").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return product.active !== false;
  });
}

export async function getStorefrontProductsForStorefront(params = {}) {
  const backendProducts = await getStorefrontHomeProductsFromApi(params);
  return dedupeStorefrontProducts(backendProducts.map(mapBackendProductToStorefront));
}

export async function getStorefrontProductDetailForStorefront(key = "") {
  const backendProduct = await getStorefrontProductByKeyFromApi(key);
  return mapBackendProductToStorefront(backendProduct);
}

export async function getStorefrontProductRecommendationsApi(key = "") {
  const empty = { related: [], mostViewed: [], bestSelling: [] };
  if (!key) return empty;

  try {
    const data = await publicJsonRequest(`/products/${encodeURIComponent(key)}/recommendations`);
    if (!data?.success) return empty;

    return {
      related: Array.isArray(data.related) ? data.related.map(mapBackendProductToStorefront) : [],
      mostViewed: Array.isArray(data.mostViewed) ? data.mostViewed.map(mapBackendProductToStorefront) : [],
      bestSelling: Array.isArray(data.bestSelling) ? data.bestSelling.map(mapBackendProductToStorefront) : [],
    };
  } catch {
    return empty;
  }
}

export function mapBackendCategoryToStorefront(category = {}) {
  const id = category.id || category.slug || category.code;
  const group = category.categoryGroup || category.group || null;
  const imageUrl = resolveMediaUrl(category.imageUrl || category.image || category.mainImage || "");
  return {
    id,
    backendCategoryId: category.id,
    code: category.code,
    slug: category.slug,
    name: { vi: category.nameVi || category.name?.vi || category.name || category.code || id, en: category.nameEn || category.name?.en || category.nameVi || category.name || category.code || id },
    label: category.nameVi || category.nameEn || category.code || id,
    description: category.description || "",
    imageUrl,
    image: imageUrl,
    icon: resolveMediaUrl(category.icon) || imageUrl,
    mainImage: imageUrl,
    active: category.active !== false,
    sortOrder: Number(category.sortOrder || category.sort || 0),
    sort: Number(category.sortOrder || category.sort || 0),
    productCount: Number(category.productCount || category.count || 0),
    categoryGroupId: category.categoryGroupId || group?.id || "",
    categoryGroup: group ? mapBackendCategoryGroupToStorefront({ ...group, children: [] }) : null,
    source: "backend",
  };
}

export function mapBackendCategoryGroupToStorefront(group = {}) {
  return {
    id: group.id,
    code: group.code,
    slug: group.slug,
    nameVi: group.nameVi,
    nameEn: group.nameEn || group.nameVi,
    name: { vi: group.nameVi, en: group.nameEn || group.nameVi },
    label: group.nameVi || group.nameEn || group.code || group.id,
    imageUrl: resolveMediaUrl(group.imageUrl),
    icon: resolveMediaUrl(group.icon || group.imageUrl),
    active: group.active !== false,
    sortOrder: Number(group.sortOrder || 0),
    productCount: Number(group.productCount || group.count || 0),
    categoryCount: Number(group.categoryCount || group.children?.length || 0),
    categoryIds: Array.isArray(group.categoryIds) ? group.categoryIds : [],
    children: Array.isArray(group.children) ? group.children.map(mapBackendCategoryToStorefront) : [],
  };
}

export async function getStorefrontCategoryTreeFromApi() {
  const data = await publicJsonRequest("/products/categories/tree?catalog=live");
  if (!data?.success) throw new Error("Storefront category tree sync skipped.");
  return {
    groups: Array.isArray(data.groups) ? data.groups.map(mapBackendCategoryGroupToStorefront) : [],
    categories: Array.isArray(data.categories) ? data.categories.map(mapBackendCategoryToStorefront) : [],
    tree: Array.isArray(data.tree) ? data.tree.map(mapBackendCategoryGroupToStorefront) : [],
  };
}

export async function getStorefrontCategoriesFromApi() {
  const data = await getStorefrontCategoryTreeFromApi();
  return data.categories.filter((category) => category.active !== false);
}
