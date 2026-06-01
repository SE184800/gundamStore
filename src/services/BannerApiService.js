import { apiRequest } from "./ApiClient";

export async function getStorefrontHomeBannersFromApi() {
  const data = await apiRequest("/banners/home", {
    token: "",
  });

  return {
    banners: Array.isArray(data?.banners) ? data.banners : [],
    heroSettings: data?.heroSettings || null,
  };
}

export async function listAdminBanners() {
  const data = await apiRequest("/admin/banners");
  return Array.isArray(data?.banners) ? data.banners : [];
}

export async function createAdminBanner(payload) {
  const data = await apiRequest("/admin/banners", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return data?.banner;
}

export async function updateAdminBanner(id, payload) {
  const data = await apiRequest(`/admin/banners/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return data?.banner;
}

export async function deleteAdminBanner(id) {
  return apiRequest(`/admin/banners/${id}`, {
    method: "DELETE",
  });
}

export async function getAdminHeroSettings() {
  const data = await apiRequest("/admin/banners/settings/hero");
  return data?.heroSettings || null;
}

export async function updateAdminHeroSettings(payload) {
  const data = await apiRequest("/admin/banners/settings/hero", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return data?.heroSettings || null;
}
