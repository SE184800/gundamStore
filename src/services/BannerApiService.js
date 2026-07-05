import { apiRequest } from "./ApiClient";
import { validateImageUrlForPerformance } from "../utils/imagePerformanceValidation";

const HOMEPAGE_HERO_MAX_BANNERS = 3;

function limitHeroSettings(heroSettings = {}) {
  const settings = heroSettings || {};
  return {
    ...settings,
    maxBanners: Math.min(Number(settings.maxBanners || HOMEPAGE_HERO_MAX_BANNERS), HOMEPAGE_HERO_MAX_BANNERS),
  };
}

function validateBannerPayloadImages(payload = {}) {
  validateImageUrlForPerformance(payload.desktopImage || payload.mainImage || payload.imageUrl || payload.mediaUrl || payload.image, {
    label: "Hero desktop image",
    targetKey: "heroDesktop",
    sizeBytes: payload.desktopImageSizeBytes || payload.sizeBytes || payload.fileSize,
  });

  validateImageUrlForPerformance(payload.mobileImage, {
    label: "Hero mobile image",
    targetKey: "heroMobile",
    sizeBytes: payload.mobileImageSizeBytes || payload.sizeBytes || payload.fileSize,
  });

  validateImageUrlForPerformance(payload.tabletImage, {
    label: "Hero tablet image",
    targetKey: "heroDesktop",
    sizeBytes: payload.tabletImageSizeBytes || payload.sizeBytes || payload.fileSize,
  });
}

export async function getStorefrontHomeBannersFromApi() {
  const data = await apiRequest("/api/banners/home");

  return {
    banners: Array.isArray(data?.banners) ? data.banners.slice(0, HOMEPAGE_HERO_MAX_BANNERS) : [],
    heroSettings: limitHeroSettings(data?.heroSettings || null),
  };
}

export async function listAdminBanners() {
  const data = await apiRequest("/api/admin/banners");
  return Array.isArray(data?.banners) ? data.banners : [];
}

export async function createAdminBanner(payload) {
  validateBannerPayloadImages(payload);

  const data = await apiRequest("/api/admin/banners", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return data?.banner;
}

export async function updateAdminBanner(id, payload) {
  validateBannerPayloadImages(payload);

  const data = await apiRequest("/api/admin/banners/" + id, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return data?.banner;
}

export async function deleteAdminBanner(id) {
  return apiRequest("/api/admin/banners/" + id, {
    method: "DELETE",
  });
}

export async function getAdminHeroSettings() {
  const data = await apiRequest("/api/admin/banners/settings/hero");
  return limitHeroSettings(data?.heroSettings || null);
}

export async function updateAdminHeroSettings(payload) {
  const data = await apiRequest("/api/admin/banners/settings/hero", {
    method: "PATCH",
    body: JSON.stringify(limitHeroSettings(payload)),
  });

  return limitHeroSettings(data?.heroSettings || null);
}
