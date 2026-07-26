import { useEffect, useMemo, useState } from "react";
import { GitCompareArrows, Loader2, Search, Trash2, X } from "lucide-react";
import PageShell from "../../components/common/PageShell";
import { useLang } from "../../store/CmsStore";
import { addCompare, clearCompare, getCompareIds, removeCompare } from "../../services/CompareService";
import {
  getStorefrontProductDetailForStorefront,
  getStorefrontProductsPageFromApi,
} from "../../services/StorefrontProductApiService";

function getCopy(lang) {
  return {
    title: lang === "en" ? "Compare Gunpla Kits" : "So sánh Gunpla",
    desc:
      lang === "en"
        ? "Compare price, grade, scale, stock, status and build difficulty before choosing."
        : "So sánh giá, grade, scale, tồn kho, tình trạng và độ khó build trước khi chọn.",
    search: lang === "en" ? "Search product to compare..." : "Tìm sản phẩm để so sánh...",
    searching: lang === "en" ? "Searching..." : "Đang tìm...",
    selected: lang === "en" ? "Selected" : "Đã chọn",
    clear: lang === "en" ? "Clear compare" : "Xóa so sánh",
    empty: lang === "en" ? "No products selected." : "Chưa chọn sản phẩm để so sánh.",
    add: lang === "en" ? "Add" : "Thêm",
    remove: lang === "en" ? "Remove" : "Xóa",
    product: lang === "en" ? "Product" : "Sản phẩm",
    price: lang === "en" ? "Price" : "Giá",
    grade: "Grade",
    scale: "Scale",
    status: lang === "en" ? "Status" : "Tình trạng",
    stock: lang === "en" ? "Stock" : "Tồn kho",
    brand: lang === "en" ? "Brand" : "Thương hiệu",
    difficulty: lang === "en" ? "Difficulty" : "Độ khó",
    detail: lang === "en" ? "View detail" : "Xem chi tiết",
  };
}

function money(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + "₫";
}

function getProductName(product, lang) {
  if (typeof product.name === "string") return product.name;
  return product.name?.[lang] || product.name?.vi || product.name?.en || product.title || product.id;
}

function productImage(product) {
  return product.cardUrl || product.media?.card || product.imageUrl || product.images?.[0] || "/images/products/hi-nu.jpg";
}

export default function ComparePage() {
  const [lang] = useLang();
  const t = getCopy(lang);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [version, setVersion] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loadingCompare, setLoadingCompare] = useState(() => getCompareIds().length > 0);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const compareIds = useMemo(() => getCompareIds(), [version]);
  const compareIdsKey = compareIds.join(",");

  useEffect(() => {
    let alive = true;

    if (!compareIds.length) {
      setSelectedProducts([]);
      setLoadingCompare(false);
      return;
    }

    setLoadingCompare(true);

    Promise.all(
      compareIds.map((id) => getStorefrontProductDetailForStorefront(id).catch(() => null))
    ).then((items) => {
      if (!alive) return;
      const found = items.filter(Boolean);
      const ordered = compareIds
        .map((id) => found.find((product) => product.id === id))
        .filter(Boolean);
      setSelectedProducts(ordered);
      setLoadingCompare(false);
    });

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compareIdsKey]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let alive = true;

    if (!debouncedQuery) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);

    getStorefrontProductsPageFromApi({ q: debouncedQuery, limit: 6 })
      .then(({ products }) => {
        if (alive) setSearchResults(products);
      })
      .catch(() => {
        if (alive) setSearchResults([]);
      })
      .finally(() => {
        if (alive) setSearchLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [debouncedQuery]);

  function refresh() {
    setVersion((value) => value + 1);
  }

  function add(productId) {
    addCompare(productId);
    setQuery("");
    setDebouncedQuery("");
    setSearchResults([]);
    refresh();
  }

  function remove(productId) {
    removeCompare(productId);
    refresh();
  }

  function clear() {
    clearCompare();
    refresh();
  }

  const rows = [
    ["price", t.price, (product) => money(product.price)],
    ["grade", t.grade, (product) => product.grade || "-"],
    ["scale", t.scale, (product) => product.scale || "-"],
    ["status", t.status, (product) => product.status || "-"],
    ["stock", t.stock, (product) => product.stock ?? 0],
    ["brand", t.brand, (product) => product.brand || "Bandai"],
    ["difficulty", t.difficulty, (product) => product.difficulty || "Intermediate"],
  ];

  return (
    <PageShell>
      <main className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8">
        <section className="relative overflow-hidden rounded-6xl bg-slate-950 p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(14,165,233,0.35),transparent_35%)]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-600 px-4 py-2 text-xs font-black uppercase tracking-[0.25em]">
              <GitCompareArrows size={15} />
              Compare
            </div>
            <h1 className="mt-5 text-5xl font-black leading-tight">{t.title}</h1>
            <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-white/70">{t.desc}</p>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex flex-1 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Search size={18} className="text-cyan-600" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.search}
                className="w-full bg-transparent px-3 text-sm font-semibold outline-none"
              />
              {query && (
                <button onClick={() => setQuery("")} className="rounded-xl p-1 text-slate-400 hover:bg-white">
                  <X size={16} />
                </button>
              )}

              {searchLoading && (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 text-center text-xs font-bold text-slate-500 shadow-xl">
                  {t.searching}
                </div>
              )}

              {!searchLoading && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => add(product.id)}
                      className="flex w-full items-center gap-3 border-b p-3 text-left hover:bg-slate-50"
                    >
                      <img src={productImage(product)} alt="" loading="lazy" className="h-12 w-12 rounded-xl object-cover" />
                      <span className="flex-1 text-sm font-black">{getProductName(product, lang)}</span>
                      <span className="rounded-xl bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">{t.add}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={clear} className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-600">
              <Trash2 size={16} className="mr-1 inline" />
              {t.clear}
            </button>
          </div>

          <div className="mt-3 text-sm font-bold text-slate-500">
            {t.selected}: {selectedProducts.length}/3
          </div>
        </section>

        {loadingCompare ? (
          <section className="mt-8 flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-12 shadow-sm">
            <Loader2 className="animate-spin text-cyan-600" size={36} />
          </section>
        ) : selectedProducts.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <GitCompareArrows className="mx-auto text-slate-300" size={44} />
            <div className="mt-4 text-lg font-black text-slate-500">{t.empty}</div>
            <a href="/shop" className="mt-5 inline-block rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white">
              Shop
            </a>
          </section>
        ) : (
          <section className="mt-8 overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="w-48 px-5 py-4 text-left font-black text-slate-500">{t.product}</th>
                  {selectedProducts.map((product) => (
                    <th key={product.id} className="px-5 py-4 text-left">
                      <div className="relative rounded-2xl bg-white p-3 shadow-sm">
                        <button
                          onClick={() => remove(product.id)}
                          className="absolute right-2 top-2 rounded-full bg-red-50 p-1 text-red-600"
                          title={t.remove}
                        >
                          <X size={14} />
                        </button>
                        <img src={productImage(product)} alt="" loading="lazy" className="h-32 w-full rounded-xl object-cover" />
                        <div className="mt-3 line-clamp-2 text-sm font-black text-slate-950">{getProductName(product, lang)}</div>
                        <a href={`/product/${product.slug || product.id}`} className="mt-3 inline-block rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white">
                          {t.detail}
                        </a>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rows.map(([key, label, getter]) => (
                  <tr key={key} className="border-b">
                    <td className="bg-slate-50 px-5 py-4 font-black text-slate-600">{label}</td>
                    {selectedProducts.map((product) => (
                      <td key={`${product.id}-${key}`} className="px-5 py-4 font-bold text-slate-800">
                        {getter(product)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </PageShell>
  );
}
