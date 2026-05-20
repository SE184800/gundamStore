import PageShell from "../../components/common/PageShell";
import ProductCard from "../../components/storefront/ProductCard";
import { useCms, useLang } from "../../store/CmsStore";
import { Gift, Flame, TicketPercent, Clock3, PackageCheck } from "lucide-react";

export default function PromotionsPage() {
  const { state, actions } = useCms();
  const [lang] = useLang();

  const products = state.products || [];
  const deals = products.filter((p) => {
    const tags = p.tags || p.groupIds || [];
    return Number(p.oldPrice || p.originalPrice || 0) > Number(p.price || 0) || tags.includes("sale") || tags.includes("hot");
  });

  const displayDeals = deals.length ? deals : products.slice(0, 4);

  return (
    <PageShell>
      <main className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8">
        <section className="relative overflow-hidden rounded-[36px] bg-slate-950 p-8 text-white shadow-[0_30px_120px_rgba(15,23,42,0.25)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(239,68,68,0.35),transparent_36%),radial-gradient(circle_at_25%_70%,rgba(37,99,235,0.3),transparent_34%)]" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="inline-flex rounded-full bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-[0.25em]">
                Gundam Store Deals
              </div>
              <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[0.95] md:text-7xl">
                Khuyến mãi dành cho Builder
              </h1>
              <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-white/75">
                Săn flash sale, voucher, combo phụ kiện và ưu đãi pre-order hấp dẫn cho Gunpla collector.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#flash-sale" className="rounded-2xl bg-white px-7 py-4 text-sm font-black text-slate-950">
                  Xem deal ngay
                </a>
                <a href="/shop" className="rounded-2xl border border-white/30 px-7 py-4 text-sm font-black text-white">
                  Xem sản phẩm
                </a>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <PromoMiniCard icon={Flame} title="Flash Sale" desc="Deal trong ngày" tone="red" />
              <PromoMiniCard icon={TicketPercent} title="Voucher" desc="Mã giảm giá" tone="blue" />
              <PromoMiniCard icon={PackageCheck} title="Combo Builder" desc="Tool + Decal" tone="emerald" />
              <PromoMiniCard icon={Clock3} title="Pre-order Deal" desc="Ưu đãi đặt trước" tone="amber" />
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          <CampaignCard
            label="FLASH SALE"
            title="Giảm đến 20%"
            desc="Áp dụng cho các mẫu hot và phụ kiện builder."
            cta="Săn ngay"
            className="from-red-600 to-orange-500"
          />
          <CampaignCard
            label="VOUCHER"
            title="Freeship & Voucher"
            desc="Tặng voucher cho khách hàng thân thiết."
            cta="Nhận voucher"
            className="from-blue-700 to-cyan-500"
          />
          <CampaignCard
            label="COMBO"
            title="Combo build tiết kiệm"
            desc="Kìm, decal, action base và tool cơ bản."
            cta="Xem combo"
            className="from-slate-900 to-slate-700"
          />
        </section>

        <section id="flash-sale" className="mt-8 rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-black uppercase text-red-600">
                Hot deals
              </div>
              <h2 className="mt-2 text-3xl font-black text-slate-950">Sản phẩm đang ưu đãi</h2>
            </div>

            <div className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">
              Kết thúc sau: 06 : 24 : 59
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayDeals.map((product) => (
              <ProductCard key={product.id} product={product} lang={lang} actions={actions} badge="SALE" />
            ))}
          </div>
        </section>
      </main>
    </PageShell>
  );
}

function PromoMiniCard({ icon: Icon, title, desc, tone }) {
  const toneClass = {
    red: "bg-red-500",
    blue: "bg-blue-600",
    emerald: "bg-emerald-500",
    amber: "bg-amber-400 text-slate-950",
  }[tone];

  return (
    <div className="rounded-[26px] border border-white/10 bg-white/10 p-5 backdrop-blur">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneClass}`}>
        <Icon size={22} />
      </div>
      <div className="mt-4 text-xl font-black">{title}</div>
      <div className="mt-1 text-sm font-semibold text-white/70">{desc}</div>
    </div>
  );
}

function CampaignCard({ label, title, desc, cta, className }) {
  return (
    <article className={`overflow-hidden rounded-[30px] bg-gradient-to-br ${className} p-6 text-white shadow-xl`}>
      <div className="rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase w-fit">{label}</div>
      <h3 className="mt-5 text-3xl font-black">{title}</h3>
      <p className="mt-3 text-sm font-semibold leading-7 text-white/80">{desc}</p>
      <button className="mt-6 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950">
        {cta}
      </button>
    </article>
  );
}
