import PageShell from "../../components/common/PageShell";
import ProductCard from "../../components/storefront/ProductCard";
import { useCms, useLang } from "../../store/CmsStore";
import {
  BellRing,
  Flame,
  Gift,
  PackageCheck,
  ShieldCheck,
  TicketPercent,
} from "lucide-react";

function getCopy(lang) {
  return {
    badge: lang === "en" ? "Gundam Campaign Hub" : "Gundam Campaign Hub",
    title: lang === "en" ? "Deals, Restock & Limited Kits" : "Deal, Restock & Hàng Limited",
    desc:
      lang === "en"
        ? "A campaign hub for builders and collectors: flash sale, restock, limited items and coming soon kits."
        : "Trung tâm chiến dịch cho builder và collector: flash sale, restock, limited và hàng sắp về.",
    shopNow: lang === "en" ? "Shop now" : "Xem sản phẩm",
    hotDeals: lang === "en" ? "Hot deals" : "Sản phẩm đang ưu đãi",
    flashSale: "Flash Sale",
    restock: "Restock",
    limited: "Limited",
    comingSoon: lang === "en" ? "Coming Soon" : "Sắp về",
    voucher: "Voucher",
    combo: lang === "en" ? "Builder Combo" : "Combo Builder",
  };
}

export default function PromotionsPage() {
  const { state, actions } = useCms();
  const [lang] = useLang();
  const t = getCopy(lang);

  const products = state.products || [];
  const deals = products.filter((product) => {
    const tags = product.tags || product.groupIds || [];
    return (
      Number(product.oldPrice || product.originalPrice || 0) > Number(product.price || 0) ||
      tags.includes("sale") ||
      tags.includes("hot") ||
      String(product.status || "").toLowerCase().includes("sale")
    );
  });

  const displayDeals = deals.length ? deals : products.slice(0, 4);

  return (
    <PageShell>
      <main className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8">
        <section className="relative overflow-hidden rounded-6xl bg-slate-950 p-8 text-white shadow-[0_30px_120px_rgba(15,23,42,0.25)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(239,68,68,0.35),transparent_36%),radial-gradient(circle_at_25%_70%,rgba(37,99,235,0.3),transparent_34%)]" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="inline-flex rounded-full bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-[0.25em]">
                {t.badge}
              </div>
              <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[0.95] md:text-7xl">
                {t.title}
              </h1>
              <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-white/75">
                {t.desc}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="/flash-sale" className="rounded-2xl bg-white px-7 py-4 text-sm font-black text-slate-950">
                  {t.flashSale}
                </a>
                <a href="/shop" className="rounded-2xl border border-white/30 px-7 py-4 text-sm font-black text-white">
                  {t.shopNow}
                </a>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <PromoMiniCard href="/flash-sale" icon={Flame} title={t.flashSale} desc="Deal trong ngày" tone="red" />
              <PromoMiniCard href="/restock" icon={PackageCheck} title={t.restock} desc="Hàng hot về lại" tone="blue" />
              <PromoMiniCard href="/limited" icon={ShieldCheck} title={t.limited} desc="Collector items" tone="violet" />
              <PromoMiniCard href="/coming-soon" icon={BellRing} title={t.comingSoon} desc="Theo dõi ETA" tone="amber" />
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          <CampaignCard href="/flash-sale" label="FLASH SALE" title="Giảm đến 20%" desc="Áp dụng cho mẫu hot và phụ kiện builder." cta="Săn ngay" className="from-red-600 to-orange-500" />
          <CampaignCard href="/restock" label="RESTOCK" title="Hàng vừa về lại" desc="Các mẫu từng hết hàng nay đã có lại." cta="Xem restock" className="from-blue-700 to-cyan-500" />
          <CampaignCard href="/limited" label="LIMITED" title="Limited / P-Bandai" desc="Phiên bản khó săn cho collector." cta="Xem limited" className="from-violet-900 to-fuchsia-600" />
        </section>

        <section id="flash-sale" className="mt-8 rounded-5xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-black uppercase text-red-600">
                {t.hotDeals}
              </div>
              <h2 className="mt-2 text-3xl font-black text-slate-950">{t.flashSale}</h2>
            </div>

            <a href="/flash-sale" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">
              Xem tất cả
            </a>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayDeals.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} lang={lang} actions={actions} badge="SALE" />
            ))}
          </div>
        </section>
      </main>
    </PageShell>
  );
}

function PromoMiniCard({ href, icon: Icon, title, desc, tone }) {
  const toneClass = {
    red: "bg-red-500",
    blue: "bg-blue-600",
    violet: "bg-violet-500",
    amber: "bg-amber-400 text-slate-950",
  }[tone];

  return (
    <a href={href} className="rounded-4xl border border-white/10 bg-white/10 p-5 backdrop-blur transition hover:-translate-y-1 hover:bg-white/15">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneClass}`}>
        <Icon size={22} />
      </div>
      <div className="mt-4 text-xl font-black">{title}</div>
      <div className="mt-1 text-sm font-semibold text-white/70">{desc}</div>
    </a>
  );
}

function CampaignCard({ href, label, title, desc, cta, className }) {
  return (
    <a href={href} className={`block overflow-hidden rounded-5xl bg-gradient-to-br ${className} p-6 text-white shadow-xl transition hover:-translate-y-1`}>
      <div className="w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase">{label}</div>
      <h3 className="mt-5 text-3xl font-black">{title}</h3>
      <p className="mt-3 text-sm font-semibold leading-7 text-white/80">{desc}</p>
      <div className="mt-6 w-fit rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950">
        {cta}
      </div>
    </a>
  );
}
