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


function getHeroTextStyles(banner = {}) {
  const fontFamily =
    banner.fontFamily === "serif"
      ? "Georgia, serif"
      : banner.fontFamily === "mono"
      ? "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
      : "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";

  return {
    heading: {
      display: banner.showHeading === false ? "none" : undefined,
      color: banner.headingColor || undefined,
      fontSize: banner.headingSize ? `${Number(banner.headingSize)}px` : undefined,
      fontFamily,
    },
    title: {
      display: banner.showTitle === false ? "none" : undefined,
      color: banner.titleColor || undefined,
      fontSize: banner.titleSize ? `${Number(banner.titleSize)}px` : undefined,
      fontFamily,
    },
    subtitle: {
      display: banner.showSubtitle === false ? "none" : undefined,
      color: banner.subtitleColor || undefined,
      fontSize: banner.subtitleSize ? `${Number(banner.subtitleSize)}px` : undefined,
      fontFamily,
    },
  };
}

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


function Hero({ banners, lang, actions, heroSettings }) {
  const settings = {
    layout: "v2",
    autoplay: true,
    interval: 4500,
    maxBanners: 5,
    ...(heroSettings || {}),
  };

  if (settings.layout === "v3") {
    return (

      <HeroV3Bento
        banners={banners}
        lang={lang}
        actions={actions}
        settings={settings}
      />
    );
  }

  return (
    <HeroV2Classic
      banners={banners}
      lang={lang}
      actions={actions}
    />
  );
}

function HeroV3Bento({ banners, lang, actions, settings }) {
  const t = copy[lang];
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const cmsBanners = Array.isArray(banners) ? banners : [];
  const maxBanners = Number(settings.maxBanners || 5);
  const interval = Number(settings.interval || 4500);

  const activeBanners = cmsBanners
    .filter((banner) => {
      const isActive = banner.active !== false;
      const status = String(banner.status || "Live").toLowerCase();
      const placement = String(banner.placement || banner.position || "Homepage Hero").toLowerCase();

      return (
        isActive &&
        !status.includes("draft") &&
        !status.includes("inactive") &&
        (placement.includes("home") || placement.includes("hero"))
      );
    })
    .sort((a, b) => Number(a.priority || 99) - Number(b.priority || 99))
    .slice(0, maxBanners);

  const safeBanners = activeBanners.length
    ? activeBanners
    : [
        {
          id: "fallback-bento-1",
          heading: { vi: "RG Hi-ν Gundam", en: "RG Hi-ν Gundam" },
          title: { vi: "Huyền thoại trở lại", en: "Legend returns" },
          subtitle: { vi: "Hàng chính hãng Bandai, số lượng có hạn.", en: "Authentic Bandai, limited stock." },
          imageUrl: "/images/banners/banner-1.jpg",
          ctaText: { vi: "Mua ngay", en: "Shop now" },
          ctaUrl: "/shop",
          backgroundColor: "#07111f",
          active: true,
          status: "Live",
          priority: 1,
        },
      ];

  const activeBanner = safeBanners[activeIndex] || safeBanners[0];
  const heroTextStyles = getHeroTextStyles(activeBanner);
  const sideOne = safeBanners[(activeIndex + 1) % safeBanners.length] || activeBanner;
  const sideTwo = safeBanners[(activeIndex + 2) % safeBanners.length] || activeBanner;

  const getUrl = (banner) =>
    banner.videoUrl ||
    banner.mediaUrl ||
    banner.imageUrl ||
    banner.image ||
    banner.desktopImage ||
    "/images/banners/banner-1.jpg";

  const isVideo = (banner) => {
    const url = getUrl(banner);
    const type = String(banner.mediaType || banner.type || "").toLowerCase();
    return type.includes("video") || String(url).match(/\.(mp4|webm|ogg)$/i);
  };

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

  const renderMedia = (banner, className) => {
    const url = getUrl(banner);

    if (isVideo(banner)) {
      return (
        <video
          src={url}
          className={className}
          autoPlay
          muted
          loop
          playsInline
        />
      );
    }

    return (
      <img
        src={url}
        alt={text(banner.title, lang, "Gundam banner")}
        className={className}
      />
    );
  };

  const campaignBg = activeBanner.backgroundColor || activeBanner.bgColor || "#07111f";

  const fontFamily =
    activeBanner.fontFamily === "serif"
      ? "Georgia, serif"
      : activeBanner.fontFamily === "mono"
      ? "ui-monospace, SFMono-Regular, Menlo, monospace"
      : "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";

  const headingStyle = {
    color: activeBanner.headingColor || undefined,
    fontSize: activeBanner.headingSize ? Number(activeBanner.headingSize) : undefined,
    fontFamily,
  };

  const titleStyle = {
    color: activeBanner.titleColor || undefined,
    fontSize: activeBanner.titleSize ? Number(activeBanner.titleSize) : undefined,
    fontFamily,
  };

  const subtitleStyle = {
    color: activeBanner.subtitleColor || undefined,
    fontSize: activeBanner.subtitleSize ? Number(activeBanner.subtitleSize) : undefined,
    fontFamily,
  };


  return (
    <section className="mx-auto max-w-[1440px] px-4 pt-4 lg:px-8">
      <div
        className="grid gap-3 lg:grid-cols-[1.75fr_0.95fr]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <a
          href={activeBanner.ctaUrl || activeBanner.link || "/shop"}
          onClick={() => actions?.track?.("banner_click", { meta: { bannerId: activeBanner.id || "hero-v3" } })}
          className="group relative h-[420px] overflow-hidden rounded-[30px] border border-slate-800 bg-slate-950 shadow-[0_32px_120px_rgba(15,23,42,0.22)]"
          style={{ backgroundColor: campaignBg }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(59,130,246,0.28),transparent_42%)]" />

          {renderMedia(
            activeBanner,
            "absolute inset-0 h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-[1.03]"
          )}

          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />

          <div className="relative z-10 flex h-full max-w-[560px] flex-col justify-center p-7 md:p-10">
            {activeBanner.showEyebrow !== false && (
              <div className={`${activeBanner.showEyebrow === false ? "hidden" : "mb-4 flex"} flex-wrap gap-2`}>
                <span className="rounded-full bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-wide text-white shadow-lg">
                  New Arrival
                </span>
                <span className="rounded-full bg-blue-700 px-4 py-2 text-xs font-black uppercase tracking-wide text-white shadow-lg">
                  {lang === "vi" ? "Chính hãng Bandai" : "Authentic Bandai"}
                </span>
              </div>
            )}

            {activeBanner.showHeading !== false && (
              <h1 className="line-clamp-2 text-5xl font-black leading-[0.9] tracking-tight text-white md:text-7xl" style={heroTextStyles.heading}>
                {text(activeBanner.heading, lang, t.heroTitle)}
              </h1>
            )}

            <p className="mt-5 line-clamp-2 text-xl font-black text-white md:text-2xl"style={heroTextStyles.title}>
              {text(activeBanner.title, lang, t.heroSub)}
            </p>

            <p className="mt-3 line-clamp-3 max-w-[460px] text-sm font-semibold leading-7 text-white/80"style={heroTextStyles.subtitle}>
              {text(activeBanner.subtitle, lang, "Hàng chính hãng Bandai, số lượng có hạn.")}
            </p>

            {activeBanner.showChips !== false && (
              <div className={`${activeBanner.showChips === false ? "hidden" : "mt-6 flex"} flex-wrap gap-3 text-white`}>
                {["Chính hãng", "Giao nhanh", "Đóng gói chống sốc"].map((item) => (
                  <span key={item} className="rounded-2xl bg-white/10 px-4 py-3 text-xs font-black backdrop-blur">
                    {item}
                  </span>
                ))}
              </div>
            )}

            {activeBanner.showCta !== false && (
              <div className={`${activeBanner.showCta === false ? "hidden" : "mt-7 flex"} flex-wrap gap-3`}>
                <span className="rounded-2xl bg-blue-700 px-8 py-4 text-sm font-black uppercase tracking-wide text-white shadow-xl shadow-blue-900/30 transition group-hover:bg-blue-600">
                  {text(activeBanner.ctaText, lang, t.buyNow)}
                </span>
                <span className="rounded-2xl border border-white/30 bg-white/10 px-7 py-4 text-sm font-black uppercase tracking-wide text-white backdrop-blur">
                  {lang === "vi" ? "Xem chi tiết" : "View details"}
                </span>
              </div>
            )}
          </div>

          <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {safeBanners.map((item, index) => (
              <button
                key={item.id || index}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  goToBanner(index);
                }}
                className={`h-2.5 rounded-full transition ${
                  activeIndex === index ? "w-12 bg-blue-500" : "w-9 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </a>

        <div className="grid gap-3">
          {[sideOne, sideTwo].map((banner, index) => (
            <a
              key={`${banner.id}-${index}`}
              href={banner.ctaUrl || banner.link || "/shop"}
              className="group relative h-[203px] overflow-hidden rounded-[26px] border border-slate-200 bg-slate-950 shadow-lg"
            >
              {renderMedia(
                banner,
                "absolute inset-0 h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105"
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/35 to-transparent" />
              <div className="relative z-10 flex h-full max-w-[290px] flex-col justify-center p-6 text-white">
                <span className={`mb-3 w-fit rounded-full px-3 py-1 text-xs font-black uppercase ${
                  index === 0 ? "bg-emerald-500" : "bg-amber-500 text-slate-950"
                }`}>
                  {index === 0 ? "Pre-order" : "Flash Sale"}
                </span>
                <h3 className="text-2xl font-black leading-tight">
                  {text(banner.title, lang, "Campaign")}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm font-semibold text-white/80">
                  {text(banner.subtitle, lang, "Ưu đãi nổi bật hôm nay.")}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {safeBanners.length > 1 && (
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => goToBanner(activeIndex - 1)}
            className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-2xl font-black text-blue-700 shadow-md transition hover:bg-blue-700 hover:text-white md:flex"
          >
            ‹
          </button>

          <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-5">
            {safeBanners.map((banner, index) => (
              <button
                key={banner.id || index}
                onClick={() => goToBanner(index)}
                className={`group relative h-[98px] overflow-hidden rounded-2xl border text-left shadow-sm transition ${
                  activeIndex === index
                    ? "border-blue-600 ring-4 ring-blue-100"
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                {renderMedia(
                  banner,
                  "absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110"
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 to-slate-950/10" />
                <div className="relative z-10 flex h-full flex-col justify-end p-3 text-white">
                  <span className="text-xs font-black text-white/70">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="line-clamp-1 text-sm font-black">
                    {text(banner.title, lang, `Banner ${index + 1}`)}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => goToBanner(activeIndex + 1)}
            className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-2xl font-black text-blue-700 shadow-md transition hover:bg-blue-700 hover:text-white md:flex"
          >
            ›
          </button>
        </div>
      )}
    </section>
  );
}

function HeroV2Classic({ banners, lang, actions }) {
  const t = copy[lang];
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const cmsBanners = Array.isArray(banners) ? banners : [];

  const activeBanners = cmsBanners
    .filter((banner) => {
      const isActive = banner.active !== false;
      const status = String(banner.status || "Live").toLowerCase();
      const placement = String(banner.placement || banner.position || "Homepage Hero").toLowerCase();

      return (
        isActive &&
        !status.includes("draft") &&
        !status.includes("inactive") &&
        (placement.includes("home") || placement.includes("hero"))
      );
    })
    .sort((a, b) => Number(a.priority || 99) - Number(b.priority || 99))
    .slice(0, 5);

  const safeBanners = activeBanners.length
    ? activeBanners
    : [
        {
          id: "fallback-hero",
          title: { vi: "RG Hi-ν Gundam", en: "RG Hi-ν Gundam" },
          heading: { vi: "GUNDAM / GUNPLA", en: "GUNDAM / GUNPLA" },
          subtitle: { vi: "Hàng chính hãng Bandai.", en: "Authentic Bandai." },
          imageUrl: "/images/banners/banner-1.jpg",
          backgroundColor: "#ffffff",
          mediaType: "image",
          active: true,
          ctaText: { vi: "Mua ngay", en: "Shop now" },
          ctaUrl: "/shop",
        },
      ];

  useEffect(() => {
    if (safeBanners.length <= 1 || paused) return;

    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % safeBanners.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [safeBanners.length, paused]);

  const goToBanner = (index) => {
    const nextIndex = (index + safeBanners.length) % safeBanners.length;
    setActiveIndex(nextIndex);
  };

  const activeBanner = safeBanners[activeIndex] || safeBanners[0];
  const heroTextStyles = getHeroTextStyles(activeBanner);

  const bannerUrl =
    activeBanner.videoUrl ||
    activeBanner.mediaUrl ||
    activeBanner.imageUrl ||
    activeBanner.image ||
    activeBanner.desktopImage ||
    "/images/banners/banner-1.jpg";

  const mediaType = String(
    activeBanner.mediaType ||
    activeBanner.type ||
    (String(bannerUrl).match(/\.(mp4|webm|ogg)$/i) ? "video" : "image")
  ).toLowerCase();

  const heroBg = activeBanner.backgroundColor || activeBanner.bgColor || "#ffffff";

  const fontFamily =
    activeBanner.fontFamily === "serif"
      ? "Georgia, serif"
      : activeBanner.fontFamily === "mono"
      ? "ui-monospace, SFMono-Regular, Menlo, monospace"
      : "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";

  const headingStyle = {
    color: activeBanner.headingColor || undefined,
    fontSize: activeBanner.headingSize ? Number(activeBanner.headingSize) : undefined,
    fontFamily,
  };

  const titleStyle = {
    color: activeBanner.titleColor || undefined,
    fontSize: activeBanner.titleSize ? Number(activeBanner.titleSize) : undefined,
    fontFamily,
  };

  const subtitleStyle = {
    color: activeBanner.subtitleColor || undefined,
    fontSize: activeBanner.subtitleSize ? Number(activeBanner.subtitleSize) : undefined,
    fontFamily,
  };


  return (
    <section className="mx-auto max-w-[1440px] px-4 pt-4 lg:px-8">
      <div
        className="relative overflow-hidden rounded-[34px] border border-blue-100 shadow-[0_30px_110px_rgba(37,99,235,0.16)]"
        style={{ backgroundColor: heroBg }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(rgba(37,99,235,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.045) 1px, transparent 1px)",
            backgroundSize: "38px 38px",
          }}
        />

        <div className="relative z-10 grid h-[420px] overflow-hidden lg:grid-cols-[0.68fr_1.32fr]">
          <div className="flex flex-col justify-center p-7 md:p-9 lg:p-10">
            {activeBanner.showEyebrow !== false && (
              <div className={`${activeBanner.showEyebrow === false ? "hidden" : "mb-4 inline-flex"} w-fit rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-blue-700 shadow-sm backdrop-blur`}>
                {t.eyebrow}
              </div>
            )}

            <h1 className="line-clamp-2 max-w-[500px] text-5xl font-black leading-[0.92] tracking-tight text-slate-950 md:text-6xl" style={heroTextStyles.heading}>
              {text(activeBanner.heading, lang, t.heroTitle)}
            </h1>

            <p className="mt-4 line-clamp-2 max-w-[460px] text-lg font-black leading-snug text-slate-800 md:text-2xl"style={heroTextStyles.title}>
              {text(activeBanner.title, lang, t.heroSub)}
            </p>

            <p className="mt-3 line-clamp-3 max-w-[440px] text-sm font-semibold leading-7 text-slate-600"style={heroTextStyles.subtitle}>
              {text(activeBanner.subtitle, lang, "Hàng chính hãng Bandai.")}
            </p>

            {activeBanner.showChips !== false && (
              <div className={`${activeBanner.showChips === false ? "hidden" : "mt-5 flex"} flex-wrap gap-2`}>
                {["Chính hãng", "Giao nhanh", "Bọc chống sốc"].map((item) => (
                  <span key={item} className="rounded-full border border-blue-100 bg-white/80 px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm">
                    {item}
                  </span>
                ))}
              </div>
            )}

            {activeBanner.showCta !== false && (
              <div className={activeBanner.showCta === false ? "hidden" : "mt-6"}>
                <a
                  href={activeBanner.ctaUrl || activeBanner.link || "/shop"}
                  onClick={() => actions?.track?.("banner_click", { meta: { bannerId: activeBanner.id || "hero" } })}
                  className="inline-flex rounded-2xl bg-gradient-to-r from-blue-700 to-cyan-500 px-9 py-4 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-blue-200 transition hover:-translate-y-1 hover:brightness-110"
                >
                  {text(activeBanner.ctaText, lang, t.buyNow)}
                </a>
              </div>
            )}

            {safeBanners.length > 1 && (
              <div className="mt-6 hidden items-center gap-3">
                <button
                  onClick={() => goToBanner(activeIndex - 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-xl font-black text-slate-700 shadow-sm transition hover:bg-blue-700 hover:text-white"
                  aria-label="Previous banner"
                >
                  ‹
                </button>

                <div className="flex items-center gap-2">
                  {safeBanners.map((item, index) => (
                    <button
                      key={item.id || index}
                      onClick={() => goToBanner(index)}
                      className={`relative h-2.5 overflow-hidden rounded-full transition ${
                        activeIndex === index ? "w-12 bg-blue-100" : "w-2.5 bg-slate-300 hover:bg-slate-400"
                      }`}
                      aria-label={`Banner ${index + 1}`}
                    >
                      {activeIndex === index && (
                        <span
                          key={activeIndex}
                          className="absolute left-0 top-0 h-full rounded-full bg-blue-700"
                          style={{
                            width: paused ? "100%" : "100%",
                            animation: paused ? "none" : "heroProgress 4.5s linear forwards",
                          }}
                        />
                      )}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => goToBanner(activeIndex + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-xl font-black text-slate-700 shadow-sm transition hover:bg-blue-700 hover:text-white"
                  aria-label="Next banner"
                >
                  ›
                </button>
              </div>
            )}
          </div>

          <a
            href={activeBanner.ctaUrl || activeBanner.link || "/shop"}
            className="group relative flex h-[420px] cursor-pointer items-center justify-center overflow-hidden p-5 lg:p-6"
          >
            <div className="absolute inset-6 rounded-[30px] bg-gradient-to-br from-blue-500/20 via-cyan-400/20 to-white/10 blur-2xl" />
            <div className="absolute left-8 top-8 z-20 rounded-2xl bg-white/90 px-4 py-3 shadow-xl backdrop-blur">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-red-500">Campaign</div>
              <div className="mt-1 text-sm font-black text-slate-950">Hot arrival</div>
            </div>

            {mediaType.includes("video") ? (
              <video
                src={bannerUrl}
                className="relative z-10 h-[270px] w-full max-w-[860px] rounded-[22px] object-cover shadow-2xl transition duration-500 group-hover:scale-[1.015] md:h-[300px]"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <img
                src={bannerUrl}
                alt={text(activeBanner.title, lang, "Gundam banner")}
                className="relative z-10 h-[270px] w-full max-w-[860px] rounded-[22px] object-cover shadow-2xl transition duration-500 group-hover:scale-[1.015] md:h-[300px]"
              />
            )}
          </a>
        </div>
        {safeBanners.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goToBanner(activeIndex - 1)}
              className="absolute left-4 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/80 text-3xl font-black text-slate-700 shadow-xl backdrop-blur transition hover:scale-110 hover:bg-blue-700 hover:text-white"
              aria-label="Previous banner"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={() => goToBanner(activeIndex + 1)}
              className="absolute right-4 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/80 text-3xl font-black text-slate-700 shadow-xl backdrop-blur transition hover:scale-110 hover:bg-blue-700 hover:text-white"
              aria-label="Next banner"
            >
              ›
            </button>

            <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 shadow-xl backdrop-blur">
              {safeBanners.map((item, index) => (
                <button
                  key={item.id || index}
                  type="button"
                  onClick={() => goToBanner(index)}
                  className={`h-2.5 rounded-full transition ${
                    activeIndex === index
                      ? "w-12 bg-blue-700"
                      : "w-2.5 bg-slate-300 hover:bg-blue-400"
                  }`}
                  aria-label={`Banner ${index + 1}`}
                />
              ))}
            </div>
          </>
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

  const getCategoryImage = (category, index) => {
    return (
      category.icon ||
      category.imageUrl ||
      category.image ||
      [
        "/images/products/aerial.jpg",
        "/images/products/hi-nu.jpg",
        "/images/products/freedom.jpg",
        "/images/products/strike-freedom.jpg",
      ][index % 4]
    );
  };

  return (
    <aside className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <div className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">
          Category
        </div>
        <h3 className="mt-1 text-xl font-black text-slate-950">
          {lang === "vi" ? "Dòng sản phẩm" : "Product lines"}
        </h3>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
          {lang === "vi"
            ? "Ảnh danh mục nên upload dạng vuông 512 x 512 px."
            : "Category image should be square 512 x 512 px."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {list.map((category, index) => {
          const fullName = text(category.name, lang, category.label || category.code || "Category");
          const shortCode = category.code || category.shortName || fullName;
          const image = getCategoryImage(category, index);
          const href = `/shop?category=${category.id || category.slug || category.code || ""}`;

          return (
            <a
              key={category.id || category.code || fullName}
              href={href}
              title={fullName}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl"
            >
              <div className="aspect-square w-full overflow-hidden bg-gradient-to-br from-slate-100 to-blue-50">
                <img
                  src={image}
                  alt={shortCode}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                />
              </div>

              <div className="p-3 text-center">
                <div className="text-lg font-black leading-tight text-slate-950 group-hover:text-blue-700">
                  {shortCode}
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
