import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  CheckCircle2,
  ClipboardList,
  PackageSearch,
  RefreshCcw,
  ShoppingCart,
  Star,
  Ticket,
  Truck,
  Users,
  WalletCards,
} from "lucide-react";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { formatCurrency } from "../../utils/format";
import { getAdminDashboardKpisApi } from "../../services/AdminDashboardApiService";

function StatCard({ icon: Icon, label, value, hint, tone = "blue" }) {
  const toneMap = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    violet: "bg-violet-50 text-violet-700",
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

function BarRow({ label, value, max, tone = "bg-blue-600" }) {
  const percent = max > 0 ? Math.max(4, Math.round((Number(value || 0) / max) * 100)) : 0;

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between text-xs font-black text-slate-600">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function MiniTrend({ data = [] }) {
  const maxRevenue = Math.max(...data.map((item) => Number(item.revenue || 0)), 1);

  return (
    <div className="flex h-44 items-end gap-2 rounded-3xl bg-slate-50 p-4">
      {data.map((item) => {
        const height = Math.max(8, Math.round((Number(item.revenue || 0) / maxRevenue) * 140));

        return (
          <div key={item.date} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
            <div className="w-full rounded-t-xl bg-blue-600" style={{ height }} title={`${item.date}: ${formatCurrency(item.revenue)}`} />
            <div className="w-full truncate text-center text-[10px] font-bold text-slate-400">{item.date.slice(5)}</div>
          </div>
        );
      })}
    </div>
  );
}

function Section({ title, desc, children, action }) {
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          {desc && <p className="mt-1 text-sm font-semibold text-slate-500">{desc}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function shortDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN");
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  async function reload() {
    setLoading(true);
    setApiError("");

    try {
      const result = await getAdminDashboardKpisApi();
      setData(result);
    } catch (error) {
      // Keep the last successfully loaded numbers on screen instead of
      // wiping them to zero — a transient refresh failure (e.g. backend
      // cold start) shouldn't make a healthy store look dead.
      setApiError(error?.message || "Cannot load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};
  const queues = data?.actionQueues || {};
  // Distinguish "never loaded yet" from "confirmed zero" so a failed first
  // load reads as unknown ("—") instead of a misleadingly empty store.
  const noDataYet = !data;
  const stat = (formatted) => (noDataYet ? "—" : formatted);

  const maxOrderStatus = useMemo(() => {
    return Math.max(...Object.values(charts.orderStatusSummary || {}).map(Number), 1);
  }, [charts.orderStatusSummary]);

  const maxFulfillment = useMemo(() => {
    return Math.max(...Object.values(charts.fulfillmentSummary || {}).map(Number), 1);
  }, [charts.fulfillmentSummary]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Executive Operations"
        title="Admin KPI Dashboard"
        desc="One-page operating view across sales, products, inventory, fulfillment, customers, reviews and complaints."
        action={
          <button
            onClick={() => void reload()}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
          >
            <RefreshCcw size={15} className="mr-1 inline" />
            {loading ? "Loading..." : "Refresh"}
          </button>
        }
      />

      {apiError && (
        <section className="mb-4 rounded-3xl border border-red-100 bg-red-50 p-4 text-sm font-black text-red-700">
          {apiError}
        </section>
      )}

      <section className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={WalletCards} label="Revenue today" value={stat(formatCurrency(kpis.revenueToday || 0))} hint="Valid non-cancelled orders" tone="emerald" />
        <StatCard icon={BarChart3} label="Revenue 30 days" value={stat(formatCurrency(kpis.revenue30 || 0))} hint={`AOV ${formatCurrency(kpis.avgOrderValue30 || 0)}`} tone="blue" />
        <StatCard icon={ShoppingCart} label="Orders today" value={stat(kpis.ordersToday || 0)} hint={`${kpis.orders30 || 0} orders in 30 days`} tone="violet" />
        <StatCard icon={Users} label="Customers" value={stat(kpis.customers || 0)} hint="Registered accounts" tone="slate" />
        <StatCard icon={Boxes} label="Active products" value={stat(kpis.activeProducts || 0)} hint={`${kpis.productIssues || 0} product data issue(s)`} tone={kpis.productIssues ? "amber" : "emerald"} />
        <StatCard icon={PackageSearch} label="Low stock" value={stat(kpis.lowStockProducts || 0)} hint="Stock <= 5" tone={kpis.lowStockProducts ? "amber" : "emerald"} />
        <StatCard icon={Truck} label="Need tracking" value={stat(kpis.fulfillmentNeedsTracking || 0)} hint="Shipping orders missing tracking" tone={kpis.fulfillmentNeedsTracking ? "red" : "emerald"} />
        <StatCard icon={Ticket} label="Open complaints" value={stat(kpis.openComplaints || 0)} hint={`${kpis.pendingReviews || 0} pending review(s)`} tone={kpis.openComplaints ? "red" : "emerald"} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Section title="Revenue trend" desc="Last 14 days from backend orders">
          <MiniTrend data={charts.dailyTrend || []} />
        </Section>

        <Section title="Order status mix" desc="Last 30 days">
          <div className="space-y-3">
            {Object.entries(charts.orderStatusSummary || {}).map(([status, value]) => (
              <BarRow key={status} label={status} value={value} max={maxOrderStatus} tone="bg-violet-600" />
            ))}
            {!Object.keys(charts.orderStatusSummary || {}).length && <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm font-bold text-slate-400">No order status data.</div>}
          </div>
        </Section>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-3">
        <Section title="Fulfillment queue" desc="Operational load by stage">
          <div className="space-y-3">
            {Object.entries(charts.fulfillmentSummary || {}).map(([stage, value]) => (
              <BarRow key={stage} label={stage} value={value} max={maxFulfillment} tone={stage === "needsTracking" ? "bg-red-600" : "bg-blue-600"} />
            ))}
          </div>
        </Section>

        <Section title="Top products" desc="By revenue, last 30 days">
          <div className="space-y-3">
            {(charts.topProducts || []).map((item) => (
              <div key={`${item.sku}-${item.name}`} className="rounded-2xl bg-slate-50 p-3">
                <div className="text-xs font-black text-slate-500">{item.sku}</div>
                <div className="mt-1 line-clamp-1 text-sm font-black text-slate-950">{item.name}</div>
                <div className="mt-2 flex justify-between text-xs font-black">
                  <span className="text-blue-700">Qty {item.quantity}</span>
                  <span className="text-emerald-700">{formatCurrency(item.revenue)}</span>
                </div>
              </div>
            ))}
            {!(charts.topProducts || []).length && <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm font-bold text-slate-400">No sales item data.</div>}
          </div>
        </Section>

        <Section title="Active vouchers" desc="Commercial campaigns in market">
          <div className="space-y-3">
            {(queues.vouchers || []).slice(0, 8).map((voucher) => (
              <div key={voucher.id} className="rounded-2xl bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <div className="font-black text-slate-900">{voucher.code}</div>
                  <div className="text-xs font-black text-blue-700">{voucher.type}</div>
                </div>
                <div className="mt-1 text-xs font-bold text-slate-500">{voucher.name}</div>
                <div className="mt-2 text-xs font-bold text-slate-600">
                  Used {voucher.usedCount || 0}/{voucher.usageLimit || "∞"}
                </div>
              </div>
            ))}
            {!(queues.vouchers || []).length && <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm font-bold text-slate-400">No active vouchers.</div>}
          </div>
        </Section>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-3">
        <Section title="Product data issues" desc="Need commercial/product admin action">
          <div className="space-y-3">
            {(queues.productIssues || []).map((product) => (
              <div key={product.id} className="rounded-2xl border border-amber-100 bg-amber-50 p-3">
                <div className="text-xs font-black text-amber-700">{product.sku}</div>
                <div className="mt-1 line-clamp-1 text-sm font-black text-slate-950">{product.name}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {product.issues.map((issue) => (
                    <span key={issue} className="rounded-full bg-white px-2 py-1 text-[11px] font-black text-amber-700">{issue}</span>
                  ))}
                </div>
              </div>
            ))}
            {!(queues.productIssues || []).length && <div className="rounded-2xl bg-emerald-50 p-5 text-sm font-black text-emerald-700"><CheckCircle2 size={15} className="mr-1 inline" /> No product data issues.</div>}
          </div>
        </Section>

        <Section title="Low stock watchlist" desc="Active products with stock <= 5">
          <div className="space-y-3">
            {(queues.lowStockProducts || []).map((product) => (
              <div key={product.id} className="grid grid-cols-[1fr_auto] rounded-2xl bg-slate-50 p-3">
                <div>
                  <div className="text-xs font-black text-slate-500">{product.sku}</div>
                  <div className="mt-1 line-clamp-1 text-sm font-black text-slate-950">{product.name}</div>
                </div>
                <div className="text-lg font-black text-red-600">{product.stock}</div>
              </div>
            ))}
            {!(queues.lowStockProducts || []).length && <div className="rounded-2xl bg-emerald-50 p-5 text-sm font-black text-emerald-700">Stock level looks good.</div>}
          </div>
        </Section>

        <Section title="Fulfillment action queue" desc="Latest active fulfillment orders">
          <div className="space-y-3">
            {(queues.fulfillment || []).map((order) => (
              <div key={order.id} className="rounded-2xl bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-black text-slate-900">{order.orderNo}</div>
                  <div className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-black text-blue-700">{order.status}</div>
                </div>
                <div className="mt-1 text-xs font-bold text-slate-500">{order.customerName} · {order.customerPhone}</div>
                <div className="mt-2 flex justify-between text-xs font-black">
                  <span className={order.trackingCode ? "text-emerald-600" : "text-red-600"}>{order.trackingCode || "Missing tracking"}</span>
                  <span>{shortDate(order.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </section>

      {data?.generatedAt && (
        <div className="mt-4 text-right text-xs font-bold text-slate-400">
          Generated at {shortDate(data.generatedAt)}
        </div>
      )}
    </>
  );
}
