const PRICE_MAP = [
  ["action base 5 clear", 180000],
  ["hg 1/144 gundam aerial", 520000],
  ["rg 1/144 hi-v gundam", 1150000],
  ["rg 1/144 hi-v", 1150000],
  ["mg 1/100 freedom gundam ver.2.0", 1250000],
  ["rg 1/144 sazabi", 1200000],
  ["mgex 1/100 strike freedom", 2950000],
];

export function normalizeText(text) {
  return String(text || "").toLowerCase().replace(/\s+/g, " ").trim();
}

export function getProductPrice(product) {
  const name = normalizeText(product?.name);
  const found = PRICE_MAP.find(([key]) => name.includes(key));
  return Number(product?.price) > 0 ? Number(product.price) : found?.[1] || 0;
}

export function normalizeItems(items = []) {
  return items.map((item) => ({
    ...item,
    price: getProductPrice(item),
    quantity: Number(item.quantity) || 1,
  }));
}

export function calcSubtotal(items = []) {
  return normalizeItems(items).reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
}
