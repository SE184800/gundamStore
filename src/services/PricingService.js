const PRICE_MAP = [
  ["prod-action-base-5", 180000],
  ["action-base-5-clear", 180000],
  ["action base 5 clear", 180000],

  ["prod-hg-aerial", 520000],
  ["hg-aerial-144-bd", 520000],
  ["hg 1/144 gundam aerial", 520000],
  ["gundam aerial", 520000],

  ["prod-rg-hi-nu", 1150000],
  ["rg-hinu-144-bd", 1150000],
  ["rg 1/144 hi-ν gundam", 1150000],
  ["rg 1/144 hi-nu gundam", 1150000],
  ["rg 1/144 hi-v gundam", 1150000],
  ["hi-ν gundam", 1150000],
  ["hi-nu gundam", 1150000],
  ["hi-v gundam", 1150000],

  ["prod-mg-freedom", 1250000],
  ["mg-freedom-100-bd", 1250000],
  ["mg 1/100 freedom gundam ver.2.0", 1250000],
  ["freedom gundam", 1250000],

  ["prod-rg-sazabi", 1200000],
  ["rg-sazabi-144-bd", 1200000],
  ["rg 1/144 sazabi", 1200000],

  ["prod-mgex-strike-freedom", 2950000],
  ["mgex-strike-freedom", 2950000],
  ["mgex 1/100 strike freedom", 2950000],
];

export function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/ν/g, "nu")
    .replace(/hi-v/g, "hi-nu")
    .replace(/[^\p{L}\p{N}/.]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function resolveName(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.vi || value.en || value.label || "";
}

export function getProductSearchText(product = {}) {
  return [
    product.id,
    product.productId,
    product.slug,
    product.sku,
    resolveName(product.name),
    product.title,
    product.productName,
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(" ");
}

export function getProductPrice(product = {}) {
  const directPrice =
    Number(product.finalPrice) ||
    Number(product.effectivePrice) ||
    Number(product.price) ||
    Number(product.salePrice) ||
    Number(product.unitPrice) ||
    Number(product.currentPrice);

  if (directPrice > 0) return directPrice;

  const searchText = getProductSearchText(product);
  const found = PRICE_MAP.find(([key]) => searchText.includes(normalizeText(key)));

  return found?.[1] || 0;
}

export function normalizeCartItem(item = {}, product = null) {
  const merged = product ? { ...product, ...item } : item;
  const price = getProductPrice(merged);

  return {
    ...item,
    id: item.id || item.productId || product?.id || product?.slug,
    productId: item.productId || item.id || product?.id,
    slug: item.slug || product?.slug,
    sku: item.sku || product?.sku,
    variantId: item.variantId || product?.variantId || "",
    variantSku: item.variantSku || product?.variantSku || "",
    variantName: item.variantName || product?.variantName || "",
    variantOptions: item.variantOptions || product?.variantOptions || null,
    name: item.name || product?.name || product?.title || "Gundam Product",
    image:
      product?.media?.card ||
      product?.media?.home ||
      product?.media?.detailMain ||
      item.image ||
      item.imageUrl ||
      product?.imageUrl ||
      product?.images?.[0] ||
      "/images/products/hi-nu.jpg",
    price,
    quantity: Number(item.quantity || item.qty) || 1,
    selected: item.selected !== false,
  };
}

export function normalizeItems(items = [], products = []) {
  return items.map((item) => {
    const product = products.find((p) => {
      return (
        p.id === item.id ||
        p.id === item.productId ||
        p.slug === item.slug ||
        p.slug === item.id ||
        p.sku === item.sku
      );
    });

    return normalizeCartItem(item, product);
  });
}

export function calcSubtotal(items = [], products = []) {
  return normalizeItems(items, products).reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );
}
