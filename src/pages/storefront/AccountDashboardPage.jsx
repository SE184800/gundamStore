import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Heart,
  Loader2,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Ticket,
  UserRound,
  WalletCards,
} from "lucide-react";
import PageShell from "../../components/common/PageShell";
import { useLang } from "../../store/CmsStore";
import { hasAccountToken } from "../../services/AccountApiService";
import { getMyAccountDashboardApi } from "../../services/AccountDashboardApiService";
import { getOrderStatusLabel, getOrderStatusToneClass } from "../../constants/orderConfig";

const money = (value) => `${(Number(value) || 0).toLocaleString("vi-VN")}đ`;

function getCopy(lang) {
  return {
    eyebrow: lang === "en" ? "My account" : "Tài khoản của tôi",
    title: lang === "en" ? "Account overview" : "Tổng quan tài khoản",
    desc:
      lang === "en"
        ? "Track orders, delivery, support tickets, addresses and wishlist from your backend account."
        : "Theo dõi đơn hàng, giao hàng, hỗ trợ, địa chỉ và yêu thích từ tài khoản backend.",
    loginRequired:
      lang === "en" ? "Please sign in to view your account." : "Vui lòng đăng nhập để xem tài khoản.",
    login: lang === "en" ? "Sign in" : "Đăng nhập",
    loading: lang === "en" ? "Loading account..." : "Đang tải tài khoản...",
    totalOrders: lang === "en" ? "Total orders" : "Tổng đơn hàng",
    activeOrders: lang === "en" ? "Active orders" : "Đơn đang xử lý",
    openTickets: lang === "en" ? "Open tickets" : "Yêu cầu hỗ trợ mở",
    totalSpent: lang === "en" ? "Total spent" : "Tổng chi tiêu",
    recentOrders: lang === "en" ? "Recent orders" : "Đơn hàng gần đây",
    supportTickets: lang === "en" ? "Support tickets" : "Yêu cầu hỗ trợ",
    defaultAddress: lang === "en" ? "Default address" : "Địa chỉ mặc định",
    wishlist: lang === "en" ? "Wishlist" : "Sản phẩm yêu thích",
    viewOrders: lang === "en" ? "View all orders" : "Xem tất cả đơn",
    viewProfile: lang === "en" ? "Edit profile" : "Sửa hồ sơ",
    orderDetail: lang === "en" ? "Detail" : "Chi tiết",
    emptyOrders: lang === "en" ? "No recent orders." : "Chưa có đơn gần đây.",
    emptyTickets: lang === "en" ? "No support ticket." : "Chưa có yêu cầu hỗ trợ.",
  };
}

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

function shortDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN");
}

export default function AccountDashboardPage() {
  const [lang] = useLang();
  const t = getCopy(lang);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!hasAccountToken()) {
        setLoading(false);
        setError(t.loginRequired);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const data = await getMyAccountDashboardApi();
        if (!alive) return;
        setDashboard(data);
      } catch (err) {
        if (!alive) return;
        setError(err?.message || t.loginRequired);
      } finally {
        if (alive) setLoading(false);
      }
    }

    void load();

    return () => {
      alive = false;
    };
  }, [t.loginRequired]);

  const summary = dashboard?.summary || {};
  const account = dashboard?.account || {};
  const defaultAddress = dashboard?.defaultAddress || null;

  return (
    <PageShell>
      <main className="min-h-screen bg-[#F5F7FB] px-4 py-8 md:px-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">{t.eyebrow}</p>
          <h1 className="mt-2 text-4xl font-black text-slate-950">{t.title}</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-500">{t.desc}</p>

          {loading ? (
            <div className="mt-8 flex min-h-[260px] items-center justify-center rounded-3xl bg-white p-10 font-black text-slate-500">
              <Loader2 className="mr-3 animate-spin text-blue-600" />
              {t.loading}
            </div>
          ) : error ? (
            <div className="mt-8 rounded-3xl bg-white p-10 text-center">
              <AlertCircle className="mx-auto text-amber-500" size={42} />
              <div className="mt-4 font-black text-slate-700">{error}</div>
              <Link to="/login" className="mt-5 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">
                {t.login}
              </Link>
            </div>
          ) : (
            <>
              <section className="mt-8 grid gap-4 lg:grid-cols-[330px_1fr]">
                <aside className="space-y-4">
                  <div className="rounded-3xl border border-slate-100 bg-white p-5 text-center shadow-sm">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-700 text-2xl font-black text-white">
                      {(account.name || "US").slice(0, 2).toUpperCase()}
                    </div>
                    <h2 className="mt-3 text-xl font-black text-slate-950">{account.name}</h2>
                    <p className="mt-1 text-sm font-bold text-slate-500">{account.email}</p>
                    <div className="mt-4 grid gap-2">
                      <Link to="/account/profile" className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white">
                        <UserRound size={16} className="mr-1 inline" />
                        {t.viewProfile}
                      </Link>
                      <Link to="/orders" className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700">
                        <ShoppingBag size={16} className="mr-1 inline" />
                        {t.viewOrders}
                      </Link>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                    <h3 className="flex items-center gap-2 text-lg font-black text-slate-950">
                      <MapPin size={19} /> {t.defaultAddress}
                    </h3>
                    {defaultAddress ? (
                      <div className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                        <div className="font-black text-slate-950">{defaultAddress.receiver}</div>
                        <div>{defaultAddress.phone}</div>
                        <div>{[defaultAddress.address, defaultAddress.ward, defaultAddress.district, defaultAddress.city].filter(Boolean).join(", ")}</div>
                      </div>
                    ) : (
                      <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">-</div>
                    )}
                  </div>
                </aside>

                <section className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard icon={ShoppingBag} label={t.totalOrders} value={summary.totalOrders || 0} />
                    <StatCard icon={PackageCheck} label={t.activeOrders} value={summary.activeOrders || 0} />
                    <StatCard icon={Ticket} label={t.openTickets} value={summary.openTickets || 0} />
                    <StatCard icon={WalletCards} label={t.totalSpent} value={money(summary.totalSpent || 0)} />
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-black text-slate-950">{t.recentOrders}</h2>
                        <Link to="/orders" className="text-sm font-black text-blue-700">{t.viewOrders}</Link>
                      </div>

                      <div className="space-y-3">
                        {(dashboard.recentOrders || []).slice(0, 5).map((order) => (
                          <Link key={order.id} to={`/orders/${order.id}`} className="block rounded-2xl bg-slate-50 p-4 hover:bg-blue-50">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="font-black text-slate-950">{order.orderCode}</div>
                                <div className="mt-1 text-xs font-bold text-slate-500">{shortDate(order.createdAt)}</div>
                              </div>
                              <span className={`rounded-full px-3 py-1 text-xs font-black ${getOrderStatusToneClass(order.status)}`}>
                                {getOrderStatusLabel(order.status, lang)}
                              </span>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-sm font-black">
                              <span className="text-slate-500">{order.items?.length || 0} item(s)</span>
                              <span className="text-red-500">{money(order.total)}</span>
                            </div>
                          </Link>
                        ))}

                        {!(dashboard.recentOrders || []).length && (
                          <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm font-bold text-slate-400">{t.emptyOrders}</div>
                        )}
                      </div>
                    </section>

                    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                      <h2 className="text-lg font-black text-slate-950">{t.supportTickets}</h2>
                      <div className="mt-4 space-y-3">
                        {(dashboard.supportTickets || []).slice(0, 5).map((ticket) => (
                          <div key={ticket.id} className="rounded-2xl bg-slate-50 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="font-black text-blue-700">{ticket.ticketNo}</div>
                              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">{ticket.status}</span>
                            </div>
                            <div className="mt-2 text-sm font-black text-slate-900">{ticket.issue}</div>
                            <div className="mt-1 text-xs font-bold text-slate-500">
                              Order {ticket.orderNo || "-"} · {shortDate(ticket.createdAt)}
                            </div>
                          </div>
                        ))}

                        {!(dashboard.supportTickets || []).length && (
                          <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm font-bold text-slate-400">{t.emptyTickets}</div>
                        )}
                      </div>
                    </section>
                  </div>

                  <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                    <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
                      <Heart size={18} className="text-red-500" />
                      {t.wishlist}
                    </h2>

                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {(dashboard.wishlist || []).slice(0, 4).map((item) => (
                        <Link key={item.id} to={`/product/${item.product?.slug || item.productId}`} className="rounded-2xl bg-slate-50 p-3 hover:bg-blue-50">
                          <div className="aspect-square rounded-xl bg-white">
                            {item.product?.imageUrl ? (
                              <img src={item.product.imageUrl} alt={item.product.nameVi || item.product.sku} loading="lazy" decoding="async" className="h-full w-full rounded-xl object-cover" />
                            ) : null}
                          </div>
                          <div className="mt-2 line-clamp-2 text-sm font-black text-slate-950">
                            {item.product?.nameVi || item.product?.nameEn || item.product?.sku}
                          </div>
                          <div className="mt-1 text-sm font-black text-red-500">{money(item.product?.price)}</div>
                        </Link>
                      ))}
                    </div>
                  </section>
                </section>
              </section>

              <div className="mt-4 rounded-3xl bg-blue-50 p-4 text-sm font-bold text-blue-800">
                <ShieldCheck size={16} className="mr-1 inline" />
                Account data is loaded from backend account APIs.
              </div>
            </>
          )}
        </div>
      </main>
    </PageShell>
  );
}
