import { prisma } from "../config/prisma.js";

const HERO_SETTING_ID = "homepage";
const VALID_STATUSES = new Set(["Live", "Draft", "Scheduled", "Inactive"]);
const VALID_FIT_MODES = new Set(["cover", "contain"]);
const VALID_MEDIA_TYPES = new Set(["image", "gif", "video"]);
const BANNER_MEDIA_TEXT_LIMIT = 20_000_000;
const HOMEPAGE_HERO_MAX_BANNERS = 3;
const BANNER_IMAGE_FIELDS = ["mainImage", "imageUrl", "mobileImage", "tabletImage", "desktopImage"];

function cleanText(value = "", max = 2000) {
  return String(value || "").trim().slice(0, max);
}

function clampHeroMaxBanners(value) {
  const requested = Number(value || HOMEPAGE_HERO_MAX_BANNERS);
  if (!Number.isFinite(requested) || requested <= 0) return HOMEPAGE_HERO_MAX_BANNERS;
  return Math.min(requested, HOMEPAGE_HERO_MAX_BANNERS);
}

function isInlineImageValue(value = "") {
  const text = cleanText(value, BANNER_MEDIA_TEXT_LIMIT).toLowerCase();
  return text.startsWith("data:") || text.includes(";base64,");
}

function isOptimizedImageUrl(value = "") {
  const text = cleanText(value, BANNER_MEDIA_TEXT_LIMIT).toLowerCase();
  return !text || text.includes(".webp") || text.includes(".avif");
}

function validateBannerImageFields(input = {}) {
  for (const field of BANNER_IMAGE_FIELDS) {
    const value = cleanText(input[field] || "", BANNER_MEDIA_TEXT_LIMIT);
    if (!value) continue;

    if (isInlineImageValue(value)) {
      return {
        ok: false,
        message: `${field} must be an uploaded image URL. Inline data/base64 images are not allowed.`,
      };
    }

    if (!isOptimizedImageUrl(value)) {
      console.warn(`[Banner performance] ${field}: WebP/AVIF is recommended. Current URL: ${value.slice(0, 180)}`);
    }
  }

  return { ok: true };
}

function normalizeStatus(value) {
  const status = cleanText(value || "Draft", 40);
  return VALID_STATUSES.has(status) ? status : "Draft";
}

function normalizeFitMode(value) {
  const fitMode = cleanText(value || "cover", 20).toLowerCase();
  return VALID_FIT_MODES.has(fitMode) ? fitMode : "cover";
}

function normalizeMediaType(value) {
  const mediaType = cleanText(value || "image", 20).toLowerCase();
  return VALID_MEDIA_TYPES.has(mediaType) ? mediaType : "image";
}

function getAllowedCtaHosts() {
  return String(process.env.BANNER_CTA_ALLOWED_HOSTS || process.env.CTA_ALLOWED_HOSTS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeSafeCtaUrl(rawValue, { fallback = "/shop", rejectUnsafe = false } = {}) {
  const value = cleanText(rawValue || fallback, 1200);

  if (!value) {
    return { ok: !rejectUnsafe, value: fallback };
  }

  const lower = value.toLowerCase();

  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:") ||
    value.includes("\\")
  ) {
    return { ok: false, value: fallback };
  }

  if (value.startsWith("/") && !value.startsWith("//")) {
    return { ok: true, value };
  }

  try {
    const url = new URL(value);
    const allowedHosts = getAllowedCtaHosts();

    if (url.protocol !== "https:") {
      return { ok: false, value: fallback };
    }

    if (allowedHosts.length && !allowedHosts.includes(url.hostname.toLowerCase())) {
      return { ok: false, value: fallback };
    }

    return { ok: true, value: url.toString() };
  } catch {
    return { ok: false, value: fallback };
  }
}

function hasMainMedia(input = {}) {
  return Boolean(
    cleanText(
      input.mainImage ||
        input.imageUrl ||
        input.desktopImage ||
        input.mobileImage ||
        input.tabletImage ||
        input.videoUrl ||
        ""
    )
  );
}

function toPublicBanner(row = {}) {
  const cta = normalizeSafeCtaUrl(row.ctaUrl, { fallback: "/shop", rejectUnsafe: false });

  return {
    id: row.id,
    titleInternal: row.titleInternal,
    altText: row.altText,
    placement: row.placement,
    mediaType: row.mediaType,
    mainImage: row.mainImage,
    imageUrl: row.imageUrl || row.mainImage,
    mobileImage: row.mobileImage,
    tabletImage: row.tabletImage,
    desktopImage: row.desktopImage,
    videoUrl: row.videoUrl,
    ctaUrl: cta.value,
    status: row.status,
    active: row.active,
    priority: row.priority,
    fitMode: row.fitMode || "cover",
  };
}

function toAdminBanner(row = {}) {
  return {
    ...toPublicBanner(row),
    legacyText: row.legacyText || null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function normalizeBannerInput(body = {}, { current = null } = {}) {
  const merged = {
    ...(current || {}),
    ...(body || {}),
  };

  const mainImage = cleanText(merged.mainImage || merged.imageUrl || "", BANNER_MEDIA_TEXT_LIMIT);
  const imageUrl = cleanText(merged.imageUrl || mainImage, BANNER_MEDIA_TEXT_LIMIT);
  const mobileImage = cleanText(merged.mobileImage || "", BANNER_MEDIA_TEXT_LIMIT);
  const tabletImage = cleanText(merged.tabletImage || "", BANNER_MEDIA_TEXT_LIMIT);
  const desktopImage = cleanText(merged.desktopImage || "", BANNER_MEDIA_TEXT_LIMIT);
  const videoUrl = cleanText(merged.videoUrl || "", BANNER_MEDIA_TEXT_LIMIT);
  const cta = normalizeSafeCtaUrl(merged.ctaUrl || "/shop", {
    fallback: "/shop",
    rejectUnsafe: true,
  });

  if (!hasMainMedia({ mainImage, imageUrl, mobileImage, tabletImage, desktopImage, videoUrl })) {
    return {
      ok: false,
      message: "Main image or imageUrl is required for banner.",
    };
  }

  if (!cta.ok) {
    return {
      ok: false,
      message: "CTA URL is not allowed.",
    };
  }

  const imageValidation = validateBannerImageFields({
    mainImage,
    imageUrl,
    mobileImage,
    tabletImage,
    desktopImage,
  });

  if (!imageValidation.ok) {
    return {
      ok: false,
      message: imageValidation.message,
    };
  }

  const status = normalizeStatus(merged.status);
  const fitMode = normalizeFitMode(merged.fitMode);
  const mediaType = normalizeMediaType(merged.mediaType);

  return {
    ok: true,
    data: {
      titleInternal: cleanText(
        merged.titleInternal || merged.name || merged.altText || "Storefront banner",
        240
      ),
      altText: cleanText(
        merged.altText || merged.titleInternal || merged.name || "Storefront banner",
        240
      ),
      placement: cleanText(merged.placement || "Homepage Hero", 120),
      mediaType,
      mainImage,
      imageUrl,
      mobileImage: mobileImage || null,
      tabletImage: tabletImage || null,
      desktopImage: desktopImage || null,
      videoUrl: videoUrl || null,
      ctaUrl: cta.value,
      status,
      active: merged.active !== false,
      priority: Number.isFinite(Number(merged.priority)) ? Number(merged.priority) : 1,
      fitMode,
      legacyText: {
        heading: merged.heading || null,
        title: merged.title || null,
        subtitle: merged.subtitle || null,
        ctaText: merged.ctaText || null,
        showEyebrow: merged.showEyebrow ?? null,
        showHeading: merged.showHeading ?? null,
        showTitle: merged.showTitle ?? null,
        showSubtitle: merged.showSubtitle ?? null,
        showCta: merged.showCta ?? null,
        showChips: merged.showChips ?? null,
      },
    },
  };
}

async function getOrCreateHeroSettings() {
  return prisma.heroSetting.upsert({
    where: { id: HERO_SETTING_ID },
    update: {},
    create: {
      id: HERO_SETTING_ID,
      layout: "v2",
      autoplay: true,
      interval: 4500,
      maxBanners: HOMEPAGE_HERO_MAX_BANNERS,
    },
  });
}

export async function listStorefrontHomeBanners(req, res, next) {
  try {
    const settings = await getOrCreateHeroSettings();
    const maxBanners = clampHeroMaxBanners(settings.maxBanners);

    const rows = await prisma.banner.findMany({
      where: {
        active: true,
        status: "Live",
      },
      orderBy: [
        { priority: "asc" },
        { updatedAt: "desc" },
      ],
    });

    const banners = rows
      .filter((banner) => {
        const placement = String(banner.placement || "").toLowerCase();
        return placement.includes("home") || placement.includes("hero");
      })
      .slice(0, maxBanners)
      .map(toPublicBanner);

    return res.json({
      success: true,
      banners,
      heroSettings: {
        layout: settings.layout,
        autoplay: settings.autoplay,
        interval: settings.interval,
        maxBanners,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function listAdminBanners(req, res, next) {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: [
        { priority: "asc" },
        { updatedAt: "desc" },
      ],
    });

    return res.json({
      success: true,
      banners: banners.map(toAdminBanner),
    });
  } catch (error) {
    next(error);
  }
}

export async function createAdminBanner(req, res, next) {
  try {
    const normalized = normalizeBannerInput(req.body || {});

    if (!normalized.ok) {
      return res.status(400).json({
        success: false,
        message: normalized.message,
      });
    }

    const banner = await prisma.banner.create({
      data: normalized.data,
    });

    return res.status(201).json({
      success: true,
      banner: toAdminBanner(banner),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminBanner(req, res, next) {
  try {
    const current = await prisma.banner.findUnique({
      where: { id: req.params.id },
    });

    if (!current) {
      return res.status(404).json({
        success: false,
        message: "Banner not found.",
      });
    }

    const normalized = normalizeBannerInput(req.body || {}, { current });

    if (!normalized.ok) {
      return res.status(400).json({
        success: false,
        message: normalized.message,
      });
    }

    const banner = await prisma.banner.update({
      where: { id: req.params.id },
      data: normalized.data,
    });

    return res.json({
      success: true,
      banner: toAdminBanner(banner),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAdminBanner(req, res, next) {
  try {
    const current = await prisma.banner.findUnique({
      where: { id: req.params.id },
    });

    if (!current) {
      return res.status(404).json({
        success: false,
        message: "Banner not found.",
      });
    }

    await prisma.banner.delete({
      where: { id: req.params.id },
    });

    return res.json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminHeroSettings(req, res, next) {
  try {
    const settings = await getOrCreateHeroSettings();

    return res.json({
      success: true,
      heroSettings: {
        layout: settings.layout,
        autoplay: settings.autoplay,
        interval: settings.interval,
        maxBanners: clampHeroMaxBanners(settings.maxBanners),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminHeroSettings(req, res, next) {
  try {
    const body = req.body || {};
    const layout = ["v2", "v3"].includes(String(body.layout || "").toLowerCase())
      ? String(body.layout).toLowerCase()
      : undefined;

    const interval = Number(body.interval);
    const maxBanners = Number(body.maxBanners);
    const safeMaxBanners = clampHeroMaxBanners(maxBanners);

    const settings = await prisma.heroSetting.upsert({
      where: { id: HERO_SETTING_ID },
      update: {
        ...(layout ? { layout } : {}),
        ...(typeof body.autoplay === "boolean" ? { autoplay: body.autoplay } : {}),
        ...(Number.isFinite(interval) && interval >= 1500 ? { interval } : {}),
        ...(Number.isFinite(maxBanners) && maxBanners > 0 ? { maxBanners: safeMaxBanners } : {}),
      },
      create: {
        id: HERO_SETTING_ID,
        layout: layout || "v2",
        autoplay: typeof body.autoplay === "boolean" ? body.autoplay : true,
        interval: Number.isFinite(interval) && interval >= 1500 ? interval : 4500,
        maxBanners: Number.isFinite(maxBanners) && maxBanners > 0 ? safeMaxBanners : HOMEPAGE_HERO_MAX_BANNERS,
      },
    });

    return res.json({
      success: true,
      heroSettings: {
        layout: settings.layout,
        autoplay: settings.autoplay,
        interval: settings.interval,
        maxBanners: clampHeroMaxBanners(settings.maxBanners),
      },
    });
  } catch (error) {
    next(error);
  }
}
