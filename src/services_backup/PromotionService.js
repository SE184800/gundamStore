const PROMOTION_KEY = "gundam-promotions";

export const DEFAULT_PROMOTIONS = [
  {
    id: "promo-gundam10",
    code: "GUNDAM10",
    type: "percent",
    value: 10,
    minOrder: 500000,
    maxDiscount: 100000,
    active: true,
    label: { vi: "Giảm 10% đơn từ 500.000đ", en: "10% off from 500,000đ" },
  },
  {
    id: "promo-freeship",
    code: "FREESHIP",
    type: "shipping",
    value: 30000,
    minOrder: 300000,
    maxDiscount: 30000,
    active: true,
    label: { vi: "Freeship đơn từ 300.000đ", en: "Free shipping from 300,000đ" },
  },
  {
    id: "promo-vip50",
    code: "VIP50",
    type: "fixed",
    value: 50000,
    minOrder: 1000000,
    maxDiscount: 50000,
    active: true,
    label: { vi: "Giảm 50.000đ đơn từ 1.000.000đ", en: "50,000đ off from 1,000,000đ" },
  },
];

function readPromotions() {
  try {
    const raw = localStorage.getItem(PROMOTION_KEY);
    if (!raw) return DEFAULT_PROMOTIONS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_PROMOTIONS;
  } catch {
    return DEFAULT_PROMOTIONS;
  }
}

function writePromotions(promotions) {
  localStorage.setItem(PROMOTION_KEY, JSON.stringify(Array.isArray(promotions) ? promotions : []));
}

export function getPromotions() {
  const promotions = readPromotions();
  writePromotions(promotions);
  return promotions;
}

export function savePromotion(promotion) {
  const promotions = getPromotions();
  const code = String(promotion.code || "").trim().toUpperCase();

  if (!code) {
    throw new Error("Promotion code is required.");
  }

  const nextPromotion = {
    id: promotion.id || `promo-${Date.now()}`,
    code,
    type: promotion.type || "fixed",
    value: Number(promotion.value) || 0,
    minOrder: Number(promotion.minOrder) || 0,
    maxDiscount: Number(promotion.maxDiscount) || Number(promotion.value) || 0,
    active: promotion.active !== false,
    label: promotion.label || { vi: code, en: code },
    updatedAt: new Date().toISOString(),
  };

  const exists = promotions.some((item) => item.id === nextPromotion.id || item.code === nextPromotion.code);

  const next = exists
    ? promotions.map((item) =>
        item.id === nextPromotion.id || item.code === nextPromotion.code ? { ...item, ...nextPromotion } : item
      )
    : [nextPromotion, ...promotions];

  writePromotions(next);
  return next;
}

export function togglePromotion(codeOrId) {
  const promotions = getPromotions().map((item) =>
    item.id === codeOrId || item.code === codeOrId
      ? { ...item, active: !item.active, updatedAt: new Date().toISOString() }
      : item
  );

  writePromotions(promotions);
  return promotions;
}

export function deletePromotion(codeOrId) {
  const promotions = getPromotions().filter((item) => item.id !== codeOrId && item.code !== codeOrId);
  writePromotions(promotions);
  return promotions;
}
