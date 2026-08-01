function hasPreorderTag(product = {}) {
  const collections = Array.isArray(product.collections) ? product.collections : [];
  return collections.some((collection) => {
    const key = String(collection || "").toLowerCase();
    return key.includes("preorder") || key.includes("pre_order") || key === "order_items";
  });
}

// Last-resort fallback only, used when the backend response is missing
// availability.isPreorder entirely (stale cache, older API version, or
// locally-seeded/demo product data that never went through the backend).
// Deliberately does NOT guess from free-text status strings anymore
// (previously matched status.includes("order"), which misclassified any
// product whose status merely contained the substring "order").
function legacyIsPreorder(product = {}) {
  console.warn(
    "[productAvailability] availability.isPreorder missing from product payload — falling back to legacy heuristic.",
    { id: product?.id, sku: product?.sku, slug: product?.slug }
  );
  return Boolean(product.preorder?.enabled || hasPreorderTag(product));
}

export function getProductPreorderInfo(product = {}) {
  const availability = product?.availability;
  if (availability && typeof availability === "object" && typeof availability.isPreorder === "boolean") {
    return { canOrder: availability.isPreorder, isOpen: availability.isPreorder };
  }

  const preorder = product?.preorder;
  const fallback = legacyIsPreorder(product);

  if (preorder && typeof preorder === "object") {
    return {
      canOrder: preorder.canOrder ?? fallback,
      isOpen: preorder.isOpen ?? fallback,
    };
  }

  return { canOrder: fallback, isOpen: fallback };
}

export function getProductAvailability(product = {}) {
  const { canOrder } = getProductPreorderInfo(product);
  const stock = Number(product?.stock ?? 0);
  const statusInStock = String(product?.status || "").toLowerCase() === "instock";
  const legacyInStock = canOrder || stock > 0 || statusInStock;

  const availability = product?.availability;
  if (availability && typeof availability === "object") {
    return {
      inStock: availability.inStock ?? legacyInStock,
      canAddToCart: availability.canAddToCart ?? legacyInStock,
      label: availability.label || "",
    };
  }

  return { inStock: legacyInStock, canAddToCart: legacyInStock, label: "" };
}
