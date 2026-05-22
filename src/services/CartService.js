const CART_KEY = "gundam-cart-final";
const CHECKOUT_KEY = "gundam-checkout-draft";

export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("gundam-cart-updated"));
}

export function clearCartItems(itemIds = []) {
  const cart = getCart();
  const next = cart.filter((item) => !itemIds.includes(item.id));
  saveCart(next);
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
