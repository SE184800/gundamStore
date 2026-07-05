import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const HERO_SETTING_ID = "homepage";
const HOMEPAGE_HERO_MAX_BANNERS = 3;
const IMAGE_FIELDS = ["mainImage", "imageUrl", "mobileImage", "tabletImage", "desktopImage"];
const HERO_PLACEMENT_KEYWORDS = ["home", "hero"];

const summary = {
  totalBanners: 0,
  disabledInline: 0,
  warnedNonOptimized: 0,
  keptHomepageHero: 0,
  disabledExtraHero: 0,
  heroMaxBanners: HOMEPAGE_HERO_MAX_BANNERS,
};

const warnedNonOptimizedUrls = new Set();
const disabledInlineBannerIds = new Set();
const disabledExtraHeroIds = new Set();

function cleanText(value = "") {
  return String(value || "").trim();
}

function isInlineImageValue(value = "") {
  const text = cleanText(value).toLowerCase();
  return text.startsWith("data:") || text.startsWith("data:image") || text.includes(";base64,");
}

function isOptimizedImageUrl(value = "") {
  const text = cleanText(value).toLowerCase();
  return !text || text.includes(".webp") || text.includes(".avif");
}

function bannerLabel(banner = {}) {
  return banner.titleInternal || banner.altText || banner.name || banner.id || "unknown-banner";
}

function isHomepageHeroBanner(banner = {}) {
  const placement = cleanText(banner.placement || banner.position || "Homepage Hero").toLowerCase();
  return HERO_PLACEMENT_KEYWORDS.some((keyword) => placement.includes(keyword));
}

function isActiveLiveBanner(banner = {}) {
  return banner.active !== false && cleanText(banner.status || "Live") === "Live";
}

async function deactivateBanner(banner, reason) {
  await prisma.banner.update({
    where: { id: banner.id },
    data: {
      active: false,
      status: "Inactive",
    },
  });

  console.log(`[disabled] id=${banner.id} title="${bannerLabel(banner)}" reason=${reason}`);
}

async function cleanupInlineImages(banners = []) {
  for (const banner of banners) {
    let inlineField = "";

    for (const field of IMAGE_FIELDS) {
      const value = banner[field];
      if (value && isInlineImageValue(value)) {
        inlineField = field;
        break;
      }
    }

    if (inlineField) {
      await deactivateBanner(banner, `inline image in ${inlineField}`);
      disabledInlineBannerIds.add(banner.id);
      continue;
    }

    for (const field of IMAGE_FIELDS) {
      const value = banner[field];
      if (!value || isOptimizedImageUrl(value)) continue;

      const key = `${banner.id}:${field}:${value}`;
      if (warnedNonOptimizedUrls.has(key)) continue;

      warnedNonOptimizedUrls.add(key);
      console.warn(
        `[warn] id=${banner.id} title="${bannerLabel(banner)}" field=${field} should be WebP/AVIF url=${cleanText(value).slice(0, 300)}`
      );
    }
  }
}

async function cleanupExtraHomepageHeroes() {
  const activeLiveHeroBanners = await prisma.banner.findMany({
    where: {
      active: true,
      status: "Live",
    },
    orderBy: [
      { priority: "asc" },
      { updatedAt: "desc" },
    ],
  });

  const homepageHeroes = activeLiveHeroBanners.filter(isHomepageHeroBanner);
  const keep = homepageHeroes.slice(0, HOMEPAGE_HERO_MAX_BANNERS);
  const extras = homepageHeroes.slice(HOMEPAGE_HERO_MAX_BANNERS);

  summary.keptHomepageHero = keep.length;

  if (keep.length) {
    console.log("[hero keep]", keep.map((banner) => `${banner.id}:${bannerLabel(banner)}`).join(" | "));
  }

  for (const banner of extras) {
    await deactivateBanner(banner, "extra homepage hero over max 3");
    disabledExtraHeroIds.add(banner.id);
  }
}

async function upsertHeroSettings() {
  const current = await prisma.heroSetting.findUnique({
    where: { id: HERO_SETTING_ID },
  });

  await prisma.heroSetting.upsert({
    where: { id: HERO_SETTING_ID },
    update: {
      maxBanners: HOMEPAGE_HERO_MAX_BANNERS,
    },
    create: {
      id: HERO_SETTING_ID,
      layout: current?.layout || "v2",
      autoplay: current?.autoplay ?? true,
      interval: current?.interval || 4500,
      maxBanners: HOMEPAGE_HERO_MAX_BANNERS,
    },
  });
}

async function main() {
  console.log("Starting banner performance cleanup...");

  const banners = await prisma.banner.findMany({
    orderBy: [
      { priority: "asc" },
      { updatedAt: "desc" },
    ],
  });

  summary.totalBanners = banners.length;

  await cleanupInlineImages(banners);
  await cleanupExtraHomepageHeroes();
  await upsertHeroSettings();

  summary.disabledInline = disabledInlineBannerIds.size;
  summary.warnedNonOptimized = warnedNonOptimizedUrls.size;
  summary.disabledExtraHero = disabledExtraHeroIds.size;
  summary.heroMaxBanners = HOMEPAGE_HERO_MAX_BANNERS;

  console.log("Banner performance cleanup summary:");
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error("Banner performance cleanup failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
