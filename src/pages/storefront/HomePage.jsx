import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Award,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Layers,
  Puzzle,
  ShieldCheck,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import PageShell from "../../components/common/PageShell";
import { useCms } from "../../store/CmsStore";
import { translateStaticText } from "../../i18n";
import { getSafeHref } from "../../utils/urlSafety";
import ProductCard from "../../components/storefront/ProductCard";
import { getStorefrontProductsForStorefront } from "../../services/StorefrontProductApiService";
import { getStorefrontHomeBannersFromApi } from "../../services/BannerApiService";
import {
  getPublicEventsApi,
  getPublicNewsApi,
} from "../../services/ContentApiService";

const HOMEPAGE_HERO_MAX_BANNERS = 3;

const copy = {
  vi: {
    eyebrow: "Build your legend",
    heroTitle: "Gundam / Gunpla",
    heroSub: "Chính hãng — cho builder đích thực",
    chip1: "100% Chính hãng",
    chip2: "Đa dạng mẫu mã",
    chip3: "Giá tốt mỗi ngày",
    buyNow: "Mua ngay",
    collection: "Xem bộ sưu tập",
    statYears: "10+ NĂM",
    statYearsDesc: "KINH NGHIỆM",
    statCustomers: "10.000+",
    statCustomersDesc: "KHÁCH HÀNG TIN TƯỞNG",
    statAuthentic: "100%",
    statAuthenticDesc: "SẢN PHẨM CHÍNH HÃNG",
    statShipping: "GIAO HÀNG",
    statShippingDesc: "TOÀN QUỐC",
    featuredCategories: "Danh mục nổi bật",
    bandaiGundam: "Bandai-Gundam",
    gradesLineup: "HG-RG-MG-PG",
    otherKits: "Model kit khác",
    toolsAccessories: "Dụng cụ & phụ kiện",
    category: "Danh mục",
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
    viewedTitle: "Sản phẩm đã xem",
    trendingTitle: "Sản phẩm thịnh hành",
  },
  en: {
    eyebrow: "Build your legend",
    heroTitle: "Gundam / Gunpla",
    heroSub: "Authentic kits — for true builders",
    chip1: "100% Authentic",
    chip2: "Wide selection",
    chip3: "Best daily deals",
    buyNow: "Buy now",
    collection: "View collection",
    statYears: "10+ YEARS",
    statYearsDesc: "OF EXPERIENCE",
    statCustomers: "10,000+",
    statCustomersDesc: "TRUSTED CUSTOMERS",
    statAuthentic: "100%",
    statAuthenticDesc: "AUTHENTIC PRODUCTS",
    statShipping: "NATIONWIDE",
    statShippingDesc: "DELIVERY",
    featuredCategories: "Featured categories",
    bandaiGundam: "Bandai-Gundam",
    gradesLineup: "HG-RG-MG-PG",
    otherKits: "Other model kits",
    toolsAccessories: "Tools & accessories",
    category: "Category",
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
    viewedTitle: "Recently viewed",
    trendingTitle: "Trending now",
  },
};

const defaultSections = [
  { id: "new-arrivals", sort: 1, dataSource: "new_arrivals", title: { vi: "Hàng mới về", en: "New arrivals" } },
  { id: "order-items", sort: 2, dataSource: "order_items", title: { vi: "Hàng order", en: "Order items" } },
  { id: "best-sellers", sort: 3, dataSource: "best_sellers", title: { vi: "Hàng bán chạy", en: "Best sellers" } },
  { id: "tools-accessories", sort: 4, dataSource: "tools_accessories", title: { vi: "Dụng cụ & phụ kiện", en: "Tools & accessories" } },
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

  // Tools & accessories has no ProductGroup collection of its own yet — the
  // real category tree already has a dedicated group for it
  // (catgrp-tools-paint-accessories / category code ACCESSORY_TOOL), so match
  // against that instead of inventing a new backend collection.
  if (source === "tools_accessories") {
    return products
      .filter((product) => product?.category?.code === "ACCESSORY_TOOL")
      .slice(0, Number(section.limit || 8));
  }

  // PostgreSQL ProductGroup là nguồn duy nhất cho các block homepage khác.
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

  // No dev-facing "please configure a banner" message shown to shoppers when
  // none is Live in Admin CMS — the section is simply hidden so products
  // appear sooner in the first viewport instead.
  if (!safeBanners.length) {
    return null;
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
          className="h-[320px] rounded-2xl border border-slate-200 shadow-sm sm:h-[420px]"
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
                className="h-[203px] rounded-2xl border border-slate-200 shadow-sm"
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
        className="mobile-no-overflow relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
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
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 shadow-sm backdrop-blur">
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
    [Award, t.statYears, t.statYearsDesc],
    [Users, t.statCustomers, t.statCustomersDesc],
    [ShieldCheck, t.statAuthentic, t.statAuthenticDesc],
    [Truck, t.statShipping, t.statShippingDesc],
  ];

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-2 sm:py-4 lg:px-8">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-4">
        {items.map(([Icon, stat, desc]) => (
          <div
            key={stat}
            className="flex flex-col items-center gap-2 bg-slate-950 px-4 py-6 text-center sm:py-7"
          >
            <Icon size={22} strokeWidth={1.5} className="text-white/70" />
            <div className="text-lg font-black tracking-wide text-white sm:text-xl">
              {stat}
            </div>
            <div className="text-[10px] font-bold uppercase leading-4 tracking-wide text-white/55 sm:text-xs">
              {desc}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Same 4 targets as the Header's Bandai-Gundam/HG-RG-MG-PG/Model kit khác/
// Dụng cụ & phụ kiện nav links (Header.jsx) — kept in sync deliberately so the
// homepage quick-access tiles and the main nav always point at the same place.
function FeaturedCategories({ lang }) {
  const t = copy[lang];
  const tiles = [
    { icon: Boxes, label: t.bandaiGundam, href: "/shop?category=catgrp-gunpla-gundam" },
    { icon: Layers, label: t.gradesLineup, href: "/shop?category=catgrp-gunpla-gundam" },
    { icon: Puzzle, label: t.otherKits, href: "/shop?category=other-kits" },
    { icon: Wrench, label: t.toolsAccessories, href: "/shop?category=catgrp-tools-paint-accessories" },
  ];

  return (
    <section className="mx-auto max-w-[1440px] px-4 pb-3 pt-1 lg:px-8">
      <h2 className="mb-3 text-sm font-black tracking-wide text-blue-700">{t.featuredCategories}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map(({ icon: Icon, label, href }) => (
          <a
            key={label}
            href={href}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Icon size={20} />
            </span>
            <span className="min-w-0 truncate text-sm font-black text-slate-900">{label}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

// Horizontal-scroll carousel used only for the "Hàng order" (pre-order)
// section: cards always render at a fixed width (never stretched/shrunk to
// fill a row) and overflow into a scrollable track instead. Desktop gets
// arrow buttons that only show up when there's actually something to scroll
// to in that direction; mobile relies on touch scroll + snap.
function PreOrderCarousel({ products, lang, actions }) {
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;

    function updateScrollState() {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }

    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      observer.disconnect();
    };
  }, [products.length]);

  function scrollByDirection(direction) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.min(el.clientWidth * 0.9, 600), behavior: "smooth" });
  }

  return (
    <div className="relative">
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByDirection(-1)}
          aria-label="Cuộn trái"
          className="absolute left-0 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-md transition hover:border-blue-300 hover:text-blue-700 sm:flex"
        >
          <ChevronLeft size={18} />
        </button>
      )}

      <div
        ref={trackRef}
        className="preorder-carousel-track flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1"
      >
        {products.map((product) => (
          <div key={product.id} className="w-[240px] max-w-[80vw] shrink-0 snap-start">
            <ProductCard product={product} lang={lang} actions={actions} />
          </div>
        ))}
      </div>

      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByDirection(1)}
          aria-label="Cuộn phải"
          className="absolute right-0 top-1/2 z-10 hidden translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-md transition hover:border-blue-300 hover:text-blue-700 sm:flex"
        >
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}

function ProductSection({ section, products, lang, actions, badge, isFirst = false }) {
  const t = copy[lang];
  const sectionProducts = getSectionProducts(products, section);
  const title = text(section.title, lang, t.newArrivals);
  const isPreOrderSection = section.id === "order-items";
  const viewAllHref = isPreOrderSection
    ? "/shop?stock=preorder"
    : `/shop?collection=${encodeURIComponent(section.dataSource || section.id || "")}`;

  return (
    <section className={`p-4 ${isFirst ? "" : "border-t border-slate-100"}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700">{badge}</span>
          <h2 className="text-xl font-black text-blue-700">{title}</h2>
        </div>
        <a href={viewAllHref} className="inline-flex items-center gap-1 text-xs font-black text-blue-700 hover:underline">
          {t.viewAll}<ArrowRight size={13} />
        </a>
      </div>

      {sectionProducts.length ? (
        isPreOrderSection ? (
          <PreOrderCarousel products={sectionProducts} lang={lang} actions={actions} />
        ) : sectionProducts.length === 1 ? (
          <div className="home-mobile-product-grid grid grid-cols-1 gap-3">
            <div className="max-w-xs">
              <ProductCard product={sectionProducts[0]} lang={lang} actions={actions} />
            </div>
          </div>
        ) : (
          <div className="home-mobile-product-grid grid grid-cols-[repeat(auto-fill,minmax(200px,240px))] justify-start gap-3">
            {sectionProducts.map((product) => (
              <ProductCard key={product.id} product={product} lang={lang} actions={actions} />
            ))}
          </div>
        )
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
              <div className="text-[10px] font-black tracking-wide text-blue-600">
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
                  <div className="text-[10px] font-black text-blue-600">
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
              <div className="text-[10px] font-black tracking-wide text-blue-600">
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
                <div className="text-[10px] font-black text-blue-600">
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


export default function HomePage() {
  const [backendProducts, setBackendProducts] = useState([]);
  const [homepageNews, setHomepageNews] = useState([]);
  const [homepageEvents, setHomepageEvents] = useState([]);
  const [dbBanners, setDbBanners] = useState([]);
  const [dbHeroSettings, setDbHeroSettings] = useState(null);
  const [bannerApiReady, setBannerApiReady] = useState(false);
  const [bannerApiError, setBannerApiError] = useState("");
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

    getStorefrontProductsForStorefront()
      .then((loadedProducts) => {
        if (!alive) return;
        setBackendProducts(Array.isArray(loadedProducts) ? loadedProducts : []);
      })
      .catch(() => {
        if (!alive) return;
        setBackendProducts([]);
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

        <FeaturedCategories lang={lang} />

        <main className="mx-auto max-w-[1440px] px-4 pb-8 lg:px-8">
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
                  new_arrivals: "New",
                  order_items: "Order",
                  best_sellers: "Hot",
                  tools_accessories: "Tools",
                }[section.dataSource] || "New"}
              />
            ))}
          </div>
        </main>

        <TrustStrip lang={lang} />

        <ContentHighlights
          news={homepageNews}
          events={homepageEvents}
          lang={lang}
        />
      </div>
    </PageShell>
  );
}
