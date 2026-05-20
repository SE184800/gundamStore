import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Package,
  ShoppingCart,
  Star,
  Truck,
} from "lucide-react";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminStatusBadge from "../../components/admin/AdminStatusBadge";
import { useCms, useLang } from "../../store/CmsStore";
import { formatCurrency, getText } from "../../utils/format";

function kpiTone(tone) {
  const map = {
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    red: "border-red-100 bg-red-50 text-red-700",
  };
  return map[tone] || map.blue;
}

function MiniChart() {
  const values = [48, 60, 52, 75, 68, 88, 92, 77, 96, 110, 104, 125];

  return (
    <div className="flex h-72 items-end gap-3 border-b border-l border-slate-200 px-4 pb-4">
      {values.map((value, index) => (
        <div key={index} className="flex flex-1 flex-col items-center gap-2">
          <div className="w-full rounded-t-md bg-blue-600/85" style={{ height: `${value * 1.55}px` }} />
          <span className="text-[10px] font-bold text-slate-400">T{index + 1}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const { state } = useCms();
  const [lang] = useLang();

  const products = state.products || [];
  const orders = state.orders || [];
  const chats = state.chats || [];
  const reviews = state.reviews || [];
  const inventory = state.inventory || [];

  const revenue = orders.reduce((sum, order) => sum + Number(order.total || order.amount || 0), 0);
  const lowStockCount = inventory.filter((item) => Number(item.available ?? item.onHand ?? 0) <= Number(item.lowStockThreshold || 3)).length;

  const kpis = [
    {
      label: "Revenue today",
      value: revenue > 0 ? formatCurrency(revenue) : "18.45M₫",
      change: "+12.8%",
      icon: BarChart3,
      tone: "blue",
    },
    {
      label: "New orders",
      value: orders.length || 42,
      change: "+8 orders",
      icon: ShoppingCart,
      tone: "emerald",
    },
    {
      label: "Pending tickets",
      value: chats.length || 9,
      change: "3 urgent",
      icon: ClipboardList,
      tone: "amber",
    },
    {
      label: "Low stock",
      value: lowStockCount || 16,
      change: "Need action",
      icon: AlertTriangle,
      tone: "red",
    },
  ];

  const topProducts = [...products]
    .sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0))
    .slice(0, 5);

  return (
    <>
      <AdminPageHeader
        eyebrow="Operations Command Center"
        title="Dashboard vận hành ecommerce"
        desc="Theo dõi doanh thu, đơn hàng, tồn kho, ticket CSKH, pre-order và hành vi khách hàng trong một màn hình vận hành."
        action={
          <div className="flex flex-wrap gap-2">
            <button className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
              Export report
            </button>
            <button className="rounded-md bg-blue-700 px-4 py-2 text-xs font-black text-white hover:bg-blue-800">
              Create task
            </button>
          </div>
        }
      />

      <section className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.label}</div>
                  <div className="mt-2 text-2xl font-black text-slate-950">{item.value}</div>
                  <div className={`mt-3 inline-flex rounded-md border px-2 py-1 text-xs font-black ${kpiTone(item.tone)}`}>
                    {item.change}
                  </div>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-md border ${kpiTone(item.tone)}`}>
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="mb-4 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-950">Revenue & conversion trend</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Xem xu hướng doanh thu và tỉ lệ chuyển đổi theo thời gian.
              </p>
            </div>
            <select className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700">
              <option>Last 12 months</option>
              <option>Last 30 days</option>
            </select>
          </div>
          <MiniChart />
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-black text-slate-950">Action queue</h2>
            <button className="text-xs font-black text-blue-700 hover:underline">View all</button>
          </div>

          <div className="space-y-3">
            {[
              ["5 đơn Pre-order cần xác nhận cọc", "Order Staff", "High"],
              ["Banner Hero T06 cần publish lúc 20:00", "Content", "Medium"],
              ["RG Hi-ν còn 2 sản phẩm khả dụng", "Inventory", "High"],
              ["12 đánh giá mới cần duyệt", "CSKH", "Low"],
            ].map(([title, owner, priority]) => (
              <div key={title} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-black leading-5 text-slate-950">{title}</div>
                  <AdminStatusBadge>{priority}</AdminStatusBadge>
                </div>
                <div className="mt-2 text-xs font-semibold text-slate-500">Owner: {owner}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <h2 className="text-base font-black text-slate-950">Top behavior products</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Sản phẩm được xem nhiều, thêm giỏ nhiều và có doanh số tốt.
              </p>
            </div>
            <button className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700">
              Open analytics
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3 text-right">Views</th>
                  <th className="px-4 py-3 text-right">Add cart</th>
                  <th className="px-4 py-3 text-right">Sold</th>
                  <th className="px-4 py-3 text-right">Rating</th>
                </tr>
              </thead>
              <tbody>
                {(topProducts.length ? topProducts : products.slice(0, 5)).map((product, index) => (
                  <tr key={product.id || index} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-500">{product.sku || "-"}</td>
                    <td className="px-4 py-3 font-black text-slate-950">{getText(product.name, lang)}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-700">{product.views || 1280 - index * 120}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-700">{product.carts || 146 - index * 12}</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-700">{product.sold || 0}</td>
                    <td className="px-4 py-3 text-right font-black text-amber-500">
                      <Star size={14} className="mr-1 inline" fill="currentColor" />
                      {product.rating || "4.9"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-4">
          <h2 className="text-base font-black text-slate-950">System health</h2>
          <div className="mt-4 space-y-3">
            {[
              ["CMS publish status", "Healthy", CheckCircle2],
              ["Media storage", "Local base64 demo", Package],
              ["Inventory sync", "Demo mode", Truck],
              ["Analytics events", "Tracking", BarChart3],
            ].map(([label, value, Icon]) => (
              <div key={label} className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-3">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-600">
                  <Icon size={16} className="text-blue-600" />
                  {label}
                </span>
                <AdminStatusBadge>{value}</AdminStatusBadge>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
