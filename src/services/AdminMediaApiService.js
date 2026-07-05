import { getApiBaseUrl, getStoredAdminToken } from "./ApiClient";

function buildApiUrl(path = "") {
  const baseUrl = String(getApiBaseUrl() || "").replace(/\/$/, "");
  const cleanPath = String(path || "").startsWith("/") ? String(path || "") : `/${path}`;

  if (baseUrl.endsWith("/api") && cleanPath.startsWith("/api/")) {
    return `${baseUrl}${cleanPath.slice(4)}`;
  }

  return `${baseUrl}${cleanPath}`;
}

async function multipartRequest(path, formData) {
  const token = getStoredAdminToken();
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildApiUrl(path), {
    method: "POST",
    headers,
    body: formData,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof data === "object" && data?.message
      ? data.message
      : `Media upload failed: ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function uploadAdminProductImages(productId, files = [], { replace = false } = {}) {
  const formData = new FormData();

  for (const file of Array.from(files || []).slice(0, 6)) {
    formData.append("images", file);
  }

  formData.append("replace", replace ? "true" : "false");

  return multipartRequest(`/api/admin/media/products/${encodeURIComponent(productId)}/images?replace=${replace ? "true" : "false"}`, formData);
}

export async function uploadAdminBannerImage(bannerId, { image, desktop, mobile } = {}) {
  const formData = new FormData();

  if (image) formData.append("image", image);
  if (desktop) formData.append("desktop", desktop);
  if (mobile) formData.append("mobile", mobile);

  return multipartRequest(`/api/admin/media/banners/${encodeURIComponent(bannerId)}/images`, formData);
}

export async function uploadAdminCategoryImage(categoryId, file) {
  const formData = new FormData();
  formData.append("image", file);

  return multipartRequest(`/api/admin/media/categories/${encodeURIComponent(categoryId)}/image`, formData);
}
