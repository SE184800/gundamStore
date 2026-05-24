export const SITE_CONFIG = {
  siteName: "Gundam Store VN",
  defaultTitle: "Gundam Store VN | Gunpla, Gundam chính hãng, Pre-order & Builder Gear",
  defaultDescription:
    "Gundam Store VN chuyên Gunpla/Gundam chính hãng, hàng sẵn, pre-order, phụ kiện builder, tin tức và sự kiện cộng đồng.",
  defaultImage: "/images/banners/banner-1.jpg",
  twitterHandle: "",
};

export function getSiteUrl() {
  if (import.meta.env.VITE_SITE_URL) {
    return String(import.meta.env.VITE_SITE_URL).replace(/\/$/, "");
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return "https://gundam-store.vn";
}

export function buildUrl(path = "/") {
  const cleanPath = String(path || "/").startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${cleanPath}`;
}

export function absoluteImage(image = "") {
  if (!image) return buildUrl(SITE_CONFIG.defaultImage);
  if (/^https?:\/\//.test(image)) return image;
  return buildUrl(image);
}

export function cleanText(value = "", max = 160) {
  return String(value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}
