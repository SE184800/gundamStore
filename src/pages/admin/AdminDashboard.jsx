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
import { getOrderStatusLabel } from "../../constants/orderConfig";
import { useLang } from "../../store/CmsStore";

function getCopy(lang) {
  return {
    eyebrow: lang === "en" ? "Executive Operations" : "Điều hành tổng quan",
    title: lang === "en" ? "Admin KPI Dashboard" : "Bảng điều khiển KPI",
    desc:
      lang === "en"
        ? "One-page operating view across sales, products, inventory, fulfillment, customers, reviews and complaints."
        : "Toàn cảnh vận hành trên một màn hình: bán hàng, sản phẩm, tồn kho, giao hàng, khách hàng, đánh giá và khiếu nại.",
    loading: lang === "en" ? "Loading..." : "Đang tải...",
    refresh: lang === "en" ? "Refresh" : "Tải lại",
    revenueToday: lang === "en" ? "Revenue today" : "Doanh thu hôm nay",
    validOrders: lang === "en" ? "Valid non-cancelled orders" : "Đơn hợp lệ, chưa huỷ",
    revenue30: lang === "en" ? "Revenue 30 days" : "Doanh thu 30 ngày",
    ordersToday: lang === "en" ? "Orders today" : "Đơn hôm nay",
    ordersIn30: (count) => (lang === "en" ? `${count} orders in 30 days` : `${count} đơn trong 30 ngày`),
    customers: lang === "en" ? "Customers" : "Khách hàng",
    registeredAccounts: lang === "en" ? "Registered accounts" : "Tài khoản đã đăng ký",
    activeProducts: lang === "en" ? "Active products" : "Sản phẩm đang bán",
    productIssues: (count) => (lang === "en" ? `${count} product data issue(s)` : `${count} sản phẩm lỗi dữ liệu`),
    lowStock: lang === "en" ? "Low stock" : "Sắp hết hàng",
    stockThreshold: lang === "en" ? "Stock <= 5" : "Tồn kho <= 5",
    needTracking: lang === "en" ? "Need tracking" : "Cần mã vận đơn",
    missingTrackingHint: lang === "en" ? "Shipping orders missing tracking" : "Đơn đang giao thiếu mã vận đơn",
    openComplaints: lang === "en" ? "Open complaints" : "Khiếu nại đang mở",
    pendingReviews: (count) => (lang === "en" ? `${count} pending review(s)` : `${count} đánh giá chờ duyệt`),
    revenueTrend: lang === "en" ? "Revenue trend" : "Xu hướng doanh thu",
    last14Days: lang === "en" ? "Last 14 days from backend orders" : "14 ngày gần nhất, dữ liệu từ đơn hàng",
    orderStatusMix: lang === "en" ? "Order status mix" : "Tỉ lệ trạng thái đơn",
    last30Days: lang === "en" ? "Last 30 days" : "30 ngày gần nhất",
    noOrderStatus: lang === "en" ? "No order status data." : "Chưa có dữ liệu trạng thái đơn.",
    fulfillmentQueue: lang === "en" ? "Fulfillment queue" : "Hàng chờ xử lý giao hàng",
    operationalLoad: lang === "en" ? "Operational load by stage" : "Khối lượng công việc theo giai đoạn",
    topProducts: lang === "en" ? "Top products" : "Sản phẩm bán chạy",
    byRevenue30: lang === "en" ? "By revenue, last 30 days" : "Theo doanh thu, 30 ngày gần nhất",
    qty: lang === "en" ? "Qty" : "SL",
    noSalesItem: lang === "en" ? "No sales item data." : "Chưa có dữ liệu bán hàng.",
    activeVouchers: lang === "en" ? "Active vouchers" : "Voucher đang chạy",
    activeCampaigns: lang === "en" ? "Commercial campaigns in market" : "Chương trình khuyến mãi đang áp dụng",
    used: lang === "en" ? "Used" : "Đã dùng",
    noActiveVouchers: lang === "en" ? "No active vouchers." : "Chưa có voucher nào đang chạy.",
    productDataIssues: lang === "en" ? "Product data issues" : "Sản phẩm lỗi dữ liệu",
    needAdminAction: lang === "en" ? "Need commercial/product admin action" : "Cần admin xử lý giá/thông tin sản phẩm",
    noProductIssues: lang === "en" ? "No product data issues." : "Không có sản phẩm lỗi dữ liệu.",
    lowStockWatchlist: lang === "en" ? "Low stock watchlist" : "Danh sách sắp hết hàng",
    activeStockHint: lang === "en" ? "Active products with stock <= 5" : "Sản phẩm đang bán có tồn kho <= 5",
    stockLooksGood: lang === "en" ? "Stock level looks good." : "Tồn kho đang ổn.",
    fulfillmentActionQueue: lang === "en" ? "Fulfillment action queue" : "Hàng chờ xử lý giao hàng",
    latestFulfillment: lang === "en" ? "Latest active fulfillment orders" : "Đơn đang giao gần nhất",
    missingTracking: lang === "en" ? "Missing tracking" : "Thiếu mã vận đơn",
    generatedAt: lang === "en" ? "Generated at" : "Cập nhật lúc",
  };
}

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
  const [lang] = useLang();
  const t = getCopy(lang);
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
      setApiError(error?.message || (lang === "en" ? "Cannot load dashboard." : "Không tải được dữ liệu bảng điều khiển."));
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
        eyebrow={t.eyebrow}
        title={t.title}
        desc={t.desc}
        action={
          <button
            onClick={() => void reload()}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
          >
            <RefreshCcw size={15} className="mr-1 inline" />
            {loading ? t.loading : t.refresh}
          </button>
        }
      />

      {apiError && (
        <section className="mb-4 rounded-3xl border border-red-100 bg-red-50 p-4 text-sm font-black text-red-700">
          {apiError}
        </section>
      )}

      <section className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={WalletCards} label={t.revenueToday} value={stat(formatCurrency(kpis.revenueToday || 0))} hint={t.validOrders} tone="emerald" />
        <StatCard icon={BarChart3} label={t.revenue30} value={stat(formatCurrency(kpis.revenue30 || 0))} hint={`AOV ${formatCurrency(kpis.avgOrderValue30 || 0)}`} tone="blue" />
        <StatCard icon={ShoppingCart} label={t.ordersToday} value={stat(kpis.ordersToday || 0)} hint={t.ordersIn30(kpis.orders30 || 0)} tone="violet" />
        <StatCard icon={Users} label={t.customers} value={stat(kpis.customers || 0)} hint={t.registeredAccounts} tone="slate" />
        <StatCard icon={Boxes} label={t.activeProducts} value={stat(kpis.activeProducts || 0)} hint={t.productIssues(kpis.productIssues || 0)} tone={kpis.productIssues ? "amber" : "emerald"} />
        <StatCard icon={PackageSearch} label={t.lowStock} value={stat(kpis.lowStockProducts || 0)} hint={t.stockThreshold} tone={kpis.lowStockProducts ? "amber" : "emerald"} />
        <StatCard icon={Truck} label={t.needTracking} value={stat(kpis.fulfillmentNeedsTracking || 0)} hint={t.missingTrackingHint} tone={kpis.fulfillmentNeedsTracking ? "red" : "emerald"} />
        <StatCard icon={Ticket} label={t.openComplaints} value={stat(kpis.openComplaints || 0)} hint={t.pendingReviews(kpis.pendingReviews || 0)} tone={kpis.openComplaints ? "red" : "emerald"} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Section title={t.revenueTrend} desc={t.last14Days}>
          <MiniTrend data={charts.dailyTrend || []} />
        </Section>

        <Section title={t.orderStatusMix} desc={t.last30Days}>
          <div className="space-y-3">
            {Object.entries(charts.orderStatusSummary || {}).map(([status, value]) => (
              <BarRow key={status} label={getOrderStatusLabel(status, lang)} value={value} max={maxOrderStatus} tone="bg-violet-600" />
            ))}
            {!Object.keys(charts.orderStatusSummary || {}).length && <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm font-bold text-slate-400">{t.noOrderStatus}</div>}
          </div>
        </Section>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-3">
        <Section title={t.fulfillmentQueue} desc={t.operationalLoad}>
          <div className="space-y-3">
            {Object.entries(charts.fulfillmentSummary || {}).map(([stage, value]) => (
              <BarRow key={stage} label={stage} value={value} max={maxFulfillment} tone={stage === "needsTracking" ? "bg-red-600" : "bg-blue-600"} />
            ))}
          </div>
        </Section>

        <Section title={t.topProducts} desc={t.byRevenue30}>
          <div className="space-y-3">
            {(charts.topProducts || []).map((item) => (
              <div key={`${item.sku}-${item.name}`} className="rounded-2xl bg-slate-50 p-3">
                <div className="text-xs font-black text-slate-500">{item.sku}</div>
                <div className="mt-1 line-clamp-1 text-sm font-black text-slate-950">{item.name}</div>
                <div className="mt-2 flex justify-between text-xs font-black">
                  <span className="text-blue-700">{t.qty} {item.quantity}</span>
                  <span className="text-emerald-700">{formatCurrency(item.revenue)}</span>
                </div>
              </div>
            ))}
            {!(charts.topProducts || []).length && <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm font-bold text-slate-400">{t.noSalesItem}</div>}
          </div>
        </Section>

        <Section title={t.activeVouchers} desc={t.activeCampaigns}>
          <div className="space-y-3">
            {(queues.vouchers || []).slice(0, 8).map((voucher) => (
              <div key={voucher.id} className="rounded-2xl bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <div className="font-black text-slate-900">{voucher.code}</div>
                  <div className="text-xs font-black text-blue-700">{voucher.type}</div>
                </div>
                <div className="mt-1 text-xs font-bold text-slate-500">{voucher.name}</div>
                <div className="mt-2 text-xs font-bold text-slate-600">
                  {t.used} {voucher.usedCount || 0}/{voucher.usageLimit || "∞"}
                </div>
              </div>
            ))}
            {!(queues.vouchers || []).length && <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm font-bold text-slate-400">{t.noActiveVouchers}</div>}
          </div>
        </Section>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-3">
        <Section title={t.productDataIssues} desc={t.needAdminAction}>
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
            {!(queues.productIssues || []).length && <div className="rounded-2xl bg-emerald-50 p-5 text-sm font-black text-emerald-700"><CheckCircle2 size={15} className="mr-1 inline" /> {t.noProductIssues}</div>}
          </div>
        </Section>

        <Section title={t.lowStockWatchlist} desc={t.activeStockHint}>
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
            {!(queues.lowStockProducts || []).length && <div className="rounded-2xl bg-emerald-50 p-5 text-sm font-black text-emerald-700">{t.stockLooksGood}</div>}
          </div>
        </Section>

        <Section title={t.fulfillmentActionQueue} desc={t.latestFulfillment}>
          <div className="space-y-3">
            {(queues.fulfillment || []).map((order) => (
              <div key={order.id} className="rounded-2xl bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-black text-slate-900">{order.orderNo}</div>
                  <div className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-black text-blue-700">{order.status}</div>
                </div>
                <div className="mt-1 text-xs font-bold text-slate-500">{order.customerName} · {order.customerPhone}</div>
                <div className="mt-2 flex justify-between text-xs font-black">
                  <span className={order.trackingCode ? "text-emerald-600" : "text-red-600"}>{order.trackingCode || t.missingTracking}</span>
                  <span>{shortDate(order.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </section>

      {data?.generatedAt && (
        <div className="mt-4 text-right text-xs font-bold text-slate-400">
          {t.generatedAt} {shortDate(data.generatedAt)}
        </div>
      )}
    </>
  );
}
