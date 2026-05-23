import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Truck, CreditCard, ShieldCheck, AlertCircle } from "lucide-react";
import {
  getCheckoutDraft,
  clearCheckoutDraft,
  clearCartItems,
} from "../../services/CartService";
import { applyVoucher } from "../../services/VoucherService";
import { createOrder } from "../../services/OrderService";
import StorefrontShell from "../../components/storefront/StorefrontShell";
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

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    province: "Hồ Chí Minh",
    note: "",
    paymentMethod: "COD",
    shippingMethod: "FAST",
  });

  useEffect(() => {
    const checkoutDraft = getCheckoutDraft();
    setDraft(checkoutDraft);

    if (checkoutDraft?.shippingMethod) {
      setCustomer((prev) => ({
        ...prev,
        shippingMethod: checkoutDraft.shippingMethod,
      }));
    }
  }, []);

  const selectedShipping = getShippingMethod(customer.shippingMethod);

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
    const shippingFee = Number(selectedShipping?.fee || 0);
    const voucher = applyVoucher(draft.voucherCode || "", subtotal, shippingFee);

    return {
      subtotal,
      shippingFee,
      discount: Number(voucher.discount) || 0,
      shippingDiscount: Number(voucher.shippingDiscount) || 0,
      total: Math.max(0, subtotal + shippingFee - (Number(voucher.discount) || 0) - (Number(voucher.shippingDiscount) || 0)),
      voucherCode: voucher.valid ? draft.voucherCode : "",
    };
  }, [draft, selectedShipping]);

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

  function submitOrder() {
    if (!validateCustomer()) return;

    const cleanCustomer = {
      name: sanitizeText(customer.name, 80),
      phone: normalizePhone(customer.phone),
      address: sanitizeText(customer.address, 180),
      province: sanitizeText(customer.province || "Hồ Chí Minh", 80),
      note: sanitizeText(customer.note, 280),
      paymentMethod: customer.paymentMethod,
      shippingMethod: customer.shippingMethod,
    };

    const order = createOrder({
      orderType: ORDER_TYPE.NORMAL,
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

    clearCartItems(draft.items.map((item) => item.id));
    clearCheckoutDraft();

    navigate(`/order-success/${order.id}`);
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

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_430px]">
            <section className="space-y-6">
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-xl font-black">
                  <MapPin size={22} /> {t.addressTitle}
                </h2>

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
                      className={`cursor-pointer rounded-2xl border p-4 hover:border-blue-500 ${
                        customer.shippingMethod === method.value ? "border-blue-500 ring-2 ring-blue-100" : ""
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
                      className={`cursor-pointer rounded-2xl border p-4 hover:border-blue-500 ${
                        customer.paymentMethod === method.value ? "border-blue-500 ring-2 ring-blue-100" : ""
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
                className="mt-6 w-full rounded-2xl bg-blue-600 py-4 font-black text-white shadow-lg hover:bg-blue-700"
              >
                {t.placeOrder}
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
