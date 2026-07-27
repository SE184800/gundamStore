import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Eye, Heart, Minus, Plus, ShoppingCart, Star, X, Zap } from "lucide-react";
import { formatCurrency } from "../../utils/format";
import { resolveText, useI18n } from "../../i18n";
import { addProductToCart, forceCartBadgeSync, saveBuyNowDraft, validateCartStock } from "../../services/CartService";
import { addMyWishlistItem, hasAccountToken } from "../../services/AccountApiService";
import Toast from "../../utils/Toast";
import useToast from "../../hooks/useToast";
import { useCms } from "../../store/CmsStore";
function getImage(product) {
  return (
    product?.cardUrl ||
    product?.media?.card ||
    product?.media?.home ||
    product?.imageUrl ||
    product?.images?.[0] ||
    product?.detailUrl ||
    product?.media?.detailMain ||
    "/images/products/hi-nu.jpg"
  );
}

function getProductUrl(product) {
  return `/product/${product?.slug || product?.id || ""}`;
}

function hasCommercialDiscount(product = {}) {
  const finalPrice = Number(product.finalPrice || product.effectivePrice || product.price || 0);
  const compareAtPrice = Number(product.compareAtPrice || product.oldPrice || product.originalPrice || 0);

  return Boolean(product.activePromotion) ||
    Number(product.discountAmount || 0) > 0 ||
    (finalPrice > 0 && compareAtPrice > finalPrice);
}

function hasPreorderTag(product = {}) {
  const collections = Array.isArray(product.collections) ? product.collections : [];
  return collections.some((collection) => {
    const key = String(collection || "").toLowerCase();
    return key.includes("preorder") || key.includes("pre_order") || key === "order_items";
  });
}

function ProductCard({ product, lang: langProp, actions, badge, onAddToCart }) {
  const i18n = useI18n();
  const lang = langProp || i18n.lang;
  const t = i18n.t;
  const { state, action } = useCms();
  const [quickOpen, setQuickOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [wishlistSaving, setWishlistSaving] = useState(false);
  const [wishlistSaved, setWishlistSaved] = useState(false);
  const [wishlistMessage, setWishlistMessage] = useState("");
  const { toast: toastConfig, notify, dismiss } = useToast(2500);

  const name = resolveText(product?.name, lang, t("product.defaultName"));
  const short = resolveText(product?.short, lang, t("product.defaultShort"));
  const desc = resolveText(product?.description, lang, short);
  const image = getImage(product);
  const price = Number(product?.finalPrice || product?.effectivePrice || product?.price || 0);
  const hasVariants =
    Boolean(product?.hasVariants) &&
    Array.isArray(product?.variants) &&
    product.variants.length > 0;
  const priceMin = Number(product?.priceMin ?? price) || 0;
  const priceMax = Number(product?.priceMax ?? priceMin) || priceMin;
  const hasPriceRange = hasVariants && priceMax > priceMin;
  const displayPrice = hasPriceRange
    ? `${formatCurrency(priceMin)} - ${formatCurrency(priceMax)}`
    : formatCurrency(priceMin || price);
  const commercialDiscount = hasCommercialDiscount(product);
  const oldPrice = commercialDiscount
    ? Number(product?.compareAtPrice || product?.oldPrice || product?.originalPrice || 0)
    : Number(product?.oldPrice || product?.originalPrice || 0);
  const discountPercent =
    oldPrice > 0 && price > 0 && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : 0;
  const ratingValue = Number(product?.rating) || 0;
  const hasRating = ratingValue > 0;
  const soldCount = Number(product?.sold) || 0;
  const stock = Number(product?.stock ?? 0);
  const detailUrl = getProductUrl(product);
  const isPreorder = String(product?.status || "").toLowerCase().includes("pre") || hasPreorderTag(product);
  const isOutOfStock = !isPreorder && stock <= 0;
  const maxQty = isPreorder ? 99 : Math.max(1, stock);
  const outOfStockLabel = lang === "en" ? "Out of stock" : "Hết hàng";

  const wishlistCopy = {
    loginRequired: lang === "en" ? "Please sign in to save wishlist." : "Vui lòng đăng nhập để lưu yêu thích.",
    saved: lang === "en" ? "Saved to wishlist." : "Đã lưu vào yêu thích.",
    failed: lang === "en" ? "Unable to save wishlist." : "Không thể lưu yêu thích.",
    titleSaved: lang === "en" ? "Saved to wishlist" : "Đã lưu yêu thích",
    titleSave: lang === "en" ? "Save to wishlist" : "Lưu yêu thích",
  };

  function showCartError(result) {
    const available = Number(result?.available || 0);
    notify(
      "error",
      lang === "en"
        ? `Only ${available} item(s) available.`
        : `Sản phẩm này chỉ còn ${available} sản phẩm trong kho.`
    );
  }

  function addCart(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (hasVariants) {
      window.location.href = detailUrl;
      return false;
    }

    if (!state?.user) {
      notify("error", `Vui lòng đăng nhập để tiếp tục`);
      return false;
    }
    if (isOutOfStock) {
      notify("error", outOfStockLabel);
      return false;
    }
    const validation = validateCartStock(product, qty);
    if (!validation.ok) {
      showCartError(validation);
      return false;
    }

    if (onAddToCart) onAddToCart(product, qty);
    else addProductToCart(product, qty);

    forceCartBadgeSync();
    notify("success", `Đã thêm sản phẩm vào giỏ hàng thành công!`);
    actions?.track?.("add_to_cart", { productId: product?.id, qty });
    return true;
  }

  function buyNow(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (hasVariants) {
      window.location.href = detailUrl;
      return false;
    }

    if (!state?.user) {
      notify("error", `Vui lòng đăng nhập để tiếp tục`);
      return false;
    }
    if (isOutOfStock) {
      notify("error", outOfStockLabel);
      return;
    }

    if (isPreorder) {
      window.location.href = detailUrl;
      return;
    }

    const result = saveBuyNowDraft(product, qty, { shippingMethod: "FAST" });
    if (!result.ok) {
      showCartError(result);
      return;
    }

    forceCartBadgeSync();
    actions?.track?.("buy_now", { productId: product?.id, qty });
    window.location.href = "/checkout";
  }

  async function addWishlist(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    setWishlistMessage("");

    if (!hasAccountToken()) {
      setWishlistMessage(wishlistCopy.loginRequired);
      return;
    }

    try {
      setWishlistSaving(true);
      await addMyWishlistItem(product);
      setWishlistSaved(true);
      setWishlistMessage(wishlistCopy.saved);
      actions?.track?.("add_to_wishlist", { productId: product?.id });
    } catch (err) {
      setWishlistMessage(err?.message || wishlistCopy.failed);
    } finally {
      setWishlistSaving(false);
    }
  }

  return (
    <>
      <article className="product-card-mobile group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl sm:rounded-3xl">
        <a href={detailUrl} className="block">
          <div className="relative aspect-square overflow-hidden bg-slate-100">
            {badge && (
              <div className="absolute left-3 top-3 z-10 rounded-lg bg-blue-700 px-2.5 py-1 text-[11px] font-black text-white">
                {badge}
              </div>
            )}

            {commercialDiscount && (
              <div className={`absolute left-3 z-10 rounded-lg bg-red-600 px-2.5 py-1 text-[11px] font-black text-white ${badge ? "top-11" : "top-3"}`}>
                Sale
              </div>
            )}

            <button
              type="button"
              data-wishlist-card-button="true"
              onClick={addWishlist}
              disabled={wishlistSaving}
              title={wishlistSaved ? wishlistCopy.titleSaved : wishlistCopy.titleSave}
              className={`absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border bg-white/95 shadow-lg transition hover:scale-110 ${wishlistSaved ? "border-red-100 text-red-600" : "border-white/70 text-slate-500 hover:border-red-100 hover:text-red-600"} ${wishlistSaving ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <Heart size={18} fill={wishlistSaved ? "currentColor" : "none"} />
            </button>

            <img
              src={image}
              alt={name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
              loading="lazy"
              decoding="async"
            />
          </div>
        </a>

        <div className="p-3 sm:p-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <a href={detailUrl} className="block flex-1">
              <h3 className="line-clamp-2 min-h-[40px] text-sm font-black leading-snug text-slate-950 transition hover:text-blue-700 sm:min-h-[44px] sm:text-base">
                {name}
              </h3>
            </a>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setQuickOpen(true);
              }}
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-500 shadow-sm transition hover:scale-110 hover:border-blue-200 hover:bg-blue-700 hover:text-white"
              title={t("product.quickView")}
            >
              <Eye size={18} />
            </button>
          </div>

          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-500">{product?.scale || "1/144"}</span>
            <span className="font-black text-blue-700">
              {isOutOfStock ? outOfStockLabel : isPreorder ? t("product.preorder") : resolveText(product?.status || t("product.inStock"), lang)}
            </span>
          </div>

          <div className="mb-4 flex items-end justify-between gap-2">
            <div>
              {oldPrice ? (
                <div className="flex items-center gap-1.5">
                  <div className="text-xs font-bold text-slate-400 line-through">{formatCurrency(oldPrice)}</div>
                  {discountPercent > 0 && (
                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-black text-red-600">
                      -{discountPercent}%
                    </span>
                  )}
                </div>
              ) : null}
              <div className="text-base font-black text-slate-950 sm:text-lg">{displayPrice}</div>
              {soldCount > 0 && (
                <div className="mt-0.5 text-[11px] font-semibold text-slate-400">
                  {lang === "en" ? `${soldCount} sold` : `Đã bán ${soldCount}`}
                </div>
              )}
            </div>

            {hasRating && (
              <div className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-black text-amber-600">
                <Star size={13} fill="currentColor" />
                {ratingValue.toFixed(1)}
              </div>
            )}
          </div>

          {wishlistMessage && (
            <div data-wishlist-card-message="true" className={`mb-3 rounded-2xl px-3 py-2 text-xs font-black ${wishlistSaved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
              {wishlistMessage}
            </div>
          )}

          {isPreorder ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = detailUrl;
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-3 text-sm font-black text-white shadow-lg shadow-amber-100 transition hover:scale-[1.01]"
            >
              <Zap size={17} />
              {t("product.preorderNow")}
            </button>
          ) : (
            <button
              type="button"
              onClick={addCart}
              disabled={isOutOfStock}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-black text-white shadow-lg transition hover:scale-[1.01] ${isOutOfStock ? "cursor-not-allowed bg-slate-300 shadow-none" : "bg-blue-700 shadow-blue-100 hover:bg-blue-800"}`}
            >
              <ShoppingCart size={17} />
              {isOutOfStock
                ? outOfStockLabel
                : hasVariants
                  ? (lang === "en" ? "Select options" : "Chọn phân loại")
                  : t("product.addToCart")}
            </button>
          )}
        </div>
      </article>

      {quickOpen && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={() => setQuickOpen(false)}>
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-4xl bg-white p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setQuickOpen(false)}
              aria-label={lang === "en" ? "Close" : "Đóng"}
              className="absolute right-4 top-4 z-10 rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
            >
              <X size={18} />
            </button>
            <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
              <div className="overflow-hidden rounded-3xl bg-slate-100">
                <img src={product?.detailUrl || image} alt={name} className="h-full max-h-[520px] w-full object-cover" loading="lazy" decoding="async" />
              </div>
              <div className="flex flex-col p-2 md:p-4">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Quick view</div>
                <h2 className="mt-2 text-2xl font-black text-slate-950">{name}</h2>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">{desc}</p>
                <div className="mt-4 flex items-end gap-3">
                  <div className="text-3xl font-black text-blue-700">{displayPrice}</div>
                  {oldPrice ? <div className="text-sm font-bold text-slate-400 line-through">{formatCurrency(oldPrice)}</div> : null}
                </div>
                <div className="mt-5 flex items-center gap-3">
                  <button type="button" onClick={() => setQty((v) => Math.max(1, v - 1))} className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200"><Minus size={16} /></button>
                  <span className="min-w-[32px] text-center text-lg font-black">{qty}</span>
                  <button type="button" onClick={() => setQty((v) => Math.min(maxQty, v + 1))} className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200"><Plus size={16} /></button>
                </div>
                <div className="mt-auto grid gap-3 pt-6 sm:grid-cols-2">
                  <button type="button" onClick={addCart} disabled={isOutOfStock} className={`rounded-2xl px-4 py-3 font-black text-white ${isOutOfStock ? "bg-slate-300" : "bg-blue-700 hover:bg-blue-800"}`}>{isOutOfStock ? outOfStockLabel : t("product.addToCart")}</button>
                  <button type="button" onClick={buyNow} disabled={isOutOfStock} className={`rounded-2xl px-4 py-3 font-black text-white ${isOutOfStock ? "bg-slate-300" : "bg-slate-950 hover:bg-slate-800"}`}>{t("product.orderNow")}</button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      <Toast show={toastConfig.show} type={toastConfig.type} message={toastConfig.message} onClose={dismiss} />
    </>
  );
}

export default React.memo(ProductCard);
