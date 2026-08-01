function hasPreorderTag(product = {}) {
  const collections = Array.isArray(product.collections) ? product.collections : [];
  return collections.some((collection) => {
    const key = String(collection || "").toLowerCase();
    return key.includes("preorder") || key.includes("pre_order") || key === "order_items";
  });
}

function legacyIsPreorder(product = {}) {
  const status = String(product.status || "").toLowerCase();
  return Boolean(
    product.preorder?.enabled ||
    status.includes("pre") ||
    status.includes("order") ||
    hasPreorderTag(product)
  );
}

export function getProductPreorderInfo(product = {}) {
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
