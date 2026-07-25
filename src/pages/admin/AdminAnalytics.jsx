import { Activity, BarChart3, Eye, Search, ShoppingBag, CreditCard, CheckCircle2 } from "lucide-react";
import { useCms, useLang } from "../../store/CmsStore";
import AdminPageHeader from "../../components/admin/AdminPageHeader";

const text = {
  vi: { title: "Behavior Analytics", desc: "Theo dõi page_view, product_view, search, add_to_cart, checkout_started, order_created và chat.", funnel: "Phễu chuyển đổi", latest: "Event mới nhất" },
  en: { title: "Behavior Analytics", desc: "Track page_view, product_view, search, add_to_cart, checkout_started, order_created and chat.", funnel: "Conversion funnel", latest: "Latest events" }
};

export default function AdminAnalytics() {
  const { state } = useCms();
  const [lang] = useLang();
  const t = text[lang];
  const counts = {
    page_view: state.analytics.filter((e) => e.event === "page_view").length,
    product_view: state.analytics.filter((e) => e.event === "product_view").length,
    add_to_cart: state.analytics.filter((e) => e.event === "add_to_cart").length,
    checkout_started: state.analytics.filter((e) => e.event === "checkout_started").length,
    order_created: state.analytics.filter((e) => e.event === "order_created").length,
  };
  const funnel = [
    ["page_view", counts.page_view, Eye],
    ["product_view", counts.product_view, Activity],
    ["add_to_cart", counts.add_to_cart, ShoppingBag],
    ["checkout_started", counts.checkout_started, CreditCard],
    ["order_created", counts.order_created, CheckCircle2],
  ];
  const max = Math.max(1, ...funnel.map((f) => f[1]));

  return (
    <>
      <AdminPageHeader title={t.title} desc={t.desc} />
      <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2 text-xl font-black text-slate-950"><BarChart3 className="text-blue-600" />{t.funnel}</div>
          <div className="space-y-4">{funnel.map(([name, count, Icon]) => <div key={name}><div className="mb-2 flex items-center justify-between gap-3 text-sm"><div className="flex items-center gap-2 font-black text-slate-950"><Icon size={17} className="text-blue-600" />{name}</div><div className="font-black text-slate-700">{count}</div></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${(count / max) * 100}%` }} /></div></div>)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2 text-xl font-black text-slate-950"><Search className="text-blue-600" />Search keywords</div>
          <div className="space-y-3">{state.analytics.filter((e) => e.event === "search").slice(0, 8).map((e) => <div key={e.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700">{e.meta?.query || "empty"}</div>)}</div>
        </div>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 text-xl font-black text-slate-950">{t.latest}</div>
        <div className="space-y-3">{state.analytics.slice(0, 20).map((e) => <div key={e.id} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-600 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-center"><div className="font-black text-slate-950">{e.event}</div><div>{e.page}</div><div>{e.productId || "-"}</div><div className="font-black text-blue-700">{new Date(e.createdAt).toLocaleString("vi-VN")}</div></div>)}</div>
      </section>
    </>
  );
}
