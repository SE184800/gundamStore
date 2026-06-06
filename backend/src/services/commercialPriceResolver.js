function money(value = 0) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
}

export function isSellingPriceActive(priceRow, now = new Date()) {
  if (!priceRow?.active) return false;

  const start = priceRow.startDate ? new Date(priceRow.startDate) : null;
  const end = priceRow.endDate ? new Date(priceRow.endDate) : null;

  return (!start || start <= now) && (!end || now <= end);
}

export function isPromotionActive(promotion, now = new Date()) {
  if (!promotion?.active) return false;

  const start = promotion.startDate ? new Date(promotion.startDate) : null;
  const end = promotion.endDate ? new Date(promotion.endDate) : null;

  return (!start || start <= now) && (!end || now <= end);
}

function getActiveSellingPrice(product = {}, now = new Date()) {
  return (product.prices || [])
    .filter((row) => isSellingPriceActive(row, now))
    .sort((a, b) => {
      const startDiff = new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime();
      if (startDiff !== 0) return startDiff;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    })[0] || null;
}

function getActivePromotions(product = {}, basePrice = 0, now = new Date()) {
  return (product.promotionProducts || [])
    .map((item) => item.promotion || item)
    .filter((promotion) => isPromotionActive(promotion, now))
    .map((promotion) => {
      const type = String(promotion.type || "").toUpperCase();
      const value = money(promotion.value || 0);

      let discountAmount = 0;

      if (type === "PERCENT") {
        discountAmount = Math.round(basePrice * Math.min(value, 100) / 100);
      } else {
        discountAmount = Math.min(value, basePrice);
      }

      return {
        id: promotion.id,
        code: promotion.code,
        nameVi: promotion.nameVi,
        nameEn: promotion.nameEn,
        type,
        value,
        priority: Number(promotion.priority || 0),
        discountAmount,
        startDate: promotion.startDate,
        endDate: promotion.endDate,
      };
    })
    .filter((promotion) => promotion.discountAmount > 0)
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return b.discountAmount - a.discountAmount;
    });
}

export function resolveProductCommercialPrice(product = {}, now = new Date()) {
  const activeSellingPrice = getActiveSellingPrice(product, now);

  const basePrice = activeSellingPrice
    ? money(activeSellingPrice.price)
    : money(product.price);

  const oldPrice = activeSellingPrice
    ? money(activeSellingPrice.oldPrice)
    : money(product.oldPrice);

  if (!product?.active) {
    return {
      productId: product.id,
      basePrice,
      compareAtPrice: oldPrice,
      activeSellingPrice,
      activePromotion: null,
      discountAmount: 0,
      finalPrice: 0,
      sellable: false,
      reason: "INACTIVE_PRODUCT",
    };
  }

  if (basePrice <= 0) {
    return {
      productId: product.id,
      basePrice,
      compareAtPrice: oldPrice,
      activeSellingPrice,
      activePromotion: null,
      discountAmount: 0,
      finalPrice: 0,
      sellable: false,
      reason: "MISSING_PRICE",
    };
  }

  const activePromotion = getActivePromotions(product, basePrice, now)[0] || null;
  const discountAmount = activePromotion ? activePromotion.discountAmount : 0;
  const finalPrice = Math.max(0, basePrice - discountAmount);
  const compareAtPrice = activePromotion ? Math.max(oldPrice, basePrice) : oldPrice;

  return {
    productId: product.id,
    basePrice,
    compareAtPrice,
    activeSellingPrice,
    activePromotion,
    discountAmount,
    finalPrice,
    sellable: finalPrice > 0,
    reason: finalPrice > 0 ? "" : "MISSING_PRICE",
  };
}

export function decorateProductWithCommercialPrice(product = {}, now = new Date()) {
  const commercialPrice = resolveProductCommercialPrice(product, now);

  return {
    ...product,
    commercialPrice,
    activeSellingPrice: commercialPrice.activeSellingPrice,
    activePromotion: commercialPrice.activePromotion,
    basePrice: commercialPrice.basePrice,
    discountAmount: commercialPrice.discountAmount,
    finalPrice: commercialPrice.finalPrice,
    effectivePrice: commercialPrice.finalPrice,
    compareAtPrice: commercialPrice.compareAtPrice,
    price: commercialPrice.finalPrice,
    oldPrice: commercialPrice.compareAtPrice,
    sellable: commercialPrice.sellable,
    notSellableReason: commercialPrice.reason,
  };
}
