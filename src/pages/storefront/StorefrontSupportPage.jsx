import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Headphones,
  Loader2,
  PackageSearch,
  RotateCcw,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import PageShell from "../../components/common/PageShell";
import SeoMeta from "../../components/storefront/SeoMeta";
import { useLang } from "../../store/CmsStore";
import { createStorefrontComplaintApi } from "../../services/StorefrontComplaintApiService";

const TYPE_OPTIONS = [
  { value: "COMPLAINT", labelVi: "Khiếu nại / cần hỗ trợ", labelEn: "Complaint / Support" },
  { value: "RETURN", labelVi: "Đổi trả", labelEn: "Return" },
  { value: "REFUND", labelVi: "Hoàn tiền", labelEn: "Refund" },
  { value: "DAMAGED_BOX", labelVi: "Móp / hư hộp", labelEn: "Damaged box" },
  { value: "MISSING_PART", labelVi: "Thiếu phụ kiện", labelEn: "Missing part" },
  { value: "WRONG_ITEM", labelVi: "Giao sai sản phẩm", labelEn: "Wrong item" },
];

function getCopy(lang) {
  return {
    title: lang === "en" ? "Support / Contact Center" : "Trung tâm hỗ trợ / liên hệ",
    desc:
      lang === "en"
        ? "Submit order support, return, refund, damaged box or missing part requests. Our team will review and follow up with you."
        : "Gửi yêu cầu hỗ trợ đơn hàng, đổi trả, hoàn tiền, móp hộp hoặc thiếu phụ kiện. Đội ngũ shop sẽ xem xét và phản hồi cho bạn.",
    orderNo: lang === "en" ? "Order number" : "Mã đơn hàng",
    name: lang === "en" ? "Your name" : "Tên của bạn",
    phone: lang === "en" ? "Phone" : "Số điện thoại",
    email: "Email",
    type: lang === "en" ? "Request type" : "Loại yêu cầu",
    issue: lang === "en" ? "Issue summary" : "Tóm tắt vấn đề",
    description: lang === "en" ? "Detailed description" : "Mô tả chi tiết",
    submit: lang === "en" ? "Submit request" : "Gửi yêu cầu",
    submitting: lang === "en" ? "Submitting..." : "Đang gửi...",
    success:
      lang === "en"
        ? "Request submitted successfully."
        : "Đã gửi yêu cầu thành công.",
    required:
      lang === "en"
        ? "Please fill name, phone, issue and description."
        : "Vui lòng nhập tên, số điện thoại, vấn đề và mô tả.",
    backOrders: lang === "en" ? "View my orders" : "Xem đơn hàng của tôi",
    lookup: lang === "en" ? "Order lookup" : "Tra cứu đơn hàng",
  };
}

function initialDraft(searchParams, defaultType) {
  const requestedType = searchParams.get("type") || defaultType || "COMPLAINT";
  const validType = TYPE_OPTIONS.some((item) => item.value === requestedType)
    ? requestedType
    : "COMPLAINT";

  return {
    orderNo: searchParams.get("orderNo") || searchParams.get("order") || "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    type: validType,
    issue: "",
    description: "",
  };
}

export default function StorefrontSupportPage({ defaultType = "COMPLAINT" }) {
  const [lang] = useLang();
  const t = getCopy(lang);
  const [searchParams] = useSearchParams();
  const [draft, setDraft] = useState(() => initialDraft(searchParams, defaultType));
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const selectedType = useMemo(() => {
    return TYPE_OPTIONS.find((item) => item.value === draft.type) || TYPE_OPTIONS[0];
  }, [draft.type]);

  function patch(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();

    if (!draft.customerName.trim() || !draft.customerPhone.trim() || !draft.issue.trim() || !draft.description.trim()) {
      setError(t.required);
      return;
    }

    setBusy(true);
    setError("");
    setResult(null);

    try {
      const ticket = await createStorefrontComplaintApi({
        orderNo: draft.orderNo,
        customerName: draft.customerName,
        customerPhone: draft.customerPhone,
        customerEmail: draft.customerEmail,
        type: draft.type,
        issue: draft.issue,
        description: draft.description,
        priority: ["REFUND", "WRONG_ITEM"].includes(draft.type) ? "HIGH" : "MEDIUM",
      });

      setResult(ticket);
      setDraft((prev) => ({
        ...prev,
        issue: "",
        description: "",
      }));
    } catch (err) {
      setError(err?.message || (lang === "en" ? "Cannot submit ticket. Please try again." : "Gửi yêu cầu thất bại. Vui lòng thử lại."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell>
      <SeoMeta
        title={t.title}
        description={t.desc}
      />

      <main className="min-h-screen bg-[#F5F7FB] px-4 py-8 md:px-6 lg:pr-28">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black tracking-wide text-blue-600">
            {lang === "en" ? "Customer care" : "Chăm sóc khách hàng"}
          </p>
          <h1 className="mt-2 text-4xl font-black text-slate-950">{t.title}</h1>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-500">
            {t.desc}
          </p>

          <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_390px]">
            <form onSubmit={submit} className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-black text-slate-400">{t.orderNo}</span>
                  <input
                    value={draft.orderNo}
                    onChange={(event) => patch("orderNo", event.target.value)}
                    placeholder="ORD-..."
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-black text-slate-400">{t.type}</span>
                  <select
                    value={draft.type}
                    onChange={(event) => patch("type", event.target.value)}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
                  >
                    {TYPE_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {lang === "en" ? item.labelEn : item.labelVi}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-black text-slate-400">{t.name}</span>
                  <input
                    value={draft.customerName}
                    onChange={(event) => patch("customerName", event.target.value)}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-black text-slate-400">{t.phone}</span>
                  <input
                    value={draft.customerPhone}
                    onChange={(event) => patch("customerPhone", event.target.value)}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
                  />
                </label>

                <label className="grid gap-2 md:col-span-2">
                  <span className="text-xs font-black text-slate-400">{t.email}</span>
                  <input
                    type="email"
                    value={draft.customerEmail}
                    onChange={(event) => patch("customerEmail", event.target.value)}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
                  />
                </label>

                <label className="grid gap-2 md:col-span-2">
                  <span className="text-xs font-black text-slate-400">{t.issue}</span>
                  <input
                    value={draft.issue}
                    onChange={(event) => patch("issue", event.target.value)}
                    placeholder={lang === "en" ? selectedType.labelEn : selectedType.labelVi}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
                  />
                </label>

                <label className="grid gap-2 md:col-span-2">
                  <span className="text-xs font-black text-slate-400">{t.description}</span>
                  <textarea
                    rows={6}
                    value={draft.description}
                    onChange={(event) => patch("description", event.target.value)}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
                  />
                </label>
              </div>

              {error && (
                <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-black text-red-700">
                  <AlertCircle size={16} className="mr-1 inline" />
                  {error}
                </div>
              )}

              {result && (
                <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-black text-emerald-700">
                  <CheckCircle2 size={16} className="mr-1 inline" />
                  {t.success} {lang === "en" ? "Ticket" : "Mã yêu cầu"}: {result.ticketNo}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="mt-5 rounded-2xl bg-blue-700 px-6 py-4 text-sm font-black text-white hover:bg-blue-800 disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <Loader2 size={16} className="mr-1 inline animate-spin" />
                    {t.submitting}
                  </>
                ) : (
                  <>
                    <Ticket size={16} className="mr-1 inline" />
                    {t.submit}
                  </>
                )}
              </button>
            </form>

            <aside className="space-y-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 text-blue-900">
                <Headphones size={28} />
                <h2 className="mt-3 text-xl font-black">
                  {lang === "en" ? "How support works" : "Quy trình hỗ trợ"}
                </h2>
                <div className="mt-4 space-y-3 text-sm font-bold leading-6">
                  <div><PackageSearch size={16} className="mr-1 inline" /> {lang === "en" ? "Submit your request with order number if available." : "Gửi yêu cầu kèm mã đơn nếu có."}</div>
                  <div><ShieldCheck size={16} className="mr-1 inline" /> {lang === "en" ? "Our team verifies the issue and order items." : "Shop kiểm tra vấn đề và sản phẩm trong đơn."}</div>
                  <div><RotateCcw size={16} className="mr-1 inline" /> {lang === "en" ? "Return/refund resolution is updated on your request." : "Kết quả đổi trả/hoàn tiền được cập nhật trên yêu cầu của bạn."}</div>
                </div>
              </div>

              <div className="rounded-xl bg-white p-5 shadow-sm">
                <Link to="/orders" className="block rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-black text-white">
                  {t.backOrders}
                </Link>
                <Link to="/order-lookup" className="mt-3 block rounded-2xl bg-slate-100 px-4 py-3 text-center text-sm font-black text-slate-700">
                  {t.lookup}
                </Link>
              </div>
            </aside>
          </section>
        </div>
      </main>
    </PageShell>
  );
}
