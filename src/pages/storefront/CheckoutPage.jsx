import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Truck, CreditCard, ShieldCheck, AlertCircle } from "lucide-react";
import {
  getCheckoutDraft,
  clearCheckoutDraft,
  clearCartItems,
} from "../../services/CartService";
import { applyVoucher } from "../../services/VoucherService";
import { validateStorefrontVoucherApi } from "../../services/StorefrontVoucherApiService";
import { createOrder } from "../../services/OrderService";
import {
  buildCreateOrderPayload,
  createStorefrontOrderApi,
} from "../../services/StorefrontOrderApiService";
import {
  mapBackendOrderForStorefront,
  saveOrderSuccessSnapshot,
} from "../../services/StorefrontOrderLookupApiService";
import StorefrontShell from "../../components/storefront/StorefrontShell";
import { getMyAccount, getMyAddresses, hasAccountToken } from "../../services/AccountApiService";
import {
  ORDER_TYPE,
  PAYMENT_METHODS,
  SHIPPING_METHODS,
  getLocalized,
  getShippingMethod,
} from "../../constants/orderConfig";
import { useLang } from "../../store/CmsStore";

const money = (n) => (Number(n) || 0).toLocaleString("vi-VN") + "đ";

function getCopy(lang) {
  return {
    eyebrow: lang === "en" ? "Checkout" : "Thanh toán",
    title: lang === "en" ? "Checkout your order" : "Thanh toán đơn hàng",
    noDraft: lang === "en" ? "No checkout data found" : "Không có dữ liệu checkout",
    backCart: lang === "en" ? "Back to cart" : "Quay lại giỏ hàng",
    addressTitle: lang === "en" ? "Shipping address" : "Địa chỉ nhận hàng",
    savedAddresses: lang === "en" ? "Saved addresses" : "Địa chỉ đã lưu",
    chooseSavedAddress: lang === "en" ? "Choose saved address" : "Chọn địa chỉ đã lưu",
    defaultAddress: lang === "en" ? "Default" : "Mặc định",
    name: lang === "en" ? "Recipient name" : "Họ tên người nhận",
    phone: lang === "en" ? "Phone number" : "Số điện thoại",
    province: lang === "en" ? "Province / City" : "Tỉnh / Thành phố",
    address: lang === "en" ? "Detailed address" : "Địa chỉ chi tiết",
    shippingTitle: lang === "en" ? "Shipping method" : "Phương thức vận chuyển",
    paymentTitle: lang === "en" ? "Payment method" : "Phương thức thanh toán",
    note: lang === "en" ? "Message for the shop" : "Lời nhắn cho shop",
    summary: lang === "en" ? "Order summary" : "Tóm tắt đơn hàng",
    saved: lang === "en" ? "Order will be saved into the order management system." : "Đơn hàng được lưu vào hệ thống quản lý đơn hàng.",
    subtotal: lang === "en" ? "Subtotal" : "Tạm tính",
    shippingFee: lang === "en" ? "Shipping fee" : "Phí vận chuyển",
    discount: lang === "en" ? "Discount" : "Giảm giá",
    shippingDiscount: lang === "en" ? "Shipping discount" : "Giảm phí ship",
    voucher: lang === "en" ? "Voucher" : "Voucher",
    voucherPlaceholder: lang === "en" ? "Enter voucher code" : "Nhập mã voucher",
    applyVoucher: lang === "en" ? "Apply" : "Áp dụng",
    voucherApplied: lang === "en" ? "Voucher applied." : "Đã áp dụng voucher.",
    total: lang === "en" ? "Total payment" : "Tổng thanh toán",
    placeOrder: lang === "en" ? "Place order" : "Đặt hàng",
    validationTitle: lang === "en" ? "Please check your information" : "Vui lòng kiểm tra thông tin",
    requiredName: lang === "en" ? "Recipient name is required." : "Vui lòng nhập họ tên người nhận.",
    invalidName: lang === "en" ? "Recipient name must be at least 2 characters." : "Họ tên phải có ít nhất 2 ký tự.",
    requiredPhone: lang === "en" ? "Phone number is required." : "Vui lòng nhập số điện thoại.",
    invalidPhone: lang === "en" ? "Phone number is invalid." : "Số điện thoại không hợp lệ.",
    requiredAddress: lang === "en" ? "Detailed address is required." : "Vui lòng nhập địa chỉ chi tiết.",
    invalidAddress: lang === "en" ? "Detailed address must be at least 8 characters." : "Địa chỉ chi tiết phải có ít nhất 8 ký tự.",
    invalidNote: lang === "en" ? "Note is too long." : "Ghi chú quá dài.",
    reviewHint:
      lang === "en"
        ? "Review your address, shipping and payment before placing the order."
        : "Kiểm tra địa chỉ, vận chuyển và thanh toán trước khi đặt hàng.",
    email: lang === "en" ? "Email optional" : "Email không bắt buộc",
    placing: lang === "en" ? "Placing order..." : "Đang đặt hàng...",
    apiFallback:
      lang === "en"
        ? "Backend order API failed, saved as local demo order."
        : "Backend order API lỗi, đã lưu đơn local demo.",
    preorderDeposit: lang === "en" ? "Pre-order deposit" : "Thông tin cọc pre-order",
    preorderFullAmount: lang === "en" ? "Full amount" : "Tổng giá trị đơn",
    preorderDepositNow: lang === "en" ? "Deposit now" : "Cọc hôm nay",
    preorderRemaining: lang === "en" ? "Remaining" : "Còn lại",
    preorderShippingHint:
      lang === "en"
        ? "Shipping fee will be confirmed when the item arrives."
        : "Phí vận chuyển sẽ được xác nhận khi hàng về.",
  };
}

function sanitizeText(value = "", max = 255) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizePhone(value = "") {
  return String(value || "").replace(/[^\d+]/g, "").trim();
}

function isValidVietnamPhone(phone = "") {
  const raw = normalizePhone(phone);
  return /^(0|\+84)(3|5|7|8|9)\d{8}$/.test(raw);
}

function getItemName(item, lang) {
  if (!item?.name) return "";
  if (typeof item.name === "string") return item.name;
  return getLocalized(item.name, lang, item.name?.vi || item.name?.en || "");
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [lang] = useLang();
  const t = getCopy(lang);

  const [draft, setDraft] = useState(null);
  const [errors, setErrors] = useState([]);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [apiNotice, setApiNotice] = useState("");
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherMessage, setVoucherMessage] = useState("");
  const [voucherBusy, setVoucherBusy] = useState(false);

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    province: "Hồ Chí Minh",
    note: "",
    paymentMethod: "COD",
    shippingMethod: "FAST",
  });

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");

  function applySavedAddress(address) {
    if (!address) return;

    setSelectedAddressId(address.id || "");
    setCustomer((prev) => ({
      ...prev,
      name: address.receiver || prev.name,
      phone: address.phone || prev.phone,
      address: address.address || prev.address,
      province: address.city || prev.province || "Hồ Chí Minh",
    }));
  }

  useEffect(() => {
    let alive = true;

    const checkoutDraft = getCheckoutDraft();
    setDraft(checkoutDraft);

    if (checkoutDraft?.shippingMethod) {
      setCustomer((prev) => ({
        ...prev,
        shippingMethod: checkoutDraft.shippingMethod,
      }));
    }

    if (hasAccountToken()) {
      Promise.all([
        getMyAccount(),
        getMyAddresses().catch(() => []),
      ])
        .then(([account, addresses]) => {
          if (!alive) return;

          const profile = account?.profile || {};
          const items = Array.isArray(addresses) ? addresses : [];
          const defaultAddress = items.find((item) => item.isDefault) || items[0] || null;

          setSavedAddresses(items);

          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id);
            setCustomer((prev) => ({
              ...prev,
              name: prev.name || defaultAddress.receiver || account?.name || "",
              email: prev.email || account?.email || "",
              phone: prev.phone || defaultAddress.phone || profile.phone || "",
              address: prev.address || defaultAddress.address || profile.address || "",
              province: prev.province || defaultAddress.city || profile.city || "Hồ Chí Minh",
            }));
            return;
          }

          setCustomer((prev) => ({
            ...prev,
            name: prev.name || account?.name || "",
            email: prev.email || account?.email || "",
            phone: prev.phone || profile.phone || "",
            address: prev.address || profile.address || "",
            province: prev.province || profile.city || "Hồ Chí Minh",
          }));
        })
        .catch((error) => {
          console.warn("Checkout account prefill skipped", error);
        });
    }

    return () => {
      alive = false;
    };
  }, []);

  const selectedShipping = getShippingMethod(customer.shippingMethod);
  const isPreorder = draft?.orderType === ORDER_TYPE.PREORDER;

  const pricing = useMemo(() => {
    if (!draft) {
      return {
        subtotal: 0,
        shippingFee: 0,
        discount: 0,
        shippingDiscount: 0,
        total: 0,
        voucherCode: "",
      };
    }

    const subtotal = Number(draft.subtotal) || 0;

    if (draft.orderType === ORDER_TYPE.PREORDER) {
      return {
        subtotal,
        shippingFee: 0,
        discount: 0,
        shippingDiscount: 0,
        total: Number(draft.preorder?.depositAmount || draft.total || 0),
        voucherCode: "",
      };
    }

    const shippingFee = Number(selectedShipping?.fee || 0);

    if (appliedVoucher?.code) {
      return {
        subtotal,
        shippingFee,
        discount: Number(appliedVoucher.discount) || 0,
        shippingDiscount: Number(appliedVoucher.shippingDiscount) || 0,
        total: Math.max(0, subtotal + shippingFee - (Number(appliedVoucher.discount) || 0) - (Number(appliedVoucher.shippingDiscount) || 0)),
        voucherCode: appliedVoucher.code,
      };
    }

    const voucher = applyVoucher(draft.voucherCode || "", subtotal, shippingFee);

    return {
      subtotal,
      shippingFee,
      discount: Number(voucher.discount) || 0,
      shippingDiscount: Number(voucher.shippingDiscount) || 0,
      total: Math.max(0, subtotal + shippingFee - (Number(voucher.discount) || 0) - (Number(voucher.shippingDiscount) || 0)),
      voucherCode: voucher.valid ? draft.voucherCode : "",
    };
  }, [draft, selectedShipping, appliedVoucher]);

  if (!draft) {
    return (
      <StorefrontShell>
        <main className="min-h-screen bg-slate-50 p-10">
          <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center">
            <h1 className="text-2xl font-black">{t.noDraft}</h1>
            <button
              onClick={() => navigate("/cart")}
              className="mt-5 rounded-2xl bg-blue-600 px-6 py-3 font-black text-white"
            >
              {t.backCart}
            </button>
          </div>
        </main>
      </StorefrontShell>
    );
  }

  async function applyBackendVoucher() {
    const code = String(voucherInput || "").trim().toUpperCase();

    if (!code) {
      setAppliedVoucher(null);
      setVoucherMessage("");
      return;
    }

    setVoucherBusy(true);
    setVoucherMessage("");

    try {
      const subtotal = Number(draft?.subtotal || 0);
      const shippingFee = Number(selectedShipping?.fee || 0);
      const result = await validateStorefrontVoucherApi({
        code,
        subtotal,
        shippingFee,
        items: draft?.items || [],
        customerPhone: customer.phone,
      });

      setAppliedVoucher({
        code: result.code,
        discount: Number(result.discount || 0),
        shippingDiscount: Number(result.shippingDiscount || 0),
        voucher: result.voucher || null,
      });
      setVoucherMessage(result.message || t.voucherApplied);
      setDraft((prev) => prev ? { ...prev, voucherCode: result.code } : prev);
    } catch (error) {
      setAppliedVoucher(null);
      setVoucherMessage(error?.message || "Voucher invalid.");
      setDraft((prev) => prev ? { ...prev, voucherCode: "" } : prev);
    } finally {
      setVoucherBusy(false);
    }
  }

  function validateCustomer() {
    const nextErrors = [];
    const name = sanitizeText(customer.name, 80);
    const phone = normalizePhone(customer.phone);
    const address = sanitizeText(customer.address, 180);
    const note = sanitizeText(customer.note, 300);

    if (!name) nextErrors.push(t.requiredName);
    else if (name.length < 2) nextErrors.push(t.invalidName);

    if (!phone) nextErrors.push(t.requiredPhone);
    else if (!isValidVietnamPhone(phone)) nextErrors.push(t.invalidPhone);

    if (!address) nextErrors.push(t.requiredAddress);
    else if (address.length < 8) nextErrors.push(t.invalidAddress);

    if (note.length > 280) nextErrors.push(t.invalidNote);

    setErrors(nextErrors);
    return nextErrors.length === 0;
  }

  function getReliableCheckoutAvailableStock(item = {}) {
    const stock = getStock(item.backendProductId || item.productId || item.id);
    const cachedStock = stock?.source && stock.source !== "missing"
      ? Number(stock.available || 0)
      : null;

    const itemStock = Number(item.stock ?? item.availableStock ?? 0);

    // Local inventory cache is not source of truth. If cache is missing and the
    // cart item has no reliable stock snapshot, do not block checkout here.
    // Backend create order will validate DB stock and return the real result.
    if (cachedStock !== null) return cachedStock;
    if (itemStock > 0) return itemStock;

    return null;
  }

  function validateDraftStock() {
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    if (isPreorder) return true;

    const invalidItem = (draft.items || []).find((item) => {
      const available = getReliableCheckoutAvailableStock(item);

      if (available === null) return false;

      return (Number(item.quantity) || 1) > available;
    });

    if (!invalidItem) return true;

    const available = getReliableCheckoutAvailableStock(invalidItem);

    setErrors([
      lang === "en"
        ? `${getItemName(invalidItem, lang)} only has ${Number(available || 0)} item(s) available.`
        : `${getItemName(invalidItem, lang)} chỉ còn ${Number(available || 0)} sản phẩm trong kho.`,
    ]);

    return false;
=======
=======
>>>>>>> Stashed changes
    // Do not validate stock from localStorage/cache at checkout.
    // Backend /api/orders is the final source of truth and will validate/decrement
    // product or variant stock in DB transaction.
    return true;
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
  }

  async function submitOrder() {
    if (placingOrder) return;
    if (!validateCustomer()) return;
    if (!validateDraftStock()) return;

    setPlacingOrder(true);
    setApiNotice("");

    const cleanCustomer = {
      name: sanitizeText(customer.name, 80),
      phone: normalizePhone(customer.phone),
      email: sanitizeText(customer.email || "", 120),
      address: sanitizeText(customer.address, 180),
      province: sanitizeText(customer.province || "Hồ Chí Minh", 80),
      note: sanitizeText(customer.note, 280),
      paymentMethod: customer.paymentMethod,
      shippingMethod: customer.shippingMethod,
    };

    try {
      if (!isPreorder) {
        const apiPayload = {
          ...buildCreateOrderPayload({
            customer: cleanCustomer,
            draft,
            pricing,
          }),
          voucherCode: pricing.voucherCode || "",
          discount: pricing.discount,
          shippingDiscount: pricing.shippingDiscount,
        };

        const apiOrder = await createStorefrontOrderApi(apiPayload);
        const mappedOrder = mapBackendOrderForStorefront(apiOrder);

        saveOrderSuccessSnapshot(mappedOrder, cleanCustomer);

        clearCartItems(draft.items.map((item) => item.id));
        clearCheckoutDraft();

        navigate(`/order-success/${mappedOrder.orderCode || mappedOrder.id}`);
        return;
      }

      const order = createOrder({
        orderType: ORDER_TYPE.PREORDER,
        preorder: draft.preorder || null,
        customer: cleanCustomer,
        items: draft.items.map((item) => ({
          ...item,
          name: getItemName(item, lang),
        })),
        subtotal: pricing.subtotal,
        shippingFee: pricing.shippingFee,
        discount: pricing.discount,
        shippingDiscount: pricing.shippingDiscount,
        voucherCode: pricing.voucherCode,
        total: pricing.total,
        paymentMethod: customer.paymentMethod,
        shippingMethod: customer.shippingMethod,
      });

      saveOrderSuccessSnapshot(order, cleanCustomer);

      clearCartItems(draft.items.map((item) => item.id));
      clearCheckoutDraft();

      navigate(`/order-success/${order.orderCode || order.id}`);
    } catch (error) {
      console.error("Create order API failed", error);

      if (!isPreorder) {
        setErrors([
          error?.message ||
          (lang === "en"
            ? "Cannot create backend order. Please check product mapping or stock."
            : "Không thể tạo đơn backend. Vui lòng kiểm tra mapping sản phẩm hoặc tồn kho."),
        ]);
        setApiNotice("");
        return;
      }

      setApiNotice(t.apiFallback);

      const order = createOrder({
        orderType: ORDER_TYPE.PREORDER,
        preorder: draft.preorder || null,
        customer: cleanCustomer,
        items: draft.items.map((item) => ({
          ...item,
          name: getItemName(item, lang),
        })),
        subtotal: pricing.subtotal,
        shippingFee: pricing.shippingFee,
        discount: pricing.discount,
        shippingDiscount: pricing.shippingDiscount,
        voucherCode: pricing.voucherCode,
        total: pricing.total,
        paymentMethod: customer.paymentMethod,
        shippingMethod: customer.shippingMethod,
      });

      saveOrderSuccessSnapshot(order, cleanCustomer);

      clearCartItems(draft.items.map((item) => item.id));
      clearCheckoutDraft();

      navigate(`/order-success/${order.orderCode || order.id}`);
    } finally {
      setPlacingOrder(false);
    }
  }

  return (
    <StorefrontShell>
      <main className="min-h-screen bg-[#F5F7FB] px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
            {t.eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950 md:text-4xl">
            {t.title}
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">{t.reviewHint}</p>


          {isPreorder && (
            <div className="mt-5 rounded-3xl border border-amber-100 bg-amber-50 p-5">
              <div className="text-sm font-black uppercase tracking-[0.2em] text-amber-700">
                {t.preorderDeposit}
              </div>
              <div className="mt-2 grid gap-3 text-sm font-semibold text-amber-900 md:grid-cols-3">
                <div>
                  <span className="block text-amber-700">{t.preorderFullAmount}</span>
                  <b>{money(draft.preorder?.fullAmount || draft.subtotal)}</b>
                </div>
                <div>
                  <span className="block text-amber-700">{t.preorderDepositNow}</span>
                  <b className="text-red-600">{money(draft.preorder?.depositAmount || pricing.total)}</b>
                </div>
                <div>
                  <span className="block text-amber-700">{t.preorderRemaining}</span>
                  <b>{money(draft.preorder?.remainingAmount || 0)}</b>
                </div>
              </div>
              <p className="mt-3 text-xs font-bold leading-5 text-amber-700">
                ETA: {draft.preorder?.eta || "-"} · {t.preorderShippingHint}
              </p>
            </div>
          )}

          {errors.length > 0 && (
            <div className="mt-5 rounded-3xl border border-red-100 bg-red-50 p-4 text-red-700">
              <div className="flex items-center gap-2 font-black">
                <AlertCircle size={18} />
                {t.validationTitle}
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-sm font-semibold">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {apiNotice && (
            <div className="mt-5 rounded-3xl border border-amber-100 bg-amber-50 p-4 text-sm font-black text-amber-700">
              {apiNotice}
            </div>
          )}

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_430px]">
            <section className="space-y-6">
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-xl font-black">
                  <MapPin size={22} /> {t.addressTitle}
                </h2>

                {savedAddresses.length > 0 && (
                  <div data-checkout-address-book="true" className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <div className="text-sm font-black text-blue-800">{t.savedAddresses}</div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {savedAddresses.map((address) => (
                        <button
                          key={address.id}
                          type="button"
                          onClick={() => applySavedAddress(address)}
                          className={`rounded-2xl border p-4 text-left text-sm transition ${selectedAddressId === address.id
                            ? "border-blue-500 bg-white ring-2 ring-blue-100"
                            : "border-blue-100 bg-white/70 hover:border-blue-300"
                            }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <b className="text-slate-950">{address.label || t.chooseSavedAddress}</b>
                            {address.isDefault && (
                              <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-black text-amber-700">
                                {t.defaultAddress}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 font-bold text-slate-700">
                            {address.receiver} · {address.phone}
                          </div>
                          <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                            {[address.address, address.ward, address.district, address.city].filter(Boolean).join(", ")}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <input
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    placeholder={t.name}
                    className="rounded-2xl border px-4 py-3 outline-none focus:border-blue-500"
                  />

                  <input
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    placeholder={t.phone}
                    inputMode="tel"
                    className="rounded-2xl border px-4 py-3 outline-none focus:border-blue-500"
                  />

                  <input
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    placeholder={t.email}
                    inputMode="email"
                    className="rounded-2xl border px-4 py-3 outline-none focus:border-blue-500"
                  />

                  <input
                    value={customer.province}
                    onChange={(e) => setCustomer({ ...customer, province: e.target.value })}
                    placeholder={t.province}
                    className="rounded-2xl border px-4 py-3 outline-none focus:border-blue-500"
                  />

                  <input
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    placeholder={t.address}
                    className="rounded-2xl border px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-xl font-black">
                  <Truck size={22} /> {t.shippingTitle}
                </h2>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {SHIPPING_METHODS.map((method) => (
                    <label
                      key={method.value}
                      className={`cursor-pointer rounded-2xl border p-4 hover:border-blue-500 ${customer.shippingMethod === method.value ? "border-blue-500 ring-2 ring-blue-100" : ""
                        }`}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        checked={customer.shippingMethod === method.value}
                        onChange={() => setCustomer({ ...customer, shippingMethod: method.value })}
                        className="mr-2"
                      />
                      <b>{getLocalized(method.label, lang)}</b>
                      <span className="ml-2 font-black text-red-500">{money(method.fee)}</span>
                      <p className="mt-1 text-sm text-slate-500">
                        {getLocalized(method.desc, lang)}
                      </p>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-xl font-black">
                  <CreditCard size={22} /> {t.paymentTitle}
                </h2>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {PAYMENT_METHODS.map((method) => (
                    <label
                      key={method.value}
                      className={`cursor-pointer rounded-2xl border p-4 hover:border-blue-500 ${customer.paymentMethod === method.value ? "border-blue-500 ring-2 ring-blue-100" : ""
                        }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={customer.paymentMethod === method.value}
                        onChange={() =>
                          setCustomer({ ...customer, paymentMethod: method.value })
                        }
                        className="mr-2"
                      />
                      <b>{getLocalized(method.label, lang)}</b>
                    </label>
                  ))}
                </div>

                <textarea
                  value={customer.note}
                  onChange={(e) => setCustomer({ ...customer, note: e.target.value })}
                  placeholder={t.note}
                  rows={4}
                  className="mt-5 w-full rounded-2xl border px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>
            </section>

            <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm lg:sticky lg:top-24">
              <h2 className="text-xl font-black">{t.summary}</h2>

              <div className="mt-5 max-h-80 space-y-4 overflow-y-auto pr-2">
                {draft.items.map((item) => {
                  const itemName = getItemName(item, lang);

                  return (
                    <div key={item.id} className="flex gap-3">
                      <img
                        src={item.image}
                        alt={itemName}
                        loading="lazy"
                        className="h-16 w-16 rounded-2xl bg-slate-100 object-cover"
                      />
                      <div className="flex-1">
                        <div className="font-bold">{itemName}</div>
                        <div className="mt-1 text-sm text-slate-500">
                          x{item.quantity || 1}
                        </div>
                      </div>
                      <b className="text-red-500">
                        {money((item.price || 0) * (item.quantity || 1))}
                      </b>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm font-bold text-blue-700">
                <ShieldCheck size={16} className="mr-1 inline" />
                {t.saved}
              </div>

              {/* CHECKOUT_VOUCHER_INPUT */}
              {!isPreorder && (
                <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <div className="mb-2 text-sm font-black text-blue-800">{t.voucher}</div>
                  <div className="flex gap-2">
                    <input
                      value={voucherInput}
                      onChange={(event) => setVoucherInput(event.target.value.toUpperCase())}
                      placeholder={t.voucherPlaceholder}
                      className="min-w-0 flex-1 rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-blue-400"
                    />
                    <button
                      type="button"
                      disabled={voucherBusy}
                      onClick={() => void applyBackendVoucher()}
                      className="rounded-xl bg-blue-700 px-4 py-2 text-xs font-black text-white disabled:opacity-50"
                    >
                      {voucherBusy ? "..." : t.applyVoucher}
                    </button>
                  </div>
                  {voucherMessage && (
                    <div className={`mt-2 text-xs font-black ${appliedVoucher ? "text-emerald-700" : "text-red-600"}`}>
                      {voucherMessage}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>{t.subtotal}</span>
                  <b>{money(pricing.subtotal)}</b>
                </div>

                <div className="flex justify-between">
                  <span>{t.shippingFee}</span>
                  <b>{money(pricing.shippingFee)}</b>
                </div>

                <div className="flex justify-between text-green-600">
                  <span>{t.discount}</span>
                  <b>-{money(pricing.discount)}</b>
                </div>

                <div className="flex justify-between text-green-600">
                  <span>{t.shippingDiscount}</span>
                  <b>-{money(pricing.shippingDiscount)}</b>
                </div>

                {pricing.voucherCode && (
                  <div className="flex justify-between text-blue-600">
                    <span>{t.voucher}</span>
                    <b>{pricing.voucherCode}</b>
                  </div>
                )}

                <div className="flex justify-between border-t pt-4 text-xl font-black">
                  <span>{t.total}</span>
                  <span className="text-red-500">{money(pricing.total)}</span>
                </div>
              </div>

              <button
                onClick={submitOrder}
                disabled={placingOrder}
                className="mt-6 w-full rounded-2xl bg-blue-600 py-4 font-black text-white shadow-lg hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {placingOrder ? t.placing : t.placeOrder}
              </button>

              <button
                onClick={() => navigate("/cart")}
                className="mt-3 w-full rounded-2xl border py-4 font-black text-slate-700 hover:bg-slate-50"
              >
                {t.backCart}
              </button>
            </aside>
          </div>
        </div>
      </main>
    </StorefrontShell>
  );
}