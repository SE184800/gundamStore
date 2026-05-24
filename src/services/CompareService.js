const COMPARE_KEY = "gundam-product-compare";
const MAX_COMPARE = 3;

function readCompare() {
  try {
    const parsed = JSON.parse(localStorage.getItem(COMPARE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCompare(rows) {
  localStorage.setItem(COMPARE_KEY, JSON.stringify(Array.isArray(rows) ? rows.slice(0, MAX_COMPARE) : []));
}

export function getCompareIds() {
  return readCompare();
}

export function isCompareSaved(productId) {
  return readCompare().includes(productId);
}

export function addCompare(productId) {
  const id = String(productId || "").trim();
  if (!id) return readCompare();

  const current = readCompare();
  if (current.includes(id)) return current;

  const next = [id, ...current].slice(0, MAX_COMPARE);
  writeCompare(next);
  window.dispatchEvent(new CustomEvent("compare:changed", { detail: next }));
  return next;
}

export function removeCompare(productId) {
  const next = readCompare().filter((id) => id !== productId);
  writeCompare(next);
  window.dispatchEvent(new CustomEvent("compare:changed", { detail: next }));
  return next;
}

export function toggleCompare(productId) {
  return isCompareSaved(productId) ? removeCompare(productId) : addCompare(productId);
}

export function clearCompare() {
  writeCompare([]);
  window.dispatchEvent(new CustomEvent("compare:changed", { detail: [] }));
}
