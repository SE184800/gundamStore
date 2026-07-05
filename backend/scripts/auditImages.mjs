import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CDN_BASE = String(process.env.IMAGE_CDN_BASE_URL || "https://cdn.gundamstorevn.vn").replace(/\/+$/, "");
const CHECK_BROKEN_IMAGES = String(process.env.CHECK_BROKEN_IMAGES || "false").toLowerCase() === "true";

const summary = {
  products: 0,
  banners: 0,
  categories: 0,
  missingImage: 0,
  base64DataImage: 0,
  nonOptimized: 0,
  externalNonCdn: 0,
  oversized: 0,
  brokenUrl: 0,
};

const findings = [];

function clean(value = "") {
  return String(value || "").trim();
}

function isInlineImage(value = "") {
  const text = clean(value).toLowerCase();
  return text.startsWith("data:") || text.startsWith("data:image") || text.includes(";base64,");
}

function isOptimized(value = "") {
  const text = clean(value).toLowerCase().split("?")[0];
  return text.endsWith(".webp") || text.endsWith(".avif");
}

function isExternalNonCdn(value = "") {
  const text = clean(value);
  if (!/^https?:\/\//i.test(text)) return false;
  return CDN_BASE && !text.startsWith(CDN_BASE);
}

function record(type, id, field, issue, value = "") {
  findings.push({ type, id, field, issue, value: clean(value).slice(0, 220) });
  if (issue === "missing_image") summary.missingImage += 1;
  if (issue === "base64_data_image") summary.base64DataImage += 1;
  if (issue === "non_webp_avif") summary.nonOptimized += 1;
  if (issue === "external_non_cdn") summary.externalNonCdn += 1;
  if (issue === "oversized") summary.oversized += 1;
  if (issue === "broken_url") summary.brokenUrl += 1;
}

async function checkBrokenUrl(type, id, field, value) {
  if (!CHECK_BROKEN_IMAGES) return;
  const url = clean(value);
  if (!/^https?:\/\//i.test(url)) return;

  try {
    const response = await fetch(url, { method: "HEAD" });
    if (!response.ok) {
      record(type, id, field, "broken_url", `${url} -> ${response.status}`);
    }
  } catch (error) {
    record(type, id, field, "broken_url", `${url} -> ${error.message}`);
  }
}

async function inspectImageValue(type, id, field, value, sizeBytes, sizeLimit) {
  const url = clean(value);
  if (!url) {
    record(type, id, field, "missing_image");
    return;
  }

  if (isInlineImage(url)) record(type, id, field, "base64_data_image", url);
  if (!isOptimized(url)) record(type, id, field, "non_webp_avif", url);
  if (isExternalNonCdn(url)) record(type, id, field, "external_non_cdn", url);
  if (Number(sizeBytes || 0) > sizeLimit) record(type, id, field, "oversized", `${url} sizeBytes=${sizeBytes}`);
  await checkBrokenUrl(type, id, field, url);
}

async function auditProducts() {
  const products = await prisma.product.findMany({
    where: { active: true },
    select: {
      id: true,
      sku: true,
      imageUrl: true,
      images: {
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          url: true,
          thumbUrl: true,
          cardUrl: true,
          detailUrl: true,
          sizeBytes: true,
          sortOrder: true,
        },
      },
    },
  });

  summary.products = products.length;

  for (const product of products) {
    const primary = product.images?.[0];
    const primaryUrl = primary?.cardUrl || primary?.url || product.imageUrl;
    await inspectImageValue("product", product.id, "imageUrl/cardUrl", primaryUrl, primary?.sizeBytes, 200 * 1024);

    for (const image of product.images || []) {
      await inspectImageValue("productImage", image.id, "url", image.url, image.sizeBytes, 300 * 1024);
      if (image.thumbUrl) await inspectImageValue("productImage", image.id, "thumbUrl", image.thumbUrl, image.sizeBytes, 80 * 1024);
      if (image.cardUrl) await inspectImageValue("productImage", image.id, "cardUrl", image.cardUrl, image.sizeBytes, 200 * 1024);
      if (image.detailUrl) await inspectImageValue("productImage", image.id, "detailUrl", image.detailUrl, image.sizeBytes, 300 * 1024);
    }
  }
}

async function auditBanners() {
  const banners = await prisma.banner.findMany({
    where: { active: true },
    select: {
      id: true,
      titleInternal: true,
      mainImage: true,
      imageUrl: true,
      mobileImage: true,
      tabletImage: true,
      desktopImage: true,
    },
  });

  summary.banners = banners.length;

  for (const banner of banners) {
    await inspectImageValue("banner", banner.id, "desktopImage/mainImage", banner.desktopImage || banner.mainImage || banner.imageUrl, 0, 500 * 1024);
    if (banner.mobileImage) await inspectImageValue("banner", banner.id, "mobileImage", banner.mobileImage, 0, 300 * 1024);
    if (banner.tabletImage) await inspectImageValue("banner", banner.id, "tabletImage", banner.tabletImage, 0, 500 * 1024);
  }
}

async function auditCategories() {
  const categories = await prisma.productCategory.findMany({
    where: { active: true },
    select: { id: true, imageUrl: true, icon: true },
  });

  summary.categories = categories.length;

  for (const category of categories) {
    await inspectImageValue("category", category.id, "imageUrl/icon", category.imageUrl || category.icon, 0, 200 * 1024);
  }
}

async function main() {
  await auditProducts();
  await auditBanners();
  await auditCategories();

  console.log("Image audit summary:");
  console.log(JSON.stringify(summary, null, 2));

  if (findings.length) {
    console.log("Image audit findings:");
    console.table(findings);
  } else {
    console.log("No image issues found by static DB audit.");
  }
}

main()
  .catch((error) => {
    console.error("Image audit failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
