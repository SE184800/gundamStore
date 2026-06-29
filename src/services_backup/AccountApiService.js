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
  const data = await accountRequest("/account/me");
  return data.account;
}

export async function updateMyAccount(payload = {}) {
  const data = await accountRequest("/account/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return data.account;
}

export async function getMyAddresses() {
  const data = await accountRequest("/account/addresses");
  return data.addresses || [];
}

export async function createMyAddress(payload = {}) {
  const data = await accountRequest("/account/addresses", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return data.address;
}

export async function updateMyAddress(id, payload = {}) {
  const data = await accountRequest(`/account/addresses/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return data.address;
}

export async function deleteMyAddress(id) {
  return accountRequest(`/account/addresses/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function setDefaultMyAddress(id) {
  const data = await accountRequest(`/account/addresses/${encodeURIComponent(id)}/default`, {
    method: "PATCH",
  });

  return data.address;
}

export async function getMyWishlist() {
  const data = await accountRequest("/account/wishlist");
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

  const data = await accountRequest("/account/wishlist", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return data.item;
}

export async function removeMyWishlistItem(productId) {
  const data = await accountRequest(`/account/wishlist/${encodeURIComponent(productId)}`, {
    method: "DELETE",
  });

  return data;
}

export async function clearMyWishlistApi() {
  const data = await accountRequest("/account/wishlist", {
    method: "DELETE",
  });

  return data;
}
