import { Check, Clock, XCircle } from "lucide-react";
import { ORDER_STATUS, PAYMENT_STATUS } from "../../constants/orderConfig";

function formatClaimedAt(value, lang = "vi") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function getStepDefs(lang) {
  return [
    { vi: "Đặt hàng thành công", en: "Order placed" },
    { vi: "Chờ xác nhận thanh toán", en: "Awaiting payment confirmation" },
    { vi: "Đã xác nhận, đang chuẩn bị hàng", en: "Confirmed, preparing your order" },
    { vi: "Đang giao", en: "Shipping" },
    { vi: "Hoàn tất", en: "Completed" },
  ].map((step) => (lang === "en" ? step.en : step.vi));
}

/**
 * Computes which of the 5 customer-facing steps the order is at.
 * The "Chờ xác nhận thanh toán" step stays current for BANK_TRANSFER orders
 * until an admin actually confirms payment (paymentStatus Paid/Partial) —
 * order.status can already be Confirmed/Packing while payment is still
 * unconfirmed (backend only blocks PACK+, not CONFIRM), so status alone
 * would misleadingly show "preparing" before payment is verified.
 */
export function getOrderStepState(order = {}) {
  const status = order.status;

  if (status === ORDER_STATUS.CANCELLED || status === ORDER_STATUS.REFUNDED) {
    return { index: -1, paymentPending: false, terminalLabel: status };
  }

  const isBankTransfer = order.paymentMethod === "BANK_TRANSFER";
  const paymentConfirmed =
    !isBankTransfer ||
    order.paymentStatus === PAYMENT_STATUS.PAID ||
    order.paymentStatus === PAYMENT_STATUS.PARTIAL;

  if (!paymentConfirmed) {
    return { index: 1, paymentPending: true, terminalLabel: null };
  }

  if ([ORDER_STATUS.CONFIRMED, ORDER_STATUS.PACKING].includes(status)) {
    return { index: 2, paymentPending: false, terminalLabel: null };
  }
  if ([ORDER_STATUS.SHIPPING, ORDER_STATUS.DELIVERED].includes(status)) {
    return { index: 3, paymentPending: false, terminalLabel: null };
  }
  if (status === ORDER_STATUS.COMPLETED) {
    return { index: 4, paymentPending: false, terminalLabel: null };
  }

  return { index: 1, paymentPending: false, terminalLabel: null };
}

export default function OrderStatusStepper({ order, lang = "vi", compact = false }) {
  const steps = getStepDefs(lang);
  const state = getOrderStepState(order || {});

  if (state.terminalLabel) {
    const isCancelled = state.terminalLabel === ORDER_STATUS.CANCELLED;
    return (
      <div
        className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black ${
          isCancelled ? "bg-red-50 text-red-700" : "bg-orange-50 text-orange-700"
        }`}
      >
        <XCircle size={18} />
        {isCancelled
          ? (lang === "en" ? "Order cancelled" : "Đơn hàng đã hủy")
          : (lang === "en" ? "Order refunded" : "Đơn hàng đã hoàn tiền")}
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {steps.map((label, index) => {
          const done = index < state.index || (index === state.index && !state.paymentPending);
          const isCurrent = index === state.index;

          return (
            <div key={label} className="flex items-center gap-1.5">
              <span
                title={label}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                  done
                    ? "bg-emerald-500 text-white"
                    : isCurrent
                      ? "bg-amber-500 text-white"
                      : "bg-slate-200 text-slate-400"
                }`}
              >
                {done ? <Check size={11} /> : index + 1}
              </span>
              {index < steps.length - 1 && (
                <span className={`h-0.5 w-4 rounded ${index < state.index ? "bg-emerald-400" : "bg-slate-200"}`} />
              )}
            </div>
          );
        })}
        <span className={`ml-2 text-xs font-black ${state.paymentPending ? "text-amber-700" : "text-slate-600"}`}>
          {steps[state.index]}
        </span>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {steps.map((label, index) => {
          const done = index < state.index || (index === state.index && !state.paymentPending);
          const isCurrent = index === state.index;
          const pending = isCurrent && state.paymentPending;

          return (
            <div
              key={label}
              className={`rounded-2xl p-4 text-center text-xs font-black leading-5 ${
                done
                  ? "bg-emerald-600 text-white"
                  : pending
                    ? "bg-amber-500 text-white"
                    : isCurrent
                      ? "bg-blue-700 text-white"
                      : "bg-slate-100 text-slate-400"
              }`}
            >
              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                {done ? <Check size={18} /> : pending ? <Clock size={18} /> : index + 1}
              </div>
              {label}
            </div>
          );
        })}
      </div>

      {state.paymentPending && order?.customerClaimedPaidAt && (
        <div className="mt-3 rounded-xl bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-800">
          {lang === "en"
            ? `You reported this transfer at ${formatClaimedAt(order.customerClaimedPaidAt, lang)} — waiting for shop confirmation.`
            : `Bạn đã báo chuyển khoản lúc ${formatClaimedAt(order.customerClaimedPaidAt, lang)} — đang chờ shop xác nhận.`}
        </div>
      )}
    </div>
  );
}
