import { useEffect, useMemo, useState } from "react";
import {
  BellRing,
  CalendarClock,
  Clock3,
  Flame,
  PackageCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import PageShell from "../../components/common/PageShell";
import ProductCard from "../../components/storefront/ProductCard";
import { useCms, useLang } from "../../store/CmsStore";
import { getStorefrontProductsForStorefront } from "../../services/StorefrontProductApiService";

const campaignConfig = {
  "flash-sale": {
    eyebrow: { vi: "Flash Sale", en: "Flash Sale" },
    title: { vi: "Săn deal Gunpla hôm nay", en: "Today’s Gunpla Deals" },
    desc: {
      vi: "Các mẫu Gunpla, phụ kiện builder và combo đang có ưu đãi tốt trong thời gian ngắn.",
      en: "Limited-time deals for Gunpla kits, builder tools and accessories.",
    },
    cta: { vi: "Săn deal ngay", en: "Shop deals" },
    tone: "from-red-700 via-orange-500 to-amber-300",
    icon: Flame,
    badge: "SALE",
    filter: (product) => {
      const collections = product.collections || [];
      return (
        collections.includes("sale_products") ||
        Number(product.oldPrice || product.compareAtPrice || 0) > Number(product.price || 0)
      );
    },
  },
  restock: {
    eyebrow: { vi: "Restock", en: "Restock" },
    title: { vi: "Hàng hot vừa restock", en: "Hot Kits Back in Stock" },
    desc: {
      vi: "Theo dõi các kit được săn nhiều vừa về lại kho, phù hợp collector không muốn lỡ hàng.",
      en: "Track popular kits that are back in stock before they sell out again.",
    },
    cta: { vi: "Xem hàng restock", en: "View restock" },
    tone: "from-blue-800 via-cyan-500 to-sky-200",
    icon: PackageCheck,
    badge: "RESTOCK",
    filter: (product) => Number(product.stock || 0) > 0,
  },
  limited: {
    eyebrow: { vi: "Limited / P-Bandai", en: "Limited / P-Bandai" },
    title: { vi: "Hàng limited cho collector", en: "Limited Kits for Collectors" },
    desc: {
      vi: "Tập trung các mẫu limited, P-Bandai, The Gundam Base, special coating và phiên bản khó săn.",
      en: "Limited, P-Bandai, Gundam Base, special coating and collector-focused kits.",
    },
    cta: { vi: "Xem hàng limited", en: "View limited" },
    tone: "from-violet-950 via-fuchsia-600 to-amber-300",
    icon: ShieldCheck,
    badge: "LIMITED",
    filter: (product) => {
      const text = [product.name?.vi, product.name?.en, product.name, product.title]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        text.includes("limited") ||
        text.includes("p-bandai") ||
        text.includes("gundam base") ||
        text.includes("special coating") ||
        text.includes("metal build")
      );
    },
  },
  "coming-soon": {
    eyebrow: { vi: "Coming Soon", en: "Coming Soon" },
    title: { vi: "Sắp về / sắp mở cọc", en: "Coming Soon / Pre-order Soon" },
    desc: {
      vi: "Danh sách hàng sắp về, sắp mở cọc hoặc đang chờ ETA để khách theo dõi trước.",
      en: "Upcoming arrivals, soon-to-open pre-orders and ETA tracking for collectors.",
    },
    cta: { vi: "Theo dõi hàng sắp về", en: "Track upcoming kits" },
    tone: "from-slate-950 via-blue-700 to-cyan-300",
    icon: CalendarClock,
    badge: "COMING SOON",
    filter: (product) => (product.collections || []).includes("order_items"),
  },
};

function getText(value, lang) {
  if (typeof value === "string") return value;
  return value?.[lang] || value?.vi || value?.en || "";
}

function productName(product, lang) {
  if (typeof product.name === "string") return product.name;
  return product.name?.[lang] || product.name?.vi || product.name?.en || product.title || "Gunpla";
}

function CampaignMiniStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
      <div className="text-xs font-black uppercase tracking-widest text-white/55">{label}</div>
      <div className="mt-1 text-2xl font-black text-white">{value}</div>
    </div>
  );
}

export default function CampaignCollectionPage({ type = "flash-sale" }) {
  const { actions } = useCms();
  const [lang] = useLang();
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getStorefrontProductsForStorefront()
      .then((list) => {
        if (alive) setAllProducts(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (alive) setAllProducts([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const config = campaignConfig[type] || campaignConfig["flash-sale"];
  const Icon = config.icon;

  const products = useMemo(() => {
    const result = allProducts.filter((product) => product.active !== false && config.filter(product));
    return result.length ? result : allProducts.filter((product) => product.active !== false).slice(0, 8);
  }, [allProducts, config]);

  const topProducts = products.slice(0, 8);

  return (
    <PageShell>
      <main className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8">
        <section className={`relative overflow-hidden rounded-6xl bg-gradient-to-br ${config.tone} p-8 text-white shadow-[0_30px_120px_rgba(15,23,42,0.25)]`}>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] bg-[size:36px_36px] opacity-30" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] backdrop-blur">
                <Icon size={15} />
                {getText(config.eyebrow, lang)}
              </div>
              <h1 className="mt-5 text-5xl font-black leading-[0.95] md:text-7xl">
                {getText(config.title, lang)}
              </h1>
              <p className="mt-5 max-w-3xl text-base font-semibold leading-8 text-white/80">
                {getText(config.desc, lang)}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#campaign-products" className="rounded-2xl bg-white px-7 py-4 text-sm font-black text-slate-950">
                  {getText(config.cta, lang)}
                </a>
                <a href="/shop" className="rounded-2xl border border-white/30 px-7 py-4 text-sm font-black text-white">
                  {lang === "en" ? "All products" : "Tất cả sản phẩm"}
                </a>
              </div>
            </div>

            <div className="grid gap-3">
              <CampaignMiniStat label={lang === "en" ? "Products" : "Sản phẩm"} value={products.length} />
              <CampaignMiniStat label={lang === "en" ? "Top grade" : "Grade nổi bật"} value={products[0]?.grade || "Gunpla"} />
              <CampaignMiniStat label={lang === "en" ? "Status" : "Tình trạng"} value={config.badge} />
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <a href="/flash-sale" className="rounded-3xl border border-red-100 bg-red-50 p-5 font-black text-red-700 hover:bg-red-100">
            <Flame className="mb-3" /> Flash Sale
          </a>
          <a href="/restock" className="rounded-3xl border border-blue-100 bg-blue-50 p-5 font-black text-blue-700 hover:bg-blue-100">
            <PackageCheck className="mb-3" /> Restock
          </a>
          <a href="/limited" className="rounded-3xl border border-violet-100 bg-violet-50 p-5 font-black text-violet-700 hover:bg-violet-100">
            <ShieldCheck className="mb-3" /> Limited
          </a>
          <a href="/coming-soon" className="rounded-3xl border border-slate-200 bg-slate-50 p-5 font-black text-slate-700 hover:bg-slate-100">
            <BellRing className="mb-3" /> Coming Soon
          </a>
        </section>

        <section id="campaign-products" className="mt-8 rounded-5xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase text-blue-700">
                {config.badge}
              </div>
              <h2 className="mt-2 text-3xl font-black text-slate-950">
                {lang === "en" ? "Campaign products" : "Sản phẩm trong chiến dịch"}
              </h2>
            </div>

            {type === "flash-sale" && (
              <div className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">
                <Clock3 size={16} className="mr-1 inline" />
                06 : 24 : 59
              </div>
            )}
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm font-black text-slate-400">
              {lang === "en" ? "Loading..." : "Đang tải..."}
            </div>
          ) : topProducts.length === 0 ? (
            <div className="py-10 text-center text-sm font-black text-slate-400">
              {lang === "en" ? "No products in this campaign yet." : "Chưa có sản phẩm cho chiến dịch này."}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {topProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  lang={lang}
                  actions={actions}
                  badge={config.badge}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-5xl border border-blue-100 bg-blue-50 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">
                {lang === "en" ? "Collector tip" : "Gợi ý cho collector"}
              </div>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                {type === "limited"
                  ? lang === "en"
                    ? "Limited items can sell out quickly"
                    : "Hàng limited có thể hết rất nhanh"
                  : type === "coming-soon"
                    ? lang === "en"
                      ? "Save to wishlist to track arrivals"
                      : "Lưu wishlist để theo dõi hàng về"
                    : lang === "en"
                      ? "Compare price and stock before checkout"
                      : "So sánh giá và tồn kho trước khi chốt đơn"}
              </h2>
            </div>
            <a href="/wishlist" className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white">
              Wishlist
            </a>
          </div>
        </section>
      </main>
    </PageShell>
  );
}

export { campaignConfig, productName };
