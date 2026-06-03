import { useEffect, useMemo, useState } from "react";
import { BellRing, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminStatusBadge from "../../components/admin/AdminStatusBadge";
import {
  deleteRestockAlert,
  getRestockAlerts,
  getRestockAlertSummary,
  markRestockAlertNotified,
} from "../../services/RestockAlertService";

export default function AdminRestockAlerts() {
  const [status, setStatus] = useState("all");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");

  const summary = useMemo(() => getRestockAlertSummary(rows), [rows]);

  async function loadRows(nextStatus = status) {
    try {
      setLoading(true);
      setError("");
      const data = await getRestockAlerts(nextStatus);
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Unable to load restock alerts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRows(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function notify(id) {
    try {
      setActionId(id);
      await markRestockAlertNotified(id);
      await loadRows(status);
    } catch (err) {
      setError(err?.message || "Unable to mark notified.");
    } finally {
      setActionId("");
    }
  }

  async function remove(id) {
    try {
      setActionId(id);
      await deleteRestockAlert(id);
      await loadRows(status);
    } catch (err) {
      setError(err?.message || "Unable to delete alert.");
    } finally {
      setActionId("");
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Customer Demand"
        title="Restock / Coming Soon Alerts"
        desc="Danh sách khách đăng ký báo khi hàng về, restock hoặc mở pre-order."
      />

      {error && (
        <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-600">
          {error}
        </div>
      )}

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <Summary label="Total alerts" value={summary.total} />
        <Summary label="Pending" value={summary.pending} tone="text-amber-600" />
        <Summary label="Notified" value={summary.notified} tone="text-green-600" />
      </section>

      <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex gap-2 overflow-x-auto">
          {[
            { key: "all", label: "All" },
            { key: "PENDING", label: "Pending" },
            { key: "NOTIFIED", label: "Notified" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setStatus(item.key)}
              className={`rounded-2xl px-4 py-2 text-sm font-black ${
                status === item.key ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3">Scale</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-10 text-center font-bold text-slate-400">
                    <Loader2 className="mx-auto animate-spin" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-10 text-center font-bold text-slate-400">
                    No alerts yet.
                  </td>
                </tr>
              ) : (
                rows.map((item) => (
                  <tr key={item.id} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3 font-black">
                      <a href={`/product/${item.productSlug || item.productId}`} className="text-blue-700 hover:underline">
                        {item.productName}
                      </a>
                    </td>
                    <td className="px-4 py-3">{item.name}</td>
                    <td className="px-4 py-3">{item.phone}</td>
                    <td className="px-4 py-3">{item.grade || "-"}</td>
                    <td className="px-4 py-3">{item.scale || "-"}</td>
                    <td className="px-4 py-3">{item.note || "-"}</td>
                    <td className="px-4 py-3"><AdminStatusBadge>{item.status}</AdminStatusBadge></td>
                    <td className="px-4 py-3">{item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : "-"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => notify(item.id)}
                        disabled={actionId === item.id || item.status === "NOTIFIED"}
                        className="mr-2 rounded-xl bg-green-50 px-3 py-2 text-xs font-black text-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <CheckCircle2 size={15} className="mr-1 inline" />
                        Notified
                      </button>
                      <button
                        onClick={() => remove(item.id)}
                        disabled={actionId === item.id}
                        className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={15} className="mr-1 inline" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Summary({ label, value, tone = "text-blue-700" }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-400">
        <BellRing size={15} />
        {label}
      </div>
      <div className={`mt-2 text-3xl font-black ${tone}`}>{value}</div>
    </div>
  );
}
