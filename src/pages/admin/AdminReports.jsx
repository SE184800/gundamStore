import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Package,
  RefreshCcw,
  ShoppingBag,
  Star,
  Ticket,
  Truck,
  Users,
} from "lucide-react";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { formatCurrency } from "../../utils/format";
import useToast from "../../hooks/useToast";
import Toast from "../../utils/Toast";
import {
  downloadAdminReportCsv,
  getAdminReportCenterApi,
} from "../../services/AdminReportApiService";

const PERIODS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "ytd", label: "Year to date" },
];

const REPORT_TYPES = [
  { key: "orders", label: "Orders", icon: ShoppingBag },
  { key: "salesByDay", label: "Sales by day", icon: BarChart3 },
  { key: "topProducts", label: "Top products", icon: Package },
  { key: "products", label: "Product data", icon: Package },
  { key: "customers", label: "Customers", icon: Users },
  { key: "fulfillment", label: "Fulfillment", icon: Truck },
  { key: "reviews", label: "Reviews", icon: Star },
  { key: "complaints", label: "Complaints", icon: Ticket },
];

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
          {hint && <p className="mt-1 text-xs font-bold text-slate-500">{hint}</p>}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function MiniBar({ label, value, max }) {
  const width = max > 0 ? Math.max(4, Math.round((Number(value || 0) / max) * 100)) : 0;

  return (
    <div>
      <div className="flex justify-between text-xs font-black text-slate-600">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function TablePreview({ type, rows = [] }) {
  const previewRows = rows.slice(0, 10);

  if (!previewRows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm font-bold text-slate-400">
        No data for this report.
      </div>
    );
  }

  const columnsByType = {
    orders: ["orderNo", "customerName", "customerPhone", "status", "paymentStatus", "total", "createdAt"],
    salesByDay: ["date", "orders", "revenue"],
    topProducts: ["sku", "name", "quantity", "revenue"],
    products: ["sku", "name", "category", "price", "stock", "issues"],
    customers: ["name", "email", "phone", "orderCount", "totalSpent", "lastOrderAt"],
    fulfillment: ["orderNo", "customerName", "status", "carrier", "trackingCode", "total"],
    reviews: ["productSku", "customerName", "rating", "status", "verifiedPurchase", "createdAt"],
    complaints: ["ticketNo", "orderNo", "customerName", "type", "priority", "status", "refundAmount"],
  };

  const columns = columnsByType[type] || Object.keys(previewRows[0] || {}).slice(0, 8);

  function renderValue(key, value) {
    if (["total", "revenue", "price", "totalSpent", "refundAmount"].includes(key)) return formatCurrency(Number(value || 0));
    if (String(key).toLowerCase().includes("at") && value) return new Date(value).toLocaleDateString("vi-VN");
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return String(value ?? "");
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, index) => (
              <tr key={row.id || `${type}-${index}`} className="border-t border-slate-100">
                {columns.map((column) => (
                  <td key={column} className="max-w-[260px] truncate px-4 py-3 font-semibold text-slate-700">
                    {renderValue(column, row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminReports() {
  const { toast, notify, dismiss } = useToast();
  const [period, setPeriod] = useState("30d");
  const [reportType, setReportType] = useState("orders");
  const [data, setData] = useState(null);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function reload() {
    setLoading(true);
    setApiError("");

    try {
      const result = await getAdminReportCenterApi(period);
      setData(result);
    } catch (error) {
      // Keep the last successfully loaded report on screen instead of
      // wiping it to zero on a transient refresh failure.
      setApiError(error?.message || "Cannot load reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const summary = data?.summary || {};
  const reports = data?.reports || {};
  const currentRows = reports[reportType] || [];

  const maxStatus = useMemo(() => {
    return Math.max(...(summary.statusSummary || []).map((item) => Number(item.count || 0)), 1);
  }, [summary.statusSummary]);

  async function exportCsv() {
    setExporting(true);

    try {
      await downloadAdminReportCsv(reportType, period);
    } catch (error) {
      notify("error", error?.message || "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={dismiss} />
      <AdminPageHeader
        eyebrow="Reports & Export"
        title="Reports / Export Center"
        desc="Backend DB reporting center for sales, customers, products, fulfillment, reviews and complaints."
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
              className="rounded-md bg-blue-700 px-4 py-2 text-xs font-black text-white hover:bg-blue-800 disabled:opacity-50"
              disabled={exporting}
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

      <section className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BarChart3} label="Revenue" value={formatCurrency(summary.revenue || 0)} hint={period} />
        <StatCard icon={ShoppingBag} label="Orders" value={summary.totalOrders || 0} hint={`AOV ${formatCurrency(summary.avgOrderValue || 0)}`} />
        <StatCard icon={Package} label="Products" value={summary.products || 0} hint={`${summary.productIssues || 0} data issue(s)`} />
        <StatCard icon={Users} label="Customers" value={summary.customers || 0} hint={`${summary.openComplaints || 0} open complaint(s)`} />
      </section>

      <section className="mb-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[240px_1fr]">
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
            <label className="text-xs font-black uppercase text-slate-400">Report type</label>
            <div className="mt-2 grid gap-2 md:grid-cols-4">
              {REPORT_TYPES.map((item) => {
                const Icon = item.icon;
                const active = reportType === item.key;

                return (
                  <button
                    key={item.key}
                    onClick={() => setReportType(item.key)}
                    className={`rounded-2xl border px-3 py-3 text-left text-xs font-black transition ${
                      active
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon size={15} className="mr-1 inline" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mb-4 grid gap-4 xl:grid-cols-2">
        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">Order status summary</h2>
          <div className="mt-4 space-y-3">
            {(summary.statusSummary || []).map((item) => (
              <MiniBar key={item.status} label={item.status} value={item.count} max={maxStatus} />
            ))}
            {!(summary.statusSummary || []).length && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm font-bold text-slate-400">
                No status data.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">Sales by day</h2>
          <div className="mt-4 space-y-3">
            {(reports.salesByDay || []).slice(-8).map((item) => (
              <div key={item.date} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                <div>
                  <div className="text-sm font-black text-slate-900">{item.date}</div>
                  <div className="text-xs font-bold text-slate-500">{item.orders} order(s)</div>
                </div>
                <div className="text-sm font-black text-emerald-600">{formatCurrency(item.revenue)}</div>
              </div>
            ))}
            {!(reports.salesByDay || []).length && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm font-bold text-slate-400">
                No sales data.
              </div>
            )}
          </div>
        </section>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-950">
              <FileSpreadsheet size={18} className="mr-1 inline text-blue-700" />
              Preview: {REPORT_TYPES.find((item) => item.key === reportType)?.label}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Showing first 10 rows. Export CSV downloads the full backend dataset for selected period.
            </p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
            {currentRows.length} row(s)
          </div>
        </div>

        <TablePreview type={reportType} rows={currentRows} />
      </section>

      {data?.generatedAt && (
        <div className="mt-4 text-right text-xs font-bold text-slate-400">
          Generated at {new Date(data.generatedAt).toLocaleString("vi-VN")}
        </div>
      )}
    </>
  );
}
