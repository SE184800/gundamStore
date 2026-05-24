import { normalizeCartItem, normalizeItems, normalizeText, resolveName } from "./PricingService";

const CART_KEY = "gundam-cart-final";
const CHECKOUT_KEY = "gundam-checkout-draft";

function totalQty(cart = []) {
  return cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
}

function identity(item = {}) {
  return [
    item.id,
    item.productId,
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
        productId: current.productId || item.productId,
        quantity: (Number(current.quantity) || 1) + (Number(item.quantity) || 1),
        selected: true,
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

export function addProductToCart(product, quantity = 1, products = []) {
  const cart = getCart(products);
  const item = normalizeCartItem(
    {
      ...product,
      id: product?.id || product?.slug,
      productId: product?.id,
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
              productId: row.productId || item.productId,
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
    cart.filter((item) => !itemIds.includes(item.id) && !itemIds.includes(item.productId))
  );
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
