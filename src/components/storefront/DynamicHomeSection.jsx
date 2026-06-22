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
    <section className="mx-auto max-w-[1440px] px-3 py-3 lg:px-8 lg:py-5">
      {/* 📱 1. CHỐT HERO RESPONSIVE: Trên mobile xếp dọc, lên máy tính tự phân vùng 1.3fr_0.7fr */}
      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr] lg:gap-5">

        {/* BANNER CHÍNH */}
        <div className="relative min-h-[380px] sm:min-h-[440px] overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-xl shadow-blue-100/60">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50 to-cyan-50" />

          {/* Sắp xếp nội dung: Chữ lên trước, Ảnh bám đuôi bên dưới khi co nhỏ */}
          <div className="relative grid h-full gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_380px] lg:p-8">
            <div className="flex flex-col justify-center text-left">
              <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 text-[11px] font-black text-blue-700">
                <ShoppingBag size={13} />Gundam Store VN
              </div>
              {/* Hạ size chữ một chút trên mobile (text-3xl) để không bị vỡ dòng */}
              <h1 className="text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                {getText(main.title, lang)}
              </h1>
              <p className="mt-3 max-w-xl text-xs sm:text-sm leading-relaxed text-slate-600">
                {getText(main.subtitle, lang)}
              </p>

              {/* Nút Call to Action */}
              <div className="mt-5 flex flex-wrap gap-2.5">
                <Link
                  to={main.link || "/shop"}
                  onClick={() => actions.track("banner_click", { meta: { bannerId: main.id } })}
                  className="rounded-2xl bg-blue-700 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-800 transition active:scale-95"
                >
                  {getText(main.ctaText, lang) || t.shopNow}
                </Link>
                <Link to="/shop" className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-50 transition">
                  {t.viewAll}
                </Link>
              </div>

              {/* Huy hiệu cam kết đóng khung lưới đẹp mắt */}
              <div className="mt-5 grid grid-cols-3 gap-2">
                {["Chính hãng", "Bọc chống sốc", "Pre-order rõ ETA"].map((item) => (
                  <div key={item} className="rounded-xl border border-blue-50 bg-white/95 p-2 text-[10px] sm:text-xs font-black text-blue-800 shadow-sm text-center flex flex-col items-center justify-center">
                    <CheckCircle2 size={13} className="mb-1 text-blue-600" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Khối hiển ảnh 3D/Visual: Bo nhỏ linh hoạt trên mobile */}
            <div className="min-h-[220px] sm:min-h-[300px] lg:min-h-[360px] overflow-hidden rounded-2xl sm:rounded-[2rem]">
              <ProductVisual tone={main.tone} imageUrl={main.imageUrl} large />
            </div>
          </div>
        </div>

        {/* CÁC BANNER PHỤ BÊN CẠNH */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:gap-5">
          {banners.slice(1, 3).map((banner) => (
            <Link key={banner.id} to={banner.link || "/shop"} className="relative min-h-[160px] sm:min-h-[205px] overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm hover:shadow-xl hover:shadow-blue-100/60 transition group">
              <div className="absolute inset-0 opacity-45 transition-transform duration-500 group-hover:scale-105">
                <ProductVisual tone={banner.tone} imageUrl={banner.imageUrl} />
              </div>
              <div className="relative max-w-[80%]">
                <div className="mb-1 text-[10px] font-black uppercase tracking-wider text-blue-700">Promo</div>
                <div className="text-xl sm:text-2xl font-black text-slate-950 line-clamp-1">{getText(banner.title, lang)}</div>
                <p className="mt-1 text-[11px] font-bold leading-relaxed text-slate-600 line-clamp-2">{getText(banner.subtitle, lang)}</p>
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
    <section className="mx-auto max-w-[1440px] px-3 py-2 lg:px-8">
      {/* 🌟 VỊ TRÍ 1: Thêm class "w-full scrollbar-none" để mở cổng trượt động */}
      <div className="flex flex-nowrap gap-3 w-full overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory lg:grid lg:grid-cols-6 lg:gap-3 lg:overflow-x-visible lg:pb-0">
        {state.categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/shop?grade=${cat.label}`}
            className="group w-[105px] max-w-[105px] shrink-0 snap-start rounded-2xl border border-slate-150 bg-white p-3 text-center transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/40 lg:w-full lg:max-w-none lg:shrink lg:rounded-3xl"
          >
            {/* Khung ảnh đại diện Grade */}
            <div className="h-14 sm:h-20 overflow-hidden rounded-xl bg-slate-50">
              <ProductVisual tone={cat.tone} />
            </div>
            {/* Tên danh mục (HG, RG, MG, PG...) - Thêm "break-all" phòng hờ tên quá dài */}
            <div className="mt-2 text-[11px] sm:text-sm font-black text-slate-950 truncate break-all">
              {cat.label}
            </div>
            {/* Mô tả ngắn ẩn trên mobile */}
            <div className="hidden sm:block text-[10px] font-semibold text-slate-500 truncate">
              {cat.desc}
            </div>
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
    <section className="mx-auto max-w-[1440px] px-3 py-3 lg:px-8">
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="mb-3.5 flex items-center justify-between">
          <h2 className="text-base sm:text-xl font-black text-slate-950">{getText(section.title, lang)}</h2>
          <Link to="/shop" className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-black text-blue-700 hover:bg-blue-50">
            {t.viewAll}<ArrowRight size={13} />
          </Link>
        </div>

        {/* 📱 PRODUCT LIST ĐẸP: Trên điện thoại xếp khít 2 cột tăm tắp, không bị vỡ nát layout */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} compact />
          ))}
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
    <section className="mx-auto max-w-[1440px] px-3 py-2 lg:px-8">
      <div className="grid gap-4 md:grid-cols-2">
        {banners.map((banner) => (
          <Link key={banner.id} to={banner.link || "/shop"} className="relative min-h-[160px] sm:min-h-[220px] overflow-hidden rounded-2xl sm:rounded-[2rem] border border-blue-100 bg-white p-5 sm:p-6 shadow-lg shadow-blue-100/40 group">
            <div className="absolute inset-0 opacity-45 transition-transform duration-500 group-hover:scale-103">
              <ProductVisual tone={banner.tone} imageUrl={banner.imageUrl} large />
            </div>
            <div className="relative max-w-[85%]">
              <div className="mb-1 text-[10px] font-black uppercase tracking-wider text-blue-700">Gundam Store VN</div>
              <div className="text-xl sm:text-3xl font-black text-slate-950 line-clamp-1">{getText(banner.title, lang)}</div>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600 line-clamp-2">{getText(banner.subtitle, lang)}</p>
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