import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronRight,
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
  getStorefrontCategoryTreeFromApi,
  getStorefrontProductsForStorefront,
} from "../../services/StorefrontProductApiService";
import { getStorefrontHomeBannersFromApi } from "../../services/BannerApiService";
import {
  getPublicEventsApi,
  getPublicNewsApi,
} from "../../services/ContentApiService";

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

function getSectionProducts(products, section) {
  if (!Array.isArray(products)) return [];

  const source = normalizeCollection(
    section.dataSource || section.id || ""
  );

  // PostgreSQL ProductGroup là nguồn duy nhất cho các block homepage.
  // Không dùng mapping CMS/localStorage cũ.
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

      return {
        ...base,
        ...(cms || {}),
        id: base.id,
        title: base.title,
        dataSource: base.dataSource,
      };
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
      <div className="flex min-h-[280px] items-center justify-center rounded-4xl border border-dashed border-slate-300 bg-white text-center shadow-sm">
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
          className="h-[320px] rounded-3xl border border-slate-200 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:h-[420px] sm:rounded-5xl"
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
                className="h-[203px] rounded-4xl border border-slate-200 shadow-lg"
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
        className="mobile-no-overflow relative overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-[0_20px_70px_rgba(37,99,235,0.12)] sm:rounded-6xl sm:shadow-[0_30px_110px_rgba(37,99,235,0.16)]"
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
    <section className="mx-auto max-w-[1440px] px-4 py-2 sm:py-4 lg:px-8">
      <div className="mobile-hide-scrollbar flex gap-2 overflow-x-auto rounded-2xl border border-blue-100 bg-white p-2 shadow-sm sm:grid sm:grid-cols-2 sm:gap-0 sm:overflow-hidden sm:p-0 lg:grid-cols-4">
        {items.map(([Icon, title, desc], index) => (
          <div
            key={title}
            className={`flex min-w-[154px] shrink-0 items-center gap-2 rounded-xl bg-blue-50/60 px-3 py-2.5 sm:min-w-0 sm:rounded-none sm:bg-transparent sm:p-4 ${index > 0 ? "sm:border-l sm:border-blue-50" : ""}`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 sm:h-10 sm:w-10">
              <Icon size={20} />
            </div>

            <div className="min-w-0">
              <div className="truncate text-[11px] font-black uppercase tracking-wide text-blue-900 sm:text-xs">
                {title}
              </div>

              <div className="mt-1 hidden text-xs font-medium leading-5 text-slate-500 sm:block">
                {desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CategorySidebar({ categoryTree, lang }) {
  const roots = (categoryTree || []).filter(
    (category) => category?.active !== false
  );
  const [expandedRootId, setExpandedRootId] = useState("");

  const getCategoryHref = (category) => {
    const rawKey =
      category.id === "all"
        ? ""
        : category.id ||
          category.backendCategoryId ||
          category.slug ||
          category.code ||
          "";

    const fallback = rawKey
      ? `/shop?category=${encodeURIComponent(rawKey)}`
      : "/shop";

    return getSafeHref(category.ctaUrl || fallback, fallback);
  };

  return (
    <aside className="hidden self-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:block">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
            Category
          </div>

          <h3 className="mt-0.5 text-lg font-black text-slate-950">
            {lang === "vi" ? "Dòng sản phẩm" : "Product lines"}
          </h3>
        </div>

        <a
          href="/shop"
          className="shrink-0 text-[11px] font-black text-blue-700 hover:underline"
        >
          {lang === "vi" ? "Xem tất cả" : "View all"}
        </a>
      </div>

      <div className="divide-y divide-slate-100 border-y border-slate-100">
        {roots.map((root) => {
          const children = (root.children || []).filter(
            (child) => child?.active !== false
          );

          const hasChildren = children.length > 0;
          const expanded =
            hasChildren && expandedRootId === root.id;

          const rootName = text(
            root.name,
            lang,
            root.label || root.code || "Category"
          );

          const rootCount = Number(
            root.productCount ||
              root.count ||
              children.reduce(
                (sum, child) =>
                  sum +
                  Number(
                    child.productCount ||
                      child.count ||
                      0
                  ),
                0
              )
          );

          return (
            <section key={root.id || root.code || rootName}>
              <div
                className={`grid grid-cols-[minmax(0,1fr)_44px] transition ${
                  expanded
                    ? "bg-blue-50/70"
                    : "bg-white hover:bg-slate-50"
                }`}
              >
                <a
                  href={getCategoryHref(root)}
                  className={`flex min-w-0 items-center justify-between gap-2 px-2 py-3 text-sm font-black ${
                    hasChildren ? "" : "col-span-2"
                  }`}
                >
                  <span className="min-w-0 line-clamp-2 text-slate-900">
                    {rootName}
                  </span>

                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                    {rootCount}
                  </span>
                </a>

                {hasChildren && (
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedRootId((current) =>
                        current === root.id ? "" : root.id
                      )
                    }
                    aria-expanded={expanded}
                    className="flex w-11 items-center justify-center border-l border-slate-100 text-slate-400 transition hover:bg-blue-50 hover:text-blue-700"
                  >
                    <ChevronRight
                      size={17}
                      className={`transition-transform duration-200 ${
                        expanded ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                )}
              </div>

              {expanded && (
                <div className="border-t border-slate-100 bg-slate-50/70 px-2 py-1">
                  {children.map((child) => {
                    const childName = text(
                      child.name,
                      lang,
                      child.label ||
                        child.code ||
                        "Category"
                    );

                    const childCount = Number(
                      child.productCount ||
                        child.count ||
                        0
                    );

                    return (
                      <a
                        key={
                          child.id ||
                          child.code ||
                          childName
                        }
                        href={getCategoryHref(child)}
                        className="group flex w-full items-center justify-between gap-3 border-b border-slate-100 px-2 py-2.5 text-xs font-bold text-slate-700 last:border-b-0 hover:bg-white hover:text-blue-700"
                      >
                        <span className="min-w-0 line-clamp-2">
                          {childName}
                        </span>

                        <span className="shrink-0 text-[10px] font-black text-slate-400 group-hover:text-blue-600">
                          {childCount}
                        </span>
                      </a>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </aside>
  );
}

function ProductSection({ section, products, lang, actions, badge, isFirst = false }) {
  const t = copy[lang];
  const sectionProducts = getSectionProducts(products, section);
  const title = text(section.title, lang, t.newArrivals);

  return (
    <section className={`p-4 ${isFirst ? "" : "border-t border-slate-100"}`}>
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
        <div className="home-mobile-product-grid grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
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

function ContentHighlights({ news = [], events = [], lang = "vi" }) {
  if (!news.length && !events.length) return null;

  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat(
      lang === "en" ? "en-US" : "vi-VN",
      { day: "2-digit", month: "2-digit", year: "numeric" }
    ).format(date);
  };

  return (
    <section className="mx-auto mt-4 grid max-w-[1440px] gap-4 px-4 pb-6 lg:px-8 lg:grid-cols-[1.4fr_0.6fr]">
      {news.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                {lang === "en" ? "Latest updates" : "Cập nhật mới"}
              </div>
              <h2 className="mt-1 text-xl font-black text-slate-950">
                {lang === "en" ? "News & guides" : "Tin tức & hướng dẫn"}
              </h2>
            </div>

            <a
              href="/news"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-black text-blue-700"
            >
              {lang === "en" ? "View all" : "Xem tất cả"}
              <ArrowRight size={14} />
            </a>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {news.slice(0, 3).map((article) => (
              <a
                key={article.id || article.slug}
                href={`/news/${article.slug}`}
                className="group overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 transition hover:border-blue-200 hover:bg-blue-50"
              >
                {article.image && (
                  <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                    <img
                      src={article.image}
                      alt={article.title || ""}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                )}

                <div className="p-3">
                  <div className="text-[10px] font-black uppercase text-blue-600">
                    {article.tag || (lang === "en" ? "News" : "Tin tức")}
                  </div>
                  <h3 className="mt-1 line-clamp-2 text-sm font-black leading-5 text-slate-900">
                    {article.title}
                  </h3>
                  <div className="mt-2 text-[11px] font-bold text-slate-400">
                    {formatDate(article.publishedAt || article.date)}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {events.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                {lang === "en" ? "Upcoming" : "Sắp diễn ra"}
              </div>
              <h2 className="mt-1 text-xl font-black text-slate-950">
                {lang === "en" ? "Events" : "Sự kiện"}
              </h2>
            </div>

            <a
              href="/news/events"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-black text-blue-700"
            >
              {lang === "en" ? "Calendar" : "Xem lịch"}
              <ArrowRight size={14} />
            </a>
          </div>

          <div className="space-y-2">
            {events.slice(0, 2).map((event) => (
              <a
                key={event.id}
                href={`/news/events/${event.id}`}
                className="block rounded-2xl border border-slate-100 bg-slate-50 p-3 transition hover:border-blue-200 hover:bg-blue-50"
              >
                <div className="text-[10px] font-black uppercase text-blue-600">
                  {formatDate(event.date)}
                  {event.time ? ` · ${event.time}` : ""}
                </div>
                <h3 className="mt-1 line-clamp-2 text-sm font-black leading-5 text-slate-900">
                  {event.title}
                </h3>
                <div className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">
                  {event.location || event.address || ""}
                </div>
              </a>
            ))}
          </div>
        </div>
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
  const [homepageNews, setHomepageNews] = useState([]);
  const [homepageEvents, setHomepageEvents] = useState([]);
  const [dbBanners, setDbBanners] = useState([]);
  const [dbHeroSettings, setDbHeroSettings] = useState(null);
  const [bannerApiReady, setBannerApiReady] = useState(false);
  const [bannerApiError, setBannerApiError] = useState("");
  const [backendCategoryTree, setBackendCategoryTree] = useState([]);
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
      getStorefrontCategoryTreeFromApi(),
    ]).then(([productsResult, categoriesResult]) => {
      if (!alive) return;

      const loadedProducts =
        productsResult.status === "fulfilled" &&
        Array.isArray(productsResult.value)
          ? productsResult.value
          : [];

      const treeFromApi =
        categoriesResult.status === "fulfilled" &&
        Array.isArray(categoriesResult.value?.tree)
          ? categoriesResult.value.tree.filter(
              (root) => root?.active !== false
            )
          : [];

      const derivedCategories = treeFromApi.length
        ? []
        : deriveCategoriesFromProducts(loadedProducts);

      const derivedTree = derivedCategories.length
        ? [
            {
              id: "catalog",
              name: {
                vi: "Danh mục sản phẩm",
                en: "Product categories",
              },
              ctaUrl: "/shop",
              active: true,
              productCount: loadedProducts.length,
              children: derivedCategories,
            },
          ]
        : [];

      setBackendProducts(loadedProducts);
      setBackendCategoryTree(
        treeFromApi.length ? treeFromApi : derivedTree
      );
    });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    Promise.allSettled([
      getPublicNewsApi(),
      getPublicEventsApi(),
    ]).then(([newsResult, eventsResult]) => {
      if (!alive) return;

      setHomepageNews(
        newsResult.status === "fulfilled" && Array.isArray(newsResult.value)
          ? newsResult.value.slice(0, 3)
          : []
      );

      setHomepageEvents(
        eventsResult.status === "fulfilled" && Array.isArray(eventsResult.value)
          ? eventsResult.value.slice(0, 2)
          : []
      );
    });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    actions.track("page_view", { page: "/" });
  }, [actions]);

  const categoryTree = useMemo(() => {
    if (backendCategoryTree.length) return backendCategoryTree;

    const fallbackChildren = (
      state.categories?.length ? state.categories : fallbackCategories
    ).filter(
      (category) =>
        category?.active !== false && category?.id !== "all"
    );

    return [
      {
        id: "catalog",
        name: {
          vi: "Danh mục sản phẩm",
          en: "Product categories",
        },
        ctaUrl: "/shop",
        active: true,
        productCount: fallbackChildren.reduce(
          (sum, child) =>
            sum + Number(child.productCount || child.count || 0),
          0
        ),
        children: fallbackChildren,
      },
    ];
  }, [backendCategoryTree, state.categories]);

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

        <section className="mx-auto max-w-[1440px] px-4 pb-3 lg:hidden">
          <div className="mobile-hide-scrollbar flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            <a
              href="/shop"
              className="shrink-0 rounded-full bg-blue-700 px-4 py-2.5 text-xs font-black text-white"
            >
              {lang === "vi" ? "Tất cả sản phẩm" : "All products"}
            </a>

            {categoryTree.slice(0, 4).map((root) => {
              const rootName = text(
                root.name,
                lang,
                root.label || root.code || "Category"
              );

              const rawKey =
                root.id ||
                root.backendCategoryId ||
                root.slug ||
                root.code ||
                "";

              const href = getSafeHref(
                root.ctaUrl ||
                  `/shop?category=${encodeURIComponent(rawKey)}`,
                "/shop"
              );

              return (
                <a
                  key={root.id || root.code || rootName}
                  href={href}
                  className="max-w-[180px] shrink-0 truncate rounded-full border border-blue-100 bg-blue-50 px-4 py-2.5 text-xs font-black text-blue-700"
                >
                  {rootName}
                </a>
              );
            })}

            <a
              href="/shop"
              className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-black text-slate-700"
            >
              {lang === "vi" ? "Xem danh mục →" : "View categories →"}
            </a>
          </div>
        </section>

        <main className="mx-auto grid max-w-[1440px] px-4 pb-8 lg:px-8 lg:grid-cols-[300px_1fr]">
          <CategorySidebar categoryTree={categoryTree} lang={lang} />

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            {sections.map((section, index) => (
              <ProductSection
                key={section.id}
                section={section}
                products={products}
                lang={lang}
                actions={actions}
                isFirst={index === 0}
                badge={{
                  new_arrivals: "NEW",
                  order_items: "ORDER",
                  best_sellers: "HOT",
                  sale_products: "SALE",
                }[section.dataSource] || "NEW"}
              />
            ))}
          </div>
        </main>

        <ContentHighlights
          news={homepageNews}
          events={homepageEvents}
          lang={lang}
        />

        <LoyaltyBubble lang={lang} />
      </div>
    </PageShell>
  );
}
