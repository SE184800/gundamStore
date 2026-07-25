import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, EyeOff, MessageSquareReply, RefreshCcw, Search, Star, Trash2, XCircle } from "lucide-react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import { AdminSelect, AdminTextarea } from "../../components/admin/AdminField";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import useToast from "../../hooks/useToast";
import Toast from "../../utils/Toast";
import {
  deleteAdminReviewApi,
  getAdminReviewsApi,
  updateAdminReviewApi,
} from "../../services/AdminReviewApiService";

const STATUS_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "HIDDEN", label: "Hidden" },
];

function statusClass(status = "") {
  if (status === "APPROVED") return "bg-emerald-50 text-emerald-700";
  if (status === "PENDING") return "bg-amber-50 text-amber-700";
  if (status === "REJECTED") return "bg-red-50 text-red-700";
  return "bg-slate-100 text-slate-600";
}

function stars(rating = 0) {
  return (
    <div className="flex gap-1 text-amber-400">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={15}
          fill={index < Number(rating || 0) ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}

function productName(product = {}) {
  return product.nameVi || product.nameEn || product.sku || "Product";
}

export default function AdminReviews() {
  const { toast, notify, dismiss } = useToast();
  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState("ALL");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState(null);

  async function reload() {
    setLoading(true);
    setApiError("");

    try {
      const rows = await getAdminReviewsApi({ status, q: query });
      setReviews(rows);
    } catch (error) {
      setApiError(error?.message || "Cannot load reviews.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const summary = useMemo(() => {
    return {
      total: reviews.length,
      pending: reviews.filter((item) => item.status === "PENDING").length,
      approved: reviews.filter((item) => item.status === "APPROVED").length,
      rejected: reviews.filter((item) => item.status === "REJECTED").length,
    };
  }, [reviews]);

  function openReply(review) {
    setDraft({
      ...review,
      nextStatus: review.status || "PENDING",
      adminReplyDraft: review.adminReply || "",
    });
    setDrawerOpen(true);
  }

  async function moderate(review, nextStatus) {
    try {
      await updateAdminReviewApi(review.id, {
        status: nextStatus,
        adminReply: review.adminReply || "",
      });
      await reload();
    } catch (error) {
      notify("error", error?.message || "Update review failed.");
    }
  }

  async function saveReply() {
    if (!draft?.id) return;

    try {
      await updateAdminReviewApi(draft.id, {
        status: draft.nextStatus,
        adminReply: draft.adminReplyDraft || "",
      });

      setDrawerOpen(false);
      setDraft(null);
      await reload();
    } catch (error) {
      notify("error", error?.message || "Save reply failed.");
    }
  }

  async function remove(review) {
    if (!window.confirm("Delete this review permanently?")) return;

    try {
      await deleteAdminReviewApi(review.id);
      await reload();
    } catch (error) {
      notify("error", error?.message || "Delete review failed.");
    }
  }

  return (
    <>
      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={dismiss} />
      <AdminPageHeader
        eyebrow="Customer trust"
        title="Review & Rating Moderation"
        desc="Moderate product reviews from backend DB. Only approved reviews are shown on product detail."
        action={
          <button
            onClick={() => void reload()}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
          >
            <RefreshCcw size={15} className="mr-1 inline" />
            Refresh
          </button>
        }
      />

      {apiError && (
        <section className="mb-4 rounded-3xl border border-red-100 bg-red-50 p-4 text-sm font-black text-red-700">
          {apiError}
        </section>
      )}

      <section className="mb-4 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">Loaded</p><p className="mt-2 text-2xl font-black">{summary.total}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">Pending</p><p className="mt-2 text-2xl font-black text-amber-600">{summary.pending}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">Approved</p><p className="mt-2 text-2xl font-black text-emerald-600">{summary.approved}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">Rejected</p><p className="mt-2 text-2xl font-black text-red-600">{summary.rejected}</p></div>
      </section>

      <section className="mb-4 rounded-md border border-slate-200 bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[220px_1fr_auto]">
          <AdminSelect label="Status" options={STATUS_OPTIONS} value={status} onChange={setStatus} />
          <div className="flex items-center self-end rounded-md border border-slate-300 bg-white px-3">
            <Search size={16} className="text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search customer, product, review..."
              className="w-full bg-transparent px-3 py-3 text-sm font-semibold outline-none"
            />
          </div>
          <button
            onClick={() => void reload()}
            className="self-end rounded-md bg-slate-900 px-4 py-3 text-xs font-black text-white hover:bg-slate-800"
          >
            Search
          </button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {reviews.map((review) => (
          <article key={review.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-black text-slate-950">{review.customerName}</div>
                <div className="mt-1 text-xs font-bold text-slate-500">
                  {review.customerEmail || "No email"} · {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                </div>
                <div className="mt-2 text-xs font-black text-blue-700">
                  {review.product?.sku} · {productName(review.product)}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(review.status)}`}>
                  {review.status}
                </span>
                {review.verifiedPurchase && (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                    Verified purchase
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3">{stars(review.rating)}</div>
            {review.title && <div className="mt-3 text-sm font-black text-slate-900">{review.title}</div>}
            <p className="mt-2 text-sm leading-6 text-slate-600">{review.content}</p>

            {review.adminReply && (
              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-sm font-bold text-blue-800">
                Shop reply: {review.adminReply}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {review.status !== "APPROVED" && (
                <button onClick={() => void moderate(review, "APPROVED")} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-700">
                  <CheckCircle2 size={14} className="mr-1 inline" /> Approve
                </button>
              )}
              {review.status !== "REJECTED" && (
                <button onClick={() => void moderate(review, "REJECTED")} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white hover:bg-red-700">
                  <XCircle size={14} className="mr-1 inline" /> Reject
                </button>
              )}
              {review.status !== "HIDDEN" && (
                <button onClick={() => void moderate(review, "HIDDEN")} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">
                  <EyeOff size={14} className="mr-1 inline" /> Hide
                </button>
              )}
              <button onClick={() => openReply(review)} className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 hover:bg-blue-100">
                <MessageSquareReply size={14} className="mr-1 inline" /> Reply
              </button>
              <button onClick={() => void remove(review)} className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-black text-red-600">
                <Trash2 size={14} className="mr-1 inline" /> Delete
              </button>
            </div>
          </article>
        ))}

        {!reviews.length && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm font-bold text-slate-400 xl:col-span-2">
            {loading ? "Loading reviews..." : "No reviews found."}
          </div>
        )}
      </section>

      <AdminDrawer
        open={drawerOpen}
        title="Moderate review"
        onClose={() => setDrawerOpen(false)}
        onSave={() => void saveReply()}
        saveLabel="Save moderation"
        width="max-w-2xl"
      >
        {draft && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-black text-slate-950">{draft.customerName}</div>
              <div className="mt-2">{stars(draft.rating)}</div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{draft.content}</p>
            </div>

            <AdminSelect
              label="Moderation status"
              options={STATUS_OPTIONS.filter((item) => item.value !== "ALL")}
              value={draft.nextStatus}
              onChange={(value) => setDraft((prev) => ({ ...prev, nextStatus: value }))}
            />

            <AdminTextarea
              label="Shop reply"
              rows={5}
              value={draft.adminReplyDraft}
              onChange={(value) => setDraft((prev) => ({ ...prev, adminReplyDraft: value }))}
            />
          </div>
        )}
      </AdminDrawer>
    </>
  );
}
