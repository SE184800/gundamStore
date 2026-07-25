import { useEffect, useState } from "react";
import PageShell from "../../components/common/PageShell";
import ProductCard from "../../components/storefront/ProductCard";
import { useCms, useLang } from "../../store/CmsStore";
import { getStorefrontProductsForStorefront } from "../../services/StorefrontProductApiService";

export default function AccessoriesPage() {
  const { actions } = useCms();
  const [lang] = useLang();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getStorefrontProductsForStorefront()
      .then((list) => {
        if (alive) setProducts(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (alive) setProducts([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const rows = products.filter((p) => {
    const value = `${p.category?.nameVi || ""} ${p.category?.nameEn || ""} ${p.grade || ""} ${p.name?.vi || ""} ${p.name?.en || ""}`.toLowerCase();
    return value.includes("tool") || value.includes("decal") || value.includes("accessory") || value.includes("phụ kiện");
  });

  return (
    <PageShell>
      <main className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8">
        <section className="overflow-hidden rounded-5xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.25em] text-blue-700">Builder Accessories</div>
              <h1 className="mt-3 text-5xl font-black text-slate-950">Phụ kiện Gunpla</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-600">
                Tools, decal, action base, kìm, nhám và phụ kiện hỗ trợ build mô hình chuyên nghiệp.
              </p>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-400 p-6 text-white">
              <div className="text-xs font-black uppercase tracking-widest text-white/80">Builder Kit</div>
              <div className="mt-2 text-3xl font-black">Upgrade your build</div>
              <div className="mt-3 text-sm font-semibold text-white/85">Phụ kiện đúng chuẩn giúp mô hình đẹp hơn, sạch hơn và bền hơn.</div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-950">Phụ kiện nổi bật</h2>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{rows.length} items</span>
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm font-black text-slate-400">
              {lang === "en" ? "Loading..." : "Đang tải..."}
            </div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center text-sm font-black text-slate-400">
              {lang === "en" ? "No accessories found yet." : "Chưa có phụ kiện phù hợp."}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rows.map((product) => (
                <ProductCard key={product.id} product={product} lang={lang} actions={actions} badge="ACCESSORY" />
              ))}
            </div>
          )}
        </section>
      </main>
    </PageShell>
  );
}
