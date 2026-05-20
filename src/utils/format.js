export function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + "₫";
}

export function getText(value, lang = "vi") {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[lang] || value.vi || value.en || "";
}

export function productPayable(product) {
  if (product?.preorder?.enabled || product?.status === "preorder") {
    return Number(product.preorder?.deposit || product.price || 0);
  }
  return Number(product?.price || 0);
}

export function makeSlug(text) {
  return String(text || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
