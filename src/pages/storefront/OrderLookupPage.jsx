import { useState } from "react";
import { Link } from "react-router-dom";
import { LockKeyhole, PackageSearch, Search, ShieldCheck } from "lucide-react";
import { lookupPublicOrderFromApi } from "../../services/OrderService";
import {
  getOrderStatusLabel,
  getOrderStatusToneClass,
  maskPhone,
} from "../../constants/orderConfig";
import StorefrontShell from "../../components/storefront/StorefrontShell";
import { useLang } from "../../store/CmsStore";

const money = (n) => (Number(n) || 0).toLocaleString("vi-VN") + "đ";

function getCopy(lang) {
  return {
    eyebrow: lang === "en" ? "Order Lookup" : "Tra cứu đơn hàng",
    title: lang === "en" ? "Check your order status" : "Tra cứu trạng thái đơn hàng",
    desc:
      lang === "en"
        ? "Enter your order code and phone number to securely view your order."
        : "Nhập mã đơn và số điện thoại để kiểm tra đơn hàng an toàn hơn.",
    orderCode: lang === "en" ? "Order code" : "Mã đơn hàng",
    orderCodePlaceholder: lang === "en" ? "Example: ORD-... or GS-..." : "Ví dụ: ORD-... hoặc GS-...",
    phone: lang === "en" ? "Phone number" : "Số điện thoại",
    phonePlaceholder: lang === "en" ? "Example: 090..." : "Ví dụ: 090...",
    lookup: lang === "en" ? "Lookup order" : "Tra cứu đơn",
    notFound:
      lang === "en"
        ? "No matching order found. Please check both order code and phone number."
        : "Không tìm thấy đơn phù hợp. Vui lòng kiểm tra đúng mã đơn và số điện thoại.",
    needBoth:
      lang === "en"
        ? "Please enter both order code and phone number."
        : "Vui lòng nhập cả mã đơn và số điện thoại.",
    privacyTitle: lang === "en" ? "Privacy protected" : "Bảo vệ thông tin đơn hàng",
    privacyDesc:
      lang === "en"
        ? "For safety, order lookup requires both order code and phone number."
        : "Để an toàn, hệ thống yêu cầu cả mã đơn và số điện thoại khi tra cứu.",
    order: lang === "en" ? "Order" : "Đơn hàng",
    customer: lang === "en" ? "Customer" : "Khách hàng",
    phoneMasked: lang === "en" ? "Phone" : "SĐT",
    total: lang === "en" ? "Total" : "Tổng tiền",
    status: lang === "en" ? "Status" : "Trạng thái",
    viewDetail: lang === "en" ? "View detail" : "Xem chi tiết",
  };
}

export default function OrderLookupPage() {
  const [lang] = useLang();
  const t = getCopy(lang);

  const [orderCode, setOrderCode] = useState("");
  const [phone, setPhone] = useState("");
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  async function lookupOrder() {
    const code = orderCode.trim();
    const inputPhone = phone.trim();

    setSearched(true);
    setError("");
    setOrder(null);

    if (!code || !inputPhone) {
      setError(t.needBoth);
      return;
    }

    try {
      setLoading(true);
      const result = await lookupPublicOrderFromApi(code, {
        phone: inputPhone,
      });

      setOrder(result);
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
    <StorefrontShell>
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
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
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

              <button
                type="button"
                disabled={loading}
                onClick={lookupOrder}
                className={`rounded-2xl px-6 py-3 font-black text-white shadow-lg ${
                  loading
                    ? "cursor-not-allowed bg-slate-400"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                <Search size={18} className="mr-2 inline" />
                {loading ? (lang === "en" ? "Checking..." : "Đang tra cứu...") : t.lookup}
              </button>
            </div>

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
                      {t.order}: {order.id}
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

                    <Link
                      to={`/orders/${order.id}`}
                      className="mt-4 inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white"
                    >
                      {t.viewDetail}
                    </Link>
                  </div>
                </div>
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
    </StorefrontShell>
  );
}
