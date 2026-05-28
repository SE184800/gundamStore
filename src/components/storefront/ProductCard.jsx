import { useState } from "react";
import { createPortal } from "react-dom";
import { Eye, Heart, Minus, Plus, ShoppingCart, Star, X, Zap } from "lucide-react";
import { formatCurrency } from "../../utils/format";
import { resolveText, useI18n } from "../../i18n";
import { addProductToCart, forceCartBadgeSync } from "../../services/CartService";
import { addMyWishlistItem, hasAccountToken } from "../../services/AccountApiService";

function getImage(product) {
  return (
    product?.media?.card ||
    product?.media?.home ||
    product?.media?.detailMain ||
    product?.imageUrl ||
    product?.images?.[0] ||
    "/images/products/hi-nu.jpg"
  );
}

function getProductUrl(product) {
  return `/product/${product?.slug || product?.id || ""}`;
}

export default function ProductCard({ product, lang: langProp, actions, badge, onAddToCart }) {
  const i18n = useI18n();
  const lang = langProp || i18n.lang;
  const t = i18n.t;

  const [quickOpen, setQuickOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [wishlistSaving, setWishlistSaving] = useState(false);
  const [wishlistSaved, setWishlistSaved] = useState(false);
  const [wishlistMessage, setWishlistMessage] = useState("");

  const name = resolveText(product?.name, lang, t("product.defaultName"));
  const short = resolveText(product?.short, lang, t("product.defaultShort"));
  const desc = resolveText(product?.description, lang, short);
  const image = getImage(product);
  const price = product?.price || 0;
  const oldPrice = product?.oldPrice || product?.originalPrice;
  const stock = product?.stock ?? 0;
  const detailUrl = getProductUrl(product);
  const isPreorder = String(product?.status || "").toLowerCase().includes("pre");

  function addCart(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (onAddToCart) {
      onAddToCart(product, qty);
    } else {
      addProductToCart(product, qty);
    }

    forceCartBadgeSync();

    actions?.track?.("add_to_cart", { productId: product?.id, qty });
  }

  function buyNow(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    addCart(e);
    window.location.href = isPreorder ? detailUrl : "/checkout";
  }

  async function addWishlist(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    setWishlistMessage("");

    if (!hasAccountToken()) {
      setWishlistMessage("Vui lòng đăng nhập để lưu yêu thích.");
      return;
    }

    try {
      setWishlistSaving(true);
      await addMyWishlistItem(product);
      setWishlistSaved(true);
      setWishlistMessage("Đã lưu vào yêu thích.");
      actions?.track?.("add_to_wishlist", { productId: product?.id });
    } catch (err) {
      setWishlistMessage(err?.message || "Không thể lưu yêu thích.");
    } finally {
      setWishlistSaving(false);
    }
  }

  return (
    <>
      <article className="group overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl sm:rounded-[24px]">
        <a href={detailUrl} className="block">
          <div className="relative aspect-square overflow-hidden bg-slate-100">
            {badge && (
              <div className="absolute left-3 top-3 z-10 rounded-lg bg-blue-700 px-2.5 py-1 text-[11px] font-black text-white">
                {badge}
              </div>
            )}

            <button
              type="button"
              data-wishlist-card-button="true"
              onClick={addWishlist}
              disabled={wishlistSaving}
              title={wishlistSaved ? "Đã lưu yêu thích" : "Lưu yêu thích"}
              className={`absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border bg-white/90 shadow-lg backdrop-blur transition hover:scale-110 ${
                wishlistSaved
                  ? "border-red-100 text-red-600"
                  : "border-white/70 text-slate-500 hover:border-red-100 hover:text-red-600"
              } ${wishlistSaving ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <Heart size={18} fill={wishlistSaved ? "currentColor" : "none"} />
            </button>

            <img
              src={image}
              alt={name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
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
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-500 shadow-sm transition hover:scale-110 hover:border-blue-200 hover:bg-blue-700 hover:text-white"
              title={t("product.quickView")}
            >
              <Eye size={18} />
            </button>
          </div>

          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-500">{product?.scale || "1/144"}</span>
            <span className="font-black text-blue-700">{isPreorder ? t("product.preorder") : resolveText(product?.status || t("product.inStock"), lang)}</span>
          </div>

          <div className="mb-4 flex items-end justify-between">
            <div>
              {oldPrice ? (
                <div className="text-xs font-bold text-slate-400 line-through">
                  {formatCurrency(oldPrice)}
                </div>
              ) : null}
              <div className="text-base font-black text-slate-950 sm:text-lg">
                {formatCurrency(price)}
              </div>
            </div>

            <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-black text-amber-600">
              <Star size={13} fill="currentColor" />
              {product?.rating || "4.9"}
            </div>
          </div>

          {wishlistMessage && (
            <div
              data-wishlist-card-message="true"
              className={`mb-3 rounded-2xl px-3 py-2 text-xs font-black ${
                wishlistSaved
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
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
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-4 py-3 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-red-200 transition hover:-translate-y-0.5 hover:brightness-110"
            >
              <Zap size={16} />
              {t("product.preorder")}
            </button>
          ) : (
            <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
              <button
                type="button"
                data-cart-managed="true"
                onClick={addCart}
                className="flex min-h-11 items-center justify-center gap-1 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-black text-blue-700 transition hover:bg-blue-700 hover:text-white"
              >
                <ShoppingCart size={15} />
                {t("product.addCart")}
              </button>

              <button
                type="button"
                data-cart-managed="true"
                onClick={buyNow}
                className="flex min-h-11 items-center justify-center gap-1 rounded-2xl bg-blue-700 px-3 py-2.5 text-xs font-black text-white shadow-lg shadow-blue-100 transition hover:bg-blue-800"
              >
                <Zap size={15} />
                {t("product.buyNow")}
              </button>
            </div>
          )}
        </div>
      </article>

      {quickOpen &&
        createPortal(
          <div className="fixed inset-0 z-[999999] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-md sm:items-start sm:p-4 sm:pt-6">
            <div className="relative grid max-h-[92vh] w-full max-w-[920px] overflow-hidden rounded-t-[28px] bg-white shadow-[0_50px_160px_rgba(0,0,0,0.35)] sm:rounded-[28px] lg:grid-cols-[0.9fr_1.1fr]">
              <button
                onClick={() => setQuickOpen(false)}
                className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-slate-900/80 text-white shadow-lg transition hover:bg-red-600"
              >
                <X size={20} />
              </button>

              <div className="flex items-center justify-center bg-slate-50 p-6">
                <div className="w-full">
                  <img
                    src={image}
                    alt={name}
                    className="max-h-[34vh] w-full rounded-2xl object-contain sm:max-h-[54vh]"
                  />
                </div>
              </div>

              <div className="overflow-y-auto p-5 lg:p-7">
                <h2 className="pr-10 text-2xl font-black leading-tight text-slate-950">
                  {name}
                </h2>

                <div className="mt-3 flex flex-wrap gap-3 text-sm font-bold">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                    {product?.brand || "Bandai"}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                    SKU: {product?.sku || "-"}
                  </span>
                </div>

                <p className="mt-5 text-base font-semibold leading-7 text-slate-600">
                  {desc}
                </p>

                <div className="my-6 border-t border-slate-200" />

                <div className="flex items-end gap-3">
                  <div className="text-3xl font-black text-red-600">
                    {formatCurrency(price)}
                  </div>
                  {oldPrice ? (
                    <div className="pb-1 text-lg font-bold text-slate-400 line-through">
                      {formatCurrency(oldPrice)}
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 inline-flex rounded-lg bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700">
                  {stock > 0 ? `✓ ${t("product.stockReady")}: ${stock}` : t("product.preorderContact")}
                </div>

                <div className="mt-6 grid gap-3 sm:flex sm:items-center">
                  <div className="flex items-center rounded-xl border border-slate-200">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-3">
                      <Minus size={16} />
                    </button>
                    <span className="px-5 font-black">{qty}</span>
                    <button onClick={() => setQty(qty + 1)} className="p-3">
                      <Plus size={16} />
                    </button>
                  </div>

                  <button
                    data-cart-managed="true"
                    onClick={addCart}
                    className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-4 text-sm font-black text-white shadow-lg shadow-blue-100 transition hover:bg-blue-800"
                  >
                    <ShoppingCart size={18} />
                    {t("product.addToCart")}
                  </button>

                  <a
                    href={detailUrl}
                    className="text-center rounded-2xl border border-slate-200 px-5 py-4 text-sm font-black text-slate-700 hover:bg-slate-50"
                  >
                    {t("product.details")}
                  </a>

                  <button
                    type="button"
                    onClick={addWishlist}
                    disabled={wishlistSaving}
                    title={wishlistSaved ? "Đã lưu yêu thích" : "Lưu yêu thích"}
                    className={`rounded-2xl border p-4 transition ${
                      wishlistSaved
                        ? "border-red-100 bg-red-50 text-red-600"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    } ${wishlistSaving ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <Heart size={18} fill={wishlistSaved ? "currentColor" : "none"} />
                  </button>
                </div>

                {wishlistMessage && (
                  <div
                    className={`mt-3 rounded-2xl px-4 py-3 text-sm font-black ${
                      wishlistSaved
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {wishlistMessage}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
