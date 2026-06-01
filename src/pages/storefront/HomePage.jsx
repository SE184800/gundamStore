import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Box,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  Gift,
  Heart,
  Package,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Star,
  Truck,
  Zap,
} from "lucide-react";
import PageShell from "../../components/common/PageShell";
import { useCms } from "../../store/CmsStore";
import { translateStaticText } from "../../i18n";
import ProductCard from "../../components/storefront/ProductCard";
import {
  enrichProductsWithBackendIds,
  getStorefrontProductsFromApi,
} from "../../services/StorefrontProductApiService";


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
    giftDesc: "Points & member-only gifts",
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
  {
    id: "new-arrivals",
    sort: 1,
    dataSource: "new_arrivals",
    title: { vi: "Hàng mới về", en: "New arrivals" },
  },
  {
    id: "order-items",
    sort: 2,
    dataSource: "order_items",
    title: { vi: "Hàng order", en: "Order items" },
  },
  {
    id: "best-sellers",
    sort: 3,
    dataSource: "best_sellers",
    title: { vi: "Hàng bán chạy", en: "Best sellers" },
  },
  {
    id: "sales",
    sort: 4,
    dataSource: "sale_products",
    title: { vi: "Hàng Sales", en: "Sales" },
  },
];

function money(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + "₫";
}

function text(value, lang, fallback = "") {
  if (!value) return translateStaticText(fallback, lang);
  if (typeof value === "string") return translateStaticText(value, lang);
  return value[lang] || value.vi || value.en || translateStaticText(fallback, lang);
}

function productName(product, lang) {
  return text(product.name, lang, product.title || "Gundam Model Kit");
}

function statusOf(product) {
  return String(product.status || "").toLowerCase();
}

function isPreorder(product) {
  const status = statusOf(product);
  return Boolean(
    product.preorder?.enabled ||
    status.includes("pre") ||
    status.includes("order")
  );
}

function isSale(product) {
  const status = statusOf(product);
  return Boolean(
    status.includes("sale") ||
    Number(product.oldPrice || 0) > Number(product.price || 0) ||
    product.collections?.includes("sale_products") ||
    product.collections?.includes("sales")
  );
}

function isNew(product) {
  return Boolean(
    product.isNew ||
    product.collections?.includes("new_arrivals") ||
    statusOf(product).includes("new")
  );
}

function isBestSeller(product) {
  return Boolean(
    product.isBestSeller ||
    product.collections?.includes("best_sellers") ||
    Number(product.sold || 0) >= 40
  );
}

function productMatchesSource(product, source) {
  const key = String(source || "").toLowerCase();

  if (key.includes("new")) return isNew(product);
  if (key.includes("order") || key.includes("pre")) return isPreorder(product);
  if (key.includes("best") || key.includes("seller")) return isBestSeller(product);
  if (key.includes("sale")) return isSale(product);

  return true;
}


function collectionKeyMatchesSource(collectionKey, source) {
  const key = String(collectionKey || "").toLowerCase();
  const src = String(source || "").toLowerCase();

  if (src.includes("new")) return key === "new_arrivals";
  if (src.includes("order") || src.includes("pre")) return key === "preorder" || key === "order_items";
  if (src.includes("best") || src.includes("seller")) return key === "best_sellers";
  if (src.includes("sale")) return key === "sale_products" || key === "sales";
  if (src.includes("tool")) return key === "tools";
  return key === src;
}

function getSectionProducts(products, section, displayMappings = []) {
  const source = section.dataSource || section.source || section.collection || section.id;
  const activeProducts = products.filter((product) => product.active !== false);

  const backendGroupedProducts = activeProducts.filter((product) => {
    const isBackendProduct = Boolean(product.backendProductId || String(product.source || "").includes("backend"));
    const collections = Array.isArray(product.collections) ? product.collections : [];

    return (
      isBackendProduct &&
      collections.some((key) => collectionKeyMatchesSource(key, source))
    );
  });

  let result = [];

  if (backendGroupedProducts.length > 0) {
    result = backendGroupedProducts;
  } else {
    const mappedProductIds = (displayMappings || [])
      .filter((mapping) => (mapping.collectionKeys || []).some((key) => collectionKeyMatchesSource(key, source)))
      .map((mapping) => mapping.productId);

    if (mappedProductIds.length > 0) {
      result = activeProducts
        .filter((product) => mappedProductIds.includes(product.id))
        .sort((a, b) => mappedProductIds.indexOf(a.id) - mappedProductIds.indexOf(b.id));
    } else {
      result = activeProducts.filter((product) => productMatchesSource(product, source));
    }
  }

  if (String(source).includes("best")) {
    result = [...result].sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0));
  }

  if (String(source).includes("sale")) {
    result = [...result].sort(
      (a, b) =>
        Number(b.oldPrice || 0) - Number(b.price || 0) -
        (Number(a.oldPrice || 0) - Number(a.price || 0))
    );
  }

  if (!result.length) {
    result = activeProducts;
  }

  return result.slice(0, 8);
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

function GundamVisual({ tone = "blue", imageUrl, large = false }) {
  const toneMap = {
    blue: "from-blue-950 via-blue-600 to-sky-100",
    cyan: "from-cyan-900 via-cyan-500 to-blue-100",
    slate: "from-slate-950 via-slate-500 to-slate-100",
    red: "from-red-950 via-red-500 to-orange-100",
    gold: "from-amber-800 via-yellow-400 to-slate-50",
    violet: "from-violet-950 via-violet-500 to-fuchsia-100",
    sky: "from-sky-900 via-sky-500 to-blue-100",
  };

  if (imageUrl) {
    return (
      <div className="relative h-full overflow-hidden rounded-2xl bg-slate-100">
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/20 via-transparent to-white/20" />
      </div>
    );
  }

  return (
    <div className={`relative h-full overflow-hidden rounded-2xl bg-gradient-to-br ${toneMap[tone] || toneMap.blue}`}>
      <div
        className="absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.38) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.38) 1px, transparent 1px)",
          backgroundSize: large ? "28px 28px" : "18px 18px",
        }}
      />
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/40 blur-2xl" />
      <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-8deg] rounded-[1.7rem] bg-white/90 shadow-2xl ${large ? "h-48 w-32" : "h-20 w-14"}`}>
        <div className={`absolute left-1/2 -translate-x-1/2 rounded-xl bg-red-500 ${large ? "top-6 h-10 w-10" : "top-3 h-6 w-6"}`} />
        <div className={`absolute rounded-full bg-slate-950 ${large ? "bottom-6 left-5 h-16 w-5" : "bottom-3 left-2 h-8 w-2.5"}`} />
        <div className={`absolute rounded-full bg-slate-950 ${large ? "bottom-6 right-5 h-16 w-5" : "bottom-3 right-2 h-8 w-2.5"}`} />
        <div className={`absolute -rotate-45 rounded-full bg-yellow-300 ${large ? "-left-20 top-24 h-6 w-32" : "-left-6 top-9 h-2.5 w-12"}`} />
        <div className={`absolute rotate-45 rounded-full bg-cyan-300 ${large ? "-right-20 top-24 h-6 w-32" : "-right-6 top-9 h-2.5 w-12"}`} />
      </div>
    </div>
  );
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

  return (
    isActive &&
    status === "live" &&
    hasBannerMedia(banner) &&
    (placement.includes("home") || placement.includes("hero"))
  );
}

function getBannerBaseImage(banner = {}) {
  return (
    banner.mainImage ||
    banner.imageUrl ||
    banner.mediaUrl ||
    banner.image ||
    banner.desktopImage ||
    banner.mobileImage ||
    banner.tabletImage ||
    "/images/banners/banner-1.jpg"
  );
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
  return (
    banner.altText ||
    banner.titleInternal ||
    banner.name ||
    text(banner.title, lang, "Gundam campaign banner")
  );
}

function bannerFitClass(banner = {}) {
  return banner.fitMode === "contain" ? "object-contain" : "object-cover";
}

function getHeroBanners(banners = [], settings = {}) {
  const maxBanners = Number(settings.maxBanners || 5);
  const activeBanners = (Array.isArray(banners) ? banners : [])
    .filter(isLiveHomepageBanner)
    .sort((a, b) => Number(a.priority || 99) - Number(b.priority || 99))
    .slice(0, maxBanners);

  return activeBanners.length
    ? activeBanners
    : [
        {
          id: "fallback-hero",
          titleInternal: "Gundam hero banner",
          altText: "Gundam Store banner",
          imageUrl: "/images/banners/banner-1.jpg",
          ctaUrl: "/shop",
          active: true,
          status: "Live",
          priority: 1,
          fitMode: "cover",
        },
      ];
}

function BannerMedia({ banner, lang, className = "" }) {
  const baseImage = getBannerBaseImage(banner);
  const fitClass = bannerFitClass(banner);
  const backgroundColor = banner.backgroundColor || banner.bgColor || "#f8fafc";

  if (isBannerVideo(banner)) {
    return (
      <video
        src={getBannerVideoUrl(banner) || baseImage}
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
        className={`${fitClass} ${className}`}
        style={{ backgroundColor }}
      />
    </picture>
  );
}

function ImageFirstLinkBanner({ banner, lang, actions, className = "", mediaClassName = "" }) {
  return (
    <a
      href={bannerHref(banner)}
      aria-label={bannerAlt(banner, lang)}
      title={bannerAlt(banner, lang)}
      onClick={() => actions?.track?.("banner_click", { meta: { bannerId: banner.id || "hero" } })}
      className={`image-first-banner-link block overflow-hidden bg-slate-50 ${className}`}
    >
      <BannerMedia banner={banner} lang={lang} className={`block h-full w-full ${mediaClassName}`} />
    </a>
  );
}

function Hero({ banners, lang, actions, heroSettings }) {
  const settings = {
    layout: "v2",
    autoplay: true,
    interval: 4500,
    maxBanners: 5,
    ...(heroSettings || {}),
  };

  const safeBanners = getHeroBanners(banners, settings);

  if (settings.layout === "v3") {
    return <HeroV3Bento banners={safeBanners} lang={lang} actions={actions} settings={settings} />;
  }

  return <HeroV2Classic banners={safeBanners} lang={lang} actions={actions} settings={settings} />;
}

function HeroV3Bento({ banners, lang, actions, settings }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const safeBanners = banners.length ? banners : getHeroBanners([], settings);
  const activeBanner = safeBanners[activeIndex] || safeBanners[0];
  const sideBanners = safeBanners.filter((_, index) => index !== activeIndex).slice(0, 2);
  const interval = Number(settings.interval || 4500);

  function goToBanner(index) {
    setActiveIndex((index + safeBanners.length) % safeBanners.length);
  }

  useEffect(() => {
    if (!settings.autoplay || safeBanners.length <= 1 || paused) return;

    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % safeBanners.length);
    }, interval);

    return () => clearInterval(timer);
  }, [settings.autoplay, safeBanners.length, paused, interval]);

  return (
    <section className="image-first-hero mx-auto max-w-[1440px] px-3 pt-3 sm:px-4 sm:pt-4 lg:px-8">
      <div
        className="grid gap-3 lg:grid-cols-[1.75fr_0.95fr]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <ImageFirstLinkBanner
          banner={activeBanner}
          lang={lang}
          actions={actions}
          className="h-[320px] rounded-[24px] border border-slate-200 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:h-[420px] sm:rounded-[30px]"
          mediaClassName="transition duration-700 hover:scale-[1.01]"
        />

        {sideBanners.length > 0 && (
          <div className="hidden gap-3 lg:grid">
            {sideBanners.map((banner, index) => (
              <ImageFirstLinkBanner
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

          <div className="image-first-hero-thumbs mobile-hide-scrollbar flex flex-1 gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-5">
            {safeBanners.map((banner, index) => (
              <button
                key={banner.id || index}
                type="button"
                onClick={() => goToBanner(index)}
                className={`image-first-thumb relative h-[86px] min-w-[148px] overflow-hidden rounded-2xl border text-left shadow-sm transition ${
                  activeIndex === index
                    ? "border-blue-600 ring-4 ring-blue-100"
                    : "border-slate-200 hover:border-blue-300"
                }`}
                aria-label={`Banner ${index + 1}`}
              >
                <BannerMedia banner={banner} lang={lang} className="block h-full w-full" />
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
  const safeBanners = banners.length ? banners : getHeroBanners([], settings);
  const activeBanner = safeBanners[activeIndex] || safeBanners[0];
  const interval = Number(settings.interval || 4500);

  function goToBanner(index) {
    setActiveIndex((index + safeBanners.length) % safeBanners.length);
  }

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
        className="mobile-no-overflow relative overflow-hidden rounded-[24px] border border-blue-100 bg-white shadow-[0_20px_70px_rgba(37,99,235,0.12)] sm:rounded-[34px]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <ImageFirstLinkBanner
          banner={activeBanner}
          lang={lang}
          actions={actions}
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
                className={`h-2.5 rounded-full transition ${
                  activeIndex === index ? "w-12 bg-blue-700" : "w-2.5 bg-slate-300 hover:bg-blue-400"
                }`}
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
  const list = categories.length ? categories : fallbackCategories;

  function getCategoryImage(category, index) {
    return (
      category.icon ||
      category.imageUrl ||
      category.image ||
      category.mainImage ||
      [
        "/images/products/aerial.jpg",
        "/images/products/hi-nu.jpg",
        "/images/products/freedom.jpg",
        "/images/products/strike-freedom.jpg",
      ][index % 4]
    );
  }

  function getCategoryHref(category) {
    const fallback = `/shop?category=${encodeURIComponent(category.id || category.slug || category.code || "")}`;
    return getSafeHref(category.ctaUrl || fallback, fallback);
  }

  return (
    <aside className="image-first-category-wrap rounded-[28px] border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="image-first-category-grid grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-2">
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
              className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl"
            >
              <div className="aspect-square w-full overflow-hidden bg-gradient-to-br from-slate-100 to-blue-50">
                <img
                  src={image}
                  alt={category.altText || fullName}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
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
          <span className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase text-blue-700">
            {badge}
          </span>
          <h2 className="text-xl font-black text-blue-700">{title}</h2>
        </div>
        <a href="/shop" className="inline-flex items-center gap-1 text-xs font-black text-blue-700 hover:underline">
          {t.viewAll}<ArrowRight size={13} />
        </a>
      </div>

      {sectionProducts.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sectionProducts.map((product) => (
            <ProductCard key={product.id} product={product} lang={lang} actions={actions} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
          {t.empty}
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

export default function HomePage() {
  const [backendProducts, setBackendProducts] = useState([]);
  const [productApiReady, setProductApiReady] = useState(false);
  const [productApiError, setProductApiError] = useState("");
  const { state, actions } = useCms();
  const lang = state.settings?.lang || "vi";
  const banners = useMemo(() => {
    const active = (state.banners || [])
      .filter((banner) => banner.active !== false)
      .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
    const hero = active.filter((banner) => String(banner.placement || "").includes("hero"));
    return hero.length ? hero : active;
  }, [state.banners]);

  const sections = useMemo(() => mergeCmsSections(state.homeSections), [state.homeSections]);
  const localProducts = state.products || [];
  const enrichedProducts = useMemo(
    () => enrichProductsWithBackendIds(localProducts, backendProducts),
    [localProducts, backendProducts]
  );
  const products = enrichedProducts;

  useEffect(() => {
    let alive = true;

    getStorefrontProductsFromApi()
      .then((items) => {
        if (!alive) return;
        setBackendProducts(items);
        setProductApiReady(true);
        setProductApiError("");
      })
      .catch((error) => {
        if (!alive) return;
        setBackendProducts([]);
        setProductApiReady(false);
        setProductApiError(error?.message || "Cannot load backend products.");
      });

    return () => {
      alive = false;
    };
  }, []);
  const categories = state.categories || [];

  useEffect(() => {
    actions.track("page_view", { page: "/" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageShell>
      <div className="relative">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f7fbff] to-[#eef5fc]" />
          <div
            className="absolute inset-0 opacity-80"
            style={{
              backgroundImage:
                "linear-gradient(rgba(37,99,235,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.035) 1px, transparent 1px)",
              backgroundSize: "42px 42px",
            }}
          />
        </div>

        <Hero banners={(state?.publishedHero?.banners || banners)} lang={lang} actions={actions} heroSettings={(state?.publishedHero?.heroSettings || state?.heroSettings)} />
        <TrustStrip lang={lang} />

        <main className="mx-auto grid max-w-[1200px] gap-4 px-4 pb-8 lg:grid-cols-[190px_1fr]">
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
