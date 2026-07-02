import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BellRing,
  Box,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Factory,
  GitCompareArrows,
  Heart,
  Layers3,
  MapPin,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  Ruler,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  Truck,
  Wallet,
  Zap,
} from "lucide-react";
import PageShell from "../../components/common/PageShell";
import { useCms } from "../../store/CmsStore";
import { translateStaticText } from "../../i18n";
import { addProductToCart, forceCartBadgeSync, saveBuyNowDraft, saveCheckoutDraft, validateCartStock } from "../../services/CartService";
import {
  addMyWishlistItem,
  getMyWishlist,
  hasAccountToken,
  removeMyWishlistItem,
} from "../../services/AccountApiService";
import { isCompareSaved, toggleCompare } from "../../services/CompareService";
import { registerRestockAlert } from "../../services/RestockAlertService";
import {
  getStorefrontProductDetailForStorefront,
  getStorefrontProductsForStorefront,
} from "../../services/StorefrontProductApiService";
import { getStorefrontProductReviewsApi } from "../../services/StorefrontReviewApiService";
import {
  ORDER_TYPE,
  PAYMENT_STATUS,
  PREORDER_STATUS,
  calculatePreorderDeposit,
  getPreorderEtaText,
} from "../../constants/orderConfig";

const copy = {
  vi: {
    home: "Trang chủ",
    shop: "Trang bán hàng",
    inStock: "Hàng sẵn",
    outOfStock: "Hết hàng",
    preorder: "Pre-order",
    authentic: "Bandai chính hãng",
    sold: "đã bán",
    reviews: "đánh giá",
    sku: "Mã sản phẩm",
    brand: "Thương hiệu",
    scale: "Tỷ lệ",
    grade: "Grade",
    stock: "Tồn kho",
    quantity: "Số lượng",
    addToCart: "Thêm vào giỏ",
    soldOut: "Hết hàng",
    buyNow: "Đặt hàng ngay",
    preorderNow: "Đặt trước ngay",
    favorite: "Yêu thích",
    saved: "Đã lưu",
    wishlistLogin: "Vui lòng đăng nhập để lưu yêu thích.",
    wishlistSaved: "Đã lưu vào yêu thích.",
    wishlistRemoved: "Đã xóa khỏi yêu thích.",
    wishlistError: "Không thể cập nhật yêu thích.",
    share: "Chia sẻ",
    compare: "So sánh",
    compared: "Đã thêm so sánh",
    notifyTitle: "Báo khi hàng về",
    notifyName: "Họ tên",
    notifyPhone: "Số điện thoại",
    notifyNote: "Ghi chú nhu cầu",
    notifySubmit: "Đăng ký báo hàng",
    notifySuccess: "Đã ghi nhận. Shop sẽ báo khi hàng về.",
    deposit: "Cọc trước",
    eta: "Dự kiến về",
    preorderNote: "Đơn pre-order sẽ được ghi nhận cọc, shop nhắc thanh toán phần còn lại khi hàng về.",
    voucherTitle: "Ưu đãi cho sản phẩm này",
    voucher1: "Giảm 50.000₫ cho đơn từ 1.000.000₫",
    voucher2: "Freeship theo điều kiện khu vực",
    voucher3: "Giảm 10% khi mua kèm phụ kiện builder",
    collectVoucher: "Lưu voucher",
    voucherSaved: "Đã lưu voucher",
    deliveryTitle: "Giao hàng dự kiến",
    deliveryTo: "Giao đến",
    deliveryLocation: "TP.HCM, Quận 1",
    deliveryEta: "Nhận hàng dự kiến: 1-2 ngày",
    deliveryFee: "Phí ship dự kiến: 25.000₫",
    paymentTitle: "Thanh toán",
    payment1: "COD khi nhận hàng",
    payment2: "Chuyển khoản ngân hàng",
    payment3: "Ví điện tử / cổng thanh toán sau này",
    shopTitle: "Thông tin shop",
    shopName: "Gundam Store VN",
    shopRating: "5.0 đánh giá",
    shopResponse: "Phản hồi nhanh",
    shopProducts: "500+ sản phẩm",
    chatShop: "Chat shop",
    viewShop: "Xem shop",
    shippingTitle: "Cam kết giao hàng",
    shipping1: "Bọc chống sốc 3 lớp, ưu tiên giữ hộp đẹp cho collector.",
    shipping2: "Kiểm tra ngoại hộp trước khi đóng gói.",
    shipping3: "Hỗ trợ tra cứu đơn và tư vấn qua Zalo/Facebook.",
    specsTitle: "Thông số kỹ thuật",
    maker: "Hãng",
    material: "Chất liệu",
    difficulty: "Độ khó",
    boxTitle: "Đập hộp có gì?",
    descTitle: "Mô tả sản phẩm",
    defaultDesc: "Mô hình lắp ráp Gundam/Gunpla chính hãng, phù hợp builder và collector. Sản phẩm được đóng gói kỹ, minh bạch thông tin, hỗ trợ tư vấn trước và sau khi mua.",
    policyTitle: "Chính sách mua hàng",
    policy1: "Hàng chính hãng, nguồn gốc minh bạch.",
    policy2: "Đổi trả theo chính sách nếu sản phẩm lỗi do nhà sản xuất.",
    policy3: "Hỗ trợ kiểm tra tình trạng hộp trước khi giao.",
    returnTitle: "Đổi trả & bảo hành",
    return1: "Đổi trả nếu lỗi do nhà sản xuất theo chính sách shop.",
    return2: "Khuyến khích quay video mở hộp để xử lý nhanh hơn.",
    return3: "Không hỗ trợ đổi trả nếu runner đã cắt/lắp ráp.",
    customerReviewsTitle: "Đánh giá khách hàng",
    noReviews: "Sản phẩm chưa có đánh giá được duyệt.",
    relatedTitle: "Sản phẩm liên quan",
    viewAll: "Xem tất cả",
    notFound: "Không tìm thấy sản phẩm",
    backToShop: "Quay lại trang bán hàng",
  },
  en: {
    home: "Home",
    shop: "Shop",
    inStock: "In stock",
    outOfStock: "Out of stock",
    preorder: "Pre-order",
    authentic: "Authentic Bandai",
    sold: "sold",
    reviews: "reviews",
    sku: "SKU",
    brand: "Brand",
    scale: "Scale",
    grade: "Grade",
    stock: "Stock",
    quantity: "Quantity",
    addToCart: "Add to cart",
    soldOut: "Out of stock",
    buyNow: "Buy now",
    preorderNow: "Pre-order now",
    favorite: "Wishlist",
    saved: "Saved",
    wishlistLogin: "Please sign in to save wishlist.",
    wishlistSaved: "Saved to wishlist.",
    wishlistRemoved: "Removed from wishlist.",
    wishlistError: "Unable to update wishlist.",
    share: "Share",
    compare: "Compare",
    compared: "Compared",
    notifyTitle: "Notify when available",
    notifyName: "Full name",
    notifyPhone: "Phone number",
    notifyNote: "Demand note",
    notifySubmit: "Register alert",
    notifySuccess: "Saved. The shop will notify you when available.",
    deposit: "Deposit",
    eta: "ETA",
    preorderNote: "Pre-order deposit will be recorded. The shop will remind you to pay the remaining balance when the item arrives.",
    voucherTitle: "Product deals",
    voucher1: "50,000₫ off orders from 1,000,000₫",
    voucher2: "Conditional free shipping by area",
    voucher3: "10% off builder accessories bundle",
    collectVoucher: "Collect voucher",
    voucherSaved: "Voucher saved",
    deliveryTitle: "Estimated delivery",
    deliveryTo: "Deliver to",
    deliveryLocation: "District 1, Ho Chi Minh City",
    deliveryEta: "Estimated arrival: 1-2 days",
    deliveryFee: "Estimated shipping fee: 25,000₫",
    paymentTitle: "Payment",
    payment1: "Cash on delivery",
    payment2: "Bank transfer",
    payment3: "E-wallet / payment gateway later",
    shopTitle: "Shop information",
    shopName: "Gundam Store VN",
    shopRating: "5.0 rating",
    shopResponse: "Fast response",
    shopProducts: "500+ products",
    chatShop: "Chat shop",
    viewShop: "View shop",
    shippingTitle: "Delivery guarantee",
    shipping1: "Triple-layer shock protection, keeping boxes mint for collectors.",
    shipping2: "Outer box condition checked before packing.",
    shipping3: "Order tracking and support via Zalo/Facebook.",
    specsTitle: "Technical specs",
    maker: "Maker",
    material: "Material",
    difficulty: "Difficulty",
    boxTitle: "What’s in the box?",
    descTitle: "Product description",
    defaultDesc: "Authentic Gundam/Gunpla model kit for builders and collectors. Carefully packed, transparent information, with support before and after purchase.",
    policyTitle: "Purchase policy",
    policy1: "Authentic product with transparent source.",
    policy2: "Return support according to policy if the item has manufacturing issues.",
    policy3: "Box condition support before delivery.",
    returnTitle: "Returns & warranty",
    return1: "Return support for manufacturing defects according to shop policy.",
    return2: "Unboxing video helps the shop process issues faster.",
    return3: "No returns after runners are cut or assembled.",
    customerReviewsTitle: "Customer reviews",
    noReviews: "No approved reviews for this product yet.",
    relatedTitle: "Related products",
    viewAll: "View all",
    notFound: "Product not found",
    backToShop: "Back to shop",
  },
};

function money(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + "₫";
}

function text(value, lang, fallback = "") {
  if (!value) return translateStaticText(fallback, lang);
  if (typeof value === "string") return translateStaticText(value, lang);
  return value[lang] || value.vi || value.en || translateStaticText(fallback, lang);
}

function slugFromPath() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  return decodeURIComponent(parts[1] || "");
}

function productName(product, lang) {
  return text(product.name, lang, product.title || "Gundam Model Kit");
}

function productDesc(product, lang, fallback) {
  return text(product.description, lang, product.desc || fallback);
}

function isPreorder(product) {
  const status = String(product.status || "").toLowerCase();
  return Boolean(product.preorder?.enabled || status.includes("pre") || status.includes("order"));
}

function isSale(product) {
  const finalPrice = Number(product.finalPrice || product.effectivePrice || product.price || 0);
  const compareAtPrice = Number(product.compareAtPrice || product.oldPrice || product.originalPrice || 0);

  return Boolean(product.activePromotion) ||
    Number(product.discountAmount || 0) > 0 ||
    (finalPrice > 0 && compareAtPrice > finalPrice);
}

function getActiveVariants(product = {}) {
  return (product.variants || [])
    .filter((variant) => variant.active !== false)
    .sort((a, b) => {
      const sortDiff = Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
      if (sortDiff !== 0) return sortDiff;
      return String(a.sku || "").localeCompare(String(b.sku || ""));
    });
}

function getVariantLabel(variant = {}) {
  return [
    variant.option1Value || variant.nameVi || variant.sku,
    variant.option2Value,
  ].filter(Boolean).join(" / ");
}

function getVariantOptions(variant = {}) {
  return {
    option1Name: variant.option1Name || "",
    option1Value: variant.option1Value || "",
    option2Name: variant.option2Name || "",
    option2Value: variant.option2Value || "",
  };
}

function mergeProductVariant(product = {}, variant = null) {
  if (!variant) return product;

  const variantName = variant.nameVi || getVariantLabel(variant) || variant.sku;

  return {
    ...product,
    sku: variant.sku || product.sku,
    variantId: variant.id,
    variantSku: variant.sku,
    variantName,
    variantOptions: getVariantOptions(variant),
    price: Number(variant.price || 0),
    finalPrice: Number(variant.price || 0),
    oldPrice: Number(variant.oldPrice || 0),
    compareAtPrice: Number(variant.oldPrice || 0),
    stock: Number(variant.stock || 0),
    status: variant.status || product.status,
    imageUrl: variant.imageUrl || product.imageUrl,
    images: variant.imageUrl ? [variant.imageUrl, ...(product.images || [])] : product.images,
  };
}

function GundamVisual({ tone = "blue", imageUrl, large = false }) {
  const toneMap = {
    blue: "from-blue-950 via-blue-600 to-sky-100",
    cyan: "from-cyan-900 via-cyan-500 to-blue-100",
    sky: "from-sky-900 via-sky-500 to-blue-100",
    red: "from-red-950 via-red-500 to-orange-100",
    gold: "from-amber-800 via-yellow-400 to-slate-50",
    slate: "from-slate-950 via-slate-500 to-slate-100",
    violet: "from-violet-950 via-violet-500 to-fuchsia-100",
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
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)",
          backgroundSize: large ? "26px 26px" : "18px 18px",
        }}
      />
      <div className="absolute -right-8 -top-10 h-44 w-44 rounded-full bg-white/35 blur-3xl" />
      <div className="absolute bottom-6 left-10 right-10 h-10 rounded-full bg-black/20 blur-xl" />
      <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-8deg] rounded-[2rem] bg-white/90 shadow-2xl ${large ? "h-72 w-48" : "h-24 w-16"}`}>
        <div className={`absolute left-1/2 -translate-x-1/2 rounded-2xl bg-red-500 ${large ? "top-8 h-16 w-16" : "top-3 h-8 w-8"}`} />
        <div className={`absolute rounded-full bg-slate-900 ${large ? "bottom-8 left-7 h-24 w-7" : "bottom-3 left-2 h-10 w-3"}`} />
        <div className={`absolute rounded-full bg-slate-900 ${large ? "bottom-8 right-7 h-24 w-7" : "bottom-3 right-2 h-10 w-3"}`} />
        <div className={`absolute -rotate-45 rounded-full bg-yellow-300 ${large ? "-left-24 top-28 h-7 w-40" : "-left-7 top-10 h-3 w-14"}`} />
        <div className={`absolute rotate-45 rounded-full bg-cyan-300 ${large ? "-right-24 top-28 h-7 w-40" : "-right-7 top-10 h-3 w-14"}`} />
      </div>
    </div>
  );
}

function QuantitySelector({ qty, setQty, maxQty = 99, disabled = false }) {
  return (
    <div className={`inline-flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${disabled ? "opacity-50" : ""}`}>
      <button
        type="button"
        disabled={disabled || qty <= 1}
        onClick={() => setQty(Math.max(1, qty - 1))}
        className="p-3 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus size={16} />
      </button>
      <div className="w-12 text-center text-sm font-black">{qty}</div>
      <button
        type="button"
        disabled={disabled || qty >= maxQty}
        onClick={() => setQty((value) => Math.min(maxQty, value + 1))}
        className="p-3 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

function ProductInfo({ product, lang, actions, onPreorder }) {
  const t = copy[lang];
  const variants = useMemo(() => getActiveVariants(product), [product]);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [qty, setQty] = useState(1);
  const [wishlistSaved, setWishlistSaved] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [wishlistMessage, setWishlistMessage] = useState("");
  const [compareSaved, setCompareSaved] = useState(false);
  const [alertForm, setAlertForm] = useState({ name: "", phone: "", note: "" });
  const [alertMessage, setAlertMessage] = useState("");
  const [alertError, setAlertError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!variants.length) {
      setSelectedVariantId("");
      return;
    }

    if (!variants.some((variant) => variant.id === selectedVariantId)) {
      setSelectedVariantId(variants[0].id);
    }
  }, [variants, selectedVariantId]);

  useEffect(() => {
    setQty(1);
  }, [selectedVariantId]);

  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) || null;
  const currentProduct = selectedVariant ? mergeProductVariant(product, selectedVariant) : product;
  const preorder = isPreorder(currentProduct);
  const stock = Number(currentProduct.stock || 0);
  const isOutOfStock = !preorder && stock <= 0;
  const maxQty = preorder ? 99 : Math.max(1, stock);
  const price = Number(currentProduct.finalPrice || currentProduct.effectivePrice || currentProduct.price || 0);
  const oldPrice = Number(currentProduct.compareAtPrice || currentProduct.oldPrice || 0);
  const save = oldPrice > price ? oldPrice - price : 0;

  function showCartError(result) {
    const available = Number(result?.available || 0);
    alert(
      lang === "en"
        ? `Only ${available} item(s) available.`
        : `Sản phẩm này chỉ còn ${available} sản phẩm trong kho.`
    );
  }

  function handleAddToCart() {
    if (isOutOfStock) return;

    const validation = validateCartStock(currentProduct, qty);
    if (!validation.ok) {
      showCartError(validation);
      return;
    }

    addProductToCart(currentProduct, qty);
    forceCartBadgeSync();
    actions?.track?.("add_to_cart", { productId: product.id, variantId: currentProduct.variantId || "", qty });
  }

  function handleBuyNow() {
    if (isOutOfStock) return;

    const result = saveBuyNowDraft(currentProduct, qty, { shippingMethod: "FAST" });
    if (!result.ok) {
      showCartError(result);
      return;
    }

    forceCartBadgeSync();
    actions?.track?.("buy_now", { productId: product.id, variantId: currentProduct.variantId || "", qty });
    navigate("/checkout");
  }

  useEffect(() => {
    let alive = true;

    async function loadWishlistState() {
      setCompareSaved(isCompareSaved(product.id));

      if (!hasAccountToken()) {
        setWishlistSaved(false);
        return;
      }

      try {
        const items = await getMyWishlist();
        if (!alive) return;

        const productKeys = new Set([
          product.id,
          product.backendProductId,
          product.productId,
          product.sku,
          product.slug,
        ].filter(Boolean).map(String));

        const saved = (items || []).some((item) => {
          const savedProduct = item.product || item;
          return [
            item.productId,
            savedProduct.id,
            savedProduct.sku,
            savedProduct.slug,
          ].filter(Boolean).some((value) => productKeys.has(String(value)));
        });

        setWishlistSaved(saved);
      } catch {
        if (alive) setWishlistSaved(false);
      }
    }

    loadWishlistState();

    return () => {
      alive = false;
    };
  }, [product.id, product.backendProductId, product.productId, product.sku, product.slug]);

  async function handleWishlist() {
    if (!hasAccountToken()) {
      setWishlistMessage(t.wishlistLogin);
      return;
    }

    try {
      setWishlistBusy(true);
      setWishlistMessage("");

      if (wishlistSaved) {
        await removeMyWishlistItem(product.backendProductId || product.productId || product.id);
        setWishlistSaved(false);
        setWishlistMessage(t.wishlistRemoved);
      } else {
        await addMyWishlistItem(product);
        setWishlistSaved(true);
        setWishlistMessage(t.wishlistSaved);
      }
    } catch (error) {
      setWishlistMessage(error?.message || t.wishlistError);
    } finally {
      setWishlistBusy(false);
    }
  }

  function handleCompare() {
    const next = toggleCompare(product.id);
    setCompareSaved(next.includes(product.id));
  }

  function patchAlert(field, value) {
    setAlertForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submitRestockAlert(event) {
    event.preventDefault();
    setAlertMessage("");
    setAlertError("");

    try {
      await registerRestockAlert(currentProduct, alertForm);
      setAlertMessage(t.notifySuccess);
      setAlertForm({ name: "", phone: "", note: "" });
    } catch (error) {
      setAlertError(error?.message || "Request failed.");
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
      <div className="flex flex-wrap gap-2">
        <span className={`rounded-xl px-3 py-1 text-xs font-black text-white ${preorder ? "bg-violet-600" : isOutOfStock ? "bg-slate-500" : "bg-emerald-600"}`}>
          {preorder ? t.preorder : isOutOfStock ? t.outOfStock : t.inStock}
        </span>
        <span className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{t.authentic}</span>
        {isSale(product) && <span className="rounded-xl bg-red-100 px-3 py-1 text-xs font-black text-red-700">SALE</span>}
      </div>

      <h1 className="mt-4 text-3xl font-black leading-tight text-slate-950 lg:text-4xl">{productName(product, lang)}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600 whitespace-pre-line">
        {productDesc(product, lang, t.defaultDesc)}
      </p>

      {/* VARIANT_SELECTOR_START */}
      {variants.length > 0 && (
        <section className="mt-5 rounded-3xl border border-blue-100 bg-blue-50 p-4">
          <div className="mb-3 text-sm font-black text-blue-900">
            {lang === "vi" ? "Phân loại hàng" : "Variants"}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {variants.map((variant) => {
              const selected = selectedVariantId === variant.id;
              const disabled = variant.active === false || (Number(variant.stock || 0) <= 0 && !isPreorder(variant));

              return (
                <button
                  key={variant.id}
                  type="button"
                  disabled={variant.active === false}
                  onClick={() => setSelectedVariantId(variant.id)}
                  className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${selected
                    ? "border-blue-500 bg-white ring-4 ring-blue-100"
                    : "border-blue-100 bg-white/70 hover:bg-white"
                    } ${disabled ? "opacity-60" : ""}`}
                >
                  <div className="h-14 w-14 overflow-hidden rounded-xl bg-slate-100">
                    {variant.imageUrl ? (
                      <img src={variant.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <GundamVisual tone={product.tone || "blue"} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-black text-slate-950">{getVariantLabel(variant)}</div>
                    <div className="text-xs font-bold text-slate-500">{variant.sku}</div>
                    <div className="mt-1 text-xs font-black text-blue-700">{money(variant.price)}</div>
                    <div className={`mt-1 text-[11px] font-black ${Number(variant.stock || 0) > 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {Number(variant.stock || 0) > 0 ? `${t.stock}: ${variant.stock}` : t.outOfStock}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedVariant && (
            <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-xs font-bold text-slate-600">
              {lang === "vi" ? "Đang chọn" : "Selected"}: <span className="font-black text-slate-950">{getVariantLabel(selectedVariant)}</span>
            </div>
          )}
        </section>
      )}
      {/* VARIANT_SELECTOR_END */}

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-1 text-amber-400">
          {Array.from({ length: 5 }).map((_, index) => <Star key={index} size={17} fill="currentColor" />)}
        </div>
        <span className="font-bold text-slate-600">{product.rating || "4.9"} / 5</span>
        <span className="text-slate-300">|</span>
        <span className="font-bold text-slate-600">{product.sold || 0} {t.sold}</span>
      </div>

      <div className="mt-5 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="text-3xl font-black text-blue-700">{money(price)}</div>
          {oldPrice > price && <div className="pb-1 text-base font-bold text-slate-400 line-through">{money(oldPrice)}</div>}
          {save > 0 && <div className="mb-1 rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">-{money(save)}</div>}
        </div>
      </div>

      {preorder ? (
        <div className="mt-5 rounded-3xl border border-violet-200 bg-violet-50 p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-black text-violet-800"><Clock size={18} /> {t.preorder}</div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-3 shadow-sm"><div className="text-xs font-bold text-slate-500">{t.deposit}</div><div className="mt-1 font-black text-slate-950">{money(product.preorder?.deposit || product.deposit || 300000)}</div></div>
            <div className="rounded-2xl bg-white p-3 shadow-sm"><div className="text-xs font-bold text-slate-500">{t.eta}</div><div className="mt-1 font-black text-slate-950">{product.preorder?.eta || product.eta || "TBD"}</div></div>
            <div className="rounded-2xl bg-white p-3 shadow-sm"><div className="text-xs font-bold text-slate-500">Status</div><div className="mt-1 font-black text-violet-700">Open</div></div>
          </div>
          <p className="mt-3 text-xs leading-5 text-violet-800/80">{t.preorderNote}</p>
        </div>
      ) : (
        <div className={`mt-5 flex items-center gap-2 rounded-2xl border p-4 text-sm font-black ${isOutOfStock
          ? "border-slate-200 bg-slate-50 text-slate-600"
          : "border-emerald-100 bg-emerald-50 text-emerald-700"
          }`}>
          <CheckCircle2 size={18} /> {isOutOfStock ? t.outOfStock : `${t.stock}: ${stock}`}
        </div>
      )}

      <MarketplaceExtras lang={lang} />

      <div className="mt-5">
        <div className="mb-2 text-xs font-black uppercase text-slate-500">{t.quantity}</div>
        <QuantitySelector qty={qty} setQty={setQty} maxQty={maxQty} disabled={isOutOfStock} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {preorder ? (
          <button
            onClick={() => onPreorder ? onPreorder(product, qty) : actions.addToCart(product.id, qty)}
            className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 hover:bg-violet-700 sm:col-span-2"
          >
            {t.preorderNow}
          </button>
        ) : (
          <>
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`rounded-2xl px-5 py-3 text-sm font-black shadow-lg ${isOutOfStock
                ? "cursor-not-allowed bg-slate-200 text-slate-500 shadow-none"
                : "bg-blue-700 text-white shadow-blue-200 hover:bg-blue-800"
                }`}
            >
              <ShoppingCart className="mr-2 inline" size={17} />
              {isOutOfStock ? t.soldOut : t.addToCart}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className={`rounded-2xl px-5 py-3 text-sm font-black shadow-lg ${isOutOfStock
                ? "cursor-not-allowed bg-slate-200 text-slate-500 shadow-none"
                : "bg-slate-950 text-white shadow-slate-200 hover:bg-slate-800"
                }`}
            >
              <Zap className="mr-2 inline" size={17} />
              {isOutOfStock ? t.soldOut : t.buyNow}
            </button>
          </>
        )}
      </div>


      {/* RestockAlertFormStart */}
      {(preorder || Number(currentProduct.stock || 0) <= 0 || String(currentProduct.status || "").toLowerCase().includes("coming")) && (
        <form onSubmit={submitRestockAlert} className="mt-5 rounded-3xl border border-cyan-100 bg-cyan-50 p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-black text-cyan-800">
            <BellRing size={18} />
            {t.notifyTitle}
          </div>

          {alertMessage && (
            <div className="mb-3 rounded-2xl bg-green-50 p-3 text-xs font-black text-green-700">
              {alertMessage}
            </div>
          )}

          {alertError && (
            <div className="mb-3 rounded-2xl bg-red-50 p-3 text-xs font-black text-red-600">
              {alertError}
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={alertForm.name}
              onChange={(event) => patchAlert("name", event.target.value)}
              placeholder={t.notifyName}
              className="rounded-2xl border border-cyan-100 bg-white px-4 py-3 text-sm font-bold outline-none"
            />
            <input
              value={alertForm.phone}
              onChange={(event) => patchAlert("phone", event.target.value)}
              placeholder={t.notifyPhone}
              inputMode="tel"
              className="rounded-2xl border border-cyan-100 bg-white px-4 py-3 text-sm font-bold outline-none"
            />
            <input
              value={alertForm.note}
              onChange={(event) => patchAlert("note", event.target.value)}
              placeholder={t.notifyNote}
              className="rounded-2xl border border-cyan-100 bg-white px-4 py-3 text-sm font-bold outline-none sm:col-span-2"
            />
          </div>

          <button type="submit" className="mt-3 rounded-2xl bg-cyan-700 px-5 py-3 text-sm font-black text-white">
            {t.notifySubmit}
          </button>
        </form>
      )}
      {/* RestockAlertFormEnd */}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={handleWishlist}
          disabled={wishlistBusy}
          className={`rounded-2xl border px-4 py-3 text-sm font-black shadow-sm disabled:cursor-not-allowed disabled:opacity-60 ${wishlistSaved
            ? "border-pink-200 bg-pink-50 text-pink-700"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
        >
          <Heart className="mr-2 inline" size={16} fill={wishlistSaved ? "currentColor" : "none"} />
          {wishlistSaved ? t.saved : t.favorite}
        </button>

        {wishlistMessage && (
          <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 sm:col-span-2">
            {wishlistMessage}
          </div>
        )}
        <button
          onClick={handleCompare}
          className={`rounded-2xl border px-4 py-3 text-sm font-black shadow-sm ${compareSaved
            ? "border-cyan-200 bg-cyan-50 text-cyan-700"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
        >
          <GitCompareArrows className="mr-2 inline" size={16} />
          {compareSaved ? t.compared : t.compare}
        </button>
      </div>
    </div>
  );
}

function MarketplaceExtras({ lang }) {
  const t = copy[lang];
  const [savedVoucher, setSavedVoucher] = useState("");

  const vouchers = [
    { label: t.voucher1, code: "VIP50" },
    { label: t.voucher2, code: "FREESHIP" },
    { label: t.voucher3, code: "GUNDAM10" },
  ];

  function collectVoucher(code) {
    try {
      localStorage.setItem("gundam-saved-voucher", code);
      setSavedVoucher(code);
    } catch {
      setSavedVoucher(code);
    }
  }

  return (
    <div className="mt-5 grid gap-3">
      <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-black text-amber-800">
          <CreditCard size={18} />
          {t.voucherTitle}
        </div>

        {savedVoucher && (
          <div className="mb-3 rounded-2xl bg-emerald-50 p-3 text-xs font-black text-emerald-700">
            {t.voucherSaved}: {savedVoucher}
          </div>
        )}

        {vouchers.map((voucher) => (
          <div key={voucher.code} className="mb-2 flex items-center justify-between gap-3 rounded-2xl bg-white p-3 text-xs font-bold text-slate-700 shadow-sm">
            <span>{voucher.label}</span>
            <button
              type="button"
              onClick={() => collectVoucher(voucher.code)}
              className="shrink-0 rounded-xl bg-amber-500 px-3 py-1.5 text-[11px] font-black text-white hover:bg-amber-600"
            >
              {savedVoucher === voucher.code ? t.voucherSaved : t.collectVoucher}
            </button>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-950"><MapPin className="text-blue-600" size={18} />{t.deliveryTitle}</div>
          <div className="text-xs font-bold text-slate-500">{t.deliveryTo}</div>
          <div className="mt-1 text-sm font-black text-slate-950">{t.deliveryLocation}</div>
          <div className="mt-3 space-y-1 text-xs font-semibold text-slate-600">
            <div>{t.deliveryEta}</div>
            <div>{t.deliveryFee}</div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-950"><Wallet className="text-blue-600" size={18} />{t.paymentTitle}</div>
          {[t.payment1, t.payment2, t.payment3].map((item, index) => (
            <div key={item} className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-600">
              {index === 0 ? <Wallet size={15} className="text-emerald-600" /> : <CheckCircle2 size={15} className="text-blue-600" />}
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


function ShopInfoCard({ lang }) {
  const t = copy[lang];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-cyan-500 text-white shadow-lg shadow-blue-100"><Store size={26} /></div>
        <div>
          <div className="text-xs font-black uppercase text-slate-500">{t.shopTitle}</div>
          <div className="text-lg font-black text-slate-950">{t.shopName}</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[t.shopRating, t.shopResponse, t.shopProducts].map((item) => (
          <div key={item} className="rounded-2xl bg-slate-50 p-3 text-xs font-black text-slate-700">{item}</div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button className="rounded-2xl bg-blue-700 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 hover:bg-blue-800">{t.chatShop}</button>
        <a href="/shop" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50">{t.viewShop}</a>
      </div>
    </div>
  );
}

function InfoCard({ title, items, icon: Icon }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-lg font-black text-slate-950">
        {Icon && <Icon className="text-blue-600" size={20} />}
        {title}
      </div>
      {items.map((item) => (
        <div key={item} className="mb-3 flex gap-3 text-sm leading-6 text-slate-600">
          <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={18} />
          {item}
        </div>
      ))}
    </div>
  );
}

function ProductAttributes({ product, lang }) {
  const t = copy[lang];

  const attributes = [
    [t.sku, product.sku || product.id],
    [t.brand, product.brand || "Bandai Spirits"],
    [t.grade, product.grade || "Gunpla"],
    [t.scale, product.scale || "1/144"],
    [t.stock, product.stock ?? 0],
  ];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-xl font-black text-slate-950">{lang === "vi" ? "Thông tin sản phẩm" : "Product information"}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {attributes.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-black uppercase text-slate-500">{label}</div>
            <div className="mt-1 font-black text-slate-950">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpecsCard({ product, lang }) {
  const t = copy[lang];

  const specs = [
    { label: t.scale, value: product.scale || "1/144", icon: Ruler },
    { label: t.grade, value: product.grade || "Gunpla", icon: Layers3 },
    { label: t.maker, value: product.brand || "Bandai Japan", icon: Factory },
    { label: t.difficulty, value: product.difficulty || "Intermediate", icon: Box },
    { label: t.material, value: product.material || "PS / ABS", icon: ShieldCheck },
  ];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-xl font-black text-slate-950">{t.specsTitle}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {specs.map((spec) => {
          const Icon = spec.icon;
          return (
            <div key={spec.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <Icon className="mb-3 text-blue-600" size={22} />
              <div className="text-xs font-black uppercase text-slate-500">{spec.label}</div>
              <div className="mt-1 font-black text-slate-950">{spec.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Reviews({ product, reviews, lang, onSubmitted }) {
  const t = copy[lang];
  const [draft, setDraft] = useState({
    customerName: "",
    customerEmail: "",
    orderNo: "",
    rating: 5,
    title: "",
    content: "",
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function patch(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  async function submitReview() {
    if (!product?.id || busy) return;

    setBusy(true);
    setMessage("");

    try {
      await createStorefrontReviewApi({
        productId: product.id,
        slug: product.slug,
        sku: product.sku,
        customerName: draft.customerName,
        customerEmail: draft.customerEmail,
        orderNo: draft.orderNo,
        rating: Number(draft.rating || 5),
        title: draft.title,
        content: draft.content,
      });

      setDraft({
        customerName: "",
        customerEmail: "",
        orderNo: "",
        rating: 5,
        title: "",
        content: "",
      });
      setMessage(lang === "vi" ? "Đã gửi đánh giá. Review sẽ hiển thị sau khi được duyệt." : "Review submitted. It will appear after moderation.");
      await onSubmitted?.();
    } catch (error) {
      setMessage(error?.message || (lang === "vi" ? "Không gửi được đánh giá." : "Cannot submit review."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-4 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950">{t.customerReviewsTitle}</h2>
            <div className="mt-1 text-sm font-bold text-slate-500">{reviews.length} {t.reviews}</div>
          </div>
          <div className="flex items-center gap-1 text-amber-400">{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={18} fill="currentColor" />)}</div>
        </div>

        {reviews.length ? (
          <div className="grid gap-3 lg:grid-cols-3">
            {reviews.slice(0, 6).map((review) => (
              <div key={review.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex gap-1 text-amber-400">
                  {Array.from({ length: Number(review.rating || 5) }).map((_, index) => <Star key={index} size={14} fill="currentColor" />)}
                </div>
                <div className="text-sm font-black text-slate-950">{review.customerName || review.customer || review.name || "Builder"}</div>
                {review.verifiedPurchase && (
                  <div className="mt-1 inline-flex rounded-full bg-blue-50 px-2 py-1 text-[11px] font-black text-blue-700">
                    Verified purchase
                  </div>
                )}
                {review.title && <div className="mt-2 text-sm font-black text-slate-900">{review.title}</div>}
                <p className="mt-2 text-sm leading-6 text-slate-600">{review.content || review.comment}</p>
                {review.adminReply && (
                  <div className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-bold text-blue-700">
                    Shop reply: {review.adminReply}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">{t.noReviews}</div>
        )}

        <div className="mt-6 rounded-3xl border border-blue-100 bg-blue-50 p-4">
          <div className="text-sm font-black text-blue-900">{lang === "vi" ? "Viết đánh giá" : "Write a review"}</div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input value={draft.customerName} onChange={(e) => patch("customerName", e.target.value)} placeholder={lang === "vi" ? "Tên của bạn" : "Your name"} className="rounded-2xl border border-blue-100 px-4 py-3 text-sm font-bold outline-none" />
            <input value={draft.customerEmail} onChange={(e) => patch("customerEmail", e.target.value)} placeholder="Email" className="rounded-2xl border border-blue-100 px-4 py-3 text-sm font-bold outline-none" />
            <input value={draft.orderNo} onChange={(e) => patch("orderNo", e.target.value)} placeholder={lang === "vi" ? "Mã đơn hàng nếu có" : "Order no if any"} className="rounded-2xl border border-blue-100 px-4 py-3 text-sm font-bold outline-none" />
            <select value={draft.rating} onChange={(e) => patch("rating", Number(e.target.value))} className="rounded-2xl border border-blue-100 px-4 py-3 text-sm font-bold outline-none">
              {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
            </select>
            <input value={draft.title} onChange={(e) => patch("title", e.target.value)} placeholder={lang === "vi" ? "Tiêu đề" : "Title"} className="rounded-2xl border border-blue-100 px-4 py-3 text-sm font-bold outline-none md:col-span-2" />
            <textarea value={draft.content} onChange={(e) => patch("content", e.target.value)} rows={4} placeholder={lang === "vi" ? "Nội dung đánh giá" : "Review content"} className="rounded-2xl border border-blue-100 px-4 py-3 text-sm font-bold outline-none md:col-span-2" />
          </div>
          {message && <div className="mt-3 text-xs font-black text-blue-800">{message}</div>}
          <button onClick={() => void submitReview()} disabled={busy} className="mt-4 rounded-2xl bg-blue-700 px-5 py-3 text-xs font-black text-white disabled:opacity-50">
            {busy ? "..." : lang === "vi" ? "Gửi đánh giá" : "Submit review"}
          </button>
        </div>
      </div>
    </section>
  );
}

function RelatedCard({ product, lang }) {
  return (
    <a href={`/product/${product.slug || product.id}`} className="block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-100/60">
      <div className="h-32"><GundamVisual imageUrl={product.imageUrl || product.images?.[0]} tone={product.tone || "blue"} /></div>
      <div className="p-3">
        <div className="mb-2 inline-block rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700">{product.grade || product.brand || "Gunpla"}</div>
        <div className="line-clamp-2 min-h-9 text-sm font-black leading-5 text-slate-950">{productName(product, lang)}</div>
        <div className="mt-2 font-black text-blue-700">{money(product.price)}</div>
      </div>
    </a>
  );
}

export default function ProductDetailPage() {
  const { state, actions } = useCms();
  const navigate = useNavigate();
  const lang = state.settings?.lang || "vi";
  const t = copy[lang];
  const slug = slugFromPath();

  const [product, setProduct] = useState(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState("");
  const [relatedDbProducts, setRelatedDbProducts] = useState([]);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    let alive = true;

    setDetailLoading(true);
    setDetailError("");

    getStorefrontProductDetailForStorefront(slug)
      .then((item) => {
        if (!alive) return;
        setProduct(item);
        setActiveImage(0);
        setDetailError("");
      })
      .catch((error) => {
        if (!alive) return;
        setProduct(null);
        setDetailError(error?.message || t.notFound);
      })
      .finally(() => {
        if (alive) setDetailLoading(false);
      });

    getStorefrontProductsForStorefront()
      .then((items) => {
        if (alive) setRelatedDbProducts(items || []);
      })
      .catch(() => {
        if (alive) setRelatedDbProducts([]);
      });

    return () => {
      alive = false;
    };
  }, [slug, t.notFound]);

  function startPreorderCheckout(product, qty = 1) {
    const quantity = Math.max(1, Number(qty) || 1);
    const unitPrice = Number(product.price) || 0;
    const subtotal = unitPrice * quantity;
    const deposit = calculatePreorderDeposit(subtotal);
    const etaText = product.preorder?.eta || product.eta || getPreorderEtaText(lang);
    const image =
      product.media?.card ||
      product.media?.home ||
      product.media?.detailMain ||
      product.imageUrl ||
      product.images?.[0] ||
      "/images/products/hi-nu.jpg";

    saveCheckoutDraft({
      orderType: ORDER_TYPE.PREORDER,
      items: [
        {
          id: product.id,
          name: productName(product, lang),
          image,
          price: unitPrice,
          quantity,
          selected: true,
          status: "preorder",
        },
      ],
      subtotal,
      shippingFee: 0,
      discount: 0,
      shippingDiscount: 0,
      voucherCode: "",
      total: deposit.depositAmount,
      shippingMethod: "FAST",
      preorder: {
        status: PREORDER_STATUS.DEPOSIT_PENDING,
        eta: etaText,
        fullAmount: deposit.fullAmount,
        depositRate: deposit.depositRate,
        depositAmount: deposit.depositAmount,
        remainingAmount: deposit.remainingAmount,
        depositStatus: PAYMENT_STATUS.UNPAID,
        balanceStatus: PAYMENT_STATUS.UNPAID,
      },
    });

    navigate("/checkout");
  }


  const [productReviews, setProductReviews] = useState([]);

  useEffect(() => {
    if (!product?.id) {
      setProductReviews([]);
      return;
    }

    const key = product.slug || product.id;

    getStorefrontProductReviewsApi(key)
      .then((rows) => setProductReviews(rows || []))
      .catch(() => setProductReviews(Array.isArray(product.reviews) ? product.reviews : []));
  }, [product?.id, product?.slug, product?.reviews]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return (relatedDbProducts || [])
      .filter((item) => item.id !== product.id && item.active !== false)
      .filter((item) =>
        item.grade === product.grade ||
        item.categoryId === product.categoryId ||
        item.category?.id === product.category?.id ||
        item.brand === product.brand
      )
      .slice(0, 4);
  }, [relatedDbProducts, product]);

  useEffect(() => {
    if (product) {
      actions.track("product_view", { productId: product.id, page: `/product/${product.slug || product.id}` });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  if (detailLoading) {
    return (
      <PageShell>
        <section className="mx-auto max-w-[960px] px-4 py-16 text-center">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-sm font-black text-slate-500 shadow-sm">
            Loading product...
          </div>
        </section>
      </PageShell>
    );
  }

  if (detailError || !product) {
    return (
      <PageShell>
        <section className="mx-auto max-w-[960px] px-4 py-16 text-center">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
            <h1 className="text-3xl font-black text-slate-950">{t.notFound}</h1>
            <a href="/shop" className="mt-5 inline-flex rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white">{t.backToShop}</a>
          </div>
        </section>
      </PageShell>
    );
  }

  const gallery = product.images?.length ? product.images : [null, null, null, null];

  return (
    <PageShell>
      <main className="relative">
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

        <section className="mx-auto max-w-[1440px] px-4 py-5 lg:px-8">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
            <span>{t.home}</span><ChevronRight size={16} /><span>{t.shop}</span><ChevronRight size={16} /><span className="text-slate-950">{productName(product, lang)}</span>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="h-[520px] overflow-hidden rounded-2xl">
                  <GundamVisual imageUrl={gallery[activeImage]} tone={product.tone || "blue"} large />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {gallery.map((image, index) => (
                  <button
                    key={`${image || "visual"}-${index}`}
                    onClick={() => setActiveImage(index)}
                    className={`h-28 overflow-hidden rounded-2xl border bg-white p-1 shadow-sm transition ${activeImage === index ? "border-blue-500 ring-4 ring-blue-100" : "border-slate-200 hover:border-blue-200"
                      }`}
                  >
                    <GundamVisual imageUrl={image} tone={product.tone || ["blue", "cyan", "slate", "red"][index] || "blue"} />
                  </button>
                ))}
              </div>
            </div>

            <ProductInfo product={product} lang={lang} actions={actions} onPreorder={startPreorderCheckout} />
          </div>
        </section>

        <section className="mx-auto grid max-w-[1440px] gap-5 px-4 py-4 lg:grid-cols-[1fr_360px] lg:px-8">
          <div className="space-y-5">
            <ProductAttributes product={product} lang={lang} />
            <SpecsCard product={product} lang={lang} />

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-xl font-black text-slate-950">{t.descTitle}</h2>
              {/* Thêm class whitespace-pre-line vào đây */}
              <p className="text-sm leading-7 text-slate-600 whitespace-pre-line">
                {productDesc(product, lang, t.defaultDesc)}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-xl font-black text-slate-950">{t.boxTitle}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {(product.boxItems || ["Runner nhựa đầy đủ", "Decal sheet", "Beam Rifle", "Shield", "Beam Saber", "Sách hướng dẫn"]).map((item) => {
                  const itemText = text(item, lang, "");
                  return (
                    <div key={itemText} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700">
                      <CheckCircle2 className="text-emerald-600" size={18} />{itemText}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <ShopInfoCard lang={lang} />
            <InfoCard title={t.shippingTitle} icon={Truck} items={[t.shipping1, t.shipping2, t.shipping3]} />
            <InfoCard title={t.policyTitle} icon={ShieldCheck} items={[t.policy1, t.policy2, t.policy3]} />
            <InfoCard title={t.returnTitle} icon={RotateCcw} items={[t.return1, t.return2, t.return3]} />
          </div>
        </section>

        <Reviews
          product={product}
          reviews={productReviews}
          lang={lang}
          onSubmitted={() => getStorefrontProductReviewsApi(product.slug || product.id).then((rows) => setProductReviews(rows || [])).catch(() => { })}
        />

        <section className="mx-auto max-w-[1440px] px-4 py-4 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-950">{t.relatedTitle}</h2>
              <a href="/shop" className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-black text-blue-700 hover:bg-blue-50">
                {t.viewAll}<ArrowRight size={14} />
              </a>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((item) => (
                <RelatedCard key={item.id} product={item} lang={lang} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
