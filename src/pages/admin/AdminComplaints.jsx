import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Eye, MessageSquarePlus, RefreshCcw, Search, WalletCards } from "lucide-react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import { AdminSelect, AdminTextarea, AdminTextField } from "../../components/admin/AdminField";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { formatCurrency } from "../../utils/format";
import {
  addAdminComplaintCommentApi,
  getAdminComplaintDetailApi,
  getAdminComplaintsApi,
  updateAdminComplaintApi,
} from "../../services/AdminComplaintApiService";

const STATUS_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "NEW", label: "New" },
  { value: "VERIFYING", label: "Verifying" },
  { value: "WAITING_CUSTOMER", label: "Waiting customer" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const REFUND_OPTIONS = [
  { value: "NONE", label: "None" },
  { value: "REQUESTED", label: "Requested" },
  { value: "APPROVED", label: "Approved" },
  { value: "PAID", label: "Paid" },
  { value: "REJECTED", label: "Rejected" },
];

function statusClass(status = "") {
  if (status === "NEW") return "bg-amber-50 text-amber-700";
  if (status === "VERIFYING" || status === "WAITING_CUSTOMER") return "bg-blue-50 text-blue-700";
  if (status === "APPROVED") return "bg-violet-50 text-violet-700";
  if (status === "RESOLVED" || status === "CLOSED") return "bg-emerald-50 text-emerald-700";
  if (status === "REJECTED") return "bg-red-50 text-red-700";
  return "bg-slate-100 text-slate-600";
}

function priorityClass(priority = "") {
  if (priority === "URGENT") return "bg-red-600 text-white";
  if (priority === "HIGH") return "bg-red-50 text-red-700";
  if (priority === "MEDIUM") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

function shortDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN");
}

export default function AdminComplaints() {
  const [tickets, setTickets] = useState([]);
  const [summary, setSummary] = useState({});
  const [status, setStatus] = useState("ALL");
  const [query, setQuery] = useState("");
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [draft, setDraft] = useState(null);
  const [commentDraft, setCommentDraft] = useState("");

  async function reload() {
    setLoading(true);
    setApiError("");

    try {
      const data = await getAdminComplaintsApi({ status, q: query });
      setTickets(data.tickets || []);
      setSummary(data.summary || {});
    } catch (error) {
      setApiError(error?.message || "Cannot load complaint tickets.");
      setTickets([]);
      setSummary({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const urgentTickets = useMemo(() => {
    return tickets.filter((ticket) => ticket.priority === "URGENT" || ticket.priority === "HIGH");
  }, [tickets]);

  function patch(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  async function openDetail(ticket) {
    setDrawerOpen(true);
    setDetail(null);
    setDraft(null);
    setCommentDraft("");

    try {
      const item = await getAdminComplaintDetailApi(ticket.id);
      setDetail(item);
      setDraft({
        status: item.status,
        priority: item.priority,
        resolution: item.resolution || "",
        refundAmount: Number(item.refundAmount || 0),
        refundStatus: item.refundStatus || "NONE",
        returnTracking: item.returnTracking || "",
      });
    } catch (error) {
      alert(error?.message || "Cannot open ticket.");
      setDrawerOpen(false);
    }
  }

  async function saveTicket() {
    if (!detail?.id || !draft) return;

    try {
      const ticket = await updateAdminComplaintApi(detail.id, {
        ...draft,
        refundAmount: Number(draft.refundAmount || 0),
        comment: commentDraft,
      });
      setDetail(ticket);
      setCommentDraft("");
      await reload();
      alert("Ticket updated.");
    } catch (error) {
      alert(error?.message || "Cannot update ticket.");
    }
  }

  async function addComment() {
    if (!detail?.id || !commentDraft.trim()) return;

    try {
      await addAdminComplaintCommentApi(detail.id, {
        content: commentDraft,
        type: "ADMIN_COMMENT",
      });
      const item = await getAdminComplaintDetailApi(detail.id);
      setDetail(item);
      setCommentDraft("");
    } catch (error) {
      alert(error?.message || "Cannot add comment.");
    }
  }

  async function quickStatus(ticket, nextStatus) {
    try {
      await updateAdminComplaintApi(ticket.id, {
        status: nextStatus,
        priority: ticket.priority,
      });
      await reload();
    } catch (error) {
      alert(error?.message || "Cannot update status.");
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Customer service"
        title="Return / Refund / Complaint Center"
        desc="Handle return, refund, damaged box, missing part and complaint tickets from backend DB."
        action={
          <button onClick={() => void reload()} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">
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

      <section className="mb-4 grid gap-4 md:grid-cols-6">
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">Total</p><p className="mt-2 text-2xl font-black">{summary.total || 0}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">New</p><p className="mt-2 text-2xl font-black text-amber-600">{summary.new || 0}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">Verifying</p><p className="mt-2 text-2xl font-black text-blue-600">{summary.verifying || 0}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">Refund</p><p className="mt-2 text-2xl font-black text-violet-600">{summary.refund || 0}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">Urgent</p><p className="mt-2 text-2xl font-black text-red-600">{summary.urgent || urgentTickets.length}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">Resolved</p><p className="mt-2 text-2xl font-black text-emerald-600">{summary.resolved || 0}</p></div>
      </section>

      <section className="mb-4 rounded-md border border-slate-200 bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[240px_1fr_auto]">
          <AdminSelect label="Status" options={STATUS_OPTIONS} value={status} onChange={setStatus} />
          <div className="flex items-center self-end rounded-md border border-slate-300 bg-white px-3">
            <Search size={16} className="text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search ticket, order, customer, phone, issue..."
              className="w-full bg-transparent px-3 py-3 text-sm font-semibold outline-none"
            />
          </div>
          <button onClick={() => void reload()} className="self-end rounded-md bg-slate-900 px-4 py-3 text-xs font-black text-white hover:bg-slate-800">
            Search
          </button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {tickets.map((ticket) => (
          <article key={ticket.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-black text-blue-700">{ticket.ticketNo}</div>
                <h3 className="mt-1 text-lg font-black text-slate-950">{ticket.issue}</h3>
                <div className="mt-1 text-xs font-bold text-slate-500">
                  {ticket.customerName} · {ticket.customerPhone || "-"} · {shortDate(ticket.createdAt)}
                </div>
                <div className="mt-1 text-xs font-black text-slate-400">
                  {ticket.order?.orderNo ? `Order ${ticket.order.orderNo}` : "No order linked"}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(ticket.status)}`}>{ticket.status}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${priorityClass(ticket.priority)}`}>{ticket.priority}</span>
              </div>
            </div>

            <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{ticket.description}</p>

            <div className="mt-4 grid gap-2 text-xs font-bold text-slate-500 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="text-slate-400">Type</div>
                <div className="mt-1 font-black text-slate-800">{ticket.type}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="text-slate-400">Refund</div>
                <div className="mt-1 font-black text-slate-800">{ticket.refundStatus} · {formatCurrency(ticket.refundAmount || 0)}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="text-slate-400">Return tracking</div>
                <div className="mt-1 font-black text-slate-800">{ticket.returnTracking || "-"}</div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {ticket.status === "NEW" && (
                <button onClick={() => void quickStatus(ticket, "VERIFYING")} className="rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">
                  Verify
                </button>
              )}
              {!["RESOLVED", "CLOSED"].includes(ticket.status) && (
                <button onClick={() => void quickStatus(ticket, "RESOLVED")} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white">
                  <CheckCircle2 size={14} className="mr-1 inline" />
                  Resolve
                </button>
              )}
              <button onClick={() => void openDetail(ticket)} className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 hover:bg-blue-100">
                <Eye size={14} className="mr-1 inline" />
                Detail
              </button>
            </div>
          </article>
        ))}

        {!tickets.length && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm font-bold text-slate-400 xl:col-span-2">
            {loading ? "Loading tickets..." : "No tickets found."}
          </div>
        )}
      </section>

      <AdminDrawer
        open={drawerOpen}
        title={detail ? `${detail.ticketNo} · ${detail.issue}` : "Ticket detail"}
        onClose={() => setDrawerOpen(false)}
        onSave={() => void saveTicket()}
        saveLabel="Save ticket"
        width="max-w-5xl"
      >
        {detail && draft && (
          <div className="space-y-5">
            <section className="grid gap-4 md:grid-cols-4">
              <div className="rounded-3xl bg-red-50 p-4">
                <div className="text-xs font-black uppercase text-red-600">Ticket</div>
                <div className="mt-2 text-lg font-black">{detail.ticketNo}</div>
              </div>
              <div className="rounded-3xl bg-blue-50 p-4">
                <div className="text-xs font-black uppercase text-blue-600">Order</div>
                <div className="mt-2 text-lg font-black">{detail.order?.orderNo || "-"}</div>
              </div>
              <div className="rounded-3xl bg-violet-50 p-4">
                <div className="text-xs font-black uppercase text-violet-600">Type</div>
                <div className="mt-2 text-lg font-black">{detail.type}</div>
              </div>
              <div className="rounded-3xl bg-emerald-50 p-4">
                <div className="text-xs font-black uppercase text-emerald-600">Refund</div>
                <div className="mt-2 text-lg font-black">{formatCurrency(draft.refundAmount || 0)}</div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900">
                <AlertTriangle size={16} />
                Customer issue
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                <div className="font-black text-slate-950">{detail.customerName} · {detail.customerPhone || "-"}</div>
                <div className="mt-2 font-black">{detail.issue}</div>
                <p className="mt-2">{detail.description}</p>
              </div>
            </section>

            <section className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
              <div className="mb-3 text-sm font-black text-blue-900">Resolution workflow</div>
              <div className="grid gap-3 md:grid-cols-2">
                <AdminSelect label="Status" options={STATUS_OPTIONS.filter((item) => item.value !== "ALL")} value={draft.status} onChange={(value) => patch("status", value)} />
                <AdminSelect label="Priority" options={PRIORITY_OPTIONS} value={draft.priority} onChange={(value) => patch("priority", value)} />
                <AdminSelect label="Refund status" options={REFUND_OPTIONS} value={draft.refundStatus} onChange={(value) => patch("refundStatus", value)} />
                <AdminTextField label="Refund amount" type="number" value={draft.refundAmount} onChange={(value) => patch("refundAmount", value)} />
                <AdminTextField label="Return tracking" value={draft.returnTracking} onChange={(value) => patch("returnTracking", value)} />
                <AdminTextarea label="Resolution" rows={3} value={draft.resolution} onChange={(value) => patch("resolution", value)} />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900">
                <MessageSquarePlus size={16} />
                Add comment / customer update
              </div>
              <AdminTextarea label="Comment" rows={4} value={commentDraft} onChange={setCommentDraft} />
              <button onClick={() => void addComment()} className="mt-3 rounded-2xl bg-blue-700 px-4 py-3 text-xs font-black text-white">
                Add comment only
              </button>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="mb-3 text-sm font-black text-slate-900">Order items</div>
                <div className="space-y-2">
                  {(detail.order?.items || []).map((item) => (
                    <div key={item.id} className="grid grid-cols-[1fr_auto] rounded-2xl bg-slate-50 p-3 text-sm">
                      <div>
                        <div className="font-black text-slate-900">{item.variantName || item.name}</div>
                        <div className="text-xs font-bold text-slate-500">{item.sku}</div>
                      </div>
                      <div className="font-black text-blue-700">x{item.quantity}</div>
                    </div>
                  ))}
                  {!detail.order?.items?.length && (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm font-bold text-slate-400">
                      No linked order items.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="mb-3 text-sm font-black text-slate-900">Timeline</div>
                <div className="max-h-80 space-y-3 overflow-y-auto">
                  {(detail.comments || []).map((comment) => (
                    <div key={comment.id} className="rounded-2xl bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-black text-blue-700">{comment.type}</span>
                        <span className="text-[11px] font-bold text-slate-400">{shortDate(comment.createdAt)}</span>
                      </div>
                      <div className="mt-2 text-xs font-black text-slate-500">{comment.actorName || "System"}</div>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{comment.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}
      </AdminDrawer>
    </>
  );
}
