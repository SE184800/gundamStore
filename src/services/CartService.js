import { normalizeCartItem, normalizeItems, normalizeText, resolveName } from "./PricingService";
import { getStock } from "./InventoryService";

const CART_KEY = "gundam-cart-final";
const CHECKOUT_KEY = "gundam-checkout-draft";

function totalQty(cart = []) {
  return cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
}

function looksLikeBackendId(value = "") {
  return /^c[a-z0-9]{10,}$/i.test(String(value || ""));
}

function resolveBackendProductId(product = {}) {
  return (
    product.backendProductId ||
    (looksLikeBackendId(product.productId) ? product.productId : "") ||
    (looksLikeBackendId(product.id) ? product.id : "") ||
    ""
  );
}

function identity(item = {}) {
  const variantKey = item.variantId || item.variantSku;

  if (variantKey) {
    return [`variant:${variantKey}`];
  }

  return [
    item.backendProductId,
    item.productId,
    item.id,
    item.slug,
    item.sku,
    normalizeText(resolveName(item.name)),
  ]
    .filter(Boolean)
    .map(String);
}

function sameItem(a = {}, b = {}) {
  const aKeys = identity(a);
  const bKeys = identity(b);
  return aKeys.some((key) => bKeys.includes(key));
}

function dedupeCart(cart = []) {
  return cart.reduce((acc, item) => {
    const index = acc.findIndex((row) => sameItem(row, item));

    if (index >= 0) {
      const current = acc[index];
      acc[index] = {
        ...current,
        ...item,
        id: current.id || item.id,
        backendProductId: current.backendProductId || item.backendProductId,
        productId: current.productId || item.productId || current.backendProductId || item.backendProductId,
        quantity: (Number(current.quantity) || 1) + (Number(item.quantity) || 1),
        selected: item.selected !== undefined ? item.selected : (current.selected !== undefined ? current.selected : true),
        price: Number(item.price) > 0 ? item.price : current.price,
      };
      return acc;
    }

    return [...acc, item];
  }, []);
}


export function updateCartBadgeDom(count = 0) {
  if (typeof document === "undefined") return;

  const value = Number(count) || 0;
  const badge = document.getElementById("gundam-floating-cart-badge");

  if (!badge) return;

  badge.textContent = String(value);
  badge.style.display = value > 0 ? "flex" : "none";
}

export function forceCartBadgeSync(products = []) {
  updateCartBadgeDom(getCartCount(products));
}

export function emitCartUpdated(cart = []) {

  window.dispatchEvent(
    new CustomEvent("cart:updated", {
      detail: {
        cart,
        totalQty: totalQty(cart),
        updatedAt: Date.now(),
      },
    })
  );
}

export function getCart(products = []) {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    const fixed = dedupeCart(normalizeItems(Array.isArray(raw) ? raw : [], products));
    localStorage.setItem(CART_KEY, JSON.stringify(fixed));
    return fixed;
  } catch {
    return [];
  }
}

export function saveCart(cart, products = []) {
  const fixed = dedupeCart(normalizeItems(Array.isArray(cart) ? cart : [], products));
  localStorage.setItem(CART_KEY, JSON.stringify(fixed));
  emitCartUpdated(fixed);
  return fixed;
}


export function validateCartStock(product, quantity = 1, products = []) {
  const backendProductId = resolveBackendProductId(product);
  const item = normalizeCartItem(
    {
      ...product,
      id: product?.id || product?.slug || backendProductId,
      backendProductId,
      productId: backendProductId || product?.productId || product?.id || product?.slug,
      sku: product?.sku || "",
      slug: product?.slug || "",
      variantId: product?.variantId || "",
      variantSku: product?.variantSku || "",
      variantName: product?.variantName || "",
      variantOptions: product?.variantOptions || null,
      quantity: Number(quantity) || 1,
      selected: true,
    },
    product
  );

  const cart = getCart(products);
  const found = cart.find((row) => sameItem(row, item));
  const currentQty = Number(found?.quantity || 0);
  const requestQty = Math.max(1, Number(quantity) || 1);
  const stock = getStock(item.backendProductId || item.productId || item.id || product?.id);
  const available = item.variantId
    ? Number(product?.stock || item.stock || 0)
    : Number(stock?.available || product?.stock || 0);

  if (available <= 0) {
    return { ok: false, reason: "OUT_OF_STOCK", available, currentQty, requestQty, item };
  }

  if (currentQty + requestQty > available) {
    return { ok: false, reason: "EXCEED_STOCK", available, currentQty, requestQty, item };
  }

  return { ok: true, available, currentQty, requestQty, item };
}

export function addProductToCart(product, quantity = 1, products = []) {
  const validation = validateCartStock(product, quantity, products);
  if (!validation.ok) return getCart(products);

  const cart = getCart(products);
  const backendProductId = resolveBackendProductId(product);

  const item = normalizeCartItem(
    {
      ...product,
      id: product?.id || product?.slug || backendProductId,
      backendProductId,
      productId: backendProductId || product?.productId || product?.id || product?.slug,
      sku: product?.sku || "",
      slug: product?.slug || "",
      variantId: product?.variantId || "",
      variantSku: product?.variantSku || "",
      variantName: product?.variantName || "",
      variantOptions: product?.variantOptions || null,
      quantity: Number(quantity) || 1,
      selected: true,
    },
    product
  );

  const found = cart.find((row) => sameItem(row, item));

  const next = found
    ? cart.map((row) =>
      sameItem(row, found)
        ? {
          ...row,
          ...item,
          id: row.id || item.id,
          backendProductId: row.backendProductId || item.backendProductId,
          productId: row.productId || item.productId || row.backendProductId || item.backendProductId,
          quantity: (Number(row.quantity) || 1) + item.quantity,
          selected: true,
        }
        : row
    )
    : [item, ...cart];

  return saveCart(next, products);
}

export function getCartCount(products = []) {
  return totalQty(getCart(products));
}

export function clearCartItems(itemIds = []) {
  const cart = getCart();
  return saveCart(
    cart.filter(
      (item) =>
        !itemIds.includes(item.id) &&
        !itemIds.includes(item.productId) &&
        !itemIds.includes(item.backendProductId) &&
        !itemIds.includes(item.variantId)
    )
  );
}


export function buildCheckoutDraftFromItems(items = [], options = {}, products = []) {
  const normalized = normalizeItems(items, products).map((item) => ({
    ...item,
    id: item.id || item.productId || item.backendProductId,
    productId: item.productId || item.id || item.backendProductId,
    variantId: item.variantId || "",
    variantSku: item.variantSku || "",
    variantName: item.variantName || "",
    variantOptions: item.variantOptions || null,
    quantity: Math.max(1, Number(item.quantity) || 1),
    selected: item.selected !== false,
  }));

  const subtotal = normalized.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );

  const shippingFee = Number(options.shippingFee || 0);
  const discount = Number(options.discount || 0);
  const shippingDiscount = Number(options.shippingDiscount || 0);

  return {
    orderType: options.orderType || "normal",
    items: normalized,
    subtotal,
    shippingFee,
    discount,
    shippingDiscount,
    voucherCode: options.voucherCode || "",
    total: Math.max(0, subtotal + shippingFee - discount - shippingDiscount),
    shippingMethod: options.shippingMethod || "FAST",
    preorder: options.preorder || null,
  };
}

export function saveBuyNowDraft(product, quantity = 1, options = {}, products = []) {
  const validation = validateCartStock(product, quantity, products);
  if (!validation.ok) return validation;

  addProductToCart(product, quantity, products);

  const draft = buildCheckoutDraftFromItems(
    [{ ...validation.item, quantity: Math.max(1, Number(quantity) || 1), selected: true }],
    options,
    products
  );

  saveCheckoutDraft(draft);
  return { ok: true, draft, available: validation.available };
}

export function saveCheckoutDraft(draft) {
  localStorage.setItem(CHECKOUT_KEY, JSON.stringify(draft));
}

export function getCheckoutDraft() {
  try {
    return JSON.parse(localStorage.getItem(CHECKOUT_KEY) || "null");
  } catch {
    return null;
  }
}

export function clearCheckoutDraft() {
  localStorage.removeItem(CHECKOUT_KEY);
}
