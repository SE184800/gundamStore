import { useMemo, useState } from "react";
import { ChevronRight, Grid3X3, List, Search, SlidersHorizontal, X } from "lucide-react";
import PageShell from "../../components/common/PageShell";
import ProductCard from "../../components/storefront/ProductCard";
import { useCms, useLang } from "../../store/CmsStore";

const text = {
  vi: {
    home: "Trang chủ",
    shopPage: "Trang bán hàng",
    title: "Tất cả Gundam / Gunpla",
    subtitle: "Khám phá hàng sẵn, hàng order, pre-order, sale và phụ kiện builder tại Gundam Store VN.",
    filters: "Bộ lọc sản phẩm",
    clear: "Xóa lọc",
    all: "Tất cả",
    category: "Danh mục",
    status: "Tình trạng",
    grade: "Grade",
    search: "Tìm sản phẩm...",
    sort: "Sắp xếp",
    popular: "Phổ biến",
    newest: "Mới nhất",
    priceLow: "Giá thấp đến cao",
    priceHigh: "Giá cao đến thấp",
    noProducts: "Không có sản phẩm phù hợp.",
    loadMore: "Xem thêm sản phẩm",
  },
  en: {
    home: "Home",
    shopPage: "Shop",
    title: "All Gundam / Gunpla",
    subtitle: "Explore in-stock kits, order items, pre-orders, sale items and builder accessories.",
    filters: "Product filters",
    clear: "Clear",
    all: "All",
    category: "Category",
    status: "Status",
    grade: "Grade",
    search: "Search products...",
    sort: "Sort by",
    popular: "Popular",
    newest: "Newest",
    priceLow: "Price low to high",
    priceHigh: "Price high to low",
    noProducts: "No products match.",
    loadMore: "Load more",
  },
};

function getProductName(product, lang) {
  if (typeof product.name === "string") return product.name;
  return product.name?.[lang] || product.name?.vi || product.name?.en || "";
}

function getCategoryName(category, lang) {
  return category.name?.[lang] || category.name?.vi || category.label || category.id;
}

function isProductInCategory(productId, categoryId, mappings) {
  return (mappings || []).some((item) => item.productId === productId && (item.categoryIds || []).includes(categoryId));
}

export default function ShopPage() {
  const { state, actions } = useCms();
  const [lang] = useLang();
  const t = text[lang];

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [grade, setGrade] = useState("all");
  const [sort, setSort] = useState("popular");
  const [view, setView] = useState("grid");

  const activeCategories = useMemo(() => {
    return [...(state.categories || [])]
      .filter((item) => item.active !== false)
      .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
  }, [state.categories]);

  const grades = useMemo(() => {
    return ["all", ...Array.from(new Set((state.products || []).map((p) => p.grade).filter(Boolean)))];
  }, [state.products]);

  const statuses = ["all", "inStock", "preorder", "sale"];
  const statusLabels = {
    inStock: { vi: "Hàng sẵn", en: "In stock" },
    preorder: { vi: "Pre-order", en: "Pre-order" },
    sale: { vi: "Sale", en: "Sale" },
  };

  const products = useMemo(() => {
    let result = (state.products || []).filter((p) => p.active !== false);

    if (query) {
      result = result.filter((p) => `${getProductName(p, lang)} ${p.sku || ""} ${p.brand || ""}`.toLowerCase().includes(query.toLowerCase()));
    }

    if (category !== "all") {
      result = result.filter((p) => isProductInCategory(p.id, category, state.productCategoryMappings || []));
    }

    if (status !== "all") {
      result = result.filter((p) => p.status === status);
    }

    if (grade !== "all") {
      result = result.filter((p) => p.grade === grade);
    }

    if (sort === "popular") result = [...result].sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0));
    if (sort === "newest") result = [...result].reverse();
    if (sort === "priceLow") result = [...result].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    if (sort === "priceHigh") result = [...result].sort((a, b) => Number(b.price || 0) - Number(a.price || 0));

    return result;
  }, [state.products, state.productCategoryMappings, query, category, status, grade, sort, lang]);

  function reset() {
    setQuery("");
    setCategory("all");
    setStatus("all");
    setGrade("all");
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-[1440px] px-4 py-5 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
          <span>{t.home}</span><ChevronRight size={16} /><span className="text-slate-950">{t.shopPage}</span>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/60 lg:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50 to-cyan-50" />
          <div className="relative">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-black text-blue-700">{t.shopPage}</div>
            <h1 className="text-3xl font-black text-slate-950 lg:text-5xl">{t.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{t.subtitle}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-5 px-4 py-5 lg:grid-cols-[260px_1fr] lg:px-8">
        <aside className="hidden space-y-4 lg:block">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-black text-slate-950">
                <SlidersHorizontal size={17} className="text-blue-600" />{t.filters}
              </div>
              <button onClick={reset} className="rounded-xl bg-slate-50 px-3 py-1.5 text-[11px] font-black text-slate-500 hover:bg-slate-100">{t.clear}</button>
            </div>

            <div className="space-y-5">
              <div>
                <div className="mb-2 text-xs font-black uppercase text-slate-500">{t.category}</div>
                <div className="grid gap-2">
                  <button onClick={() => setCategory("all")} className={`rounded-xl px-3 py-2 text-left text-xs font-bold ${category === "all" ? "bg-blue-700 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>{t.all}</button>
                  {activeCategories.map((item) => (
                    <button key={item.id} onClick={() => setCategory(item.id)} className={`rounded-xl px-3 py-2 text-left text-xs font-bold ${category === item.id ? "bg-blue-700 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>
                      {getCategoryName(item, lang)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-black uppercase text-slate-500">{t.status}</div>
                <div className="grid gap-2">
                  {statuses.map((s) => (
                    <button key={s} onClick={() => setStatus(s)} className={`rounded-xl px-3 py-2 text-left text-xs font-bold ${status === s ? "bg-blue-700 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>
                      {s === "all" ? t.all : statusLabels[s]?.[lang] || s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-black uppercase text-slate-500">{t.grade}</div>
                <div className="flex flex-wrap gap-2">
                  {grades.map((g) => (
                    <button key={g} onClick={() => setGrade(g)} className={`rounded-xl px-3 py-2 text-xs font-black ${grade === g ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>
                      {g === "all" ? t.all : g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Search size={18} className="text-blue-600" />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    actions.track("search", { meta: { query: e.target.value } });
                  }}
                  className="w-full bg-transparent px-3 text-sm font-semibold outline-none placeholder:text-slate-400"
                  placeholder={t.search}
                />
                {query && <button onClick={() => setQuery("")} className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-700"><X size={16} /></button>}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                  <span className="text-xs font-black text-slate-500">{t.sort}</span>
                  <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-transparent text-xs font-black text-slate-800 outline-none">
                    <option value="popular">{t.popular}</option>
                    <option value="newest">{t.newest}</option>
                    <option value="priceLow">{t.priceLow}</option>
                    <option value="priceHigh">{t.priceHigh}</option>
                  </select>
                </div>

                <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1">
                  <button onClick={() => setView("grid")} className={`rounded-xl p-2 ${view === "grid" ? "bg-blue-700 text-white" : "text-slate-500 hover:bg-white"}`}><Grid3X3 size={17} /></button>
                  <button onClick={() => setView("list")} className={`rounded-xl p-2 ${view === "list" ? "bg-blue-700 text-white" : "text-slate-500 hover:bg-white"}`}><List size={17} /></button>
                </div>
              </div>
            </div>
          </div>

          {products.length > 0 ? (
            <div className={view === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-4"}>
              {products.map((product) => <ProductCard key={product.id} product={product} view={view} lang={lang} actions={actions} />)}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <div className="text-lg font-black text-slate-950">{t.noProducts}</div>
              <button onClick={reset} className="mt-4 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 hover:bg-blue-800">{t.clear}</button>
            </div>
          )}

          <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <button className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 hover:bg-blue-800">{t.loadMore}</button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
