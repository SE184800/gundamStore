// Guest-only "remember my shipping info" store. Namespaced separately from
// the cart/checkout-draft keys and from any admin session storage so the two
// can never collide. Never stores payment details (card, CVV, wallet info).
const SAVED_INFO_KEY = "gundam-guest-saved-checkout-info";

const ALLOWED_FIELDS = ["name", "phone", "email", "province", "district", "ward", "address"];

function pick(source = {}) {
  return ALLOWED_FIELDS.reduce((acc, field) => {
    acc[field] = source[field] || "";
    return acc;
  }, {});
}

export function getSavedCheckoutInfo() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVED_INFO_KEY) || "null");
    return raw ? pick(raw) : null;
  } catch {
    return null;
  }
}

export function saveCheckoutInfo(info) {
  try {
    localStorage.setItem(SAVED_INFO_KEY, JSON.stringify(pick(info)));
  } catch {
    // Storage unavailable — skip silently, non-critical convenience feature.
  }
}

export function clearSavedCheckoutInfo() {
  try {
    localStorage.removeItem(SAVED_INFO_KEY);
  } catch {
    // ignore
  }
}

export function hasSavedCheckoutInfo() {
  return Boolean(getSavedCheckoutInfo());
}
