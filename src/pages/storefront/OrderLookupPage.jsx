import { useEffect, useState } from "react";

import { LockKeyhole, PackageSearch, Search, ShieldCheck } from "lucide-react";
import { lookupPublicOrderFromApi } from "../../services/OrderService";
import {
  getOrderStatusLabel,
  getOrderStatusToneClass,
  maskPhone,
} from "../../constants/orderConfig";
import PageShell from "../../components/common/PageShell";
import { useLang } from "../../store/CmsStore";

const money = (n) => (Number(n) || 0).toLocaleString("vi-VN") + "đ";

function getCopy(lang) {
  return {
    eyebrow: lang === "en" ? "Order Lookup" : "Tra cứu đơn hàng",
    title: lang === "en" ? "Check your order status" : "Tra cứu trạng thái đơn hàng",
    desc:
      lang === "en"
        ? "Enter your order code and either your phone number or email to securely view your order."
        : "Nhập mã đơn cùng số điện thoại hoặc email để kiểm tra đơn hàng an toàn hơn.",
    orderCode: lang === "en" ? "Order code" : "Mã đơn hàng",
    orderCodePlaceholder: lang === "en" ? "Example: ORD-... or GS-..." : "Ví dụ: ORD-... hoặc GS-...",
    phone: lang === "en" ? "Phone number" : "Số điện thoại",
    phonePlaceholder: lang === "en" ? "Example: 090..." : "Ví dụ: 090...",
    email: lang === "en" ? "Email" : "Email",
    emailPlaceholder: lang === "en" ? "Example: name@email.com" : "Ví dụ: ten@email.com",
    verifyHint: lang === "en" ? "Enter at least one" : "Nhập ít nhất một trong hai",
    lookup: lang === "en" ? "Lookup order" : "Tra cứu đơn",
    notFound:
      lang === "en"
        ? "No matching order found. Please check your order code and verification info."
        : "Không tìm thấy đơn phù hợp. Vui lòng kiểm tra đúng mã đơn và thông tin xác minh.",
    needBoth:
      lang === "en"
        ? "Please enter the order code and either your phone number or email."
        : "Vui lòng nhập mã đơn và số điện thoại hoặc email.",
    privacyTitle: lang === "en" ? "Privacy protected" : "Bảo vệ thông tin đơn hàng",
    privacyDesc:
      lang === "en"
        ? "For safety, order lookup requires the order code and either your phone number or email."
        : "Để an toàn, hệ thống yêu cầu mã đơn và số điện thoại hoặc email khi tra cứu.",
    order: lang === "en" ? "Order" : "Đơn hàng",
    customer: lang === "en" ? "Customer" : "Khách hàng",
    phoneMasked: lang === "en" ? "Phone" : "SĐT",
    total: lang === "en" ? "Total" : "Tổng tiền",
    status: lang === "en" ? "Status" : "Trạng thái",
    viewDetail: lang === "en" ? "View detail" : "Xem chi tiết",
    hideDetail: lang === "en" ? "Hide detail" : "Ẩn chi tiết",
    items: lang === "en" ? "Items" : "Sản phẩm",
    quantity: lang === "en" ? "Qty" : "SL",
    address: lang === "en" ? "Address" : "Địa chỉ",
  };
}

export default function OrderLookupPage() {
  const [lang] = useLang();
  const t = getCopy(lang);

  const [orderCode, setOrderCode] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code") || "";
    const phoneParam = params.get("phone") || "";
    const emailParam = params.get("email") || "";

    if (code) setOrderCode(code);
    if (phoneParam) setPhone(phoneParam);
    if (emailParam) setEmail(emailParam);
  }, []);

  async function lookupOrder() {
    const code = orderCode.trim();
    const inputPhone = phone.trim();
    const inputEmail = email.trim();

    setSearched(true);
    setError("");
    setOrder(null);

    if (!code || (!inputPhone && !inputEmail)) {
      setError(t.needBoth);
      return;
    }

    try {
      setLoading(true);
      const result = await lookupPublicOrderFromApi(code, {
        phone: inputPhone,
        email: inputEmail,
      });

      setOrder(result);
      setShowDetail(false);
    } catch (err) {
      if (err?.status === 404) {
        setError(t.notFound);
      } else if (err?.status === 429) {
        setError(err?.message || "Bạn thao tác quá nhanh. Vui lòng thử lại sau.");
      } else {
        setError(err?.message || t.notFound);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <main className="min-h-screen bg-[#F5F7FB] px-4 py-8 md:px-6 md:py-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
            {t.eyebrow}
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-950 md:text-4xl">
            {t.title}
          </h1>

          <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-500">
            {t.desc}
          </p>

          <div className="mt-6 rounded-3xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <LockKeyhole className="mt-0.5 text-blue-700" size={22} />
              <div>
                <div className="font-black text-blue-800">{t.privacyTitle}</div>
                <p className="mt-1 text-sm font-semibold text-blue-700/80">{t.privacyDesc}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-3xl bg-white p-5 shadow-sm md:p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="text-sm font-black text-slate-700">{t.orderCode}</span>
                <input
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value)}
                  placeholder={t.orderCodePlaceholder}
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-700">{t.phone}</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.phonePlaceholder}
                  inputMode="tel"
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  {t.email} <span className="font-semibold text-slate-400">({t.verifyHint})</span>
                </span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  inputMode="email"
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </label>
            </div>

            <button
              type="button"
              disabled={loading || !orderCode.trim() || (!phone.trim() && !email.trim())}
              onClick={lookupOrder}
              className={`mt-4 w-full rounded-2xl px-6 py-3 font-black text-white shadow-lg md:w-auto ${
                loading || !orderCode.trim() || (!phone.trim() && !email.trim())
                  ? "cursor-not-allowed bg-slate-400"
                  : "bg-blue-700 hover:bg-blue-800"
              }`}
            >
              <Search size={18} className="mr-2 inline" />
              {loading ? (lang === "en" ? "Checking..." : "Đang tra cứu...") : t.lookup}
            </button>

            {error && (
              <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-black text-red-600">
                {error}
              </div>
            )}
          </div>

          <div className="mt-6">
            {order && (
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                  <div>
                    <div className="flex items-center gap-2 font-black text-blue-600">
                      <PackageSearch size={18} />
                      {t.order}: {order.orderCode}
                    </div>

                    <div className="mt-2 text-sm font-semibold text-slate-500">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "-"}
                    </div>

                    <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                      <div>
                        <b>{t.customer}:</b> {order.customer?.name || "-"}
                      </div>
                      <div>
                        <b>{t.phoneMasked}:</b> {maskPhone(order.customer?.phone || "-")}
                      </div>
                    </div>

                    <div className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-black ${getOrderStatusToneClass(order.status)}`}>
                      <ShieldCheck size={14} className="mr-1" />
                      {t.status}: {getOrderStatusLabel(order.status, lang)}
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    <div className="text-sm font-bold text-slate-500">{t.total}</div>
                    <div className="text-2xl font-black text-red-500">{money(order.total)}</div>

                    <button
                      type="button"
                      onClick={() => setShowDetail((value) => !value)}
                      className="mt-4 inline-block rounded-xl bg-blue-700 px-4 py-2 text-sm font-black text-white"
                    >
                      {showDetail ? t.hideDetail : t.viewDetail}
                    </button>
                  </div>
                </div>

                {showDetail && (
                  <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="grid gap-3 text-sm font-semibold text-slate-600 md:grid-cols-2">
                      <div>
                        <b>{t.address}:</b> {order.customer?.address || "-"}
                      </div>
                      <div>
                        <b>{t.order}:</b> {order.orderCode}
                      </div>
                    </div>

                    <div className="mt-4 text-sm font-black text-slate-950">{t.items}</div>
                    <div className="mt-2 divide-y divide-slate-200 rounded-2xl bg-white">
                      {(order.items || []).map((item) => (
                        <div key={item.id || item.sku || item.name} className="flex items-center justify-between gap-3 p-3 text-sm">
                          <div className="font-bold text-slate-700">{item.productName || item.name || item.sku}</div>
                          <div className="shrink-0 font-black text-slate-950">
                            {t.quantity}: {item.quantity || item.qty || 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {searched && !order && !error && (
              <div className="rounded-3xl bg-white p-10 text-center font-bold text-slate-400">
                {t.notFound}
              </div>
            )}
          </div>
        </div>
      </main>
    </PageShell>
  );
}
