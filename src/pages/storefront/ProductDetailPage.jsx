import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BellRing,
  Box,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  CreditCard,
  Factory,
  FileText,
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
  Tag,
  Truck,
  Wallet,
  Zap,
} from "lucide-react";
import PageShell from "../../components/common/PageShell";
import useToast from "../../hooks/useToast";
import Toast from "../../utils/Toast";
import ProductCard from "../../components/storefront/ProductCard";
import { useCms } from "../../store/CmsStore";
import { translateStaticText } from "../../i18n";
import { addProductToCart, forceCartBadgeSync, saveBuyNowDraft, saveCheckoutDraft, validateCartStock } from "../../services/CartService";
import { trackProductView } from "../../services/RecentlyViewedService";
import {
  addMyWishlistItem,
  getMyWishlist,
  hasAccountToken,
  removeMyWishlistItem,
} from "../../services/AccountApiService";
import { isCompareSaved, toggleCompare } from "../../services/CompareService";
import { getProductAvailability, getProductPreorderInfo } from "../../utils/productAvailability";
import { registerRestockAlert } from "../../services/RestockAlertService";
import {
  getStorefrontProductDetailForStorefront,
  getStorefrontProductRecommendationsApi,
} from "../../services/StorefrontProductApiService";
import { getStorefrontActivePromotionsApi } from "../../services/StorefrontPromotionApiService";
import {
  createStorefrontReviewApi,
  getStorefrontProductReviewsApi,
} from "../../services/StorefrontReviewApiService";
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
    preorderNow: "ĐẶT HÀNG NGAY",
    favorite: "Yêu thích",
    saved: "Đã lưu",
    wishlistLogin: "Vui lòng đăng nhập để lưu yêu thích.",
    cartLoginRequired: "Vui lòng đăng nhập để tiếp tục.",
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
    deliveryTitle: "Giao hàng",
    deliveryHint: "Phí và thời gian giao sẽ được tính chính xác theo địa chỉ của bạn ở bước thanh toán.",
    paymentTitle: "Thanh toán",
    payment1: "COD khi nhận hàng",
    payment2: "Chuyển khoản ngân hàng",
    payment3: "Ví điện tử/ cổng thanh toán (Đang cập nhật)",
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
    productInfoTitle: "Thông tin sản phẩm",
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
    tabInfo: "Thông tin sản phẩm",
    tabDesc: "Mô tả sản phẩm",
    tabPolicy: "Chính sách & bảo hành",
    showMore: "Xem thêm",
    showLess: "Thu gọn",
    customerReviewsTitle: "Đánh giá khách hàng",
    noReviews: "Sản phẩm chưa có đánh giá được duyệt.",
    relatedTitle: "Sản phẩm liên quan",
    viewedTitle: "Sản phẩm được xem nhiều",
    bestSellerTitle: "Sản phẩm bán chạy",
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
    cartLoginRequired: "Please log in to continue.",
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
    deliveryTitle: "Delivery",
    deliveryHint: "Shipping fee and delivery time will be calculated based on your address at checkout.",
    paymentTitle: "Payment",
    payment1: "Cash on delivery",
    payment2: "Bank transfer",
    payment3: "E-wallet/ payment gateway (Coming soon)",
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
    productInfoTitle: "Product information",
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
    tabInfo: "Product information",
    tabDesc: "Description",
    tabPolicy: "Policies & warranty",
    showMore: "Show more",
    showLess: "Show less",
    customerReviewsTitle: "Customer reviews",
    noReviews: "No approved reviews for this product yet.",
    relatedTitle: "Related products",
    viewedTitle: "Most viewed",
    bestSellerTitle: "Best sellers",
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

function collapseBlankLines(value = "") {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function productLongDesc(product, lang, fallback) {
  return collapseBlankLines(text(product.description, lang, product.desc || fallback));
}

function firstNonEmptyLine(value = "") {
  return String(value || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .find(Boolean) || "";
}

function productShortDesc(product, lang, fallback) {
  const shortText = text(product.short, lang, product.shortVi || product.shortEn || "");
  if (shortText) return shortText;

  const longText = productLongDesc(product, lang, "");
  return firstNonEmptyLine(longText) || fallback;
}

function productDesc(product, lang, fallback) {
  return productLongDesc(product, lang, fallback);
}

function isPreorder(product) {
  return getProductPreorderInfo(product).canOrder;
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

function GundamVisual({ tone = "blue", imageUrl, large = false, priority = false, alt = "", zoom = false }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [imageUrl]);

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
      <div className={`relative h-full overflow-hidden rounded-2xl bg-slate-100 ${zoom ? "group cursor-zoom-in" : ""}`}>
        {!loaded && <div className="absolute inset-0 animate-pulse bg-slate-200" />}
        <img
          src={imageUrl}
          alt={alt}
          className={`h-full w-full object-cover transition duration-300 ${loaded ? "opacity-100" : "opacity-0"} ${zoom ? "group-hover:scale-125" : ""}`}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
          onLoad={() => setLoaded(true)}
        />
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

function QuantitySelector({ qty, setQty, maxQty = 99, disabled = false, lang = "vi" }) {
  const decreaseLabel = lang === "en" ? "Decrease quantity" : "Giảm số lượng";
  const increaseLabel = lang === "en" ? "Increase quantity" : "Tăng số lượng";
  return (
    <div className={`inline-flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${disabled ? "opacity-50" : ""}`}>
      <button
        type="button"
        disabled={disabled || qty <= 1}
        onClick={() => setQty(Math.max(1, qty - 1))}
        aria-label={decreaseLabel}
        className="p-3 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus size={16} />
      </button>
      <div className="w-12 text-center text-sm font-black">{qty}</div>
      <button
        type="button"
        disabled={disabled || qty >= maxQty}
        onClick={() => setQty((value) => Math.min(maxQty, value + 1))}
        aria-label={increaseLabel}
        className="p-3 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

function ProductInfo({ product, lang, actions, onPreorder, reviewCount = 0 }) {
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
  const { toast, notify, dismiss } = useToast();

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
  const isOutOfStock = !getProductAvailability(currentProduct).canAddToCart;
  const maxQty = preorder ? 99 : Math.max(1, stock);
  const price = Number(currentProduct.finalPrice || currentProduct.effectivePrice || currentProduct.price || 0);
  const oldPrice = Number(currentProduct.compareAtPrice || currentProduct.oldPrice || 0);
  const save = oldPrice > price ? oldPrice - price : 0;
  const ratingValue = Number(product.rating) || 0;
  const hasRating = ratingValue > 0 && reviewCount > 0;
  const preorderDeposit = preorder ? calculatePreorderDeposit(price) : null;
  const preorderEtaText = product.preorder?.eta || product.eta || getPreorderEtaText(lang);

  function showCartError() {
    notify(
      "error",
      lang === "en"
        ? "Not enough stock available for this quantity."
        : "Số lượng bạn chọn vượt quá tồn kho hiện có."
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
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={dismiss} />
      <div className="flex flex-wrap gap-1.5">
        <span className={`rounded-lg px-2.5 py-1 text-[11px] font-black text-white ${preorder ? "bg-blue-900" : isOutOfStock ? "bg-slate-500" : "bg-emerald-600"}`}>
          {preorder ? t.preorder : isOutOfStock ? t.outOfStock : t.inStock}
        </span>
        <span className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700">{t.authentic}</span>
        {isSale(product) && <span className="rounded-lg bg-red-100 px-2.5 py-1 text-[11px] font-black text-red-700">SALE</span>}
      </div>

      <h1 className="mt-3 text-xl font-black leading-tight text-slate-950 lg:text-2xl">{productName(product, lang)}</h1>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600 whitespace-pre-line">
        {productShortDesc(product, lang, t.defaultDesc)}
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
              const disabled = variant.active === false || (Number(variant.stock || 0) <= 0 && !preorder);

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
                      <img src={variant.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    ) : (
                      <GundamVisual tone={product.tone || "blue"} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-black text-slate-950">{getVariantLabel(variant)}</div>
                    <div className="text-xs font-bold text-slate-500">{variant.sku}</div>
                    <div className="mt-1 text-xs font-black text-blue-700">{money(variant.price)}</div>
                    <div className={`mt-1 text-[11px] font-black ${Number(variant.stock || 0) > 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {Number(variant.stock || 0) > 0 ? t.inStock : t.outOfStock}
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

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
        {hasRating && (
          <>
            <div className="flex items-center gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} size={14} fill={index < Math.round(ratingValue) ? "currentColor" : "none"} />
              ))}
            </div>
            <span className="font-bold text-slate-600">{ratingValue.toFixed(1)} / 5</span>
            <span className="text-slate-300">|</span>
          </>
        )}
        <span className="font-bold text-slate-600">{product.sold || 0} {t.sold}</span>
      </div>

      <div className="mt-3 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="text-2xl font-black text-blue-700">{money(price)}</div>
          {oldPrice > price && <div className="pb-0.5 text-sm font-bold text-slate-400 line-through">{money(oldPrice)}</div>}
          {save > 0 && <div className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-black text-red-700">-{money(save)}</div>}
        </div>
      </div>

      {preorder ? (
        <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-black text-blue-900"><Clock size={16} /> {t.preorder}</div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-2.5 shadow-sm"><div className="text-[11px] font-bold text-slate-500">{t.deposit}</div><div className="mt-0.5 text-sm font-black text-slate-950">{money(preorderDeposit?.depositAmount)}</div></div>
            <div className="rounded-xl bg-white p-2.5 shadow-sm"><div className="text-[11px] font-bold text-slate-500">{t.eta}</div><div className="mt-0.5 text-sm font-black text-slate-950">{preorderEtaText}</div></div>
            <div className="rounded-xl bg-white p-2.5 shadow-sm"><div className="text-[11px] font-bold text-slate-500">Status</div><div className="mt-0.5 text-sm font-black text-red-600">Open</div></div>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-blue-900/70">{t.preorderNote}</p>
        </div>
      ) : (
        <div className={`mt-3 flex items-center gap-2 rounded-xl border p-3 text-xs font-black ${isOutOfStock
          ? "border-slate-200 bg-slate-50 text-slate-600"
          : "border-emerald-100 bg-emerald-50 text-emerald-700"
          }`}>
          <CheckCircle2 size={16} /> {isOutOfStock ? t.outOfStock : t.inStock}
        </div>
      )}

      <MarketplaceExtras lang={lang} product={currentProduct} />

      <div className="mt-3">
        <div className="mb-1.5 text-[11px] font-black uppercase text-slate-500">{t.quantity}</div>
        <QuantitySelector qty={qty} setQty={setQty} maxQty={maxQty} disabled={isOutOfStock} lang={lang} />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {preorder ? (
          <>
            <button
              onClick={handleAddToCart}
              className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-black text-blue-900 shadow-sm hover:bg-blue-50"
            >
              <ShoppingCart className="mr-2 inline" size={16} />
              {t.addToCart}
            </button>
            <button
              onClick={() => onPreorder ? onPreorder(currentProduct, qty) : actions.addToCart(currentProduct.id, qty)}
              className="rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-950"
            >
              <Zap className="mr-2 inline" size={16} />
              {t.preorderNow}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`rounded-xl px-4 py-2.5 text-sm font-black shadow-lg ${isOutOfStock
                ? "cursor-not-allowed bg-slate-200 text-slate-500 shadow-none"
                : "bg-blue-700 text-white shadow-blue-200 hover:bg-blue-800"
                }`}
            >
              <ShoppingCart className="mr-2 inline" size={16} />
              {isOutOfStock ? t.soldOut : t.addToCart}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className={`rounded-xl px-4 py-2.5 text-sm font-black shadow-lg ${isOutOfStock
                ? "cursor-not-allowed bg-slate-200 text-slate-500 shadow-none"
                : "bg-slate-950 text-white shadow-slate-200 hover:bg-slate-800"
                }`}
            >
              <Zap className="mr-2 inline" size={16} />
              {isOutOfStock ? t.soldOut : t.buyNow}
            </button>
          </>
        )}
      </div>

      {/* RestockAlertFormStart */}
      {(preorder || Number(currentProduct.stock || 0) <= 0 || String(currentProduct.status || "").toLowerCase().includes("coming")) && (
        <form onSubmit={submitRestockAlert} className="mt-3 rounded-2xl border border-cyan-100 bg-cyan-50 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-black text-cyan-800">
            <BellRing size={16} />
            {t.notifyTitle}
          </div>

          {alertMessage && (
            <div className="mb-2 rounded-xl bg-green-50 p-2.5 text-[11px] font-black text-green-700">
              {alertMessage}
            </div>
          )}

          {alertError && (
            <div className="mb-2 rounded-xl bg-red-50 p-2.5 text-[11px] font-black text-red-600">
              {alertError}
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={alertForm.name}
              onChange={(event) => patchAlert("name", event.target.value)}
              placeholder={t.notifyName}
              className="rounded-xl border border-cyan-100 bg-white px-3 py-2.5 text-sm font-bold outline-none"
            />
            <input
              value={alertForm.phone}
              onChange={(event) => patchAlert("phone", event.target.value)}
              placeholder={t.notifyPhone}
              inputMode="tel"
              className="rounded-xl border border-cyan-100 bg-white px-3 py-2.5 text-sm font-bold outline-none"
            />
            <input
              value={alertForm.note}
              onChange={(event) => patchAlert("note", event.target.value)}
              placeholder={t.notifyNote}
              className="rounded-xl border border-cyan-100 bg-white px-3 py-2.5 text-sm font-bold outline-none sm:col-span-2"
            />
          </div>

          <button type="submit" className="mt-2 rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-black text-white">
            {t.notifySubmit}
          </button>
        </form>
      )}
      {/* RestockAlertFormEnd */}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={handleWishlist}
          disabled={wishlistBusy}
          className={`rounded-xl border px-3 py-2.5 text-sm font-black shadow-sm disabled:cursor-not-allowed disabled:opacity-60 ${wishlistSaved
            ? "border-pink-200 bg-pink-50 text-pink-700"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
        >
          <Heart className="mr-2 inline" size={15} fill={wishlistSaved ? "currentColor" : "none"} />
          {wishlistSaved ? t.saved : t.favorite}
        </button>

        {wishlistMessage && (
          <div className="rounded-xl bg-blue-50 px-3 py-2.5 text-xs font-black text-blue-700 sm:col-span-2">
            {wishlistMessage}
          </div>
        )}
        <button
          onClick={handleCompare}
          className={`rounded-xl border px-3 py-2.5 text-sm font-black shadow-sm ${compareSaved
            ? "border-cyan-200 bg-cyan-50 text-cyan-700"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
        >
          <GitCompareArrows className="mr-2 inline" size={15} />
          {compareSaved ? t.compared : t.compare}
        </button>
      </div>
    </div>
  );
}

function MarketplaceExtras({ lang, product }) {
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

  const productKey = String(product?.backendProductId || product?.productId || product?.id || "");
  const applicablePromotions = promotions.filter((promo) =>
    (promo.products || []).some(
      (entry) => String(entry.product?.id || entry.productId || "") === productKey
    )
  );

  return (
    <div className="mt-3 space-y-2">
      {applicablePromotions.length > 0 && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3">
          <div className="mb-1.5 flex items-center gap-2 text-xs font-black text-amber-800">
            <CreditCard size={15} />
            {t.voucherTitle}
          </div>

          {applicablePromotions.map((promo) => (
            <div key={promo.id} className="mb-1 text-[11px] font-bold text-slate-700 last:mb-0">
              {(lang === "en" ? promo.nameEn : promo.nameVi) || promo.nameVi || promo.nameEn}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-start gap-2 text-xs font-semibold text-slate-600">
          <MapPin className="mt-0.5 shrink-0 text-blue-600" size={15} />
          <span><span className="font-black text-slate-950">{t.deliveryTitle}: </span>{t.deliveryHint}</span>
        </div>
        <div className="mt-1.5 flex items-start gap-2 text-xs font-semibold text-slate-600">
          <Wallet className="mt-0.5 shrink-0 text-blue-600" size={15} />
          <span><span className="font-black text-slate-950">{t.paymentTitle}: </span>{[t.payment1, t.payment2, t.payment3].join(" · ")}</span>
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
      {/* Star rating and product-count chips were removed: they were hardcoded
          marketing copy ("5.0 đánh giá", "500+ sản phẩm") with no real data
          behind them. Add them back once a real shop-rating/product-count
          source is wired up. */}
      <div className="grid grid-cols-2 gap-3">
        <button className="rounded-2xl bg-blue-700 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 hover:bg-blue-800">{t.chatShop}</button>
        <a href="/shop" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50">{t.viewShop}</a>
      </div>
    </div>
  );
}

// Merges the legacy fixed fields (SKU/brand/grade/scale/material/difficulty)
// with the backend's real specs[] array, so the same attribute never shows
// up twice with two different values. A specs[] entry always wins over the
// generic fallback; any specs entry that isn't one of the canonical fields
// (e.g. Height, Model No.) is appended so real backend data isn't dropped.
function getMergedSpecs(product = {}, t) {
  const specs = Array.isArray(product.specs) ? product.specs : [];
  const findSpec = (labels) =>
    specs.find((spec) => labels.includes(String(spec?.label || "").trim().toLowerCase()));

  const canonicalLabels = new Set([
    "maker", "brand", "thương hiệu",
    "grade",
    "scale", "tỷ lệ",
    "material", "chất liệu",
    "difficulty", "độ khó",
  ]);

  const fields = [
    { label: t.sku, value: product.sku || product.id, icon: Tag },
    { label: t.brand, value: findSpec(["maker", "brand", "thương hiệu"])?.value || product.brand || "Bandai Spirits", icon: Factory },
    { label: t.grade, value: findSpec(["grade"])?.value || product.grade || "Gunpla", icon: Layers3 },
    { label: t.scale, value: findSpec(["scale", "tỷ lệ"])?.value || product.scale || "1/144", icon: Ruler },
    { label: t.material, value: findSpec(["material", "chất liệu"])?.value || product.material || "PS / ABS", icon: ShieldCheck },
    { label: t.difficulty, value: findSpec(["difficulty", "độ khó"])?.value || product.difficulty || "Intermediate", icon: Box },
  ];

  const extraSpecs = specs
    .filter((spec) => spec?.value && !canonicalLabels.has(String(spec?.label || "").trim().toLowerCase()))
    .map((spec) => ({ label: spec.label, value: spec.value, icon: Ruler }));

  return [...fields, ...extraSpecs];
}

function ProductInfoFields({ product, lang }) {
  const t = copy[lang];
  const fields = getMergedSpecs(product, t);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {fields.map((field) => {
        const Icon = field.icon;
        return (
          <div key={field.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <Icon className="mb-2 text-blue-600" size={20} />
            <div className="text-xs font-black uppercase text-slate-500">{field.label}</div>
            <div className="mt-1 font-black text-slate-950">{field.value}</div>
          </div>
        );
      })}
    </div>
  );
}

// Generic expand/collapse section used for every secondary block on the
// product page (specs, description, shipping, policy, returns, reviews,
// related products) so the page opens short and the shopper picks what to
// read instead of scrolling past everything at once.
function CollapsibleSection({ title, icon: Icon, defaultOpen = false, badge, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 p-5 text-left"
      >
        <span className="flex items-center gap-2 text-base font-black text-slate-950">
          {Icon && <Icon className="text-blue-600" size={20} />}
          {title}
          {badge}
        </span>
        <ChevronDown
          className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          size={18}
        />
      </button>
      {open && <div className="border-t border-slate-100 p-5">{children}</div>}
    </div>
  );
}

function PolicyList({ items }) {
  return items.map((item) => (
    <div key={item} className="mb-3 flex gap-3 text-sm leading-6 text-slate-600 last:mb-0">
      <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={18} />
      {item}
    </div>
  ));
}

function ProductDetailSections({ product, lang }) {
  const t = copy[lang];
  const [descExpanded, setDescExpanded] = useState(false);
  const boxItems = product.boxItems?.length ? product.boxItems : ["Runner nhựa đầy đủ", "Decal sheet", "Beam Rifle", "Shield", "Beam Saber", "Sách hướng dẫn"];
  const descText = productLongDesc(product, lang, t.defaultDesc);
  const descIsLong = descText.length > 420;

  return (
    <div className="space-y-3">
      <CollapsibleSection title={t.productInfoTitle} icon={Layers3}>
        <ProductInfoFields product={product} lang={lang} />
      </CollapsibleSection>

      <CollapsibleSection title={t.descTitle} icon={FileText}>
        <p className={`text-sm leading-7 text-slate-600 whitespace-pre-line ${!descExpanded && descIsLong ? "line-clamp-6" : ""}`}>
          {descText}
        </p>
        {descIsLong && (
          <button
            type="button"
            onClick={() => setDescExpanded((value) => !value)}
            className="mt-2 inline-flex items-center gap-1 text-xs font-black text-blue-700 hover:text-blue-800"
          >
            {descExpanded ? t.showLess : t.showMore}
            <ChevronDown className={`transition-transform ${descExpanded ? "rotate-180" : ""}`} size={14} />
          </button>
        )}

        <h4 className="mb-3 mt-5 text-sm font-black text-slate-950">{t.boxTitle}</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          {boxItems.map((item) => {
            const itemText = text(item, lang, "");
            return (
              <div key={itemText} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700">
                <CheckCircle2 className="text-emerald-600" size={18} />{itemText}
              </div>
            );
          })}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title={t.shippingTitle} icon={Truck}>
        <PolicyList items={[t.shipping1, t.shipping2, t.shipping3]} />
      </CollapsibleSection>

      <CollapsibleSection title={t.policyTitle} icon={ShieldCheck}>
        <PolicyList items={[t.policy1, t.policy2, t.policy3]} />
      </CollapsibleSection>

      <CollapsibleSection title={t.returnTitle} icon={RotateCcw}>
        <PolicyList items={[t.return1, t.return2, t.return3]} />
      </CollapsibleSection>
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
  const [showForm, setShowForm] = useState(false);
  const [open, setOpen] = useState(false);

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

  const avgRating = reviews.length
    ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
    : 0;

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-4 lg:px-8">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-3 p-5 text-left"
        >
          <span className="flex items-center gap-3">
            <span className="text-base font-black text-slate-950">{t.customerReviewsTitle}</span>
            <span className="text-xs font-bold text-slate-500">{reviews.length} {t.reviews}</span>
            {avgRating > 0 && (
              <span className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={14} fill={index < Math.round(avgRating) ? "currentColor" : "none"} />
                ))}
              </span>
            )}
          </span>
          <ChevronDown
            className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
            size={18}
          />
        </button>

        {open && (
          <div className="border-t border-slate-100 p-5 pt-4">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForm((value) => !value)}
                className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700 hover:bg-blue-100"
              >
                {lang === "vi" ? "Viết đánh giá" : "Write a review"}
              </button>
            </div>

            {reviews.length ? (
              <div className="grid gap-2 lg:grid-cols-3">
                {reviews.slice(0, 6).map((review) => (
                  <div key={review.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-1.5 flex gap-1 text-amber-400">
                      {Array.from({ length: Number(review.rating || 5) }).map((_, index) => <Star key={index} size={12} fill="currentColor" />)}
                    </div>
                    <div className="text-xs font-black text-slate-950">{review.customerName || review.customer || review.name || "Builder"}</div>
                    {review.verifiedPurchase && (
                      <div className="mt-1 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-700">
                        Verified purchase
                      </div>
                    )}
                    {review.title && <div className="mt-1.5 text-xs font-black text-slate-900">{review.title}</div>}
                    <p className="mt-1 text-xs leading-5 text-slate-600">{review.content || review.comment}</p>
                    {review.adminReply && (
                      <div className="mt-2 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-bold text-blue-700">
                        Shop reply: {review.adminReply}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-xs font-bold text-slate-500">{t.noReviews}</div>
            )}

            {showForm && (
              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <div className="text-sm font-black text-blue-900">{lang === "vi" ? "Viết đánh giá" : "Write a review"}</div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <input value={draft.customerName} onChange={(e) => patch("customerName", e.target.value)} placeholder={lang === "vi" ? "Tên của bạn" : "Your name"} className="rounded-xl border border-blue-100 px-3 py-2.5 text-sm font-bold outline-none" />
                  <input value={draft.customerEmail} onChange={(e) => patch("customerEmail", e.target.value)} placeholder="Email" className="rounded-xl border border-blue-100 px-3 py-2.5 text-sm font-bold outline-none" />
                  <input value={draft.orderNo} onChange={(e) => patch("orderNo", e.target.value)} placeholder={lang === "vi" ? "Mã đơn hàng nếu có" : "Order no if any"} className="rounded-xl border border-blue-100 px-3 py-2.5 text-sm font-bold outline-none" />
                  <select value={draft.rating} onChange={(e) => patch("rating", Number(e.target.value))} className="rounded-xl border border-blue-100 px-3 py-2.5 text-sm font-bold outline-none">
                    {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
                  </select>
                  <input value={draft.title} onChange={(e) => patch("title", e.target.value)} placeholder={lang === "vi" ? "Tiêu đề" : "Title"} className="rounded-xl border border-blue-100 px-3 py-2.5 text-sm font-bold outline-none md:col-span-2" />
                  <textarea value={draft.content} onChange={(e) => patch("content", e.target.value)} rows={3} placeholder={lang === "vi" ? "Nội dung đánh giá" : "Review content"} className="rounded-xl border border-blue-100 px-3 py-2.5 text-sm font-bold outline-none md:col-span-2" />
                </div>
                {message && <div className="mt-2 text-xs font-black text-blue-800">{message}</div>}
                <button onClick={() => void submitReview()} disabled={busy} className="mt-3 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50">
                  {busy ? "..." : lang === "vi" ? "Gửi đánh giá" : "Submit review"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="aspect-square bg-slate-100" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-3/4 rounded bg-slate-100" />
        <div className="h-4 w-1/2 rounded bg-slate-100" />
        <div className="h-9 rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}

function RecommendationSection({ title, products, loading, lang, viewAllHref, viewAllLabel, collapsible = false }) {
  const [open, setOpen] = useState(false);
  if (!loading && (!products || products.length === 0)) return null;

  const grid = (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {loading
        ? Array.from({ length: 5 }).map((_, index) => <ProductCardSkeleton key={index} />)
        : products.map((item) => <ProductCard key={item.id} product={item} lang={lang} />)}
    </div>
  );

  if (collapsible) {
    return (
      <section className="mx-auto max-w-[1440px] px-4 py-4 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            className="flex w-full items-center justify-between gap-3 p-5 text-left"
          >
            <span className="text-base font-black text-slate-950">{title}</span>
            <ChevronDown
              className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
              size={18}
            />
          </button>
          {open && (
            <div className="border-t border-slate-100 p-5 pt-4">
              {viewAllHref && (
                <div className="mb-4 flex justify-end">
                  <a href={viewAllHref} className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-black text-blue-700 hover:bg-blue-50">
                    {viewAllLabel}<ArrowRight size={14} />
                  </a>
                </div>
              )}
              {grid}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-4 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-950">{title}</h2>
          {viewAllHref && (
            <a href={viewAllHref} className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-black text-blue-700 hover:bg-blue-50">
              {viewAllLabel}<ArrowRight size={14} />
            </a>
          )}
        </div>
        {grid}
      </div>
    </section>
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
  const [activeImage, setActiveImage] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [mostViewedProducts, setMostViewedProducts] = useState([]);
  const [mostViewedLoading, setMostViewedLoading] = useState(true);
  const [bestSellingProducts, setBestSellingProducts] = useState([]);
  const [bestSellingLoading, setBestSellingLoading] = useState(true);

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

    return () => {
      alive = false;
    };
  }, [slug, t.notFound]);

  useEffect(() => {
    let alive = true;

    if (!slug) {
      setRelatedProducts([]);
      setMostViewedProducts([]);
      setBestSellingProducts([]);
      setRelatedLoading(false);
      setMostViewedLoading(false);
      setBestSellingLoading(false);
      return;
    }

    setRelatedLoading(true);
    setMostViewedLoading(true);
    setBestSellingLoading(true);

    getStorefrontProductRecommendationsApi(slug)
      .then(({ related, mostViewed, bestSelling }) => {
        if (!alive) return;
        setRelatedProducts(related || []);
        setMostViewedProducts(mostViewed || []);
        setBestSellingProducts(bestSelling || []);
      })
      .catch(() => {
        if (!alive) return;
        setRelatedProducts([]);
        setMostViewedProducts([]);
        setBestSellingProducts([]);
      })
      .finally(() => {
        if (!alive) return;
        setRelatedLoading(false);
        setMostViewedLoading(false);
        setBestSellingLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [slug]);

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
          id: product.variantId ? `${product.id}::${product.variantId}` : product.id,
          productId: product.backendProductId || product.productId || product.id,
          backendProductId: product.backendProductId || product.productId || product.id,
          sku: product.sku || "",
          slug: product.slug || "",
          variantId: product.variantId || "",
          backendVariantId: product.variantId || "",
          variantSku: product.variantSku || "",
          variantName: product.variantName || "",
          variantOptions: product.variantOptions || null,
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

  useEffect(() => {
    if (product) {
      actions.track("product_view", { productId: product.id, page: `/product/${product.slug || product.id}` });
      trackProductView(product);
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
            <div className="space-y-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="h-[380px] overflow-hidden rounded-2xl sm:h-[420px]">
                  <GundamVisual imageUrl={gallery[activeImage]} tone={product.tone || "blue"} large priority zoom alt={productName(product, lang)} />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {gallery.map((image, index) => (
                  <button
                    key={`${image || "visual"}-${index}`}
                    onClick={() => setActiveImage(index)}
                    aria-label={`${lang === "en" ? "Image" : "Ảnh"} ${index + 1}`}
                    className={`h-16 overflow-hidden rounded-xl border bg-white p-1 shadow-sm transition sm:h-20 ${activeImage === index ? "border-blue-500 ring-4 ring-blue-100" : "border-slate-200 hover:border-blue-200"
                      }`}
                  >
                    <GundamVisual imageUrl={image} tone={product.tone || ["blue", "cyan", "slate", "red"][index] || "blue"} />
                  </button>
                ))}
              </div>
            </div>

            <ProductInfo product={product} lang={lang} actions={actions} onPreorder={startPreorderCheckout} reviewCount={productReviews.length} />
          </div>
        </section>

        <section className="mx-auto grid max-w-[1440px] gap-5 px-4 py-4 lg:grid-cols-[1fr_360px] lg:px-8">
          <ProductDetailSections product={product} lang={lang} />

          <div className="space-y-5">
            <ShopInfoCard lang={lang} />
          </div>
        </section>

        <Reviews
          product={product}
          reviews={productReviews}
          lang={lang}
          onSubmitted={() => getStorefrontProductReviewsApi(product.slug || product.id).then((rows) => setProductReviews(rows || [])).catch(() => { })}
        />

        <RecommendationSection
          title={t.relatedTitle}
          products={relatedProducts}
          loading={relatedLoading}
          lang={lang}
          viewAllHref="/shop"
          viewAllLabel={t.viewAll}
          collapsible
        />

        <RecommendationSection
          title={t.viewedTitle}
          products={mostViewedProducts}
          loading={mostViewedLoading}
          lang={lang}
        />

        <RecommendationSection
          title={t.bestSellerTitle}
          products={bestSellingProducts}
          loading={bestSellingLoading}
          lang={lang}
          viewAllHref="/shop?collection=best_sellers"
          viewAllLabel={t.viewAll}
        />
      </main>
    </PageShell>
  );
}
