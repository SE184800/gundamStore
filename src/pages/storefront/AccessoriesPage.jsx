import PageShell from "../../components/common/PageShell";
import ProductCard from "../../components/storefront/ProductCard";
import { useCms, useLang } from "../../store/CmsStore";

export default function AccessoriesPage() {
  const { state, actions } = useCms();
  const [lang] = useLang();

  const products = state.products || [];
  const rows = products.filter((p) => {
    const value = `${p.categoryId || ""} ${p.grade || ""} ${p.name?.vi || ""} ${p.name?.en || ""}`.toLowerCase();
    return value.includes("tool") || value.includes("decal") || value.includes("accessory") || value.includes("phụ kiện");
  });

  return (
    <PageShell>
      <main className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8">
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.25em] text-blue-700">Builder Accessories</div>
              <h1 className="mt-3 text-5xl font-black text-slate-950">Phụ kiện Gunpla</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-600">
                Tools, decal, action base, kìm, nhám và phụ kiện hỗ trợ build mô hình chuyên nghiệp.
              </p>
            </div>

            <div className="rounded-[24px] bg-gradient-to-br from-blue-600 to-cyan-400 p-6 text-white">
              <div className="text-xs font-black uppercase tracking-widest text-white/80">Builder Kit</div>
              <div className="mt-2 text-3xl font-black">Upgrade your build</div>
              <div className="mt-3 text-sm font-semibold text-white/85">Phụ kiện đúng chuẩn giúp mô hình đẹp hơn, sạch hơn và bền hơn.</div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-950">Phụ kiện nổi bật</h2>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{rows.length} items</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.map((product) => (
              <ProductCard key={product.id} product={product} lang={lang} actions={actions} badge="ACCESSORY" />
            ))}
          </div>
        </section>
      </main>
    </PageShell>
  );
}
