import { useEffect, useMemo, useState } from "react";
import { Calendar, Check, Clock, Copy, Flame, ShoppingCart, Star, Store, Ticket } from "lucide-react";
import CountdownTimer from "../common/CountdownTimer";
import useShopStats from "../../hooks/useShopStats";
import { formatCurrency } from "../../utils/format";
import { getActiveFlashSalesApi } from "../../services/StorefrontFlashSaleApiService";
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
    flashSaleBuyNow: "Mua ngay",
    flashClosesIn: "Đóng sau",
    flashOpensIn: "Mở sau",
    flashApplyDate: "Áp dụng",
    flashApplyTime: "Giờ bán",
    flashOpensAt: (time) => `Mở bán lúc ${time}`,
    flashSoldProgress: (sold, limit) => `Đã bán ${sold}/${limit}`,
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
    flashSaleBuyNow: "Buy now",
    flashClosesIn: "Closes in",
    flashOpensIn: "Opens in",
    flashApplyDate: "Valid",
    flashApplyTime: "Hours",
    flashOpensAt: (time) => `Opens at ${time}`,
    flashSoldProgress: (sold, limit) => `${sold}/${limit} sold`,
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

// Live Flash Sale (FlashSaleCampaign/FlashSaleItem) — driven by
// GET /api/flash-sales/active, with real per-campaign daily time windows
// and LIVE/UPCOMING states computed by the backend in Asia/Ho_Chi_Minh time.
function LiveFlashSaleCard({ item, campaign, lang = "vi", actions }) {
  const i18n = useI18n();
  const t = copy[lang];
  const { toast: toastConfig, notify, dismiss } = useToast(2200);

  const product = useMemo(() => mapBackendProductToStorefront(item.product || {}), [item.product]);
  const name = resolveText(product?.name, lang, i18n.t("product.defaultName"));
  const detailUrl = `/product/${product?.slug || product?.id || ""}`;
  const image = product?.cardUrl || product?.imageUrl || product?.images?.[0] || "/images/products/hi-nu.jpg";
  const price = Number(item.flashPrice) || 0;
  const oldPrice = Number(product?.price || product?.compareAtPrice || 0);
  const discountPercent = oldPrice > price && price > 0 ? Math.round((1 - price / oldPrice) * 100) : 0;
  const isLive = campaign.status === "LIVE";
  const dailyStockLimit = item.dailyStockLimit == null ? null : Number(item.dailyStockLimit);
  const soldToday = Number(item.soldToday) || 0;
  const soldPercent = dailyStockLimit > 0 ? Math.min(100, Math.round((soldToday / dailyStockLimit) * 100)) : 0;
  const isSoldOut = dailyStockLimit > 0 && soldToday >= dailyStockLimit;

  function buyNow(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (!isLive || isSoldOut) return;

    const cartProduct = { ...product, price, finalPrice: price, flashSaleItemId: item.id };
    const validation = validateCartStock(cartProduct, 1);
    if (!validation.ok) {
      notify("error", lang === "en" ? "Not enough stock available." : "Số lượng vượt quá tồn kho hiện có.");
      return;
    }
    addProductToCart(cartProduct, 1);
    forceCartBadgeSync();
    notify("success", lang === "en" ? "Added to cart!" : "Đã thêm vào giỏ hàng!");
    actions?.track?.("add_to_cart", { productId: product?.id, qty: 1, source: "flash_sale_live", flashSaleItemId: item.id });
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
            {!isLive && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/40">
                <div className="flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-black text-slate-800">
                  <Clock size={12} />
                  {t.flashOpensAt(campaign.dailyStartTime)}
                </div>
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

          {dailyStockLimit > 0 ? (
            <div className="mt-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-red-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-600 transition-all"
                  style={{ width: `${soldPercent}%` }}
                />
              </div>
              <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-red-500">
                <Flame size={10} className="fill-red-500 text-red-500" />
                {t.flashSoldProgress(soldToday, dailyStockLimit)}
              </div>
            </div>
          ) : (
            <div className="mt-2 flex-1" />
          )}

          <div className="mt-auto pt-2.5">
            {isLive ? (
              <button
                type="button"
                onClick={buyNow}
                disabled={isSoldOut}
                className={`flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-black text-white transition ${
                  isSoldOut
                    ? "cursor-not-allowed bg-slate-300"
                    : "bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600"
                }`}
              >
                <ShoppingCart size={14} />
                {isSoldOut ? (lang === "en" ? "Sold out" : "Hết lượt hôm nay") : t.flashSaleBuyNow}
              </button>
            ) : (
              <div className="flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-2 py-2 text-xs font-black text-slate-500">
                <Clock size={14} />
                {t.flashOpensAt(campaign.dailyStartTime)}
              </div>
            )}
          </div>
        </div>
      </article>

      <Toast show={toastConfig.show} type={toastConfig.type} message={toastConfig.message} onClose={dismiss} />
    </>
  );
}

// Vietnamese e-commerce disputes over flash sale pricing usually hinge on
// "was the applicable window actually shown" — so the exact date range and
// daily time window is spelled out here rather than left implicit in the
// countdown alone.
function formatFlashSaleDate(value, lang = "vi") {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(lang === "en" ? "en-GB" : "vi-VN");
}

function formatFlashSaleWindow(campaign = {}, lang = "vi") {
  const dateFrom = formatFlashSaleDate(campaign.dateFrom, lang);
  const dateTo = formatFlashSaleDate(campaign.dateTo, lang);
  const dateRange = dateFrom && dateTo
    ? dateFrom === dateTo ? dateFrom : `${dateFrom} - ${dateTo}`
    : dateFrom || dateTo;
  const timeRange = campaign.dailyStartTime && campaign.dailyEndTime
    ? `${campaign.dailyStartTime} - ${campaign.dailyEndTime}`
    : "";

  return { dateRange, timeRange };
}

function sortFlashSaleCampaigns(list = []) {
  return [...list].sort((a, b) => String(a.dailyStartTime || "").localeCompare(String(b.dailyStartTime || "")));
}

// Shopee-style time-slot tabs: one tab per campaign/session (labeled by its
// daily start time), switchable without leaving the section. Selecting a
// campaign only swaps which items + countdown render below — it never
// refetches.
export function LiveFlashSaleSection({ lang = "vi", actions }) {
  const t = copy[lang];
  const [campaigns, setCampaigns] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeCampaignId, setActiveCampaignId] = useState("");

  useEffect(() => {
    let alive = true;
    let pollTimer = null;
    let edgeTimer = null;

    async function load() {
      try {
        const rows = await getActiveFlashSalesApi();
        if (!alive) return;
        const list = sortFlashSaleCampaigns(
          (Array.isArray(rows) ? rows : []).filter((row) => (row.items || []).length > 0)
        );
        setCampaigns(list);
        setActiveCampaignId((current) => {
          if (current && list.some((row) => row.id === current)) return current;
          const live = list.find((row) => row.status === "LIVE");
          return (live || list[0])?.id || "";
        });

        clearTimeout(edgeTimer);
        const targets = list
          .map((row) => new Date(row.countdownTarget).getTime())
          .filter((value) => Number.isFinite(value));

        if (targets.length) {
          // Refetch right as the nearest campaign's countdown hits zero so
          // UPCOMING flips to LIVE (or a LIVE campaign disappears) without
          // waiting for the next poll tick.
          const delay = Math.min(...targets) - Date.now() + 1000;
          if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
            edgeTimer = setTimeout(() => {
              void load();
            }, delay);
          }
        }
      } catch {
        if (alive) setCampaigns([]);
      } finally {
        if (alive) setLoaded(true);
      }
    }

    void load();
    pollTimer = setInterval(() => void load(), 20000);

    return () => {
      alive = false;
      clearInterval(pollTimer);
      clearTimeout(edgeTimer);
    };
  }, []);

  if (!loaded || !campaigns.length) return null;

  const activeCampaign = campaigns.find((row) => row.id === activeCampaignId) || campaigns[0];
  const isLive = activeCampaign.status === "LIVE";

  return (
    <div
      className={`mt-4 overflow-hidden rounded-2xl border shadow-lg ${
        isLive ? "border-red-200 shadow-red-100/50" : "border-amber-200 shadow-amber-100/50"
      }`}
    >
      <div
        className={`relative flex flex-wrap items-center justify-between gap-3 overflow-hidden px-4 py-4 sm:px-6 sm:py-5 ${
          isLive
            ? "bg-gradient-to-r from-red-600 via-red-600 to-orange-500"
            : "bg-gradient-to-r from-amber-500 via-amber-500 to-orange-400"
        }`}
      >
        <div className="pointer-events-none absolute -right-6 -top-10 h-32 w-32 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-10 left-1/3 h-24 w-24 rounded-full bg-white/10" />

        <div className="relative inline-flex items-center gap-2.5 text-white">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
            {isLive ? <Flame size={20} className="fill-white text-white" /> : <Clock size={20} />}
          </span>
          <div>
            <div className="text-lg font-black uppercase leading-tight tracking-wide sm:text-xl">
              {t.flashSaleTitle}
            </div>
            <div className="text-[11px] font-bold text-white/80 sm:text-xs">
              {activeCampaign.nameVi || activeCampaign.nameEn}
            </div>
            {(() => {
              const { dateRange, timeRange } = formatFlashSaleWindow(activeCampaign, lang);
              if (!dateRange && !timeRange) return null;
              return (
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] font-semibold text-white/85 sm:text-[11px]">
                  {dateRange && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={11} />
                      {t.flashApplyDate}: {dateRange}
                    </span>
                  )}
                  {timeRange && (
                    <span className="inline-flex items-center gap-1">
                      <Clock size={11} />
                      {t.flashApplyTime}: {timeRange}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {activeCampaign.countdownTarget && (
          <div className="relative flex items-center gap-2 text-xs font-bold text-white sm:text-sm">
            <span className="text-white/90">{isLive ? t.flashClosesIn : t.flashOpensIn}</span>
            <CountdownTimer endDate={activeCampaign.countdownTarget} variant="light" />
          </div>
        )}
      </div>

      {campaigns.length > 1 && (
        <div className="mobile-hide-scrollbar flex gap-2 overflow-x-auto border-b border-slate-100 bg-white px-3 py-2.5 sm:px-4">
          {campaigns.map((campaign) => {
            const tabLive = campaign.status === "LIVE";
            const selected = campaign.id === activeCampaign.id;
            const { dateRange, timeRange } = formatFlashSaleWindow(campaign, lang);

            return (
              <button
                key={campaign.id}
                type="button"
                onClick={() => setActiveCampaignId(campaign.id)}
                title={[dateRange, timeRange].filter(Boolean).join(" · ")}
                className={`flex shrink-0 flex-col items-center gap-0.5 rounded-xl px-3.5 py-2 text-center transition ${
                  selected
                    ? tabLive
                      ? "bg-red-600 text-white shadow-sm"
                      : "bg-amber-500 text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="flex items-center gap-1.5 text-sm font-black tabular-nums">
                  {tabLive ? (
                    <Flame size={13} className={selected ? "text-white" : "text-red-500"} />
                  ) : (
                    <Clock size={13} className={selected ? "text-white" : "text-amber-500"} />
                  )}
                  {timeRange || campaign.dailyStartTime}
                </span>
                {dateRange && (
                  <span className={`text-[10px] font-bold tabular-nums ${selected ? "text-white/80" : "text-slate-400"}`}>
                    {dateRange}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className={`p-4 sm:p-5 ${isLive ? "bg-gradient-to-b from-red-50/70 to-white" : "bg-gradient-to-b from-amber-50/70 to-white"}`}>
        <div className="no-scrollbar flex snap-x scroll-px-1 gap-3 overflow-x-auto pb-1">
          {(activeCampaign.items || []).slice(0, 12).map((item) => (
            <div key={item.id} className="shrink-0 snap-start">
              <LiveFlashSaleCard item={item} campaign={activeCampaign} lang={lang} actions={actions} />
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
