import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PackageSearch, Search, ShieldCheck, WalletCards } from "lucide-react";
import {
  getOrders,
  ORDER_STATUS,
  ORDER_TYPE,
  getOrderStatusLabel,
} from "../../services/OrderService";
import {
  getOrderStatusToneClass,
  maskPhone,
  PREORDER_STATUS,
} from "../../constants/orderConfig";
import StorefrontShell from "../../components/storefront/StorefrontShell";
import { useLang } from "../../store/CmsStore";

const money = (n) => (Number(n) || 0).toLocaleString("vi-VN") + "đ";

function getCopy(lang) {
  return {
    eyebrow: lang === "en" ? "My Orders" : "Đơn hàng của tôi",
    title: lang === "en" ? "Track your orders" : "Theo dõi đơn hàng của tôi",
    desc:
      lang === "en"
        ? "View normal orders, pre-orders, cancellation and return/refund status."
        : "Xem đơn thường, đơn pre-order, trạng thái hủy đơn và trả hàng/hoàn tiền.",
    search: lang === "en" ? "Search by order ID or product..." : "Tìm mã đơn hoặc sản phẩm...",
    all: lang === "en" ? "All" : "Tất cả",
    normal: lang === "en" ? "Normal" : "Đơn thường",
    preorder: lang === "en" ? "Pre-order" : "Pre-order",
    active: lang === "en" ? "Active" : "Đang xử lý",
    completed: lang === "en" ? "Completed" : "Hoàn tất",
    cancelled: lang === "en" ? "Cancelled" : "Đã hủy",
    empty: lang === "en" ? "No orders found." : "Không có đơn phù hợp.",
    items: lang === "en" ? "items" : "sản phẩm",
    total: lang === "en" ? "Total" : "Tổng tiền",
    detail: lang === "en" ? "View detail" : "Xem chi tiết",
    phone: lang === "en" ? "Phone" : "SĐT",
    preorderStatus: lang === "en" ? "Pre-order status" : "Trạng thái pre-order",
    balancePending: lang === "en" ? "Balance request pending" : "Chờ duyệt thanh toán còn lại",
    deposit: lang === "en" ? "Deposit" : "Tiền cọc",
    remaining: lang === "en" ? "Remaining" : "Còn lại",
  };
}

function getTabs(t) {
  return [
    { key: "all", label: t.all },
    { key: "normal", label: t.normal },
    { key: "preorder", label: t.preorder },
    { key: "active", label: t.active },
    { key: "completed", label: t.completed },
    { key: "cancelled", label: t.cancelled },
  ];
}

function isActiveOrder(order) {
  return ![ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED].includes(order.status);
}

export default function MyOrdersPage() {
  const [lang] = useLang();
  const t = getCopy(lang);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");

  const orders = useMemo(() => getOrders(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return orders.filter((order) => {
      if (tab === "normal" && order.orderType === ORDER_TYPE.PREORDER) return false;
      if (tab === "preorder" && order.orderType !== ORDER_TYPE.PREORDER) return false;
      if (tab === "active" && !isActiveOrder(order)) return false;
      if (tab === "completed" && order.status !== ORDER_STATUS.COMPLETED) return false;
      if (tab === "cancelled" && order.status !== ORDER_STATUS.CANCELLED) return false;

      if (!q) return true;

      const text = [
        order.id,
        order.orderCode,
        order.customer?.phone,
        ...(order.items || []).map((item) => item.name),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(q);
    });
  }, [orders, tab, query]);

  const tabs = getTabs(t);

  return (
    <StorefrontShell>
      <main className="min-h-screen bg-[#F5F7FB] px-4 py-8 md:px-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
            {t.eyebrow}
          </p>

          <h1 className="mt-2 text-4xl font-black text-slate-950">
            {t.title}
          </h1>

          <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-500">
            {t.desc}
          </p>

          <div className="mt-6 rounded-3xl bg-white p-4 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {tabs.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={`rounded-2xl px-4 py-2 text-sm font-black ${
                    tab === item.key ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center rounded-2xl border px-4 py-3">
              <Search size={18} className="text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.search}
                className="ml-2 w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {filtered.length === 0 ? (
              <div className="rounded-3xl bg-white p-10 text-center font-bold text-slate-500">
                {t.empty}
              </div>
            ) : (
              filtered.map((order) => {
                const isPreorder = order.orderType === ORDER_TYPE.PREORDER;
                const balancePending = order.preorder?.balancePaymentRequest?.status === "Pending";

                return (
                  <div key={order.id} className="rounded-3xl bg-white p-5 shadow-sm">
                    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-black text-blue-600">{order.id}</div>

                          <span className={`rounded-full px-3 py-1 text-xs font-black ${getOrderStatusToneClass(order.status)}`}>
                            {getOrderStatusLabel(order.status, lang)}
                          </span>

                          {isPreorder && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">
                              <WalletCards size={13} />
                              PRE-ORDER
                            </span>
                          )}

                          {balancePending && (
                            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
                              {t.balancePending}
                            </span>
                          )}
                        </div>

                        <div className="mt-1 text-sm text-slate-500">
                          {order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "-"}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-4 text-sm font-bold text-slate-600">
                          <span>
                            <PackageSearch size={15} className="mr-1 inline text-blue-600" />
                            {order.items?.length || 0} {t.items}
                          </span>
                          <span>
                            <ShieldCheck size={15} className="mr-1 inline text-blue-600" />
                            {t.phone}: {maskPhone(order.customer?.phone || "-")}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          {(order.items || []).slice(0, 2).map((item) => (
                            <div key={`${order.id}-${item.id}`} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                              <img
                                src={item.image}
                                alt={item.name}
                                loading="lazy"
                                className="h-16 w-16 rounded-xl bg-white object-cover"
                              />
                              <div>
                                <div className="line-clamp-1 text-sm font-black text-slate-900">{item.name}</div>
                                <div className="mt-1 text-xs font-bold text-slate-500">x{item.quantity || 1}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {isPreorder && order.preorder && (
                          <div className="mt-4 grid gap-3 rounded-2xl border border-violet-100 bg-violet-50 p-4 text-sm md:grid-cols-3">
                            <div>
                              <span className="block text-xs font-black uppercase text-violet-700">{t.preorderStatus}</span>
                              <b>{order.preorder.status || PREORDER_STATUS.DEPOSIT_PENDING}</b>
                            </div>
                            <div>
                              <span className="block text-xs font-black uppercase text-violet-700">{t.deposit}</span>
                              <b className="text-red-600">{money(order.preorder.depositAmount || order.total)}</b>
                            </div>
                            <div>
                              <span className="block text-xs font-black uppercase text-violet-700">{t.remaining}</span>
                              <b>{money(order.preorder.remainingAmount || 0)}</b>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="text-left lg:text-right">
                        <div className="text-sm font-bold text-slate-500">{t.total}</div>
                        <div className="text-2xl font-black text-red-500">
                          {money(order.total)}
                        </div>

                        <Link
                          to={`/orders/${order.id}`}
                          className="mt-4 inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white"
                        >
                          {t.detail}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </StorefrontShell>
  );
}
