import { useMemo, useState } from "react";
import { BellRing, CheckCircle2, Trash2 } from "lucide-react";
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
  const [version, setVersion] = useState(0);

  const summary = useMemo(() => getRestockAlertSummary(), [version]);
  const rows = useMemo(() => {
    const allRows = getRestockAlerts();
    if (status === "all") return allRows;
    return allRows.filter((row) => row.status === status);
  }, [status, version]);

  function refresh() {
    setVersion((value) => value + 1);
  }

  function notify(id) {
    markRestockAlertNotified(id);
    refresh();
  }

  function remove(id) {
    deleteRestockAlert(id);
    refresh();
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Customer Demand"
        title="Restock / Coming Soon Alerts"
        desc="Danh sách khách đăng ký báo khi hàng về, restock hoặc mở pre-order."
      />

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <Summary label="Total alerts" value={summary.total} />
        <Summary label="Pending" value={summary.pending} tone="text-amber-600" />
        <Summary label="Notified" value={summary.notified} tone="text-green-600" />
      </section>

      <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex gap-2 overflow-x-auto">
          {["all", "Pending", "Notified"].map((item) => (
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
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-10 text-center font-bold text-slate-400">
                    No alerts yet.
                  </td>
                </tr>
              ) : (
                rows.map((item) => (
                  <tr key={item.id} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3 font-black">
                      <a href={`/product/${item.productSlug}`} className="text-blue-700 hover:underline">
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
                      <button onClick={() => notify(item.id)} className="mr-2 rounded-xl bg-green-50 px-3 py-2 text-xs font-black text-green-700">
                        <CheckCircle2 size={15} className="mr-1 inline" />
                        Notified
                      </button>
                      <button onClick={() => remove(item.id)} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700">
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
