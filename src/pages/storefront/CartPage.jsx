import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, TicketPercent, ShieldCheck, Truck } from "lucide-react";
import { getCart, saveCart, saveCheckoutDraft } from "../../services/CartService";
import { validateStorefrontVoucherApi } from "../../services/StorefrontVoucherApiService";
import { getStock } from "../../services/InventoryService";
import PageShell from "../../components/common/PageShell";
import ProductCard from "../../components/storefront/ProductCard";
import { getStorefrontProductsPageFromApi } from "../../services/StorefrontProductApiService";
import { SHIPPING_METHODS, getLocalized } from "../../constants/orderConfig";
import { getStorefrontShippingMethodsApi } from "../../services/ShippingApiService";
import { useI18n } from "../../i18n";
import Toast from "../../utils/Toast";
import useToast from "../../hooks/useToast";

const money = (n) => (Number(n) || 0).toLocaleString("vi-VN") + "đ";

function getCopy(lang) {
  return {
    eyebrow: lang === "en" ? "Shopping Cart" : "Giỏ hàng",
    title: lang === "en" ? "Your cart" : "Giỏ hàng của bạn",
    continueShopping: lang === "en" ? "Continue shopping" : "Tiếp tục mua hàng",
    product: lang === "en" ? "Product" : "Sản phẩm",
    price: lang === "en" ? "Unit price" : "Đơn giá",
    quantity: lang === "en" ? "Quantity" : "Số lượng",
    lineTotal: lang === "en" ? "Subtotal" : "Thành tiền",
    empty: lang === "en" ? "Your cart is empty" : "Giỏ hàng đang trống",
    shopNow: lang === "en" ? "Shop now" : "Mua sắm ngay",
    authenticPack: lang === "en" ? "Authentic Bandai • Shock-proof packing" : "Chính hãng Bandai • Bọc chống sốc",
    guaranteed: lang === "en" ? "Guaranteed item" : "Hàng đảm bảo",
    availablePrefix: lang === "en" ? "Available" : "Còn",
    availableSuffix: lang === "en" ? "items" : "sản phẩm",
    overStock: lang === "en" ? "Quantity exceeds available stock" : "Số lượng vượt tồn kho",
    stockAlert: lang === "en" ? "Only" : "Sản phẩm này chỉ còn",
    stockAlertSuffix: lang === "en" ? "items in stock." : "sản phẩm trong kho.",
    selectAtLeastOne: lang === "en" ? "Please select at least 1 product to proceed." : "Vui lòng chọn ít nhất 1 sản phẩm để tiếp tục.",
    paymentSummary: lang === "en" ? "Payment summary" : "Tóm tắt thanh toán",
    voucher: lang === "en" ? "Voucher" : "Mã khuyến mãi",
    shipping: lang === "en" ? "Shipping" : "Vận chuyển",
    selectedItems: lang === "en" ? "Selected items" : "Sản phẩm đã chọn",
    subtotal: lang === "en" ? "Subtotal" : "Tạm tính",
    shippingFee: lang === "en" ? "Shipping fee" : "Phí vận chuyển",
    productDiscount: lang === "en" ? "Product discount" : "Giảm giá sản phẩm",
    shippingDiscount: lang === "en" ? "Shipping discount" : "Giảm phí ship",
    total: lang === "en" ? "Total payment" : "Tổng thanh toán",
    checkout: lang === "en" ? "Checkout" : "Mua hàng",
    trustTitle: lang === "en" ? "Safe checkout" : "Thanh toán an toàn",
    trustDesc:
      lang === "en"
        ? "Stock, voucher and shipping are rechecked before order placement."
        : "Tồn kho, voucher và vận chuyển sẽ được kiểm tra lại trước khi đặt hàng.",
  };
}

function getItemName(item, lang) {
  if (!item?.name) return "";
  if (typeof item.name === "string") return item.name;
  return getLocalized(item.name, lang, item.name?.vi || item.name?.en || "");
}

function getCartIdentity(item = {}) {
  return (
    item.backendProductId ||
    item.productId ||
    item.id ||
    item.slug ||
    item.sku ||
    getItemName(item, "vi")
  );
}

function isSameCartItem(a = {}, b = {}) {
  return getCartIdentity(a) === getCartIdentity(b);
}

export default function CartPage() {
  const { toast, notify, dismiss } = useToast();
  const navigate = useNavigate();
  const { lang } = useI18n();
  const t = getCopy(lang);
  const [cart, setCart] = useState(() => getCart());
  const [voucherCode, setVoucherCode] = useState(() => {
    try {
      return localStorage.getItem("gundam-saved-voucher") || "";
    } catch {
      return "";
    }
  });
  const [shippingMethod, setShippingMethod] = useState("FAST");
  const [shippingMethods, setShippingMethods] = useState(SHIPPING_METHODS);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherChecking, setVoucherChecking] = useState(false);

  useEffect(() => {
    let alive = true;
    getStorefrontShippingMethodsApi().then((methods) => {
      if (alive && Array.isArray(methods) && methods.length) setShippingMethods(methods);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (cart.length > 0) return undefined;

    let alive = true;
    getStorefrontProductsPageFromApi({ limit: 4, sort: "newest" })
      .then(({ products: items }) => {
        if (alive) setSuggestedProducts(items || []);
      })
      .catch(() => {
        if (alive) setSuggestedProducts([]);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedItems = cart.filter((item) => item.selected !== false);

  const subtotal = selectedItems.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );
  const selectedShipping =
    shippingMethods.find((item) => item.value === shippingMethod) || shippingMethods[0];
  const baseShippingFee = selectedItems.length ? Number(selectedShipping.fee || 0) : 0;
  const voucher = {
    valid: Boolean(appliedVoucher?.valid),
    discount: Number(appliedVoucher?.discount) || 0,
    shippingDiscount: Number(appliedVoucher?.shippingDiscount) || 0,
    message: appliedVoucher?.message || "",
  };

  const total = Math.max(
    0,
    subtotal + baseShippingFee - voucher.discount - voucher.shippingDiscount
  );

  // Xác thực mã giảm giá qua backend thật (khớp dữ liệu admin tạo), có debounce khi gõ.
  useEffect(() => {
    const code = voucherCode.trim().toUpperCase();

    if (!code) {
      setAppliedVoucher(null);
      return undefined;
    }

    let alive = true;
    setVoucherChecking(true);

    const delayDebounce = setTimeout(() => {
      validateStorefrontVoucherApi({ code, subtotal, shippingFee: baseShippingFee })
        .then((result) => {
          if (!alive) return;
          const message = result.message || "Áp dụng voucher thành công!";
          setAppliedVoucher({
            valid: true,
            discount: Number(result.discount) || 0,
            shippingDiscount: Number(result.shippingDiscount) || 0,
            message,
          });
          notify("success", message);
        })
        .catch((error) => {
          if (!alive) return;
          const message = error?.message || "Mã giảm giá không hợp lệ.";
          setAppliedVoucher({ valid: false, discount: 0, shippingDiscount: 0, message });
          notify("error", message);
        })
        .finally(() => {
          if (alive) setVoucherChecking(false);
        });
    }, 800);

    return () => {
      alive = false;
      clearTimeout(delayDebounce);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voucherCode, subtotal, baseShippingFee]);

  function updateCart(next) {
    const fixed = saveCart(next);
    setCart(fixed);
  }

  const availableMap = useMemo(() => {
    const map = new Map();
    cart.forEach((item) => {
      const available =
        Number(
          getStock(item.backendProductId || item.productId || item.id || item.slug || item.sku)
            .available
        ) ||
        Number(item.stock || 0) ||
        0;
      map.set(getCartIdentity(item), available);
    });
    return map;
  }, [cart]);

  function getAvailable(item) {
    return availableMap.get(getCartIdentity(item)) || 0;
  }

  function increaseQty(item) {
    const available = getAvailable(item);

    if ((item.quantity || 1) >= available) {
      notify("warning", `${t.stockAlert} ${available} ${t.stockAlertSuffix}`);
      return;
    }

    updateCart(
      cart.map((x) =>
        isSameCartItem(x, item) ? { ...x, quantity: (x.quantity || 1) + 1 } : x
      )
    );
  }
  function decreaseQty(item) {
    updateCart(
      cart.map((x) =>
        isSameCartItem(x, item)
          ? { ...x, quantity: Math.max(1, (x.quantity || 1) - 1) }
          : x
      )
    );
  }

  function toggleAll() {
    const allSelected = cart.every((item) => item.selected !== false);
    updateCart(cart.map((item) => ({ ...item, selected: !allSelected })));
  }

  function goCheckout() {
    if (!selectedItems.length) {
      notify("error", t.selectAtLeastOne);
      return;
    }

    const invalidItem = selectedItems.find(
      (item) => (item.quantity || 1) > getAvailable(item)
    );

    if (invalidItem) {
      notify(
        "error",
        `${getItemName(invalidItem, lang)}: ${t.stockAlert} ${getAvailable(invalidItem)} ${t.stockAlertSuffix}`
      );
      return;
    }

    saveCheckoutDraft({
      orderType: "normal",
      items: selectedItems.map((item) => ({
        ...item,
        id: item.id,
        backendProductId: item.backendProductId || "",
        productId: item.backendProductId || item.productId || item.id,
        sku: item.sku || "",
        slug: item.slug || "",
        name: getItemName(item, lang),
      })),
      subtotal,
      shippingFee: baseShippingFee,
      discount: voucher.discount,
      shippingDiscount: voucher.shippingDiscount,
      voucherCode: voucher.valid ? voucherCode.trim().toUpperCase() : "",
      total,
      shippingMethod,
    });

    navigate("/checkout");
  }

  return (
    <PageShell>
      <main className="min-h-screen bg-[#F5F7FB] px-4 pb-28 pt-6 md:px-6 md:pt-8 lg:pb-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
                {t.eyebrow}
              </p>
              <h1 className="mt-2 text-3xl font-black text-slate-950 md:text-4xl">
                {t.title}
              </h1>
            </div>

            <Link to="/shop" className="w-fit rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-600 shadow-sm">
              {t.continueShopping}
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
            <section className="space-y-4">
              <div className="hidden rounded-2xl bg-white px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-400 shadow-sm md:grid md:grid-cols-[40px_1fr_110px_130px_130px_56px]">
                <div>
                  <input
                    type="checkbox"
                    checked={cart.length > 0 && cart.every((item) => item.selected !== false)}
                    onChange={toggleAll}
                    className="h-5 w-5"
                  />
                </div>
                <div>{t.product}</div>
                <div className="text-right">{t.price}</div>
                <div className="text-center">{t.quantity}</div>
                <div className="text-right">{t.lineTotal}</div>
                <div></div>
              </div>

              {cart.length > 0 && (
                <label className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm md:hidden">
                  <span className="flex items-center gap-2 text-sm font-black text-slate-700">
                    <input
                      type="checkbox"
                      checked={cart.every((item) => item.selected !== false)}
                      onChange={toggleAll}
                      className="h-5 w-5"
                    />
                    {lang === "en" ? "Select all" : "Chọn tất cả"}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {selectedItems.length}/{cart.length}
                  </span>
                </label>
              )}

              {cart.length === 0 ? (
                <div className="rounded-3xl bg-white p-10 text-center shadow-sm md:p-16">
                  <div className="text-2xl font-black text-slate-800">{t.empty}</div>
                  <Link to="/shop" className="mt-5 inline-block rounded-2xl bg-blue-700 px-6 py-3 font-black text-white">
                    {t.shopNow}
                  </Link>

                  {suggestedProducts.length > 0 && (
                    <div className="mt-10 text-left">
                      <div className="mb-4 text-center text-sm font-black uppercase tracking-wide text-slate-400">
                        {lang === "en" ? "You might like" : "Có thể bạn thích"}
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {suggestedProducts.map((product) => (
                          <ProductCard key={product.id} product={product} lang={lang} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                cart.map((item) => {
                  const available = getAvailable(item);
                  const qty = item.quantity || 1;
                  const lineTotal = (Number(item.price) || 0) * qty;
                  const overStock = qty > available;
                  const itemName = getItemName(item, lang);

                  const toggleSelected = () => {
                    const updatedCart = cart.map((x) => {
                      if (isSameCartItem(x, item)) {
                        return { ...x, selected: item.selected === false ? true : false };
                      }
                      return x;
                    });
                    updateCart(updatedCart);
                  };

                  const removeItem = () => {
                    const nextCart = cart.filter((x) => !isSameCartItem(x, item));
                    updateCart(nextCart);
                    notify("error", lang === "en" ? "Removed product from cart." : "Đã xóa sản phẩm khỏi giỏ hàng.");
                  };

                  const badgeLine = (
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] font-bold text-slate-500">
                      <span>{t.authenticPack}</span>
                      <span className="text-slate-300">•</span>
                      <span className="inline-flex items-center gap-1 text-blue-700">
                        <ShieldCheck size={12} /> {t.guaranteed}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className={item.backendProductId ? "text-emerald-700" : "text-amber-700"}>
                        {item.backendProductId ? (item.sku || item.backendProductId) : "Local"}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className={available <= 0 ? "text-red-500" : ""}>
                        {t.availablePrefix} {available} {t.availableSuffix}
                      </span>
                    </div>
                  );

                  return (
                    <div
                      key={getCartIdentity(item)}
                      className={`rounded-2xl bg-white shadow-sm ${overStock ? "ring-2 ring-red-200" : ""}`}
                    >
                      {/* Desktop row */}
                      <div className="hidden md:grid md:grid-cols-[40px_1fr_110px_130px_130px_56px] md:items-center md:gap-4 md:p-4">
                        <input
                          type="checkbox"
                          checked={item.selected !== false}
                          onChange={toggleSelected}
                          className="h-5 w-5"
                        />

                        <div className="flex gap-4">
                          <img
                            src={item.image}
                            alt={itemName}
                            loading="lazy"
                            className="h-20 w-20 shrink-0 rounded-2xl bg-slate-100 object-cover"
                          />
                          <div className="min-w-0">
                            <h3 className="line-clamp-2 font-black text-slate-950">{itemName}</h3>
                            <div className="mt-2">{badgeLine}</div>
                            {overStock && (
                              <div className="mt-1.5 text-xs font-black text-red-500">{t.overStock}</div>
                            )}
                          </div>
                        </div>

                        <div className="text-right text-xs font-semibold text-slate-400">
                          {money(item.price)}
                        </div>

                        <div className="mx-auto flex w-fit items-center rounded-xl border border-slate-200">
                          <button
                            onClick={() => decreaseQty(item)}
                            className="rounded-l-xl p-2 hover:bg-slate-50"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-9 border-x border-slate-200 text-center text-sm font-black">{qty}</span>
                          <button
                            onClick={() => increaseQty(item)}
                            disabled={qty >= available}
                            className={`rounded-r-xl p-2 ${qty >= available
                              ? "cursor-not-allowed bg-slate-100 text-slate-300"
                              : "hover:bg-slate-50"
                              }`}
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <div className="text-right font-black text-red-500">{money(lineTotal)}</div>

                        <button
                          onClick={removeItem}
                          className="mx-auto rounded-xl bg-red-50 p-2.5 text-red-500 hover:bg-red-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Mobile card */}
                      <div className="p-3.5 md:hidden">
                        <div className="flex items-start gap-2">
                          <label className="-ml-2 flex h-11 w-8 shrink-0 items-start justify-center pt-1">
                            <input
                              type="checkbox"
                              checked={item.selected !== false}
                              onChange={toggleSelected}
                              className="h-4 w-4"
                            />
                          </label>
                          <img
                            src={item.image}
                            alt={itemName}
                            loading="lazy"
                            className="h-16 w-16 shrink-0 rounded-xl bg-slate-100 object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className="line-clamp-2 text-sm font-black text-slate-950">{itemName}</h3>
                            <div className="mt-1">{badgeLine}</div>
                          </div>
                          <button
                            onClick={removeItem}
                            className="h-fit shrink-0 rounded-lg bg-red-50 p-1.5 text-red-500"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        {overStock && (
                          <div className="mt-1.5 pl-7 text-[11px] font-black text-red-500">{t.overStock}</div>
                        )}

                        <div className="mt-2.5 flex items-center justify-between pl-7">
                          <div className="flex items-center rounded-lg border border-slate-200">
                            <button onClick={() => decreaseQty(item)} className="rounded-l-lg p-1.5">
                              <Minus size={13} />
                            </button>
                            <span className="w-7 border-x border-slate-200 text-center text-xs font-black">{qty}</span>
                            <button
                              onClick={() => increaseQty(item)}
                              disabled={qty >= available}
                              className={`rounded-r-lg p-1.5 ${qty >= available ? "cursor-not-allowed text-slate-300" : ""}`}
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-semibold text-slate-400">{money(item.price)}</div>
                            <div className="text-sm font-black text-red-500">{money(lineTotal)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </section>

            <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm lg:sticky lg:top-24">
              <h2 className="text-xl font-black text-slate-950">{t.paymentSummary}</h2>

              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <div className="text-sm font-black text-blue-800">{t.trustTitle}</div>
                <p className="mt-1 text-xs font-semibold leading-5 text-blue-700/80">{t.trustDesc}</p>
              </div>

              <div className="mt-3 rounded-2xl bg-blue-50 p-3.5">
                <div className="flex items-center gap-2 font-black text-blue-700">
                  <TicketPercent size={18} />
                  {t.voucher}
                </div>

                <input
                  value={voucherCode}
                  onChange={(e) => {
                    const value = e.target.value;
                    setVoucherCode(value);
                    try {
                      if (value.trim()) localStorage.setItem("gundam-saved-voucher", value.trim().toUpperCase());
                      else localStorage.removeItem("gundam-saved-voucher");
                    } catch { }
                  }}
                  placeholder={lang === "en" ? "Enter voucher code" : "Nhập mã giảm giá"}
                  className="mt-2.5 w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm outline-none"
                />

                {voucherCode && voucherChecking && (
                  <p className="mt-2 text-xs font-bold text-slate-400">
                    {lang === "en" ? "Checking voucher..." : "Đang kiểm tra mã..."}
                  </p>
                )}

                {voucherCode && !voucherChecking && voucher.message && (
                  <p className={`mt-2 text-xs font-bold ${voucher.valid ? "text-green-600" : "text-red-500"}`}>
                    {voucher.message}
                  </p>
                )}
              </div>

              <div className="mt-3 rounded-2xl bg-slate-50 p-3.5">
                <div className="mb-2.5 flex items-center gap-2 font-black text-slate-800">
                  <Truck size={18} />
                  {t.shipping}
                </div>

                <div className="grid gap-2">
                  {shippingMethods.map((method) => (
                    <label
                      key={method.value}
                      className={`cursor-pointer rounded-2xl border bg-white p-3 text-sm ${shippingMethod === method.value ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"
                        }`}
                    >
                      <input
                        type="radio"
                        name="cartShipping"
                        checked={shippingMethod === method.value}
                        onChange={() => setShippingMethod(method.value)}
                        className="mr-2"
                      />
                      <b>{getLocalized(method.label, lang)}</b>
                      <span className="ml-2 font-black text-red-500">{money(method.fee)}</span>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{getLocalized(method.desc, lang)}</p>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t.selectedItems}</span>
                  <b>{selectedItems.length}</b>
                </div>

                <div className="flex justify-between">
                  <span>{t.subtotal}</span>
                  <b>{money(subtotal)}</b>
                </div>

                <div className="flex justify-between">
                  <span>{t.shippingFee}</span>
                  <b>{money(baseShippingFee)}</b>
                </div>

                <div className="flex justify-between text-green-600">
                  <span>{t.productDiscount}</span>
                  <b>-{money(voucher.discount)}</b>
                </div>

                <div className="flex justify-between text-green-600">
                  <span>{t.shippingDiscount}</span>
                  <b>-{money(voucher.shippingDiscount)}</b>
                </div>

                <div className="flex justify-between border-t pt-3 text-xl font-black">
                  <span>{t.total}</span>
                  <span className="text-red-500">{money(total)}</span>
                </div>
              </div>

              <button
                onClick={goCheckout}
                className="mt-5 hidden w-full rounded-2xl bg-blue-700 py-4 font-black text-white shadow-lg hover:bg-blue-800 lg:block"
              >
                {t.checkout} ({selectedItems.length})
              </button>
            </aside>
          </div>
        </div>
      </main>

      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-6px_20px_rgba(15,23,42,0.08)] lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold text-slate-500">{t.total}</div>
              <div className="text-lg font-black text-red-500">{money(total)}</div>
            </div>
            <button
              onClick={goCheckout}
              className="rounded-xl bg-blue-700 px-6 py-3 text-sm font-black text-white shadow-lg hover:bg-blue-800"
            >
              {t.checkout} ({selectedItems.length})
            </button>
          </div>
        </div>
      )}

      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={dismiss} />
    </PageShell>
  );
}