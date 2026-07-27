import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  MessageSquare,
  Package,
  RotateCcw,
  ShieldCheck,
  Truck,
  Undo2,
  XCircle,
} from "lucide-react";
import { ORDER_STATUS } from "../../services/OrderService";
import {
  CANCEL_REASONS,
  RETURN_REASONS,
  PREORDER_STATUS,
  canCustomerCancelDirect,
  canCustomerRequestCancel,
  canCustomerRequestReturn,
  getLocalized,
  getOrderStatusLabel,
  getOrderStatusToneClass,
  maskPhone,
} from "../../constants/orderConfig";
import { getCart, saveCart } from "../../services/CartService";
import PageShell from "../../components/common/PageShell";
import { cancelMyStorefrontOrderApi, getMyStorefrontOrderByIdApi } from "../../services/StorefrontOrderApiService";
import { createStorefrontComplaintApi } from "../../services/StorefrontComplaintApiService";
import { useLang } from "../../store/CmsStore";
import useToast from "../../hooks/useToast";
import Toast from "../../utils/Toast";

const money = (n) => (Number(n) || 0).toLocaleString("vi-VN") + "đ";

const PUBLIC_STEPS = [
  ORDER_STATUS.PLACED,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PACKING,
  ORDER_STATUS.SHIPPING,
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.COMPLETED,
];

function getCopy(lang) {
  return {
    back: lang === "en" ? "Back to orders" : "Quay lại đơn hàng",
    notFound: lang === "en" ? "Order not found" : "Không tìm thấy đơn hàng",
    orderTracking: lang === "en" ? "Order Tracking" : "Theo dõi đơn hàng",
    createdAt: lang === "en" ? "Created at" : "Ngày đặt",
    currentStatus: lang === "en" ? "Current status" : "Trạng thái hiện tại",
    products: lang === "en" ? "Order items" : "Sản phẩm trong đơn",
    quantity: lang === "en" ? "Quantity" : "Số lượng",
    timeline: lang === "en" ? "Processing history" : "Lịch sử xử lý",
    delivery: lang === "en" ? "Delivery information" : "Thông tin nhận hàng",
    recipient: lang === "en" ? "Recipient" : "Người nhận",
    phone: lang === "en" ? "Phone" : "SĐT",
    province: lang === "en" ? "Province/City" : "Tỉnh/TP",
    address: lang === "en" ? "Address" : "Địa chỉ",
    note: lang === "en" ? "Note" : "Ghi chú",
    payment: lang === "en" ? "Payment" : "Thanh toán",
    subtotal: lang === "en" ? "Subtotal" : "Tạm tính",
    shippingFee: lang === "en" ? "Shipping fee" : "Phí vận chuyển",
    discount: lang === "en" ? "Discount" : "Giảm giá",
    shippingDiscount: lang === "en" ? "Shipping discount" : "Giảm ship",
    voucher: lang === "en" ? "Voucher" : "Voucher",
    paymentMethod: lang === "en" ? "Payment method" : "Thanh toán",
    total: lang === "en" ? "Total" : "Tổng",
    buyAgain: lang === "en" ? "Buy again" : "Mua lại",
    cancelOrder: lang === "en" ? "Cancel order" : "Hủy đơn",
    requestCancel: lang === "en" ? "Request cancellation" : "Yêu cầu hủy đơn",
    requestReturn: lang === "en" ? "Request return/refund" : "Yêu cầu trả hàng/hoàn tiền",
    requestBalancePayment: lang === "en" ? "I paid the remaining balance" : "Tôi đã thanh toán phần còn lại",
    balancePending:
      lang === "en"
        ? "Your remaining balance payment confirmation is waiting for shop review."
        : "Xác nhận thanh toán phần còn lại đang chờ shop xử lý.",
    balancePaymentNote:
      lang === "en"
        ? "Enter transfer reference or note for the shop:"
        : "Nhập mã giao dịch/chứng từ hoặc ghi chú cho shop:",
    cannotCancel:
      lang === "en"
        ? "This order cannot be cancelled at the current status. You can request return/refund after delivery."
        : "Đơn hiện không thể hủy ở trạng thái này. Sau khi nhận hàng, bạn có thể gửi yêu cầu trả hàng/hoàn tiền.",
    reason: lang === "en" ? "Reason" : "Lý do",
    detailNote: lang === "en" ? "Additional note" : "Ghi chú thêm",
    submit: lang === "en" ? "Submit request" : "Gửi yêu cầu",
    close: lang === "en" ? "Close" : "Đóng",
    requestPending: lang === "en" ? "Request pending" : "Yêu cầu đang chờ xử lý",
    cancelPending:
      lang === "en"
        ? "Your cancellation request is waiting for shop review."
        : "Yêu cầu hủy đơn đang chờ shop xử lý.",
    returnPending:
      lang === "en"
        ? "Your return/refund request is waiting for shop review."
        : "Yêu cầu trả hàng/hoàn tiền đang chờ shop xử lý.",
    cancelledSuccess:
      lang === "en"
        ? "Order cancelled successfully."
        : "Đơn hàng đã được hủy thành công.",
    requestSent:
      lang === "en"
        ? "Request submitted successfully."
        : "Đã gửi yêu cầu thành công.",
    chooseReason:
      lang === "en"
        ? "Please choose a reason."
        : "Vui lòng chọn lý do.",
    trackingHint:
      lang === "en"
        ? "Track status, delivery information and support requests in one place."
        : "Theo dõi trạng thái, thông tin giao hàng và yêu cầu hỗ trợ trong một màn hình.",
  };
}


function PreorderProgressTracker({ order, lang }) {
  if (order.orderType !== "preorder" || !order.preorder) return null;

  const current = order.preorder.status || PREORDER_STATUS.DEPOSIT_PENDING;

  const steps = [
    {
      key: PREORDER_STATUS.DEPOSIT_PENDING,
      vi: "Chờ xác nhận cọc",
      en: "Deposit pending",
    },
    {
      key: PREORDER_STATUS.DEPOSIT_PAID,
      vi: "Đã xác nhận cọc",
      en: "Deposit confirmed",
    },
    {
      key: PREORDER_STATUS.WAITING_ARRIVAL,
      vi: "Chờ hàng về",
      en: "Waiting arrival",
    },
    {
      key: PREORDER_STATUS.READY_FOR_BALANCE,
      vi: "Hàng đã về",
      en: "Ready for balance",
    },
    {
      key: PREORDER_STATUS.BALANCE_PAID,
      vi: "Đã thanh toán còn lại",
      en: "Balance paid",
    },
  ];

  const currentIndex = Math.max(0, steps.findIndex((step) => step.key === current));

  return (
    <div className="mt-6 rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <h2 className="text-xl font-black text-slate-950">
            {lang === "en" ? "Pre-order progress" : "Tiến trình pre-order"}
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {lang === "en"
              ? "Track deposit, arrival ETA and remaining balance status."
              : "Theo dõi cọc, ETA hàng về và trạng thái thanh toán phần còn lại."}
          </p>
        </div>

        <div className="rounded-2xl bg-violet-50 px-4 py-2 text-sm font-black text-violet-700">
          ETA: {order.preorder.eta || "-"}
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-5">
        {steps.map((step, index) => {
          const active = index <= currentIndex;
          return (
            <div
              key={step.key}
              className={`rounded-2xl p-4 text-center text-xs font-black ${
                active
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-100"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                {index + 1}
              </div>
              {lang === "en" ? step.en : step.vi}
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-amber-50 p-4">
          <div className="text-xs font-black uppercase text-amber-700">
            {lang === "en" ? "Deposit" : "Tiền cọc"}
          </div>
          <div className="mt-1 text-xl font-black text-red-600">
            {money(order.preorder.depositAmount || order.total)}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="text-xs font-black uppercase text-slate-500">
            {lang === "en" ? "Remaining" : "Còn lại"}
          </div>
          <div className="mt-1 text-xl font-black text-slate-950">
            {money(order.preorder.remainingAmount || 0)}
          </div>
        </div>

        <div className="rounded-2xl bg-blue-50 p-4">
          <div className="text-xs font-black uppercase text-blue-700">
            {lang === "en" ? "Balance request" : "Yêu cầu thanh toán còn lại"}
          </div>
          <div className="mt-1 text-sm font-black text-blue-800">
            {order.preorder.balancePaymentRequest?.status || "-"}
          </div>
        </div>
      </div>
    </div>
  );
}


function RequestModal({ type, lang, onClose, onSubmit }) {
  const t = getCopy(lang);
  const reasons = type === "return" ? RETURN_REASONS : CANCEL_REASONS;
  const [reason, setReason] = useState(reasons[0]?.value || "");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  function submit() {
    if (!reason) {
      setError(t.chooseReason);
      return;
    }

    onSubmit(reason, note.trim());
  }

  return (
    <div className="fixed inset-0 z-[100000] bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="mx-auto mt-10 max-h-[85vh] max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <h3 className="text-xl font-black text-slate-950">
          {type === "return" ? t.requestReturn : t.requestCancel}
        </h3>

        <label className="mt-5 block">
          <span className="text-sm font-black text-slate-700">{t.reason}</span>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none focus:border-blue-500"
          >
            {reasons.map((item) => (
              <option key={item.value} value={item.value}>
                {getLocalized(item.label, lang)}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-black text-slate-700">{t.detailNote}</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none focus:border-blue-500"
          />
        </label>

        {error && (
          <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-600">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-2xl border px-5 py-3 font-black text-slate-700">
            {t.close}
          </button>
          <button onClick={submit} className="rounded-2xl bg-blue-700 px-5 py-3 font-black text-white">
            {t.submit}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lang] = useLang();
  const t = getCopy(lang);
  const { toast, notify, dismiss } = useToast();

  const [refreshKey, setRefreshKey] = useState(0);
  const [modalType, setModalType] = useState(null);
  const [backendOrder, setBackendOrder] = useState(null);
  const [backendLoading, setBackendLoading] = useState(true);
  const [backendError, setBackendError] = useState("");

  useEffect(() => {
    let alive = true;

    setBackendLoading(true);
    setBackendError("");

    getMyStorefrontOrderByIdApi(id)
      .then((item) => {
        if (!alive) return;
        setBackendOrder(item);
        setBackendError("");
      })
      .catch((error) => {
        if (!alive) return;
        setBackendOrder(null);
        setBackendError(error?.message || "Unable to refresh order status.");
      })
      .finally(() => {
        if (!alive) return;
        setBackendLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id, refreshKey]);

  const order = backendOrder;

  if (backendLoading && !order) {
    return (
      <PageShell>
        <main className="min-h-screen bg-slate-50 p-10">
          <div className="mx-auto flex max-w-3xl items-center justify-center gap-3 rounded-3xl bg-white p-10 text-center font-black text-slate-500">
            <Loader2 className="animate-spin text-blue-600" />
            {lang === "en" ? "Loading order..." : "Đang tải đơn hàng..."}
          </div>
        </main>
      </PageShell>
    );
  }

  if (!order) {
    return (
      <PageShell>
        <main className="min-h-screen bg-slate-50 p-10">
          <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center">
            <h1 className="text-2xl font-black">{t.notFound}</h1>
            <Link to="/order-lookup" className="mt-5 inline-block rounded-2xl bg-blue-700 px-6 py-3 font-black text-white">
              {t.back}
            </Link>
          </div>
        </main>
      </PageShell>
    );
  }

  const currentIndex = PUBLIC_STEPS.indexOf(order.status);
  const directCancel = canCustomerCancelDirect(order.status);
  const cancelRequest = canCustomerRequestCancel(order.status);
  const returnRequest = canCustomerRequestReturn(order.status);
  // Backend chưa có field trạng thái cọc riêng (preorder.status/balanceStatus), nên dùng
  // số tiền còn lại thật (remainingAmount) làm điều kiện thay vì 1 sub-status chưa tồn tại.
  const balanceRequestEligible =
    order.orderType === "preorder" && Number(order.preorder?.remainingAmount) > 0;

  function buyAgain() {
    const cart = getCart();
    const next = [...cart];

    (order.items || []).forEach((item) => {
      const found = next.find((x) => x.id === item.id);
      if (found) {
        found.quantity = (found.quantity || 1) + (item.quantity || 1);
      } else {
        next.push({ ...item, selected: true });
      }
    });

    saveCart(next);
    navigate("/cart");
  }

  function handleDirectCancel() {
    setModalType("cancelDirect");
  }

  async function handlePreorderBalancePayment() {
    const note = window.prompt(t.balancePaymentNote);

    if (note === null) return;

    try {
      await createStorefrontComplaintApi({
        orderId: order.backendOrderId || order.id,
        orderNo: order.orderNo || order.orderCode || order.id,
        customerName: order.customer?.name || "Customer",
        customerPhone: order.customer?.phone || "",
        customerEmail: order.customer?.email || "",
        type: "COMPLAINT",
        issue: lang === "en" ? "Pre-order remaining balance payment notice" : "Báo đã thanh toán phần còn lại (pre-order)",
        description: String(note || "").trim(),
        priority: "MEDIUM",
      });

      notify("success", t.requestSent);
      setRefreshKey((value) => value + 1);
    } catch (error) {
      notify("error", error?.message || "Request failed.");
    }
  }

  async function submitRequest(type, reason, note) {
    try {
      if (type === "cancelDirect") {
        const updated = await cancelMyStorefrontOrderApi(order.id, { reason, note });
        setBackendOrder(updated);
        notify("success", t.cancelledSuccess);
        setModalType(null);
        setRefreshKey((value) => value + 1);
        return;
      }

      if (type === "cancel") {
        await createStorefrontComplaintApi({
          orderId: order.backendOrderId || order.id,
          orderNo: order.orderNo || order.orderCode || order.id,
          customerName: order.customer?.name || "Customer",
          customerPhone: order.customer?.phone || "",
          customerEmail: order.customer?.email || "",
          type: "COMPLAINT",
          issue: `[${lang === "en" ? "Cancel request" : "Yêu cầu hủy đơn"}] ${reason}`,
          description: note || reason,
          priority: "MEDIUM",
        });
      }

      if (type === "return") {
        await createStorefrontComplaintApi({
          orderId: order.backendOrderId || order.id,
          orderNo: order.orderNo || order.orderCode || order.id,
          customerName: order.customer?.name || "Customer",
          customerPhone: order.customer?.phone || "",
          customerEmail: order.customer?.email || "",
          type: "RETURN",
          issue: reason,
          description: note || reason,
          priority: "MEDIUM",
        });
      }

      notify("success", t.requestSent);
      setModalType(null);
      setRefreshKey((value) => value + 1);
    } catch (error) {
      notify("error", error?.message || "Request failed.");
    }
  }

  return (
    <PageShell>
      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={dismiss} />
      <main className="min-h-screen bg-[#F5F7FB] px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto max-w-7xl">
          <Link to="/orders" className="font-black text-blue-600">
            ← {t.back}
          </Link>

          <div className="mt-5 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
                  {t.orderTracking}
                </p>
                <h1 className="mt-2 text-3xl font-black text-slate-950">{order.id}</h1>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  {t.createdAt}: {order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "-"}
                </p>

                <div className="mt-3">
                  <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                    {"Order recorded"}
                  </span>
                </div>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                  {t.trackingHint}
                </p>
              </div>

              <div className={`rounded-2xl px-5 py-3 text-center ${getOrderStatusToneClass(order.status)}`}>
                <div className="text-sm font-bold">{t.currentStatus}</div>
                <div className="text-xl font-black">{getOrderStatusLabel(order.status, lang)}</div>
              </div>
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-6">
              {PUBLIC_STEPS.map((step, index) => {
                const active = currentIndex >= index && currentIndex !== -1;
                return (
                  <div
                    key={step}
                    className={`rounded-2xl p-4 text-center text-sm font-black ${
                      active ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    <CheckCircle2 className="mx-auto mb-2" size={20} />
                    {getOrderStatusLabel(step, lang)}
                  </div>
                );
              })}
            </div>
          </div>

          <PreorderProgressTracker order={order} lang={lang} />

          {(order.cancelRequest?.status === "Pending" || order.returnRequest?.status === "Pending" || order.preorder?.balancePaymentRequest?.status === "Pending") && (
            <div className="mt-6 rounded-3xl border border-amber-100 bg-amber-50 p-5 text-amber-800">
              <div className="flex gap-3">
                <Clock className="mt-0.5" size={22} />
                <div>
                  <div className="font-black">{t.requestPending}</div>
                  <p className="mt-1 text-sm font-semibold">
                    {order.cancelRequest?.status === "Pending"
                      ? t.cancelPending
                      : order.returnRequest?.status === "Pending"
                        ? t.returnPending
                        : t.balancePending}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_390px]">
            <section className="space-y-6">
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-xl font-black">
                  <Package size={22} /> {t.products}
                </h2>

                <div className="mt-5 divide-y">
                  {(order.items || []).map((item) => (
                    <div key={item.id} className="flex gap-4 py-4">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          className="h-24 w-24 shrink-0 rounded-2xl bg-slate-100 object-cover"
                        />
                      ) : (
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
                          <Package size={28} />
                        </div>
                      )}

                      <div className="flex-1">
                        <div className="font-black text-slate-950">{item.name}</div>
                        <div className="mt-1 text-sm text-slate-500">{t.quantity}: {item.quantity || 1}</div>
                        <div className="mt-2 font-black text-red-500">{money(item.price)}</div>
                      </div>

                      <div className="font-black text-slate-950">
                        {money((item.price || 0) * (item.quantity || 1))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black">{t.timeline}</h2>

                <div className="mt-5 space-y-3">
                  {(order.timeline || []).map((item, index) => (
                    <div key={index} className="rounded-2xl bg-slate-50 p-4">
                      <div className="font-black">{item.title || item.status}</div>
                      <p className="mt-1 text-sm text-slate-500">{item.note}</p>
                      <p className="mt-1 text-xs font-bold text-slate-400">
                        {item.time ? new Date(item.time).toLocaleString("vi-VN") : "-"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <aside className="space-y-6">
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-xl font-black">
                  <MapPin size={22} /> {t.delivery}
                </h2>

                <div className="mt-4 space-y-2 text-sm">
                  <p><b>{t.recipient}:</b> {order.customer?.name || "-"}</p>
                  <p><b>{t.phone}:</b> {maskPhone(order.customer?.phone || "-")}</p>
                  <p><b>{t.province}:</b> {order.customer?.province || "-"}</p>
                  <p><b>{t.address}:</b> {order.customer?.address || "-"}</p>
                  <p><b>{t.note}:</b> {order.customer?.note || "-"}</p>
                </div>

                {(order.shippingInfo?.carrier || order.shippingInfo?.trackingCode) && (
                  <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm font-bold text-blue-800">
                    <Truck size={17} className="mr-1 inline" />
                    {order.shippingInfo?.carrier || "-"} · {order.shippingInfo?.trackingCode || "-"}
                    <div className="mt-1 text-xs text-blue-600">
                      {order.shippingInfo?.status || order.shippingInfo?.method || ""}
                    </div>
                  </div>
                )}
              </div>


              {order.orderType === "preorder" && order.preorder && (
                <div className="rounded-3xl border border-amber-100 bg-amber-50 p-6 shadow-sm">
                  <h2 className="text-xl font-black text-amber-900">
                    {lang === "en" ? "Pre-order deposit" : "Thông tin đặt cọc"}
                  </h2>

                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>{lang === "en" ? "ETA" : "Dự kiến về hàng"}</span>
                      <b>{order.preorder.eta || "-"}</b>
                    </div>
                    <div className="flex justify-between">
                      <span>{lang === "en" ? "Full amount" : "Giá sản phẩm"}</span>
                      <b>{money(order.preorder.fullAmount || order.subtotal)}</b>
                    </div>
                    <div className="flex justify-between">
                      <span>{lang === "en" ? "Deposit paid/required" : "Tiền cọc"}</span>
                      <b className="text-red-600">{money(order.preorder.depositAmount || order.total)}</b>
                    </div>
                    <div className="flex justify-between">
                      <span>{lang === "en" ? "Remaining balance" : "Còn lại"}</span>
                      <b>{money(order.preorder.remainingAmount || 0)}</b>
                    </div>
                    <div className="flex justify-between">
                      <span>{lang === "en" ? "Deposit status" : "Trạng thái cọc"}</span>
                      <b>{order.preorder.depositStatus || "-"}</b>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black">{t.payment}</h2>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between"><span>{t.subtotal}</span><b>{money(order.subtotal)}</b></div>
                  <div className="flex justify-between"><span>{t.shippingFee}</span><b>{money(order.shippingFee)}</b></div>
                  <div className="flex justify-between text-green-600"><span>{t.discount}</span><b>-{money(order.discount)}</b></div>
                  <div className="flex justify-between text-green-600"><span>{t.shippingDiscount}</span><b>-{money(order.shippingDiscount)}</b></div>
                  <div className="flex justify-between"><span>{t.voucher}</span><b>{order.voucherCode || "-"}</b></div>
                  <div className="flex justify-between"><span>{t.paymentMethod}</span><b>{order.paymentMethod || "-"}</b></div>

                  <div className="flex justify-between border-t pt-4 text-xl font-black">
                    <span>{t.total}</span>
                    <span className="text-red-500">{money(order.total)}</span>
                  </div>
                </div>
              </div>

              {(order.supportTickets || []).length > 0 && (
                <div className="rounded-3xl bg-white p-6 shadow-sm">
                  <h2 className="flex items-center gap-2 text-xl font-black">
                    <MessageSquare size={20} /> {lang === "en" ? "Support tickets" : "Yêu cầu hỗ trợ"}
                  </h2>

                  <div className="mt-4 space-y-3">
                    {(order.supportTickets || []).map((ticket) => (
                      <div key={ticket.id} className="rounded-2xl bg-slate-50 p-4 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <b className="text-blue-700">{ticket.ticketNo}</b>
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">{ticket.status}</span>
                        </div>
                        <div className="mt-2 font-black text-slate-900">{ticket.issue}</div>
                        {ticket.refundStatus && ticket.refundStatus !== "NONE" && (
                          <div className="mt-1 text-xs font-bold text-slate-500">
                            Refund: {ticket.refundStatus} · {money(ticket.refundAmount || 0)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <button
                  onClick={buyAgain}
                  className="w-full rounded-2xl bg-blue-700 py-4 font-black text-white"
                >
                  <RotateCcw size={18} className="mr-2 inline" />
                  {t.buyAgain}
                </button>

                {balanceRequestEligible && (
                  <button
                    onClick={handlePreorderBalancePayment}
                    className="mt-3 w-full rounded-2xl bg-violet-50 py-4 font-black text-violet-700"
                  >
                    <CreditCard size={18} className="mr-2 inline" />
                    {t.requestBalancePayment}
                  </button>
                )}

                {directCancel && (
                  <button
                    onClick={handleDirectCancel}
                    className="mt-3 w-full rounded-2xl bg-red-50 py-4 font-black text-red-600"
                  >
                    <XCircle size={18} className="mr-2 inline" />
                    {t.cancelOrder}
                  </button>
                )}

                {cancelRequest && !order.cancelRequest?.requested && (
                  <button
                    onClick={() => setModalType("cancel")}
                    className="mt-3 w-full rounded-2xl bg-amber-50 py-4 font-black text-amber-700"
                  >
                    <AlertCircle size={18} className="mr-2 inline" />
                    {t.requestCancel}
                  </button>
                )}

                {returnRequest && !order.returnRequest?.requested && (
                  <button
                    onClick={() => setModalType("return")}
                    className="mt-3 w-full rounded-2xl bg-orange-50 py-4 font-black text-orange-700"
                  >
                    <Undo2 size={18} className="mr-2 inline" />
                    {t.requestReturn}
                  </button>
                )}

                {!directCancel && !cancelRequest && !returnRequest && (
                  <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-500">
                    <ShieldCheck size={18} className="mr-1 inline text-blue-600" />
                    {t.cannotCancel}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>

        {modalType && (
          <RequestModal
            type={modalType === "return" ? "return" : "cancel"}
            lang={lang}
            onClose={() => setModalType(null)}
            onSubmit={(reason, note) => submitRequest(modalType, reason, note)}
          />
        )}
      </main>
    </PageShell>
  );
}
