import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, PackageSearch, Search } from "lucide-react";
import { getOrderById } from "../../services/OrderService";
import {
  claimPublicStorefrontOrderPaidApi,
  getOrderSuccessSnapshot,
  getStorefrontOrderByIdFromApi,
} from "../../services/StorefrontOrderLookupApiService";
import { claimMyStorefrontOrderPaidApi } from "../../services/StorefrontOrderApiService";
import { hasAccountToken } from "../../services/AccountApiService";
import PageShell from "../../components/common/PageShell";
import BankTransferInfo from "../../components/common/BankTransferInfo";
import OrderStatusStepper from "../../components/common/OrderStatusStepper";
import { useLang } from "../../store/CmsStore";
import { getOrderStatusLabel } from "../../constants/orderConfig";

const money = (n) => (Number(n) || 0).toLocaleString("vi-VN") + "đ";

function getCopy(lang) {
  return {
    title: lang === "en" ? "Order placed successfully" : "Đặt hàng thành công",
    thank:
      lang === "en"
        ? "Thank you for shopping at Gundam Store VN."
        : "Cảm ơn bạn đã đặt hàng tại Gundam Store VN.",
    checking: lang === "en" ? "Updating order status..." : "Đang cập nhật trạng thái đơn...",
    backendOrder: lang === "en" ? "Order recorded" : "Đơn hàng đã ghi nhận",
    localOrder: lang === "en" ? "Order recorded" : "Đơn hàng đã ghi nhận",
    notFound: lang === "en" ? "Order not found" : "Không tìm thấy đơn",
    publicCode: lang === "en" ? "Public lookup code" : "Mã tra cứu đơn",
    total: lang === "en" ? "Total payment" : "Tổng tiền",
    dueNow: lang === "en" ? "Due now (deposit)" : "Cần thanh toán ngay (đặt cọc)",
    dueOnDelivery: lang === "en" ? "Due on delivery" : "Sẽ thanh toán khi nhận hàng",
    status: lang === "en" ? "Status" : "Trạng thái",
    lookupHint:
      lang === "en"
        ? "Use this public code together with the phone number you entered at checkout to look up your order."
        : "Dùng mã tra cứu này cùng số điện thoại đã nhập khi đặt hàng để tra cứu đơn.",
    detail: lang === "en" ? "View order detail" : "Xem chi tiết đơn",
    lookup: lang === "en" ? "Lookup order" : "Tra cứu đơn",
    continueShopping: lang === "en" ? "Continue shopping" : "Tiếp tục mua hàng",
    claimedSuccessMessage:
      lang === "en"
        ? "Thank you! We've recorded your report. Please send a screenshot of your transfer via Zalo/Messenger (0935950649) for the fastest confirmation. Your order will be processed right after payment is confirmed."
        : "Cảm ơn bạn! Chúng tôi đã ghi nhận thông tin. Vui lòng gửi ảnh chụp chuyển khoản qua Zalo/Messenger (0935950649) để được xác nhận nhanh nhất. Đơn hàng sẽ được xử lý ngay sau khi xác nhận thanh toán thành công.",
    claimFailed:
      lang === "en"
        ? "Failed to report payment. Please try again."
        : "Gửi thông báo thất bại. Vui lòng thử lại.",
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
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState("");

  const localOrder = getOrderById(id);
  const order = backendOrder || successSnapshot?.order || localOrder;
  const source = backendOrder ? "synced" : localOrder ? "recorded" : "";
  const publicCode = order?.orderCode || order?.orderNo || order?.code || id;

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
        setApiError(error?.message || (lang === "en" ? "Unable to update order status." : "Chưa thể cập nhật trạng thái đơn."));
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id]);

  const lookupContact = successSnapshot?.lookup || {};
  const canClaimPaid =
    order?.paymentMethod === "BANK_TRANSFER" &&
    order?.paymentStatus !== "Paid" &&
    (hasAccountToken() || lookupContact.phone || lookupContact.email);

  async function handleClaimPaid() {
    if (!order) return;

    setClaiming(true);
    setClaimError("");

    try {
      const orderKey = order.orderNo || order.orderCode || id;
      const updated = hasAccountToken()
        ? await claimMyStorefrontOrderPaidApi(orderKey)
        : await claimPublicStorefrontOrderPaidApi(orderKey, lookupContact);

      setBackendOrder(updated);
    } catch (error) {
      setClaimError(error?.message || t.claimFailed);
    } finally {
      setClaiming(false);
    }
  }

  return (
    <PageShell>
      <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-6 md:py-10">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 text-center shadow-sm md:p-8">
          <CheckCircle2 className="mx-auto text-green-500" size={72} />

          <h1 className="mt-5 text-3xl font-black text-slate-900">{t.title}</h1>

          <p className="mt-3 text-slate-500">{t.thank}</p>

          <div className="mt-5">
            <span
              className={`rounded-full px-3 py-2 text-xs font-black ${
                source === "synced"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {loading
                ? t.checking
                : source === "synced"
                  ? t.backendOrder
                  : source === "recorded"
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

              {order.preorder ? (
                <>
                  <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:justify-between">
                    <span className="font-bold text-slate-500">{t.dueNow}</span>
                    <b className="text-red-500">{money(order.total)}</b>
                  </div>
                  {Number(order.preorder.remainingAmount) > 0 && (
                    <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:justify-between">
                      <span className="font-bold text-slate-500">{t.dueOnDelivery}</span>
                      <b className="text-red-500">{money(order.preorder.remainingAmount)}</b>
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:justify-between">
                  <span className="font-bold text-slate-500">{t.total}</span>
                  <b className="text-red-500">{money(order.total)}</b>
                </div>
              )}

              <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:justify-between">
                <span className="font-bold text-slate-500">{t.status}</span>
                <b>{getOrderStatusLabel(order.status, lang)}</b>
              </div>

              <div className="mt-5">
                <OrderStatusStepper order={order} lang={lang} />
              </div>

              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-700">
                {t.lookupHint}
              </div>

              <div className="mt-5">
                <BankTransferInfo
                  paymentMethod={order.paymentMethod}
                  paymentStatus={order.paymentStatus}
                  bankInfo={order.bankInfo}
                  lang={lang}
                  customerClaimedPaidAt={order.customerClaimedPaidAt}
                  onClaimPaid={canClaimPaid ? handleClaimPaid : null}
                  claiming={claiming}
                  claimError={claimError}
                  successMessage={t.claimedSuccessMessage}
                />
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to={`/order-lookup?code=${encodeURIComponent(publicCode)}${successSnapshot?.lookup?.phone ? `&phone=${encodeURIComponent(successSnapshot.lookup.phone)}` : ""}${successSnapshot?.lookup?.email ? `&email=${encodeURIComponent(successSnapshot.lookup.email)}` : ""}`}
              className="rounded-2xl bg-blue-700 px-6 py-4 font-black text-white"
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
    </PageShell>
  );
}
