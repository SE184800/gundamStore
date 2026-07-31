const RECENTLY_VIEWED_KEY = "gundam-recently-viewed-v1";
const MAX_ITEMS = 12;

function readAll() {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeAll(items) {
  try {
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    // Storage unavailable (private mode / quota) — silently skip.
  }
}

function snapshotProduct(product = {}) {
  return {
    id: product.id,
    backendProductId: product.backendProductId || product.id,
    productId: product.productId || product.id,
    slug: product.slug || "",
    sku: product.sku || "",
    name: product.name || product.title || "",
    title: product.title || "",
    price: product.price || 0,
    finalPrice: product.finalPrice || product.price || 0,
    oldPrice: product.oldPrice || 0,
    compareAtPrice: product.compareAtPrice || 0,
    stock: product.stock ?? 0,
    status: product.status || "",
    collections: Array.isArray(product.collections) ? product.collections : [],
    scale: product.scale || "",
    rating: product.rating || 0,
    sold: product.sold || 0,
    imageUrl: product.imageUrl || "",
    cardUrl: product.cardUrl || product.imageUrl || "",
    active: product.active !== false,
    viewedAt: Date.now(),
  };
}

export function trackProductView(product) {
  if (!product?.id) return;

  const entry = snapshotProduct(product);
  const rest = readAll().filter((item) => item.id !== entry.id);
  writeAll([entry, ...rest]);
}

export function getRecentlyViewed({ excludeId = "", limit = 10 } = {}) {
  return readAll()
    .filter((item) => item.id !== excludeId && item.active !== false)
    .slice(0, limit);
}

export function clearRecentlyViewed() {
  try {
    localStorage.removeItem(RECENTLY_VIEWED_KEY);
  } catch {
    // ignore
  }
}
