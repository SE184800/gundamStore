export function getAdminText(value, lang = "vi") {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[lang] || value.vi || value.en || "";
}

export function makeAdminId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function makeAdminSlug(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeMoney(value) {
  return Number(String(value || 0).replace(/[^\d]/g, "")) || 0;
}

export function formatMoney(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + "₫";
}
