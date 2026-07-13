import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Crown,
  Gift,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";
import PageShell from "../../components/common/PageShell";
import { useCms } from "../../store/CmsStore";
import { translateStaticText } from "../../i18n";
import { getSafeHref } from "../../utils/urlSafety";
import ProductCard from "../../components/storefront/ProductCard";
import {
  getStorefrontCategoriesFromApi,
  getStorefrontProductsForStorefront,
} from "../../services/StorefrontProductApiService";
import { getStorefrontHomeBannersFromApi } from "../../services/BannerApiService";

const HOMEPAGE_HERO_MAX_BANNERS = 3;

const copy = {
  vi: {
    eyebrow: "BUILD YOUR LEGEND",
    heroTitle: "GUNDAM / GUNPLA",
    heroSub: "CHÍNH HÃNG — CHO BUILDER ĐÍCH THỰC",
    chip1: "100% Chính hãng",
    chip2: "Đa dạng mẫu mã",
    chip3: "Giá tốt mỗi ngày",
    buyNow: "MUA NGAY",
    collection: "XEM BỘ SƯU TẬP",
    fastShip: "GIAO NHANH",
    fastShipDesc: "Ship hỏa tốc 2H tại HCM & giao toàn quốc",
    sealed: "HỘP NGUYÊN VẸN",
    sealedDesc: "Đóng gói kỹ càng, bảo vệ tuyệt đối",
    authentic: "MINH BẠCH HÀNG",
    authenticDesc: "Cam kết hàng chính hãng, ghi rõ nguồn",
    gift: "QUÀ BUILDER",
    giftDesc: "Tích điểm & nhận quà riêng cho thành viên",
    category: "DANH MỤC",
    all: "Tất cả",
    viewAll: "Xem tất cả",
    newArrivals: "Hàng mới về",
    orderItems: "Hàng order",
    bestSellers: "Hàng bán chạy",
    sales: "Hàng Sales",
    inStock: "Hàng sẵn",
    preorder: "Pre-order",
    addToCart: "Thêm giỏ",
    orderNow: "Đặt ngay",
    preorderNow: "Pre-order",
    eta: "ETA",
    stock: "Còn",
    sold: "Đã bán",
    empty: "Chưa có sản phẩm phù hợp.",
    loyalty: "Khách hàng thân thiết",
    loyaltyDesc: "Tích điểm • Voucher • Hạng VIP",
  },
  en: {
    eyebrow: "BUILD YOUR LEGEND",
    heroTitle: "GUNDAM / GUNPLA",
    heroSub: "AUTHENTIC KITS — FOR TRUE BUILDERS",
    chip1: "100% Authentic",
    chip2: "Wide selection",
    chip3: "Best daily deals",
    buyNow: "BUY NOW",
    collection: "VIEW COLLECTION",
    fastShip: "FAST SHIPPING",
    fastShipDesc: "2H express in HCMC & nationwide delivery",
    sealed: "MINT BOX CARE",
    sealedDesc: "Careful packing and box protection",
    authentic: "CLEAR SOURCE",
    authenticDesc: "Authentic products with transparent info",
    gift: "BUILDER PERKS",
    giftDesc: "Points • Vouchers • VIP tiers",
    category: "CATEGORY",
    all: "All",
    viewAll: "View all",
    newArrivals: "New arrivals",
    orderItems: "Order items",
    bestSellers: "Best sellers",
    sales: "Sales",
    inStock: "In stock",
    preorder: "Pre-order",
    addToCart: "Add cart",
    orderNow: "Buy now",
    preorderNow: "Pre-order",
    eta: "ETA",
    stock: "Left",
    sold: "Sold",
    empty: "No matching products.",
    loyalty: "Loyalty club",
    loyaltyDesc: "Points • Vouchers • VIP tiers",
  },
};

const fallbackCategories = [
  { id: "all", name: { vi: "Tất cả", en: "All" } },
  { id: "mg", name: { vi: "MG (Master Grade)", en: "MG (Master Grade)" } },
  { id: "pg", name: { vi: "PG (Perfect Grade)", en: "PG (Perfect Grade)" } },
  { id: "rg", name: { vi: "RG (Real Grade)", en: "RG (Real Grade)" } },
  { id: "hg", name: { vi: "HG (High Grade)", en: "HG (High Grade)" } },
  { id: "sd-bb", name: { vi: "SD / BB", en: "SD / BB" } },
  { id: "figure", name: { vi: "Figure-rise Standard", en: "Figure-rise Standard" } },
  { id: "kotobukiya", name: { vi: "Kotobukiya", en: "Kotobukiya" } },
  { id: "tools", name: { vi: "Phụ kiện & Tools", en: "Accessories & Tools" } },
  { id: "paint", name: { vi: "Sơn & Hóa chất", en: "Paint & Chemicals" } },
  { id: "book", name: { vi: "Sách & Artbook", en: "Books & Artbooks" } },
];

const defaultSections = [
  { id: "new-arrivals", sort: 1, dataSource: "new_arrivals", title: { vi: "Hàng mới về", en: "New arrivals" } },
  { id: "order-items", sort: 2, dataSource: "order_items", title: { vi: "Hàng order", en: "Order items" } },
  { id: "best-sellers", sort: 3, dataSource: "best_sellers", title: { vi: "Hàng bán chạy", en: "Best sellers" } },
  { id: "sales", sort: 4, dataSource: "sale_products", title: { vi: "Hàng Sales", en: "Sales" } },
];

function text(value, lang, fallback = "") {
  if (!value) return translateStaticText(fallback, lang);
  if (typeof value === "string") return translateStaticText(value, lang);
  return value[lang] || value.vi || value.en || translateStaticText(fallback, lang);
}

function normalizeCollection(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getProductCollectionKeys(product = {}) {
  const keys = Array.isArray(product.collections) ? product.collections : [];
  const groups = Array.isArray(product.groups) ? product.groups : [];

  return Array.from(
    new Set(
      [
        ...keys,
        ...groups.flatMap((group) => [group.code, group.slug, group.nameVi, group.nameEn]),
      ]
        .map(normalizeCollection)
        .filter(Boolean)
    )
  );
}

function productMatchesSource(product, source) {
  const key = normalizeCollection(source);
  if (!key) return false;
  return getProductCollectionKeys(product).includes(key);
}

function getSectionProducts(products, section, displayMappings = []) {
  if (!Array.isArray(products)) return [];

  const source = normalizeCollection(section.dataSource || section.id || "");
  const mappedProductIds = (displayMappings || [])
    .filter((mapping) => Array.isArray(mapping.collectionKeys) && mapping.collectionKeys.map(normalizeCollection).includes(source))
    .map((mapping) => mapping.productId);

  if (mappedProductIds.length > 0) {
    return products
      .filter((product) => mappedProductIds.includes(product.id))
      .sort((a, b) => mappedProductIds.indexOf(a.id) - mappedProductIds.indexOf(b.id))
      .slice(0, Number(section.limit || 8));
  }

  return products
    .filter((product) => productMatchesSource(product, source))
    .slice(0, Number(section.limit || 8));
}

function mergeCmsSections(homeSections) {
  return defaultSections
    .map((base) => {
      const cms = (homeSections || []).find((section) => {
        const id = String(section.id || "").toLowerCase();
        const source = String(section.dataSource || section.source || "").toLowerCase();
        return id.includes(base.id) || source === base.dataSource;
      });

      if (cms?.enabled === false) return null;
      return { ...base, ...(cms || {}), dataSource: cms?.dataSource || cms?.source || base.dataSource };
    })
    .filter(Boolean)
    .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
}

function hasBannerMedia(banner = {}) {
  return Boolean(
    banner.videoUrl ||
      banner.mainImage ||
      banner.imageUrl ||
      banner.mediaUrl ||
      banner.image ||
      banner.desktopImage ||
      banner.mobileImage ||
      banner.tabletImage
  );
}

function isLiveHomepageBanner(banner = {}) {
  const isActive = banner.active !== false;
  const status = String(banner.status || "Live").toLowerCase();
  const placement = String(banner.placement || banner.position || "Homepage Hero").toLowerCase();
  return isActive && !status.includes("draft") && !status.includes("inactive") && (placement.includes("home") || placement.includes("hero"));
}

function getBannerBaseImage(banner = {}) {
  return banner.mainImage || banner.imageUrl || banner.mediaUrl || banner.image || banner.desktopImage || "";
}

function getBannerVideoUrl(banner = {}) {
  return banner.videoUrl || (String(banner.mediaType || "").toLowerCase().includes("video") ? banner.mediaUrl : "");
}

function isBannerVideo(banner = {}) {
  const videoUrl = getBannerVideoUrl(banner);
  const type = String(banner.mediaType || banner.type || "").toLowerCase();
  return Boolean(videoUrl) || type.includes("video");
}

function bannerAlt(banner = {}, lang = "vi") {
  return banner.altText || banner.titleInternal || banner.name || text(banner.title, lang, "Gundam campaign banner");
}

function bannerFitClass(banner = {}) {
  return banner.fitMode === "contain" ? "object-contain" : "object-cover";
}

function getHeroBanners(banners = [], settings = {}) {
  const maxBanners = Math.min(Number(settings.maxBanners || HOMEPAGE_HERO_MAX_BANNERS), HOMEPAGE_HERO_MAX_BANNERS);
  return (Array.isArray(banners) ? banners : [])
    .filter(isLiveHomepageBanner)
    .filter(hasBannerMedia)
    .sort((a, b) => Number(a.priority || 99) - Number(b.priority || 99))
    .slice(0, maxBanners);
}

function NoBannerConfigured({ lang }) {
  return (
    <section className="mx-auto max-w-[1440px] px-4 pt-4 lg:px-8">
      <div className="flex min-h-[280px] items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white text-center shadow-sm">
        <div className="px-6">
          <div className="text-sm font-black uppercase tracking-[0.24em] text-slate-400">
            {lang === "en" ? "Homepage Banner" : "Banner trang chủ"}
          </div>
          <h1 className="mt-3 text-2xl font-black text-slate-800">
            {lang === "en" ? "No banner configured" : "Chưa cấu hình banner"}
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {lang === "en"
              ? "Please create and publish a Live banner in Admin CMS."
              : "Vui lòng tạo banner trong Admin CMS và chuyển trạng thái Live để hiển thị."}
          </p>
        </div>
      </div>
    </section>
  );
}

function BannerMedia({ banner, lang, className = "", imageClassName = "", priority = false }) {
  const videoUrl = getBannerVideoUrl(banner);
  const baseImage = getBannerBaseImage(banner);
  const fitClass = bannerFitClass(banner);
  const backgroundColor = banner.backgroundColor || banner.bgColor || "#f8fafc";

  if (isBannerVideo(banner)) {
    return (
      <video
        src={videoUrl || baseImage}
        className={`${fitClass} ${className}`}
        style={{ backgroundColor }}
        autoPlay
        muted
        loop
        playsInline
      />
    );
  }

  const mobileSrc = banner.mobileImage || baseImage;
  const tabletSrc = banner.tabletImage || baseImage;
  const desktopSrc = banner.desktopImage || baseImage;

  return (
    <picture>
      <source media="(max-width: 640px)" srcSet={mobileSrc} />
      <source media="(max-width: 1024px)" srcSet={tabletSrc} />
      <source media="(min-width: 1025px)" srcSet={desktopSrc} />
      <img
        src={desktopSrc || baseImage}
        alt={bannerAlt(banner, lang)}
        className={`${fitClass} ${className} ${imageClassName}`}
        style={{ backgroundColor }}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
      />
    </picture>
  );
}

function bannerHref(banner = {}) {
  return getSafeHref(banner.ctaUrl || banner.link || banner.href || "/shop", "/shop");
}

function ImageOnlyBannerLink({ banner, lang, actions, className = "", mediaClassName = "", priority = false }) {
  return (
    <a
      href={bannerHref(banner)}
      aria-label={bannerAlt(banner, lang)}
      title={bannerAlt(banner, lang)}
      onClick={() => actions?.track?.("banner_click", { meta: { bannerId: banner.id || "hero" } })}
      className={`image-first-banner-link block overflow-hidden bg-slate-50 ${className}`}
    >
      <BannerMedia
        banner={banner}
        lang={lang}
        className={`h-full w-full ${mediaClassName}`}
        priority={priority}
      />
    </a>
  );
}

function Hero({ banners, lang, actions, heroSettings }) {
  const settings = {
    layout: "v2",
    autoplay: true,
    interval: 4500,
    maxBanners: HOMEPAGE_HERO_MAX_BANNERS,
    ...(heroSettings || {}),
  };

  const safeBanners = getHeroBanners(banners, settings);

  if (!safeBanners.length) {
    return <NoBannerConfigured lang={lang} />;
  }

  if (settings.layout === "v3") {
    return <HeroV3Bento banners={safeBanners} lang={lang} actions={actions} settings={settings} />;
  }

  return <HeroV2Classic banners={safeBanners} lang={lang} actions={actions} settings={settings} />;
}

function HeroV3Bento({ banners, lang, actions, settings }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const safeBanners = banners;
  const activeBanner = safeBanners[activeIndex] || safeBanners[0];
  const sideOne = safeBanners[(activeIndex + 1) % safeBanners.length] || activeBanner;
  const sideTwo = safeBanners[(activeIndex + 2) % safeBanners.length] || activeBanner;
  const interval = Number(settings.interval || 4500);

  const goToBanner = (index) => {
    const nextIndex = (index + safeBanners.length) % safeBanners.length;
    setActiveIndex(nextIndex);
  };

  useEffect(() => {
    if (!settings.autoplay || safeBanners.length <= 1 || paused) return;
    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % safeBanners.length);
    }, interval);
    return () => clearInterval(timer);
  }, [settings.autoplay, safeBanners.length, paused, interval]);

  return (
    <section className="image-first-hero mobile-hero-fit mx-auto max-w-[1440px] px-3 pt-3 sm:px-4 sm:pt-4 lg:px-8">
      <div
        className="grid gap-3 lg:grid-cols-[1.75fr_0.95fr]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <ImageOnlyBannerLink
          banner={activeBanner}
          lang={lang}
          actions={actions}
          priority
          className="h-[320px] rounded-[24px] border border-slate-200 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:h-[420px] sm:rounded-[30px]"
          mediaClassName="transition duration-700 hover:scale-[1.01]"
        />

        {safeBanners.length > 1 && (
          <div className="hidden gap-3 lg:grid">
            {[sideOne, sideTwo].map((banner, index) => (
              <ImageOnlyBannerLink
                key={`${banner.id || "side"}-${index}`}
                banner={banner}
                lang={lang}
                actions={actions}
                className="h-[203px] rounded-[26px] border border-slate-200 shadow-lg"
                mediaClassName="transition duration-500 hover:scale-[1.02]"
              />
            ))}
          </div>
        )}
      </div>

      {safeBanners.length > 1 && (
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => goToBanner(activeIndex - 1)}
            className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-2xl font-black text-blue-700 shadow-md transition hover:bg-blue-700 hover:text-white md:flex"
            aria-label="Previous banner"
          >
            ‹
          </button>

          <div className="image-first-hero-thumbs mobile-hide-scrollbar grid flex-1 grid-cols-2 gap-3 overflow-x-auto md:grid-cols-5">
            {safeBanners.map((banner, index) => (
              <button
                key={banner.id || index}
                type="button"
                onClick={() => goToBanner(index)}
                className={`image-first-thumb relative h-[86px] min-w-[148px] overflow-hidden rounded-2xl border text-left shadow-sm transition ${
                  activeIndex === index ? "border-blue-600 ring-4 ring-blue-100" : "border-slate-200 hover:border-blue-300"
                }`}
                aria-label={`Banner ${index + 1}`}
              >
                <BannerMedia banner={banner} lang={lang} className="h-full w-full" />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => goToBanner(activeIndex + 1)}
            className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-2xl font-black text-blue-700 shadow-md transition hover:bg-blue-700 hover:text-white md:flex"
            aria-label="Next banner"
          >
            ›
          </button>
        </div>
      )}
    </section>
  );
}

function HeroV2Classic({ banners, lang, actions, settings }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const safeBanners = banners;
  const activeBanner = safeBanners[activeIndex] || safeBanners[0];
  const interval = Number(settings.interval || 4500);

  const goToBanner = (index) => {
    const nextIndex = (index + safeBanners.length) % safeBanners.length;
    setActiveIndex(nextIndex);
  };

  useEffect(() => {
    if (!settings.autoplay || safeBanners.length <= 1 || paused) return;
    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % safeBanners.length);
    }, interval);
    return () => clearInterval(timer);
  }, [settings.autoplay, safeBanners.length, paused, interval]);

  return (
    <section className="image-first-hero mx-auto max-w-[1440px] px-4 pt-4 lg:px-8">
      <div
        className="mobile-no-overflow relative overflow-hidden rounded-[24px] border border-blue-100 bg-white shadow-[0_20px_70px_rgba(37,99,235,0.12)] sm:rounded-[34px] sm:shadow-[0_30px_110px_rgba(37,99,235,0.16)]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <ImageOnlyBannerLink
          banner={activeBanner}
          lang={lang}
          actions={actions}
          priority
          className="h-[320px] w-full sm:h-[420px] lg:h-[460px]"
          mediaClassName="transition duration-700 hover:scale-[1.01]"
        />

        {safeBanners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 shadow-xl backdrop-blur">
            {safeBanners.map((item, index) => (
              <button
                key={item.id || index}
                type="button"
                onClick={() => goToBanner(index)}
                className={`h-2.5 rounded-full transition ${activeIndex === index ? "w-12 bg-blue-700" : "w-2.5 bg-slate-300 hover:bg-blue-400"}`}
                aria-label={`Banner ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function TrustStrip({ lang }) {
  const t = copy[lang];
  const items = [
    [Truck, t.fastShip, t.fastShipDesc],
    [Package, t.sealed, t.sealedDesc],
    [ShieldCheck, t.authentic, t.authenticDesc],
    [Gift, t.gift, t.giftDesc],
  ];

  return (
    <section className="mx-auto max-w-[1200px] px-4 py-4">
      <div className="grid overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map(([Icon, title, desc], index) => (
          <div key={title} className={`flex gap-3 p-4 ${index > 0 ? "border-t border-blue-50 md:border-l md:border-t-0" : ""}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Icon size={21} />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-blue-900">{title}</div>
              <div className="mt-1 text-xs font-medium leading-5 text-slate-500">{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CategorySidebar({ categories, lang }) {
  const list = (categories || []).filter((category) => category.active !== false);

  const fallbackImages = [
    "/images/products/aerial.jpg",
    "/images/products/hi-nu.jpg",
    "/images/products/freedom.jpg",
    "/images/products/strike-freedom.jpg",
  ];

  const getCategoryImage = (category, index) =>
    category.imageUrl ||
    category.image ||
    category.icon ||
    category.mainImage ||
    fallbackImages[index % fallbackImages.length];

  const getCategoryHref = (category) => {
    const rawKey = category.id === "all" ? "" : category.id || category.slug || category.code || "";
    const fallback = rawKey ? `/shop?category=${encodeURIComponent(rawKey)}` : "/shop";
    return getSafeHref(category.ctaUrl || fallback, fallback);
  };

  return (
    <aside className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-700">Category</div>
        <h3 className="mt-1 text-xl font-black text-slate-950">
          {lang === "vi" ? "Dòng sản phẩm" : "Product lines"}
        </h3>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
          {lang === "vi" ? "Chọn dòng để lọc nhanh sản phẩm" : "Tap a line to filter products"}
        </p>
      </div>

      <div className="mobile-hide-scrollbar flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-2 lg:overflow-visible lg:pb-0">
        {list.map((category, index) => {
          const fullName = text(category.name, lang, category.label || category.code || "Category");
          const image = getCategoryImage(category, index);
          const href = getCategoryHref(category);

          return (
            <a
              key={category.id || category.code || fullName}
              href={href}
              title={category.titleInternal || fullName}
              aria-label={category.altText || fullName}
              className="group block w-[128px] shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-xl lg:w-full"
            >
              <div className="aspect-square w-full overflow-hidden bg-gradient-to-br from-slate-100 to-blue-50">
                <img
                  src={image}
                  alt={category.altText || fullName}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="p-2.5">
                <div className="line-clamp-2 min-h-[34px] text-xs font-black leading-tight text-slate-950 group-hover:text-blue-700">
                  {fullName}
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </aside>
  );
}

function ProductSection({ section, products, displayMappings, lang, actions, badge }) {
  const t = copy[lang];
  const sectionProducts = getSectionProducts(products, section, displayMappings);
  const title = text(section.title, lang, t.newArrivals);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase text-blue-700">{badge}</span>
          <h2 className="text-xl font-black text-blue-700">{title}</h2>
        </div>
        <a href={`/shop?collection=${encodeURIComponent(section.dataSource || section.id || "")}`} className="inline-flex items-center gap-1 text-xs font-black text-blue-700 hover:underline">
          {t.viewAll}<ArrowRight size={13} />
        </a>
      </div>

      {sectionProducts.length ? (
        <div className="home-mobile-product-grid grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sectionProducts.map((product) => (
            <ProductCard key={product.id} product={product} lang={lang} actions={actions} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">{t.empty}</div>
      )}
    </section>
  );
}

function LoyaltyBubble({ lang }) {
  const t = copy[lang];
  return (
    <div className="fixed bottom-5 left-5 z-40 hidden sm:block">
      <button className="group flex items-center gap-3 rounded-full border border-amber-200 bg-white px-4 py-3 text-left shadow-2xl shadow-amber-100 transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-200">
          <Crown size={22} />
        </span>
        <span className="hidden lg:block">
          <span className="block text-sm font-black text-slate-950">{t.loyalty}</span>
          <span className="block text-xs font-bold text-amber-700">{t.loyaltyDesc}</span>
        </span>
      </button>
    </div>
  );
}

function deriveCategoriesFromProducts(products = []) {
  const map = new Map();

  for (const product of products || []) {
    const category = product.category || {};
    const id = product.categoryId || category.id || category.slug || category.code;
    if (!id || map.has(id)) continue;

    map.set(id, {
      id,
      backendCategoryId: category.id || id,
      code: category.code || id,
      slug: category.slug || id,
      name: {
        vi: category.nameVi || category.name?.vi || category.name || category.code || "Danh mục",
        en: category.nameEn || category.name?.en || category.nameVi || category.name || category.code || "Category",
      },
      label: category.nameVi || category.nameEn || category.code || id,
      active: category.active !== false,
      sortOrder: Number(category.sortOrder || 0),
      sort: Number(category.sortOrder || 0),
      source: "backend-derived",
    });
  }

  return Array.from(map.values())
    .filter((item) => item.active !== false)
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0) || String(a.label || "").localeCompare(String(b.label || "")));
}


function mergeCategoryLists(apiCategories = [], derivedCategories = []) {
  const map = new Map();

  for (const category of [...apiCategories, ...derivedCategories]) {
    const key = String(category.id || category.backendCategoryId || category.slug || category.code || "").trim();
    if (!key || map.has(key)) continue;
    map.set(key, category);
  }

  return Array.from(map.values())
    .filter((item) => item.active !== false)
    .sort((a, b) => Number(a.sortOrder || a.sort || 0) - Number(b.sortOrder || b.sort || 0) || String(a.label || "").localeCompare(String(b.label || "")));
}

export default function HomePage() {
  const [backendProducts, setBackendProducts] = useState([]);
  const [dbBanners, setDbBanners] = useState([]);
  const [dbHeroSettings, setDbHeroSettings] = useState(null);
  const [bannerApiReady, setBannerApiReady] = useState(false);
  const [bannerApiError, setBannerApiError] = useState("");
  const [backendCategories, setBackendCategories] = useState([]);
  const { state, actions } = useCms();
  const lang = state.settings?.lang || "vi";
  const sections = useMemo(() => mergeCmsSections(state.homeSections), [state.homeSections]);
  const products = backendProducts;

  useEffect(() => {
    let alive = true;

    getStorefrontHomeBannersFromApi()
      .then(({ banners = [], heroSettings = null }) => {
        if (!alive) return;
        setDbBanners(Array.isArray(banners) ? banners : []);
        setDbHeroSettings(heroSettings || null);
        setBannerApiError("");
      })
      .catch((error) => {
        if (!alive) return;
        setDbBanners([]);
        setDbHeroSettings(null);
        setBannerApiError(error?.message || "Cannot load homepage banners.");
      })
      .finally(() => {
        if (!alive) return;
        setBannerApiReady(true);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    Promise.allSettled([
      getStorefrontProductsForStorefront(),
      getStorefrontCategoriesFromApi(),
    ]).then(([productsResult, categoriesResult]) => {
      if (!alive) return;

      const loadedProducts = productsResult.status === "fulfilled" && Array.isArray(productsResult.value) ? productsResult.value : [];
      const categoriesFromApi = categoriesResult.status === "fulfilled" && Array.isArray(categoriesResult.value) ? categoriesResult.value : [];
      const derivedCategories = mergeCategoryLists(categoriesFromApi, deriveCategoriesFromProducts(loadedProducts));

      setBackendProducts(loadedProducts);
      setBackendCategories(derivedCategories);
    });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    actions.track("page_view", { page: "/" });
  }, [actions]);

  const categories = backendCategories.length ? backendCategories : state.categories || [];

  return (
    <PageShell>
      <div className="relative">
        <Hero
          banners={dbBanners}
          lang={lang}
          actions={actions}
          heroSettings={dbHeroSettings || state?.heroSettings}
          loading={!bannerApiReady}
          error={bannerApiError}
        />
        <TrustStrip lang={lang} />

        <main className="mx-auto grid max-w-[1200px] gap-4 px-4 pb-8 lg:grid-cols-[300px_1fr]">
          <CategorySidebar categories={categories.length ? categories : fallbackCategories} lang={lang} />

          <div className="space-y-4">
            {sections.map((section, index) => (
              <ProductSection
                key={section.id}
                section={section}
                products={products}
                displayMappings={state.productDisplayMappings || []}
                lang={lang}
                actions={actions}
                badge={index === 0 ? "NEW" : index === 1 ? "ORDER" : index === 2 ? "HOT" : "SALE"}
              />
            ))}
          </div>
        </main>

        <LoyaltyBubble lang={lang} />
      </div>
    </PageShell>
  );
}
