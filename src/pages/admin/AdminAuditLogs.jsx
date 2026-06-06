import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Download,
  Eye,
  FileText,
  RefreshCcw,
  Search,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import {
  downloadAdminAuditLogsCsv,
  getAdminAuditLogsApi,
} from "../../services/AdminAuditApiService";

const PERIODS = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

function StatCard({ icon: Icon, label, value, hint, tone = "blue" }) {
  const toneMap = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
          {hint && <p className="mt-1 text-xs font-bold text-slate-500">{hint}</p>}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneMap[tone] || toneMap.blue}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function shortDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN");
}

function actionTone(action = "") {
  const value = String(action || "").toUpperCase();

  if (value.includes("DELETE") || value.includes("CANCEL") || value.includes("REJECT")) return "bg-red-50 text-red-700";
  if (value.includes("CREATE") || value.includes("APPROVE")) return "bg-emerald-50 text-emerald-700";
  if (value.includes("UPDATE") || value.includes("FULFILLMENT")) return "bg-blue-50 text-blue-700";
  if (value.includes("PAYMENT") || value.includes("REFUND")) return "bg-violet-50 text-violet-700";

  return "bg-slate-100 text-slate-600";
}

function JsonBlock({ value }) {
  return (
    <pre className="max-h-[420px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
      {JSON.stringify(value || {}, null, 2)}
    </pre>
  );
}

export default function AdminAuditLogs() {
  const [period, setPeriod] = useState("7d");
  const [action, setAction] = useState("ALL");
  const [entity, setEntity] = useState("ALL");
  const [query, setQuery] = useState("");
  const [take, setTake] = useState(300);
  const [data, setData] = useState(null);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const params = useMemo(() => ({
    period,
    action,
    entity,
    q: query,
    take,
  }), [period, action, entity, query, take]);

  async function reload() {
    setLoading(true);
    setApiError("");

    try {
      const result = await getAdminAuditLogsApi(params);
      setData(result);

      if (action !== "ALL" && !(result.filters?.actions || []).includes(action)) {
        setAction("ALL");
      }

      if (entity !== "ALL" && !(result.filters?.entities || []).includes(entity)) {
        setEntity("ALL");
      }
    } catch (error) {
      setApiError(error?.message || "Cannot load audit logs.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, action, entity, take]);

  async function exportCsv() {
    setExporting(true);

    try {
      await downloadAdminAuditLogsCsv(params);
    } catch (error) {
      alert(error?.message || "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  const logs = data?.logs || [];
  const summary = data?.summary || {};
  const actions = data?.filters?.actions || [];
  const entities = data?.filters?.entities || [];

  return (
    <>
      <AdminPageHeader
        eyebrow="Security & Governance"
        title="Audit Log / Admin Activity Center"
        desc="Track admin actions, order operations, payment/shipping changes, complaint workflow and commercial changes from backend audit logs."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void reload()}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
            >
              <RefreshCcw size={15} className="mr-1 inline" />
              {loading ? "Loading..." : "Refresh"}
            </button>
            <button
              onClick={() => void exportCsv()}
              disabled={exporting}
              className="rounded-md bg-blue-700 px-4 py-2 text-xs font-black text-white hover:bg-blue-800 disabled:opacity-50"
            >
              <Download size={15} className="mr-1 inline" />
              {exporting ? "Exporting..." : "Export CSV"}
            </button>
          </div>
        }
      />

      {apiError && (
        <section className="mb-4 rounded-3xl border border-red-100 bg-red-50 p-4 text-sm font-black text-red-700">
          {apiError}
        </section>
      )}

      <section className="mb-4 grid gap-4 md:grid-cols-4">
        <StatCard icon={Activity} label="Events" value={summary.total || 0} hint={period} tone="blue" />
        <StatCard icon={UserRound} label="Actors" value={summary.uniqueActors || 0} hint="Unique admin/system actors" tone="slate" />
        <StatCard icon={FileText} label="Order related" value={summary.orderRelated || 0} hint="Linked to order" tone="emerald" />
        <StatCard icon={ShieldAlert} label="System events" value={summary.systemEvents || 0} hint="No actor attached" tone={summary.systemEvents ? "amber" : "slate"} />
      </section>

      <section className="mb-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[180px_220px_220px_1fr_120px_auto]">
          <div>
            <label className="text-xs font-black uppercase text-slate-400">Period</label>
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black outline-none"
            >
              {PERIODS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-black uppercase text-slate-400">Action</label>
            <select
              value={action}
              onChange={(event) => setAction(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black outline-none"
            >
              <option value="ALL">All actions</option>
              {actions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-black uppercase text-slate-400">Entity</label>
            <select
              value={entity}
              onChange={(event) => setEntity(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black outline-none"
            >
              <option value="ALL">All entities</option>
              {entities.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-black uppercase text-slate-400">Search</label>
            <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-white px-3">
              <Search size={16} className="text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search actor, action, entity, order, metadata..."
                className="w-full bg-transparent px-3 py-3 text-sm font-semibold outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-black uppercase text-slate-400">Take</label>
            <select
              value={take}
              onChange={(event) => setTake(Number(event.target.value))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black outline-none"
            >
              {[100, 300, 500, 1000].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => void reload()}
            className="self-end rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black text-white hover:bg-slate-800"
          >
            Search
          </button>
        </div>
      </section>

      <section className="mb-4 grid gap-4 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black text-slate-950">Top actions</h2>
          <div className="mt-4 space-y-2">
            {(summary.actions || []).map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-xs font-black">
                <span className="truncate text-slate-700">{item.name}</span>
                <span className="text-blue-700">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black text-slate-950">Top entities</h2>
          <div className="mt-4 space-y-2">
            {(summary.entities || []).map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-xs font-black">
                <span className="truncate text-slate-700">{item.name}</span>
                <span className="text-blue-700">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black text-slate-950">Top actors</h2>
          <div className="mt-4 space-y-2">
            {(summary.actors || []).map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-xs font-black">
                <span className="truncate text-slate-700">{item.name}</span>
                <span className="text-blue-700">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Metadata</th>
                <th className="px-4 py-3">Detail</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-xs font-bold text-slate-500">{shortDate(log.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="font-black text-slate-900">{log.actor}</div>
                    <div className="text-xs font-bold text-slate-400">{log.actorEmail || log.actorId || "-"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${actionTone(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-black text-slate-900">{log.entity}</div>
                    <div className="text-xs font-bold text-slate-400">{log.entityId || "-"}</div>
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-600">{log.orderNo || "-"}</td>
                  <td className="max-w-[340px] truncate px-4 py-3 text-xs font-mono text-slate-500">
                    {JSON.stringify(log.metadata || {})}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 hover:bg-blue-100"
                    >
                      <Eye size={13} className="mr-1 inline" />
                      View
                    </button>
                  </td>
                </tr>
              ))}

              {!logs.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm font-bold text-slate-400">
                    {loading ? "Loading audit logs..." : "No audit logs found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AdminDrawer
        open={Boolean(selectedLog)}
        title={selectedLog ? `Audit detail · ${selectedLog.action}` : "Audit detail"}
        onClose={() => setSelectedLog(null)}
        onSave={undefined}
        saveLabel=""
        width="max-w-3xl"
      >
        {selectedLog && (
          <div className="space-y-5">
            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl bg-blue-50 p-4">
                <div className="text-xs font-black uppercase text-blue-600">Actor</div>
                <div className="mt-2 text-lg font-black text-slate-950">{selectedLog.actor}</div>
                <div className="mt-1 text-xs font-bold text-slate-500">{selectedLog.actorEmail || selectedLog.actorId || "-"}</div>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="text-xs font-black uppercase text-slate-500">Time</div>
                <div className="mt-2 text-lg font-black text-slate-950">{shortDate(selectedLog.createdAt)}</div>
              </div>
              <div className="rounded-3xl bg-violet-50 p-4">
                <div className="text-xs font-black uppercase text-violet-600">Entity</div>
                <div className="mt-2 text-lg font-black text-slate-950">{selectedLog.entity}</div>
                <div className="mt-1 text-xs font-bold text-slate-500">{selectedLog.entityId || "-"}</div>
              </div>
              <div className="rounded-3xl bg-emerald-50 p-4">
                <div className="text-xs font-black uppercase text-emerald-600">Order</div>
                <div className="mt-2 text-lg font-black text-slate-950">{selectedLog.orderNo || "-"}</div>
                <div className="mt-1 text-xs font-bold text-slate-500">{selectedLog.orderId || "-"}</div>
              </div>
            </section>

            <section>
              <div className="mb-2 text-sm font-black text-slate-900">Metadata JSON</div>
              <JsonBlock value={selectedLog.metadata} />
            </section>
          </div>
        )}
      </AdminDrawer>

      {data?.generatedAt && (
        <div className="mt-4 text-right text-xs font-bold text-slate-400">
          Generated at {shortDate(data.generatedAt)}
        </div>
      )}
    </>
  );
}
