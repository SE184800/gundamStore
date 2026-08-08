import { next } from "@vercel/functions";

// Vercel Routing Middleware (platform-level, framework-agnostic — runs before
// the CDN cache and before the SPA rewrite in vercel.json). This app is a
// client-rendered React SPA: SeoManager.jsx sets <meta> tags via
// document.head *after* JS runs, which link-preview crawlers (Zalo,
// Facebook, Messenger, ...) never execute — they only read the static HTML
// first returned for the request. For those bots on a product page, return a
// small static HTML document with real og:title/og:image/og:description
// fetched server-side from the backend instead of the React shell; real
// browsers (any other User-Agent) fall through to the normal SPA untouched.
export const config = {
  matcher: ["/product/:path*"],
};

const BOT_USER_AGENT_REGEX =
  /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|Slackbot|TelegramBot|Zalo|Pinterest(bot)?|Discordbot|SkypeUriPreview|redditbot|Applebot|vkShare|W3C_Validator|Google-InspectionTool|Bingbot|Googlebot/i;

const API_BASE = (process.env.VITE_API_BASE_URL || "https://gundam-store-team.onrender.com").replace(/\/+$/, "");
const MEDIA_BASE_URL = "https://nglnhakstmjqmxapzfgj.supabase.co/storage/v1/object/public/gundam-media";
const SITE_NAME = "Gundam Store VN";
const DEFAULT_IMAGE_PATH = "/images/banners/banner-1.jpg";

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cleanText(value = "", max = 200) {
  return String(value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function resolveMediaUrl(value, origin) {
  const imagePath = String(value || "").trim();
  if (!imagePath) return "";
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  if (imagePath.startsWith("/")) return `${origin}${imagePath}`;
  return `${MEDIA_BASE_URL}/${imagePath.replace(/^\/+/, "")}`;
}

function firstImagePath(product = {}) {
  const firstImage = Array.isArray(product.images) ? product.images[0] : null;
  const imageFromArray =
    typeof firstImage === "string"
      ? firstImage
      : firstImage?.cardUrl || firstImage?.url || firstImage?.detailUrl || firstImage?.thumbUrl || "";

  return (
    product.cardUrl ||
    product.imageUrl ||
    imageFromArray ||
    product.media?.card ||
    product.media?.home ||
    product.media?.detailMain ||
    (Array.isArray(product.media?.gallery) ? product.media.gallery[0] : "") ||
    ""
  );
}

function renderProductHtml({ title, description, image, canonicalUrl }) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeImage = escapeHtml(image);
  const safeUrl = escapeHtml(canonicalUrl);
  const safeSiteName = escapeHtml(SITE_NAME);

  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<title>${safeTitle}</title>
<meta name="description" content="${safeDescription}" />
<link rel="canonical" href="${safeUrl}" />
<meta property="og:type" content="product" />
<meta property="og:site_name" content="${safeSiteName}" />
<meta property="og:title" content="${safeTitle}" />
<meta property="og:description" content="${safeDescription}" />
<meta property="og:image" content="${safeImage}" />
<meta property="og:image:secure_url" content="${safeImage}" />
<meta property="og:url" content="${safeUrl}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${safeTitle}" />
<meta name="twitter:description" content="${safeDescription}" />
<meta name="twitter:image" content="${safeImage}" />
</head>
<body>
<h1>${safeTitle}</h1>
<p>${safeDescription}</p>
<img src="${safeImage}" alt="${safeTitle}" />
<a href="${safeUrl}">${safeUrl}</a>
</body>
</html>`;
}

export default async function middleware(request) {
  const userAgent = request.headers.get("user-agent") || "";

  // Real shoppers (any browser UA not in the crawler list) always get the
  // normal SPA — this branch only ever serves link-preview bots.
  if (!BOT_USER_AGENT_REGEX.test(userAgent)) {
    return next();
  }

  const url = new URL(request.url);
  const match = url.pathname.match(/^\/product\/([^/]+)/);
  if (!match) return next();

  const slug = decodeURIComponent(match[1]);

  try {
    const apiRes = await fetch(`${API_BASE}/api/products/${encodeURIComponent(slug)}`, {
      headers: { accept: "application/json" },
    });

    if (!apiRes.ok) return next();

    const data = await apiRes.json();
    const product = data?.product;
    if (!data?.success || !product) return next();

    const name = product.nameVi || product.nameEn || SITE_NAME;
    const description = cleanText(
      product.description || product.shortVi || product.shortEn || `Mua ${name} chính hãng tại ${SITE_NAME}.`,
      200
    );
    const imagePath = firstImagePath(product) || DEFAULT_IMAGE_PATH;
    const image = resolveMediaUrl(imagePath, url.origin) || `${url.origin}${DEFAULT_IMAGE_PATH}`;
    const canonicalUrl = `${url.origin}/product/${encodeURIComponent(slug)}`;

    const html = renderProductHtml({
      title: `${name} | ${SITE_NAME}`,
      description,
      image,
      canonicalUrl,
    });

    return new Response(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch {
    // Fail open — never block a real request behind a flaky backend call.
    return next();
  }
}
