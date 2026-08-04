import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Flame, Star, Store, Ticket } from "lucide-react";
import ProductCard from "./ProductCard";
import CountdownTimer from "../common/CountdownTimer";
import useShopStats from "../../hooks/useShopStats";
import { formatCurrency } from "../../utils/format";
import { getStorefrontActivePromotionsApi } from "../../services/StorefrontPromotionApiService";
import { getActiveStorefrontVouchersApi } from "../../services/StorefrontVoucherApiService";
import { mapBackendProductToStorefront } from "../../services/StorefrontProductApiService";

const copy = {
  vi: {
    shopName: "Gundam Store VN",
    productsOnSale: (count) => `${count} sản phẩm đang bán`,
    reviewsCount: (count) => `${count} đánh giá`,
    noReviews: "Chưa có đánh giá",
    flashSaleTitle: "Flash Sale",
    flashSaleEndsIn: "Kết thúc sau",
    voucherTitle: "Voucher khả dụng",
    voucherMinOrder: (amount) => `Đơn tối thiểu ${formatCurrency(amount)}`,
    voucherCopy: "Sao chép mã",
    voucherCopied: "Đã sao chép",
    categoryAll: "Tất cả danh mục",
  },
  en: {
    shopName: "Gundam Store VN",
    productsOnSale: (count) => `${count} products on sale`,
    reviewsCount: (count) => `${count} reviews`,
    noReviews: "No reviews yet",
    flashSaleTitle: "Flash Sale",
    flashSaleEndsIn: "Ends in",
    voucherTitle: "Available vouchers",
    voucherMinOrder: (amount) => `Min. order ${formatCurrency(amount)}`,
    voucherCopy: "Copy code",
    voucherCopied: "Copied",
    categoryAll: "All categories",
  },
};

function getVoucherValueLabel(voucher = {}, lang = "vi") {
  const type = String(voucher.type || "").toUpperCase();
  const value = Number(voucher.value || 0);

  if (type === "PERCENT") return `-${value}%`;
  if (type === "FREESHIP") return lang === "en" ? "Free shipping" : "Miễn phí ship";
  return `-${formatCurrency(value)}`;
}

export function ShopStatsBar({ lang = "vi" }) {
  const t = copy[lang];
  const { stats } = useShopStats();

  const totalActiveProducts = Number(stats?.totalActiveProducts || 0);
  const totalReviews = Number(stats?.totalReviews || 0);
  const averageRating = Number(stats?.averageRating || 0);

  return (
    <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white">
        <Store size={26} />
      </div>
      <div className="min-w-0">
        <div className="text-lg font-black text-slate-950">{t.shopName}</div>
        {/* key forces a fresh DOM subtree once stats load — the app's legacy
            auto-translate MutationObserver caches a text node's first-seen
            value and keeps re-applying it, so an in-place text update here
            (loading -> loaded) gets silently reverted without a fresh node. */}
        <div key={stats ? "loaded" : "loading"} className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-slate-500 sm:text-sm">
          {totalReviews > 0 ? (
            <span className="inline-flex items-center gap-1 text-amber-500">
              <Star size={15} className="fill-amber-400 text-amber-400" />
              <span className="text-slate-950">{averageRating.toFixed(1)}</span>
              <span className="text-slate-400">·</span>
              <span>{t.reviewsCount(totalReviews)}</span>
            </span>
          ) : (
            <span>{t.noReviews}</span>
          )}
          <span className="text-slate-300">|</span>
          <span>{t.productsOnSale(totalActiveProducts)}</span>
        </div>
      </div>
    </div>
  );
}

function FlashSaleProgress({ sold = 0, stock = 0, lang = "vi" }) {
  const soldCount = Number(sold) || 0;
  const stockCount = Number(stock) || 0;

  // Public storefront API doesn't always expose a real remaining-stock number
  // for flash-sale products — only show the sold/total progress bar when we
  // actually have one, otherwise fall back to the real sold count alone
  // instead of fabricating a denominator.
  if (!(stockCount > 0)) {
    if (soldCount <= 0) return null;
    return (
      <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-red-600">
        <Flame size={12} className="fill-red-500 text-red-500" />
        {lang === "en" ? `${soldCount} sold` : `Đã bán ${soldCount}`}
      </div>
    );
  }

  const total = stockCount + soldCount;
  const percent = Math.min(100, Math.max(soldCount > 0 ? 6 : 0, Math.round((soldCount / total) * 100)));

  return (
    <div className="mt-2">
      <div className="h-3.5 w-full overflow-hidden rounded-full bg-red-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-red-600 to-orange-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] font-bold text-slate-500">
        <span>{lang === "en" ? `${soldCount} sold` : `Đã bán ${soldCount}`}</span>
        <span>{lang === "en" ? `${total - soldCount} left` : `Còn ${total - soldCount}`}</span>
      </div>
    </div>
  );
}

export function FlashSaleSection({ lang = "vi", actions }) {
  const t = copy[lang];
  const [promotions, setPromotions] = useState([]);

  useEffect(() => {
    let alive = true;
    getStorefrontActivePromotionsApi()
      .then((rows) => {
        if (alive) setPromotions(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (alive) setPromotions([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const products = useMemo(() => {
    const seen = new Set();
    const merged = [];
    for (const promo of promotions) {
      for (const entry of promo.products || []) {
        const product = entry?.product || entry;
        if (!product?.id || seen.has(product.id)) continue;
        seen.add(product.id);
        merged.push(mapBackendProductToStorefront(product));
      }
    }
    return merged;
  }, [promotions]);

  const nearestEndDate = useMemo(() => {
    const endDates = promotions.map((p) => p.endDate).filter(Boolean).map((d) => new Date(d).getTime()).filter(Number.isFinite);
    return endDates.length ? new Date(Math.min(...endDates)).toISOString() : null;
  }, [promotions]);

  if (!products.length) return null;

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-red-200 shadow-sm shadow-red-100">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-red-600 to-orange-500 px-4 py-3 sm:px-5 sm:py-4">
        <div className="inline-flex items-center gap-2 text-white">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
            <Flame size={17} className="fill-white text-white" />
          </span>
          <span className="text-base font-black uppercase tracking-wide sm:text-lg">{t.flashSaleTitle}</span>
        </div>
        {nearestEndDate && (
          <div className="flex items-center gap-2 text-xs font-bold text-white sm:text-sm">
            <span className="text-white/90">{t.flashSaleEndsIn}</span>
            <CountdownTimer endDate={nearestEndDate} variant="light" />
          </div>
        )}
      </div>
      <div className="bg-gradient-to-b from-red-50/70 to-white p-4 sm:p-5">
        <div className="mobile-hide-scrollbar flex gap-3 overflow-x-auto pb-1">
          {products.slice(0, 12).map((product) => (
            <div key={product.id} className="w-40 shrink-0 sm:w-48">
              <ProductCard product={product} lang={lang} actions={actions} badge="SALE" />
              <FlashSaleProgress sold={product.sold} stock={product.stock} lang={lang} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function VoucherSection({ lang = "vi" }) {
  const t = copy[lang];
  const [vouchers, setVouchers] = useState([]);
  const [copiedCode, setCopiedCode] = useState("");

  useEffect(() => {
    let alive = true;
    getActiveStorefrontVouchersApi()
      .then((rows) => {
        if (alive) setVouchers(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (alive) setVouchers([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!vouchers.length) return null;

  function copyCode(code) {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code).catch(() => {});
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode((current) => (current === code ? "" : current)), 1500);
  }

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 inline-flex items-center gap-2 text-base font-black text-slate-950 sm:text-lg">
        <Ticket size={19} className="text-blue-600" />
        {t.voucherTitle}
      </div>
      <div className="mobile-hide-scrollbar flex gap-3 overflow-x-auto pb-1">
        {vouchers.map((voucher) => {
          const isCopied = copiedCode === voucher.code;
          return (
            <button
              key={voucher.code}
              type="button"
              onClick={() => copyCode(voucher.code)}
              className="flex w-60 shrink-0 items-center justify-between gap-3 rounded-xl border border-dashed border-blue-300 bg-blue-50 px-4 py-3 text-left hover:bg-blue-100"
            >
              <div className="min-w-0">
                <div className="text-sm font-black text-blue-700">{getVoucherValueLabel(voucher, lang)}</div>
                <div className="truncate text-xs font-bold text-slate-600">{voucher.nameVi}</div>
                {voucher.minOrder > 0 && (
                  <div className="mt-0.5 text-[11px] font-semibold text-slate-400">{t.voucherMinOrder(voucher.minOrder)}</div>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-center gap-1 rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-[11px] font-black text-blue-700">
                {isCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span className="whitespace-nowrap">{voucher.code}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CategoryTabsBar({ tree = [], activeId, onSelect, lang = "vi" }) {
  const t = copy[lang];

  if (!tree.length) return null;

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
      <div className="mobile-hide-scrollbar flex gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => onSelect("all")}
          className={`shrink-0 rounded-lg px-4 py-2.5 text-xs font-black sm:text-sm ${activeId === "all" ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-slate-50"}`}
        >
          {t.categoryAll}
        </button>
        {tree.map((node) => (
          <button
            key={node.id}
            type="button"
            onClick={() => onSelect(node.id)}
            className={`shrink-0 rounded-lg px-4 py-2.5 text-xs font-black sm:text-sm ${activeId === node.id ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-slate-50"}`}
          >
            {node.name}
          </button>
        ))}
      </div>
    </div>
  );
}
