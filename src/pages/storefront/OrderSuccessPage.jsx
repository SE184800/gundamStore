import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, PackageSearch, Search } from "lucide-react";
import { getOrderById } from "../../services/OrderService";
import {
  getOrderSuccessSnapshot,
  getStorefrontOrderByIdFromApi,
} from "../../services/StorefrontOrderLookupApiService";
import StorefrontShell from "../../components/storefront/StorefrontShell";
import { useLang } from "../../store/CmsStore";

const money = (n) => (Number(n) || 0).toLocaleString("vi-VN") + "đ";

function getCopy(lang) {
  return {
    title: lang === "en" ? "Order placed successfully" : "Đặt hàng thành công",
    thank:
      lang === "en"
        ? "Thank you for shopping at Gundam Store VN."
        : "Cảm ơn bạn đã đặt hàng tại Gundam Store VN.",
    checking: lang === "en" ? "Checking backend order..." : "Đang kiểm tra đơn backend...",
    backendOrder: lang === "en" ? "PostgreSQL Order" : "Đơn PostgreSQL",
    localOrder: lang === "en" ? "Local Demo Order" : "Đơn demo local",
    notFound: lang === "en" ? "Order not found" : "Không tìm thấy đơn",
    publicCode: lang === "en" ? "Public lookup code" : "Mã tra cứu đơn",
    internalId: lang === "en" ? "Internal order ID" : "Mã đơn nội bộ",
    total: lang === "en" ? "Total payment" : "Tổng tiền",
    status: lang === "en" ? "Status" : "Trạng thái",
    lookupHint:
      lang === "en"
        ? "Use this public code together with the phone number you entered at checkout to look up your order."
        : "Dùng mã tra cứu này cùng số điện thoại đã nhập khi đặt hàng để tra cứu đơn.",
    detail: lang === "en" ? "View order detail" : "Xem chi tiết đơn",
    lookup: lang === "en" ? "Lookup order" : "Tra cứu đơn",
    continueShopping: lang === "en" ? "Continue shopping" : "Tiếp tục mua hàng",
  };
}

export default function OrderSuccessPage() {
  const params = useParams();
  const id = params.id || params.orderId;
  const [lang] = useLang();
  const t = getCopy(lang);

  const successSnapshot = getOrderSuccessSnapshot(id);
  const [backendOrder, setBackendOrder] = useState(successSnapshot?.order || null);
  const [loading, setLoading] = useState(Boolean(successSnapshot?.lookup?.phone || successSnapshot?.lookup?.email));
  const [apiError, setApiError] = useState("");

  const localOrder = getOrderById(id);
  const order = backendOrder || successSnapshot?.order || localOrder;
  const source = backendOrder ? "backend" : localOrder ? "local" : "";
  const publicCode = order?.orderCode || order?.orderNo || order?.code || order?.id || id;

  useEffect(() => {
    let alive = true;
    const lookup = successSnapshot?.lookup || {};

    if (!lookup.phone && !lookup.email) {
      setLoading(false);
      return () => {
        alive = false;
      };
    }

    setLoading(true);
    setApiError("");

    getStorefrontOrderByIdFromApi(id, lookup)
      .then((item) => {
        if (!alive) return;
        setBackendOrder(item);
        setApiError("");
      })
      .catch((error) => {
        if (!alive) return;
        // Keep the session snapshot visible; do not hide success page just because public lookup failed.
        setApiError(error?.message || "Backend order lookup failed.");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <StorefrontShell>
      <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-6 md:py-10">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 text-center shadow-sm md:p-8">
          <CheckCircle2 className="mx-auto text-green-500" size={72} />

          <h1 className="mt-5 text-3xl font-black text-slate-900">{t.title}</h1>

          <p className="mt-3 text-slate-500">{t.thank}</p>

          <div className="mt-5">
            <span
              className={`rounded-full px-3 py-2 text-xs font-black ${
                source === "backend"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {loading
                ? t.checking
                : source === "backend"
                  ? t.backendOrder
                  : source === "local"
                    ? t.localOrder
                    : apiError || t.notFound}
            </span>
          </div>

          {order && (
            <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-left">
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                <span className="font-bold text-slate-500">{t.publicCode}</span>
                <b className="break-all text-blue-600">{publicCode}</b>
              </div>

              {order.id && order.id !== publicCode && (
                <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:justify-between">
                  <span className="font-bold text-slate-500">{t.internalId}</span>
                  <b className="break-all text-slate-700">{order.id}</b>
                </div>
              )}

              <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:justify-between">
                <span className="font-bold text-slate-500">{t.total}</span>
                <b className="text-red-500">{money(order.total)}</b>
              </div>

              <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:justify-between">
                <span className="font-bold text-slate-500">{t.status}</span>
                <b>{order.status}</b>
              </div>

              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-700">
                {t.lookupHint}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to={`/order-lookup?code=${encodeURIComponent(publicCode)}${successSnapshot?.lookup?.phone ? `&phone=${encodeURIComponent(successSnapshot.lookup.phone)}` : ""}`}
              className="rounded-2xl bg-blue-600 px-6 py-4 font-black text-white"
            >
              <PackageSearch size={18} className="mr-2 inline" />
              {t.detail}
            </Link>

            <Link
              to="/order-lookup"
              className="rounded-2xl border px-6 py-4 font-black text-slate-700"
            >
              <Search size={18} className="mr-2 inline" />
              {t.lookup}
            </Link>

            <Link
              to="/"
              className="rounded-2xl border px-6 py-4 font-black text-slate-700"
            >
              {t.continueShopping}
            </Link>
          </div>
        </div>
      </main>
    </StorefrontShell>
  );
}
