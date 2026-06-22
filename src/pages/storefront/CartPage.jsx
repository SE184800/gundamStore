import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, TicketPercent, ShieldCheck, Truck } from "lucide-react";
import { getCart, saveCart, saveCheckoutDraft } from "../../services/CartService";
import { applyVoucher } from "../../services/VoucherService";
import { getStock } from "../../services/InventoryService";
import StorefrontShell from "../../components/storefront/StorefrontShell";
import { SHIPPING_METHODS, getLocalized, getShippingMethod } from "../../constants/orderConfig";
import { useI18n } from "../../i18n";
import Toast from "../../utils/Toast";

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
  const [toast, setToast] = useState({ show: false, type: "", message: "" });
  const navigate = useNavigate();
  const { lang } = useI18n();
  const t = getCopy(lang);
  const [cart, setCart] = useState(() => getCart());
  const [voucherCode, setVoucherCode] = useState("");
  const [shippingMethod, setShippingMethod] = useState("FAST");

  console.log("=== BẮT ĐẦU RENDER GIỎ HÀNG ===");
  console.log("1. Mảng cart tổng hiện tại trong State:", cart);

  const selectedItems = cart.filter((item) => item.selected !== false);

  const subtotal = selectedItems.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );
  const selectedShipping = getShippingMethod(shippingMethod);
  const baseShippingFee = selectedItems.length ? Number(selectedShipping.fee || 0) : 0;
  const voucher = applyVoucher(voucherCode, subtotal, baseShippingFee);

  const total = Math.max(
    0,
    subtotal + baseShippingFee - voucher.discount - voucher.shippingDiscount
  );

  console.log("4. Tổng số tiền thanh toán cuối cùng (total):", total);
  console.log("=================================");

  // 🟢 BỔ SUNG 1: Tự động bắn Toast khi hệ thống kiểm tra xong mã Voucher
  useEffect(() => {
    if (!voucherCode) return;

    const delayDebounce = setTimeout(() => {
      setToast({
        show: true,
        type: voucher.valid ? "success" : "error",
        message: voucher.message || (voucher.valid ? "Áp dụng voucher thành công!" : "Mã giảm giá không hợp lệ.")
      });
    }, 800);

    return () => clearTimeout(delayDebounce);
  }, [voucher.valid, voucherCode]);

  function updateCart(next) {
    console.log("👉 Hàm updateCart ĐÃ ĐƯỢC KÍCH HOẠT!");
    console.log("👉 Dữ liệu mảng NEXT chuẩn bị lưu:", next);

    localStorage.setItem("gundam-cart-final", JSON.stringify(next));

    if (typeof emitCartUpdated === "function") {
      emitCartUpdated(next);
    }

    setCart([...next]);
  }

  function getAvailable(item) {
    return Number(
      getStock(item.backendProductId || item.productId || item.id || item.slug || item.sku).available
    ) || Number(item.stock || 0) || 0;
  }

  function increaseQty(item) {
    const available = getAvailable(item);

    if ((item.quantity || 1) >= available) {
      setToast({
        show: true,
        type: "warning",
        message: `${t.stockAlert} ${available} ${t.stockAlertSuffix}`
      });
      return;
    }

    updateCart(
      cart.map((x) =>
        isSameCartItem(x, item) ? { ...x, quantity: (x.quantity || 1) + 1 } : x
      )
    );
  }
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, type: "", message: "" });
      }, 2000); // 3 giây tự động reset
      return () => clearTimeout(timer);
    }
  }, [toast.show]);
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
      setToast({
        show: true,
        type: "error",
        message: t.selectAtLeastOne
      });
      return;
    }

    const invalidItem = selectedItems.find(
      (item) => (item.quantity || 1) > getAvailable(item)
    );

    if (invalidItem) {
      setToast({
        show: true,
        type: "error",
        message: `${getItemName(invalidItem, lang)}: ${t.stockAlert} ${getAvailable(invalidItem)} ${t.stockAlertSuffix}`
      });
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
    <StorefrontShell>
      <main className="min-h-screen bg-[#F5F7FB] px-4 py-6 md:px-6 md:py-8">
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
              <div className="hidden rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-500 shadow-sm md:grid md:grid-cols-[40px_1fr_130px_140px_150px_70px]">
                <div>
                  <input
                    type="checkbox"
                    checked={cart.length > 0 && cart.every((item) => item.selected !== false)}
                    onChange={toggleAll}
                    className="h-5 w-5"
                  />
                </div>
                <div>{t.product}</div>
                <div>{t.price}</div>
                <div>{t.quantity}</div>
                <div>{t.lineTotal}</div>
                <div></div>
              </div>

              {cart.length === 0 ? (
                <div className="rounded-3xl bg-white p-16 text-center shadow-sm">
                  <div className="text-2xl font-black text-slate-800">{t.empty}</div>
                  <Link to="/shop" className="mt-5 inline-block rounded-2xl bg-blue-600 px-6 py-3 font-black text-white">
                    {t.shopNow}
                  </Link>
                </div>
              ) : (
                cart.map((item) => {
                  const available = getAvailable(item);
                  const qty = item.quantity || 1;
                  const lineTotal = (Number(item.price) || 0) * qty;
                  const overStock = qty > available;
                  const itemName = getItemName(item, lang);

                  return (
                    <div
                      key={getCartIdentity(item)}
                      className={`grid items-center gap-4 rounded-3xl bg-white p-5 shadow-sm md:grid-cols-[40px_1fr_130px_140px_150px_70px] ${overStock ? "ring-2 ring-red-200" : ""
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.selected !== false}
                        onChange={() => {
                          const updatedCart = cart.map((x) => {
                            if (isSameCartItem(x, item)) {
                              return { ...x, selected: item.selected === false ? true : false };
                            }
                            return x;
                          });
                          updateCart(updatedCart);
                        }}
                        className="h-5 w-5"
                      />

                      <div className="flex gap-4">
                        <img
                          src={item.image}
                          alt={itemName}
                          loading="lazy"
                          className="h-24 w-24 rounded-2xl bg-slate-100 object-cover"
                        />
                        <div>
                          <h3 className="font-black text-slate-950">{itemName}</h3>
                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            {t.authenticPack}
                          </p>

                          <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                            <ShieldCheck size={13} /> {t.guaranteed}
                          </div>

                          <div className={`mt-2 inline-flex rounded-full px-3 py-1 text-[11px] font-black ${item.backendProductId
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                            }`}>
                            {item.backendProductId ? `DB Product • ${item.sku || item.backendProductId}` : "Local product"}
                          </div>

                          <div className={`mt-2 text-xs font-black ${available <= 0 ? "text-red-500" : "text-slate-500"}`}>
                            {t.availablePrefix} {available} {t.availableSuffix}
                          </div>

                          {overStock && (
                            <div className="mt-1 text-xs font-black text-red-500">
                              {t.overStock}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="font-black text-red-500">{money(item.price)}</div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => decreaseQty(item)}
                          className="rounded-xl border p-2 hover:bg-slate-50"
                        >
                          <Minus size={15} />
                        </button>

                        <span className="w-10 text-center font-black">{qty}</span>

                        <button
                          onClick={() => increaseQty(item)}
                          disabled={qty >= available}
                          className={`rounded-xl border p-2 ${qty >= available
                            ? "cursor-not-allowed bg-slate-100 text-slate-300"
                            : "hover:bg-slate-50"
                            }`}
                        >
                          <Plus size={15} />
                        </button>
                      </div>

                      <div className="font-black text-slate-950">{money(lineTotal)}</div>

                      {/* 🟢 BỔ SUNG 2: Sửa nút xóa để kích hoạt Toast thành công */}
                      <button
                        onClick={() => {
                          const nextCart = cart.filter((x) => !isSameCartItem(x, item));
                          updateCart(nextCart);
                          setToast({
                            show: true,
                            type: "error",
                            message: lang === "en" ? "Removed product from cart." : "Đã xóa sản phẩm khỏi giỏ hàng."
                          });
                        }}
                        className="rounded-xl bg-red-50 p-3 text-red-500 hover:bg-red-100"
                      >
                        <Trash2 size={18} />
                      </button>
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

              <div className="mt-5 rounded-2xl bg-blue-50 p-4">
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
                  placeholder="GUNDAM10 / FREESHIP / VIP50"
                  className="mt-3 w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm outline-none"
                />

                {voucherCode && (
                  <p className={`mt-2 text-xs font-bold ${voucher.valid ? "text-green-600" : "text-red-500"}`}>
                    {voucher.message}
                  </p>
                )}
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <div className="mb-3 flex items-center gap-2 font-black text-slate-800">
                  <Truck size={18} />
                  {t.shipping}
                </div>

                <div className="grid gap-2">
                  {SHIPPING_METHODS.map((method) => (
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

              <div className="mt-5 space-y-3 text-sm">
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

                <div className="flex justify-between border-t pt-4 text-xl font-black">
                  <span>{t.total}</span>
                  <span className="text-red-500">{money(total)}</span>
                </div>
              </div>

              <button
                onClick={goCheckout}
                className="mt-6 w-full rounded-2xl bg-blue-600 py-4 font-black text-white shadow-lg hover:bg-blue-700"
              >
                {t.checkout} ({selectedItems.length})
              </button>
            </aside>
          </div>
        </div>
      </main>
      {toast.show && (
        <div className="fixed bottom-5 right-5 z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Toast
            show={toast.show}
            type={toast.type}
            message={toast.message}
            onClose={() => setToast({ ...toast, show: false })}
          />
        </div>
      )}
    </StorefrontShell>
  );
}