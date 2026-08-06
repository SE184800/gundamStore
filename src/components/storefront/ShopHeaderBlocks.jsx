import { useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, Copy, Flame, ShoppingCart, Star, Store, Ticket } from "lucide-react";
import CountdownTimer from "../common/CountdownTimer";
import useShopStats from "../../hooks/useShopStats";
import { formatCurrency } from "../../utils/format";
import { getStorefrontActivePromotionsApi } from "../../services/StorefrontPromotionApiService";
import { getActiveStorefrontVouchersApi } from "../../services/StorefrontVoucherApiService";
import { mapBackendProductToStorefront } from "../../services/StorefrontProductApiService";
import { addProductToCart, forceCartBadgeSync, validateCartStock } from "../../services/CartService";
import { getProductAvailability, getProductPreorderInfo } from "../../utils/productAvailability";
import { resolveText, useI18n } from "../../i18n";
import Toast from "../../utils/Toast";
import useToast from "../../hooks/useToast";

const copy = {
  vi: {
    shopName: "Gundam Store VN",
    productsOnSale: (count) => `${count} sản phẩm đang bán`,
    reviewsCount: (count) => `${count} đánh giá`,
    noReviews: "Chưa có đánh giá",
    flashSaleTitle: "Flash Sale",
    flashSaleSubtitle: "Giá sốc mỗi ngày - số lượng có hạn",
    flashSaleEndsIn: "Kết thúc sau",
    flashSaleViewAll: "Xem tất cả ưu đãi",
    flashSaleBuyNow: "Mua ngay",
    flashSaleOptions: "Chọn mua",
    flashSaleJustLaunched: "Vừa mở bán",
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
    flashSaleSubtitle: "Unbeatable prices - limited quantities",
    flashSaleEndsIn: "Ends in",
    flashSaleViewAll: "View all deals",
    flashSaleBuyNow: "Buy now",
    flashSaleOptions: "Options",
    flashSaleJustLaunched: "Just launched",
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

function getFlashSaleUrgencyPercent(sold = 0) {
  const soldCount = Number(sold) || 0;
  if (soldCount <= 0) return 0;
  // The public API intentionally never exposes real remaining stock (avoids
  // leaking inventory data), so this fill is a decorative urgency cue derived
  // only from the public sold count — it never claims an exact stock ratio.
  return Math.min(94, Math.round(22 + Math.log2(soldCount + 1) * 11));
}

function FlashSaleCard({ product, lang = "vi", actions }) {
  const i18n = useI18n();
  const t = copy[lang];
  const { toast: toastConfig, notify, dismiss } = useToast(2200);

  const name = resolveText(product?.name, lang, i18n.t("product.defaultName"));
  const detailUrl = `/product/${product?.slug || product?.id || ""}`;
  const image = product?.cardUrl || product?.imageUrl || product?.images?.[0] || "/images/products/hi-nu.jpg";
  const price = Number(product?.finalPrice || product?.price || 0);
  const oldPrice = Number(product?.compareAtPrice || product?.oldPrice || 0);
  const discountPercent = oldPrice > price && price > 0 ? Math.round((1 - price / oldPrice) * 100) : 0;
  const soldCount = Number(product?.sold) || 0;
  const urgencyPercent = getFlashSaleUrgencyPercent(soldCount);
  const hasVariants = Boolean(product?.hasVariants) && Array.isArray(product?.variants) && product.variants.length > 0;
  const isPreorder = getProductPreorderInfo(product).canOrder;
  const isOutOfStock = !getProductAvailability(product).canAddToCart;
  const outOfStockLabel = lang === "en" ? "Out of stock" : "Hết hàng";

  function buyNow(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (hasVariants || isPreorder) {
      window.location.href = detailUrl;
      return;
    }
    if (isOutOfStock) {
      notify("error", outOfStockLabel);
      return;
    }
    const validation = validateCartStock(product, 1);
    if (!validation.ok) {
      notify("error", lang === "en" ? "Not enough stock available." : "Số lượng vượt quá tồn kho hiện có.");
      return;
    }
    addProductToCart(product, 1);
    forceCartBadgeSync();
    notify("success", lang === "en" ? "Added to cart!" : "Đã thêm vào giỏ hàng!");
    actions?.track?.("add_to_cart", { productId: product?.id, qty: 1, source: "flash_sale" });
  }

  return (
    <>
      <article className="group flex h-full w-40 shrink-0 flex-col overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm shadow-red-100/40 transition hover:-translate-y-0.5 hover:shadow-md sm:w-52">
        <a href={detailUrl} className="block">
          <div className="relative aspect-square overflow-hidden bg-slate-50">
            {discountPercent > 0 && (
              <div className="absolute left-0 top-2 z-10 rounded-r-full bg-gradient-to-r from-red-600 to-orange-500 py-1 pl-2.5 pr-3 text-[11px] font-black text-white shadow-sm">
                -{discountPercent}%
              </div>
            )}
            <img
              src={image}
              alt={name}
              className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
          </div>
        </a>

        <div className="flex flex-1 flex-col p-2.5 sm:p-3">
          <a href={detailUrl} className="block">
            <h3
              title={name}
              className="line-clamp-2 min-h-[32px] text-left text-xs font-bold leading-snug text-slate-950 transition group-hover:text-red-700 sm:min-h-[36px] sm:text-sm"
            >
              {name}
            </h3>
          </a>

          <div className="mt-1.5">
            {oldPrice > price && (
              <div className="text-[11px] font-semibold text-slate-400 line-through">{formatCurrency(oldPrice)}</div>
            )}
            <div className="text-sm font-black text-red-600 sm:text-base">{formatCurrency(price)}</div>
          </div>

          {urgencyPercent > 0 ? (
            <div className="mt-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-red-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-600 transition-all"
                  style={{ width: `${urgencyPercent}%` }}
                />
              </div>
              <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-red-500">
                <Flame size={10} className="fill-red-500 text-red-500" />
                {lang === "en" ? `${soldCount} sold` : `Đã bán ${soldCount}`}
              </div>
            </div>
          ) : (
            <div className="mt-2 text-[10px] font-bold text-slate-400">{t.flashSaleJustLaunched}</div>
          )}

          <div className="mt-auto pt-2.5">
            <button
              type="button"
              onClick={buyNow}
              disabled={isOutOfStock}
              className={`flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-black text-white transition ${
                isOutOfStock
                  ? "cursor-not-allowed bg-slate-300"
                  : isPreorder
                    ? "bg-blue-900 hover:bg-blue-950"
                    : "bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600"
              }`}
            >
              <ShoppingCart size={14} />
              {isOutOfStock
                ? outOfStockLabel
                : isPreorder
                  ? (lang === "en" ? "Pre-order" : "Đặt trước")
                  : hasVariants
                    ? t.flashSaleOptions
                    : t.flashSaleBuyNow}
            </button>
          </div>
        </div>
      </article>

      <Toast show={toastConfig.show} type={toastConfig.type} message={toastConfig.message} onClose={dismiss} />
    </>
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
      const type = String(promo.type || "PERCENT").toUpperCase();
      const value = Number(promo.value || 0);
      for (const entry of promo.products || []) {
        const rawProduct = entry?.product || entry;
        if (!rawProduct?.id || seen.has(rawProduct.id)) continue;
        seen.add(rawProduct.id);

        const mapped = mapBackendProductToStorefront(rawProduct);
        const sellingPrice = Number(mapped.price || 0);
        // The public promotions API doesn't return a pre-computed discounted
        // price per product, only the campaign's type/value — so the final
        // price is derived here with the same formula the admin preview uses.
        const discount =
          type === "PERCENT"
            ? Math.round((sellingPrice * Math.min(Math.max(value, 0), 100)) / 100)
            : Math.min(Math.max(value, 0), sellingPrice);
        const finalPrice = Math.max(0, sellingPrice - discount);

        merged.push({ ...mapped, price: finalPrice, finalPrice, oldPrice: sellingPrice, compareAtPrice: sellingPrice });
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
    <div className="mt-4 overflow-hidden rounded-2xl border border-red-200 shadow-lg shadow-red-100/50">
      <div className="relative flex flex-wrap items-center justify-between gap-3 overflow-hidden bg-gradient-to-r from-red-600 via-red-600 to-orange-500 px-4 py-4 sm:px-6 sm:py-5">
        <div className="pointer-events-none absolute -right-6 -top-10 h-32 w-32 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-10 left-1/3 h-24 w-24 rounded-full bg-white/10" />

        <div className="relative inline-flex items-center gap-2.5 text-white">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <Flame size={20} className="fill-white text-white" />
          </span>
          <div>
            <div className="text-lg font-black uppercase leading-tight tracking-wide sm:text-xl">{t.flashSaleTitle}</div>
            <div className="text-[11px] font-bold text-white/80 sm:text-xs">{t.flashSaleSubtitle}</div>
          </div>
        </div>

        {nearestEndDate && (
          <div className="relative flex items-center gap-2 text-xs font-bold text-white sm:text-sm">
            <span className="text-white/90">{t.flashSaleEndsIn}</span>
            <CountdownTimer endDate={nearestEndDate} variant="light" />
          </div>
        )}
      </div>

      <div className="bg-gradient-to-b from-red-50/70 to-white p-4 sm:p-5">
        <div className="no-scrollbar flex snap-x scroll-px-1 gap-3 overflow-x-auto pb-1">
          {products.slice(0, 12).map((product) => (
            <div key={product.id} className="shrink-0 snap-start">
              <FlashSaleCard product={product} lang={lang} actions={actions} />
            </div>
          ))}
        </div>

        <a
          href="/promotions"
          className="mt-4 flex items-center justify-center gap-1 text-xs font-black text-red-600 transition hover:text-red-700"
        >
          {t.flashSaleViewAll}
          <ChevronRight size={14} />
        </a>
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
                <div className="text-sm font-black text-red-600">{getVoucherValueLabel(voucher, lang)}</div>
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
