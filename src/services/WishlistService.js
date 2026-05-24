const WISHLIST_KEY = "gundam-wishlist";

function readWishlist() {
  try {
    const parsed = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeWishlist(rows) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(Array.isArray(rows) ? rows : []));
}

export function getWishlistIds() {
  return readWishlist();
}

export function isWishlistSaved(productId) {
  return readWishlist().includes(productId);
}

export function toggleWishlist(productId) {
  const id = String(productId || "").trim();
  if (!id) return readWishlist();

  const current = readWishlist();
  const next = current.includes(id)
    ? current.filter((item) => item !== id)
    : [id, ...current];

  writeWishlist(next);
  window.dispatchEvent(new CustomEvent("wishlist:changed", { detail: next }));
  return next;
}

export function clearWishlist() {
  writeWishlist([]);
  window.dispatchEvent(new CustomEvent("wishlist:changed", { detail: [] }));
}
