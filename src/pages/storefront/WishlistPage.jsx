import { useMemo, useState } from "react";
import { Heart, Search, Trash2 } from "lucide-react";
import PageShell from "../../components/common/PageShell";
import ProductCard from "../../components/storefront/ProductCard";
import { useCms, useLang } from "../../store/CmsStore";
import { clearWishlist, getWishlistIds, toggleWishlist } from "../../services/WishlistService";

function getCopy(lang) {
  return {
    title: lang === "en" ? "My Wishlist" : "Sản phẩm yêu thích",
    desc:
      lang === "en"
        ? "Save kits you want to buy later, track restock and pre-order opportunities."
        : "Lưu các kit muốn mua sau, theo dõi restock và cơ hội pre-order.",
    search: lang === "en" ? "Search wishlist..." : "Tìm trong wishlist...",
    empty: lang === "en" ? "No wishlist items yet." : "Chưa có sản phẩm yêu thích.",
    clear: lang === "en" ? "Clear wishlist" : "Xóa wishlist",
    remove: lang === "en" ? "Remove" : "Xóa",
    saved: lang === "en" ? "saved items" : "sản phẩm đã lưu",
  };
}

function getProductName(product, lang) {
  if (typeof product.name === "string") return product.name;
  return product.name?.[lang] || product.name?.vi || product.name?.en || "";
}

export default function WishlistPage() {
  const { state, actions } = useCms();
  const [lang] = useLang();
  const t = getCopy(lang);
  const [query, setQuery] = useState("");
  const [version, setVersion] = useState(0);

  const wishlistIds = useMemo(() => getWishlistIds(), [version]);

  const products = useMemo(() => {
    const q = query.trim().toLowerCase();

    return (state.products || [])
      .filter((product) => wishlistIds.includes(product.id))
      .filter((product) => {
        if (!q) return true;
        return [getProductName(product, lang), product.sku, product.grade, product.series]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      });
  }, [state.products, wishlistIds, query, lang]);

  function refresh() {
    setVersion((value) => value + 1);
  }

  function remove(productId) {
    toggleWishlist(productId);
    refresh();
  }

  function clearAll() {
    clearWishlist();
    refresh();
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8">
        <section className="relative overflow-hidden rounded-[36px] bg-slate-950 p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(236,72,153,0.35),transparent_35%)]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-pink-600 px-4 py-2 text-xs font-black uppercase tracking-[0.25em]">
              <Heart size={15} />
              Wishlist
            </div>
            <h1 className="mt-5 text-5xl font-black leading-tight">{t.title}</h1>
            <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-white/70">{t.desc}</p>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Search size={18} className="text-pink-600" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.search}
                className="w-full bg-transparent px-3 text-sm font-semibold outline-none"
              />
            </div>

            <button
              onClick={clearAll}
              className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-600"
            >
              <Trash2 size={16} className="mr-1 inline" />
              {t.clear}
            </button>
          </div>

          <div className="mt-3 text-sm font-bold text-slate-500">
            {products.length} {t.saved}
          </div>
        </section>

        {products.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Heart className="mx-auto text-slate-300" size={44} />
            <div className="mt-4 text-lg font-black text-slate-500">{t.empty}</div>
            <a href="/shop" className="mt-5 inline-block rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white">
              Shop now
            </a>
          </section>
        ) : (
          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <div key={product.id} className="relative">
                <ProductCard product={product} lang={lang} actions={actions} />
                <button
                  onClick={() => remove(product.id)}
                  className="absolute right-3 top-3 rounded-full bg-white/95 p-2 text-red-600 shadow-lg"
                  title={t.remove}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </section>
        )}
      </main>
    </PageShell>
  );
}
