import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, ShoppingBag } from "lucide-react";
import ProductVisual from "../common/ProductVisual";
import ProductCard from "./ProductCard";
import { getText } from "../../utils/format";
import { useCms, useLang } from "../../store/CmsStore";

const labels = {
  vi: { viewAll: "Xem tất cả", shopNow: "Mua ngay", categories: "Danh mục" },
  en: { viewAll: "View all", shopNow: "Shop now", categories: "Categories" }
};

function HeroSlider({ section }) {
  const { state, actions } = useCms();
  const [lang] = useLang();
  const t = labels[lang];
  const banners = state.banners
    .filter((b) => b.active && b.placement === section.dataSource)
    .sort((a, b) => a.sort - b.sort);

  if (!banners.length) return null;
  const main = banners[0];

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-5 lg:px-8">
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="relative min-h-[440px] overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-xl shadow-blue-100/60">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50 to-cyan-50" />
          <div className="relative grid h-full gap-6 p-6 lg:grid-cols-[1fr_420px] lg:p-8">
            <div className="flex flex-col justify-center">
              <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-black text-blue-700"><ShoppingBag size={15} />Gundam Store VN</div>
              <h1 className="text-4xl font-black leading-tight text-slate-950 lg:text-6xl">{getText(main.title, lang)}</h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">{getText(main.subtitle, lang)}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to={main.link || "/shop"} onClick={() => actions.track("banner_click", { meta: { bannerId: main.id } })} className="rounded-2xl bg-blue-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-800">{getText(main.ctaText, lang) || t.shopNow}</Link>
                <Link to="/shop" className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50">{t.viewAll}</Link>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {["Chính hãng", "Bọc chống sốc", "Pre-order rõ ETA"].map((item) => <div key={item} className="rounded-2xl border border-blue-100 bg-white/90 p-3 text-xs font-black text-blue-800 shadow-sm"><CheckCircle2 size={15} className="mb-1" />{item}</div>)}
              </div>
            </div>
            <div className="min-h-[360px] overflow-hidden rounded-[2rem]">
              <ProductVisual tone={main.tone} imageUrl={main.imageUrl} large />
            </div>
          </div>
        </div>

        <div className="grid gap-5">
          {banners.slice(1, 3).map((banner) => (
            <Link key={banner.id} to={banner.link || "/shop"} className="relative min-h-[205px] overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm hover:shadow-xl hover:shadow-blue-100/60">
              <div className="absolute inset-0 opacity-60"><ProductVisual tone={banner.tone} imageUrl={banner.imageUrl} /></div>
              <div className="relative max-w-[75%]">
                <div className="mb-2 text-xs font-black uppercase text-blue-700">Promo</div>
                <div className="text-2xl font-black text-slate-950">{getText(banner.title, lang)}</div>
                <p className="mt-2 text-xs font-bold leading-5 text-slate-600">{getText(banner.subtitle, lang)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryGrid() {
  const { state } = useCms();
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-3 lg:px-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {state.categories.map((cat) => (
          <Link key={cat.id} to={`/shop?grade=${cat.label}`} className="group rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/50">
            <div className="h-24 overflow-hidden rounded-2xl"><ProductVisual tone={cat.tone} /></div>
            <div className="mt-3 text-lg font-black text-slate-950">{cat.label}</div>
            <div className="text-xs font-semibold text-slate-500">{cat.desc}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ProductCarousel({ section }) {
  const { state } = useCms();
  const [lang] = useLang();
  const t = labels[lang];
  const limit = (section.layout?.rows || 2) * (section.layout?.columns || 4);
  const products = state.products
    .filter((p) => p.active)
    .filter((p) => {
      if (section.dataSource === "preorder") return p.status === "preorder" || p.preorder?.enabled;
      if (section.dataSource === "sale_products") return p.status === "sale" || Number(p.oldPrice) > Number(p.price);
      return p.collections?.includes(section.dataSource);
    })
    .slice(0, limit);

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-4 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-950">{getText(section.title, lang)}</h2>
          <Link to="/shop" className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-black text-blue-700 hover:bg-blue-50">{t.viewAll}<ArrowRight size={14} /></Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => <ProductCard key={product.id} product={product} compact />)}
        </div>
      </div>
    </section>
  );
}

function PromoBanner({ section }) {
  const { state } = useCms();
  const [lang] = useLang();
  const banners = state.banners.filter((b) => b.active && b.placement === section.dataSource).sort((a, b) => a.sort - b.sort);
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-4 lg:px-8">
      <div className="grid gap-4 md:grid-cols-2">
        {banners.map((banner) => (
          <Link key={banner.id} to={banner.link || "/shop"} className="relative min-h-[220px] overflow-hidden rounded-[2rem] border border-blue-100 bg-white p-6 shadow-lg shadow-blue-100/50">
            <div className="absolute inset-0 opacity-65"><ProductVisual tone={banner.tone} imageUrl={banner.imageUrl} large /></div>
            <div className="relative max-w-lg">
              <div className="mb-2 text-xs font-black uppercase text-blue-700">Gundam Store VN</div>
              <div className="text-3xl font-black text-slate-950">{getText(banner.title, lang)}</div>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{getText(banner.subtitle, lang)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function DynamicHomeSection({ section }) {
  if (!section.enabled) return null;
  if (section.type === "heroSlider") return <HeroSlider section={section} />;
  if (section.type === "categoryGrid") return <CategoryGrid section={section} />;
  if (section.type === "productCarousel") return <ProductCarousel section={section} />;
  if (section.type === "promoBanner") return <PromoBanner section={section} />;
  return null;
}
