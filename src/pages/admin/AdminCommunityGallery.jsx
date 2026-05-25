import { useMemo, useState } from "react";
import { CheckCircle2, Trash2, XCircle } from "lucide-react";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminStatusBadge from "../../components/admin/AdminStatusBadge";
import {
  deleteGallerySubmission,
  getGallerySubmissions,
  getGallerySummary,
  updateGalleryStatus,
} from "../../services/CommunityGalleryService";

export default function AdminCommunityGallery() {
  const [status, setStatus] = useState("all");
  const [version, setVersion] = useState(0);

  const summary = useMemo(() => getGallerySummary(), [version]);
  const rows = useMemo(() => {
    const allRows = getGallerySubmissions({ includePending: true });
    if (status === "all") return allRows;
    return allRows.filter((row) => row.status === status);
  }, [status, version]);

  function refresh() {
    setVersion((value) => value + 1);
  }

  function approve(id) {
    updateGalleryStatus(id, "Approved");
    refresh();
  }

  function reject(id) {
    updateGalleryStatus(id, "Rejected");
    refresh();
  }

  function remove(id) {
    deleteGallerySubmission(id);
    refresh();
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Community"
        title="Build Gallery Moderation"
        desc="Duyệt ảnh build, clean build, custom paint và nội dung cộng đồng trước khi hiển thị ngoài storefront."
      />

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <Summary label="Total" value={summary.total} />
        <Summary label="Pending" value={summary.pending} tone="text-amber-600" />
        <Summary label="Approved" value={summary.approved} tone="text-green-600" />
        <Summary label="Rejected" value={summary.rejected} tone="text-red-600" />
      </section>

      <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex gap-2 overflow-x-auto">
          {["all", "Pending", "Approved", "Rejected"].map((item) => (
            <button
              key={item}
              onClick={() => setStatus(item)}
              className={`rounded-2xl px-4 py-2 text-sm font-black ${
                status === item ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="h-72 bg-slate-100">
              <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
            </div>

            <div className="p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <AdminStatusBadge>{item.status}</AdminStatusBadge>
                <span className="text-xs font-black text-slate-400">{item.grade} • {item.series}</span>
              </div>

              <h3 className="text-xl font-black text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{item.caption}</p>

              <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm">
                <div><b>Builder:</b> {item.builderName}</div>
                <div><b>Product:</b> {item.productName || "-"}</div>
                <div><b>Created:</b> {item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : "-"}</div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => approve(item.id)} className="rounded-xl bg-green-50 px-3 py-2 text-xs font-black text-green-700">
                  <CheckCircle2 size={15} className="mr-1 inline" />
                  Approve
                </button>
                <button onClick={() => reject(item.id)} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700">
                  <XCircle size={15} className="mr-1 inline" />
                  Reject
                </button>
                <button onClick={() => remove(item.id)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">
                  <Trash2 size={15} className="mr-1 inline" />
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}

function Summary({ label, value, tone = "text-blue-700" }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="text-xs font-black uppercase text-slate-400">{label}</div>
      <div className={`mt-2 text-3xl font-black ${tone}`}>{value}</div>
    </div>
  );
}
