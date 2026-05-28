import { apiRequest, getStoredAccountToken } from "./ApiClient";

function accountRequest(path, options = {}) {
  return apiRequest(path, {
    ...options,
    token: getStoredAccountToken(),
  });
}

export function hasAccountToken() {
  return Boolean(getStoredAccountToken());
}

export async function getMyAccount() {
  const data = await accountRequest("/api/account/me");
  return data.account;
}

export async function updateMyAccount(payload = {}) {
  const data = await accountRequest("/api/account/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return data.account;
}

export async function getMyWishlist() {
  const data = await accountRequest("/api/account/wishlist");
  return data.items || [];
}

export async function addMyWishlistItem(product) {
  const payload =
    typeof product === "string"
      ? { productId: product }
      : {
          productId: product?.backendProductId || product?.productId || product?.id,
          sku: product?.sku,
          slug: product?.slug,
        };

  const data = await accountRequest("/api/account/wishlist", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return data.item;
}

export async function removeMyWishlistItem(productId) {
  const data = await accountRequest(`/api/account/wishlist/${encodeURIComponent(productId)}`, {
    method: "DELETE",
  });

  return data;
}

export async function clearMyWishlistApi() {
  const data = await accountRequest("/api/account/wishlist", {
    method: "DELETE",
  });

  return data;
}
