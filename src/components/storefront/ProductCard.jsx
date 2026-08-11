import React, { useState } from "react";
import { Flame, Heart, ShoppingCart, Star } from "lucide-react";
import { formatCurrency, isMeaningfulScale } from "../../utils/format";
import { resolveText, useI18n } from "../../i18n";
import { addProductToCart, forceCartBadgeSync, validateCartStock } from "../../services/CartService";
import { addMyWishlistItem, hasAccountToken } from "../../services/AccountApiService";
import Toast from "../../utils/Toast";
import useToast from "../../hooks/useToast";
import { getProductAvailability, getProductPreorderInfo } from "../../utils/productAvailability";
import { isFlashSaleActive } from "../../utils/flashSale";
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

function ProductCard({ product, lang: langProp, actions, badge, onAddToCart }) {
  const i18n = useI18n();
  const lang = langProp || i18n.lang;
  const t = i18n.t;
  const qty = 1;
  const [wishlistSaving, setWishlistSaving] = useState(false);
  const [wishlistSaved, setWishlistSaved] = useState(false);
  const [wishlistMessage, setWishlistMessage] = useState("");
  const { toast: toastConfig, notify, dismiss } = useToast(2500);

  const name = resolveText(product?.name, lang, t("product.defaultName"));
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
  const flashSaleActive = isFlashSaleActive(product);
  const commercialDiscount = hasCommercialDiscount(product);
  const oldPrice = commercialDiscount
    ? Number(product?.compareAtPrice || product?.oldPrice || product?.originalPrice || 0)
    : Number(product?.oldPrice || product?.originalPrice || 0);
  const discountPercent =
    oldPrice > 0 && price > 0 && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : 0;
  const ratingValue = Number(product?.rating) || 0;
  const hasRating = ratingValue > 0;
  const soldCount = Number(product?.sold) || 0;
  const detailUrl = getProductUrl(product);
  const isPreorder = getProductPreorderInfo(product).canOrder;
  const isOutOfStock = !getProductAvailability(product).canAddToCart;
  const outOfStockLabel = lang === "en" ? "Out of stock" : "Hết hàng";

  const wishlistCopy = {
    loginRequired: lang === "en" ? "Please sign in to save wishlist." : "Vui lòng đăng nhập để lưu yêu thích.",
    saved: lang === "en" ? "Saved to wishlist." : "Đã lưu vào yêu thích.",
    failed: lang === "en" ? "Unable to save wishlist." : "Không thể lưu yêu thích.",
    titleSaved: lang === "en" ? "Saved to wishlist" : "Đã lưu yêu thích",
    titleSave: lang === "en" ? "Save to wishlist" : "Lưu yêu thích",
  };

  function showCartError() {
    notify(
      "error",
      lang === "en"
        ? "Not enough stock available for this quantity."
        : "Số lượng bạn chọn vượt quá tồn kho hiện có."
    );
  }

  function addCart(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (hasVariants) {
      window.location.href = detailUrl;
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
    notify(
      "success",
      lang === "en" ? "Added to cart successfully!" : "Đã thêm sản phẩm vào giỏ hàng thành công!"
    );
    actions?.track?.("add_to_cart", { productId: product?.id, qty });
    return true;
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
      <article className="product-card-mobile group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200">
        <a href={detailUrl} className="block">
          <div className="relative aspect-square overflow-hidden bg-slate-100">
            {badge && (
              <div className="absolute left-3 top-3 z-10 rounded-lg bg-blue-700 px-2.5 py-1 text-[11px] font-black text-white">
                {badge}
              </div>
            )}

            {flashSaleActive ? (
              <div className={`absolute left-3 z-10 inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-red-600 to-orange-500 px-2.5 py-1 text-[11px] font-black text-white shadow-sm ${badge ? "top-11" : "top-3"}`}>
                <Flame size={12} className="fill-white text-white" />
                FLASH SALE
                {discountPercent > 0 && <span className="opacity-90">-{discountPercent}%</span>}
              </div>
            ) : commercialDiscount && (
              <div className={`absolute left-3 z-10 rounded-lg bg-red-600 px-2.5 py-1 text-[11px] font-black text-white ${badge ? "top-11" : "top-3"}`}>
                {discountPercent > 0 ? `-${discountPercent}%` : lang === "en" ? "Sale" : "Sale"}
              </div>
            )}

            <button
              type="button"
              data-wishlist-card-button="true"
              onClick={addWishlist}
              disabled={wishlistSaving}
              title={wishlistSaved ? wishlistCopy.titleSaved : wishlistCopy.titleSave}
              aria-label={wishlistSaved ? wishlistCopy.titleSaved : wishlistCopy.titleSave}
              className={`absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border bg-white/95 shadow-sm transition ${wishlistSaved ? "border-red-100 text-red-600" : "border-white/70 text-slate-500 hover:border-red-100 hover:text-red-600"} ${wishlistSaving ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <Heart size={18} fill={wishlistSaved ? "currentColor" : "none"} />
            </button>

            <img
              src={image}
              alt={name}
              className="h-full w-full object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>
        </a>

        <div className="flex flex-1 flex-col p-3 sm:p-4">
          <div className="mb-2">
            <a href={detailUrl} className="block text-left">
              <h3
                title={name}
                className="line-clamp-2 min-h-[40px] text-left text-sm font-black leading-snug text-slate-950 transition hover:text-blue-700 sm:min-h-[44px] sm:text-base sm:line-clamp-3"
              >
                {name}
              </h3>
            </a>
          </div>

          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-500">{isMeaningfulScale(product?.scale) ? product.scale : "1/144"}</span>
            <span className="font-black text-blue-700">
              {isOutOfStock ? outOfStockLabel : isPreorder ? t("product.preorder") : t("product.inStock")}
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
              <div className="text-base font-black text-red-600 sm:text-lg">{displayPrice}</div>
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

          <div className="mt-auto">
          {wishlistMessage && (
            <div data-wishlist-card-message="true" className={`mb-3 rounded-lg px-3 py-2 text-xs font-black ${wishlistSaved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-3 py-3 text-sm font-black text-white transition hover:bg-blue-950"
            >
              {t("product.preorderNow")}
            </button>
          ) : (
            <button
              type="button"
              onClick={addCart}
              disabled={isOutOfStock}
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-black text-white transition ${isOutOfStock ? "cursor-not-allowed bg-slate-300" : "bg-blue-700 hover:bg-blue-800"}`}
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
        </div>
      </article>

      <Toast show={toastConfig.show} type={toastConfig.type} message={toastConfig.message} onClose={dismiss} />
    </>
  );
}

export default React.memo(ProductCard);
