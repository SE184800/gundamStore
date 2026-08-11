// Shared Flash Sale detection for any product coming from GET /api/products/,
// GET /api/products/home or GET /api/products/:key — all three (plus
// POST /api/orders/) resolve price via the same server-side priority chain
// and attach `flashSale` (non-null) only when a campaign is LIVE for that
// product right now. `null`/missing means no live Flash Sale, regardless of
// whether the product ever appeared in one before.
export function getFlashSale(product = {}) {
  const flashSale = product?.flashSale;
  if (!flashSale || typeof flashSale !== "object") return null;
  if (flashSale.active === false) return null;
  return flashSale;
}

export function isFlashSaleActive(product = {}) {
  return Boolean(getFlashSale(product));
}
