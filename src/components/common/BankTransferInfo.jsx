import { useState } from "react";
import { Check, CheckCircle2, Clock, Copy, QrCode } from "lucide-react";
import useContactChannels from "../../hooks/useContactChannels";

const money = (n) => (Number(n) || 0).toLocaleString("vi-VN") + "đ";

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

function CopyRow({ label, value, lang }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!value) return;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(String(value)).catch(() => {});
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3">
      <div className="min-w-0">
        <div className="text-xs font-bold text-slate-400">{label}</div>
        <div className="truncate text-sm font-black text-slate-900">{value || "-"}</div>
      </div>

      <button
        type="button"
        onClick={handleCopy}
        disabled={!value}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? (lang === "en" ? "Copied" : "Đã chép") : (lang === "en" ? "Copy" : "Sao chép")}
      </button>
    </div>
  );
}

/**
 * Shared bank-transfer QR + info block, used on Order Success, My Orders /
 * Order Lookup detail (customer-facing) and Admin Order Detail (internal).
 *
 * Renders nothing when the order isn't BANK_TRANSFER. When paymentStatus is
 * already "Paid", shows a paid badge instead (unless showPaidBadge=false,
 * used by the admin variant where payment status is already shown elsewhere).
 */
export default function BankTransferInfo({
  paymentMethod,
  paymentStatus,
  bankInfo,
  lang = "vi",
  compact = false,
  showPaidBadge = true,
  customerClaimedPaidAt = null,
  onClaimPaid = null,
  claiming = false,
  claimError = "",
  successMessage = "",
}) {
  const { zaloUrl, facebookUrl } = useContactChannels();

  if (paymentMethod !== "BANK_TRANSFER") return null;

  if (paymentStatus === "Paid") {
    if (!showPaidBadge) return null;

    return (
      <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
        <CheckCircle2 size={18} />
        {lang === "en" ? "Paid" : "Đã thanh toán"}
      </div>
    );
  }

  if (!bankInfo) return null;

  const qrSize = compact ? 160 : 260;

  return (
    <div className={`rounded-2xl border border-blue-100 bg-blue-50/60 ${compact ? "p-4" : "p-6"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className={`flex items-center gap-2 font-black text-blue-900 ${compact ? "text-sm" : "text-lg"}`}>
          <QrCode size={compact ? 16 : 20} />
          {lang === "en" ? "Bank transfer" : "Chuyển khoản ngân hàng"}
        </h3>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
          <Clock size={13} />
          {lang === "en" ? "Awaiting payment confirmation" : "Chờ xác nhận thanh toán"}
        </span>
      </div>

      <div className={`mt-4 flex flex-col gap-4 ${compact ? "" : "sm:flex-row sm:items-start"}`}>
        {bankInfo.qrCodeUrl && (
          <img
            src={bankInfo.qrCodeUrl}
            alt={lang === "en" ? "Bank transfer QR code" : "Mã QR chuyển khoản"}
            width={qrSize}
            height={qrSize}
            loading="lazy"
            className="mx-auto shrink-0 rounded-xl border border-blue-100 bg-white object-contain p-2 sm:mx-0"
            style={{ width: qrSize, height: qrSize, minWidth: qrSize, minHeight: qrSize }}
          />
        )}

        <div className="flex-1 space-y-2">
          <CopyRow label={lang === "en" ? "Bank" : "Ngân hàng"} value={bankInfo.bankName} lang={lang} />
          <CopyRow label={lang === "en" ? "Account number" : "Số tài khoản"} value={bankInfo.accountNo} lang={lang} />
          <CopyRow label={lang === "en" ? "Account holder" : "Chủ tài khoản"} value={bankInfo.accountName} lang={lang} />
          <CopyRow label={lang === "en" ? "Amount to transfer" : "Số tiền cần chuyển"} value={money(bankInfo.amount)} lang={lang} />
          <CopyRow label={lang === "en" ? "Transfer content" : "Nội dung chuyển khoản"} value={bankInfo.transferContent} lang={lang} />
        </div>
      </div>

      <p className={`mt-4 rounded-xl bg-amber-50 px-4 py-3 font-bold leading-5 text-amber-800 ${compact ? "text-xs" : "text-sm"}`}>
        {lang === "en"
          ? "Please transfer the exact amount and keep the transfer content unchanged so your order can be confirmed as quickly as possible."
          : "Vui lòng chuyển đúng số tiền và giữ nguyên nội dung chuyển khoản để đơn hàng được xác nhận nhanh nhất."}
      </p>

      {(onClaimPaid || customerClaimedPaidAt) && (
        <div className="mt-4 rounded-xl border border-emerald-100 bg-white p-4">
          {customerClaimedPaidAt ? (
            <>
              <div className="flex items-center gap-2 text-sm font-black text-emerald-700">
                <CheckCircle2 size={16} />
                {lang === "en"
                  ? `You reported this transfer at ${formatClaimedAt(customerClaimedPaidAt, lang)}`
                  : `Bạn đã báo chuyển khoản lúc ${formatClaimedAt(customerClaimedPaidAt, lang)}`}
              </div>

              <p className="mt-2 text-sm font-bold leading-5 text-slate-600">
                {successMessage ||
                  (lang === "en"
                    ? "Thank you! We've recorded your report. Please send a screenshot of your transfer via Zalo/Messenger (0935950649) for the fastest confirmation. Your order will be processed right after payment is confirmed."
                    : "Cảm ơn bạn! Chúng tôi đã ghi nhận thông tin. Vui lòng gửi ảnh chụp chuyển khoản qua Zalo/Messenger (0935950649) để được xác nhận nhanh nhất. Đơn hàng sẽ được xử lý ngay sau khi xác nhận thanh toán thành công.")}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {zaloUrl && (
                  <a
                    href={zaloUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0068FF] px-4 py-2.5 text-xs font-black text-white hover:opacity-90"
                  >
                    Zalo: 0935950649
                  </a>
                )}
                {facebookUrl && (
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0866FF] px-4 py-2.5 text-xs font-black text-white hover:opacity-90"
                  >
                    Messenger
                  </a>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClaimPaid}
                disabled={claiming}
                className="w-full rounded-xl bg-amber-600 py-3 text-sm font-black text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {claiming
                  ? (lang === "en" ? "Sending..." : "Đang gửi...")
                  : (lang === "en" ? "I've made the transfer" : "Tôi đã chuyển khoản")}
              </button>
              {claimError && (
                <div className="mt-2 text-xs font-bold text-red-600">{claimError}</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
