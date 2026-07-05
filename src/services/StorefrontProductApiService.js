import { apiRequest } from "./ApiClient";

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
  const response = await fetch(`/api${path}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || `Public catalog API failed: ${response.status}`);
  }

  return data;
}

function cacheBackendProducts(products = []) {
  return products;
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
  const joined = raw.join(" ");
  return Array.from(new Set([...raw.map(normalize), normalize(joined)].filter(Boolean)));
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
      if (localKey === backendKey) return true;
      if (localKey.includes(backendKey) || backendKey.includes(localKey)) return true;
      const localWords = new Set(localKey.split("-").filter((word) => word.length >= 3));
      const backendWords = backendKey.split("-").filter((word) => word.length >= 3);
      const hitCount = backendWords.filter((word) => localWords.has(word)).length;
      return hitCount >= 2;
    })
  );
}

function getBackendGroups(product = {}) {
  if (Array.isArray(product.groups)) return product.groups;
  if (Array.isArray(product.groupItems)) return product.groupItems.map((item) => item.group).filter(Boolean);
  return [];
}

function getBackendCollectionKeys(product = {}) {
  if (Array.isArray(product.collections) && product.collections.length) return Array.from(new Set(product.collections.filter(Boolean)));
  const groups = getBackendGroups(product);
  const keys = groups.flatMap((group) => {
    const code = String(group.code || "").trim().toUpperCase();
    const slug = String(group.slug || "").trim();
    const name = group.nameVi || group.nameEn || "";
    const mapped = GROUP_COLLECTION_ALIASES[code];
    return [mapped, normalizeCollection(code), normalizeCollection(slug), normalizeCollection(name)].filter(Boolean);
  });
  const status = normalizeCollection(product.status || "");
  if (status.includes("pre")) keys.push("preorder", "order_items");
  if (status.includes("sale")) keys.push("sale_products", "sales");
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

export function mapBackendProductToStorefront(product = {}) {
  const imageUrl = firstImageUrl(product);
  const collections = getBackendCollectionKeys(product);
  const groups = getBackendGroups(product);
  const effectivePrice = Number(product.finalPrice ?? product.effectivePrice ?? product.price) || 0;
  const compareAtPrice = Number(product.compareAtPrice ?? product.oldPrice ?? 0);
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const images = Array.isArray(product.images)
    ? product.images.map((item) => imageValue(item, "detail")).filter(Boolean)
    : product.detailUrl ? [product.detailUrl] : imageUrl ? [imageUrl] : [];
  const thumbs = Array.isArray(product.images)
    ? product.images.map((item) => imageValue(item, "thumb")).filter(Boolean)
    : product.thumbUrl ? [product.thumbUrl] : [];

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
    imageUrl,
    thumbUrl: product.thumbUrl || thumbs[0] || imageUrl,
    cardUrl: product.cardUrl || imageUrl,
    detailUrl: product.detailUrl || images[0] || imageUrl,
    images,
    thumbs,
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
    const backendCollections = backend.collections?.length ? backend.collections : localProduct.collections || [];
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
      imageUrl: backend.imageUrl || localProduct.imageUrl,
      thumbUrl: backend.thumbUrl || localProduct.thumbUrl,
      cardUrl: backend.cardUrl || localProduct.cardUrl,
      detailUrl: backend.detailUrl || localProduct.detailUrl,
      images: backend.images?.length ? backend.images : localProduct.images || [],
      thumbs: backend.thumbs?.length ? backend.thumbs : localProduct.thumbs || [],
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
      collections: backendCollections,
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

export async function getStorefrontHomeProductsFromApi() {
  const data = await publicJsonRequest("/products/home");
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
  const backend = mapBackendProductToStorefront(backendProduct);
  return {
    ...localProduct,
    backendProductId: backendProduct.id,
    productId: backendProduct.id,
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
    imageUrl: backend.imageUrl || localProduct.imageUrl,
    thumbUrl: backend.thumbUrl || localProduct.thumbUrl,
    cardUrl: backend.cardUrl || localProduct.cardUrl,
    detailUrl: backend.detailUrl || localProduct.detailUrl,
    images: backend.images?.length ? backend.images : localProduct.images || [],
    thumbs: backend.thumbs?.length ? backend.thumbs : localProduct.thumbs || [],
    media: backend.media || localProduct.media,
    brand: backend.brand || localProduct.brand,
    grade: backend.grade || localProduct.grade,
    scale: backend.scale || localProduct.scale,
    tone: backend.tone || localProduct.tone,
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
    source: "local+backend-detail",
    backendRaw: backendProduct,
  };
}

export function dedupeStorefrontProducts(products = []) {
  const seen = new Set();
  return (products || []).filter((product) => {
    const key = String(product.backendProductId || product.id || product.sku || product.slug || "").trim();
    if (!key) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return product.active !== false;
  });
}

export async function getStorefrontProductsForStorefront() {
  const backendProducts = await getStorefrontHomeProductsFromApi();
  return dedupeStorefrontProducts(backendProducts.map(mapBackendProductToStorefront));
}

export async function getStorefrontProductDetailForStorefront(key = "") {
  const backendProduct = await getStorefrontProductByKeyFromApi(key);
  return mapBackendProductToStorefront(backendProduct);
}

export function mapBackendCategoryToStorefront(category = {}) {
  const id = category.id || category.slug || category.code;
  const group = category.categoryGroup || category.group || null;
  return {
    id,
    backendCategoryId: category.id,
    code: category.code,
    slug: category.slug,
    name: {
      vi: category.nameVi || category.name?.vi || category.name || category.code || id,
      en: category.nameEn || category.name?.en || category.nameVi || category.name || category.code || id,
    },
    label: category.nameVi || category.nameEn || category.code || id,
    description: category.description || "",
    imageUrl: category.imageUrl || category.image || category.mainImage || "",
    image: category.imageUrl || category.image || category.mainImage || "",
    icon: category.icon || category.imageUrl || "",
    mainImage: category.imageUrl || category.mainImage || "",
    active: category.active !== false,
    sortOrder: Number(category.sortOrder || category.sort || 0),
    sort: Number(category.sortOrder || category.sort || 0),
    productCount: Number(category.productCount || category.count || 0),
    categoryGroupId: category.categoryGroupId || group?.id || "",
    categoryGroup: group
      ? {
          id: group.id,
          code: group.code,
          slug: group.slug,
          nameVi: group.nameVi,
          nameEn: group.nameEn || group.nameVi,
          imageUrl: group.imageUrl || "",
          icon: group.icon || group.imageUrl || "",
          sortOrder: Number(group.sortOrder || 0),
          active: group.active !== false,
        }
      : null,
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
    imageUrl: group.imageUrl || "",
    icon: group.icon || group.imageUrl || "",
    active: group.active !== false,
    sortOrder: Number(group.sortOrder || 0),
    productCount: Number(group.productCount || group.count || 0),
    categoryCount: Number(group.categoryCount || group.children?.length || 0),
    categoryIds: Array.isArray(group.categoryIds) ? group.categoryIds : [],
    children: Array.isArray(group.children) ? group.children.map(mapBackendCategoryToStorefront) : [],
  };
}

export async function getStorefrontCategoryTreeFromApi() {
  const data = await publicJsonRequest("/products/categories/tree");
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
