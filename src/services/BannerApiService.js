import { apiRequest, clearPublicApiCache } from "./ApiClient";
import { validateImageUrlForPerformance } from "../utils/imagePerformanceValidation";

const HOMEPAGE_HERO_MAX_BANNERS = 3;

function isFormDataPayload(payload) {
  return typeof FormData !== "undefined" && payload instanceof FormData;
}

function limitHeroSettings(heroSettings = {}) {
  const settings = heroSettings || {};
  return {
    ...settings,
    maxBanners: Math.min(Number(settings.maxBanners || HOMEPAGE_HERO_MAX_BANNERS), HOMEPAGE_HERO_MAX_BANNERS),
  };
}

function validateBannerPayloadImages(payload = {}) {
  if (isFormDataPayload(payload)) return;

  validateImageUrlForPerformance(payload.desktopImage || payload.mainImage || payload.imageUrl || payload.mediaUrl, {
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

function toRequestBody(payload) {
  return isFormDataPayload(payload) ? payload : JSON.stringify(payload || {});
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
    body: toRequestBody(payload),
  });
  if (!data?.success || !data?.banner) {
    throw new Error(
      data?.message || "Backend did not create the banner."
    );
  }

  clearPublicApiCache(["/api/banners/home"]);
  return data.banner;
}

export async function updateAdminBanner(id, payload) {
  validateBannerPayloadImages(payload);
  const data = await apiRequest("/api/admin/banners/" + id, {
    method: "PATCH",
    body: toRequestBody(payload),
  });
  if (!data?.success || !data?.banner) {
    throw new Error(
      data?.message || "Backend did not update the banner."
    );
  }

  clearPublicApiCache(["/api/banners/home"]);
  return data.banner;
}

export async function deleteAdminBanner(id) {
  const data = await apiRequest("/api/admin/banners/" + id, {
    method: "DELETE",
  });

  clearPublicApiCache(["/api/banners/home"]);
  return data;
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
