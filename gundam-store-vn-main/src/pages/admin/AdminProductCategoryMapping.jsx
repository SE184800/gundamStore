import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useCms, useLang } from "../../store/CmsStore";
import { getText } from "../../utils/format";

const text = {
  vi: {
    title: "Product Category Mapping",
    desc: "Gán sản phẩm vào một hoặc nhiều danh mục. Trang shop sẽ lọc sản phẩm dựa trên mapping này.",
    search: "Tìm sản phẩm...",
    selected: "Đã gán",
    empty: "Chưa có danh mục",
  },
  en: {
    title: "Product Category Mapping",
    desc: "Assign products to one or more categories. The shop page filters products using this mapping.",
    search: "Search products...",
    selected: "Mapped",
    empty: "No categories",
  },
};

function categoryName(category, lang) {
  return category.name?.[lang] || category.name?.vi || category.label || category.id;
}

export default function AdminProductCategoryMapping() {
  const { state, actions } = useCms();
  const [lang] = useLang();
  const t = text[lang];
  const [query, setQuery] = useState("");

  const activeCategories = useMemo(() => {
    return [...(state.categories || [])]
      .filter((category) => category.active !== false)
      .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
  }, [state.categories]);

  const products = useMemo(() => {
    return (state.products || []).filter((product) => {
      const haystack = `${getText(product.name, lang)} ${product.sku || ""}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    });
  }, [state.products, lang, query]);

  function getMappedCategoryIds(productId) {
    return (state.productCategoryMappings || []).find((item) => item.productId === productId)?.categoryIds || [];
  }

  function toggle(productId, categoryId) {
    const current = getMappedCategoryIds(productId);
    const next = current.includes(categoryId)
      ? current.filter((id) => id !== categoryId)
      : [...current, categoryId];
    actions.setProductCategories(productId, next);
  }

  return (
    <>
      <section className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/50">
        <h1 className="text-3xl font-black text-slate-950">{t.title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{t.desc}</p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Search size={18} className="text-blue-600" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} className="w-full bg-transparent px-3 text-sm font-bold outline-none" />
        </div>

        <div className="space-y-4">
          {products.map((product) => {
            const mapped = getMappedCategoryIds(product.id);
            return (
              <div key={product.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-black text-slate-950">{getText(product.name, lang)}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">{product.sku} • {product.grade} • {product.status}</div>
                  </div>
                  <div className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">
                    {t.selected}: {mapped.length}
                  </div>
                </div>

                {activeCategories.length ? (
                  <div className="flex flex-wrap gap-2">
                    {activeCategories.map((category) => {
                      const checked = mapped.includes(category.id);
                      return (
                        <button
                          key={category.id}
                          onClick={() => toggle(product.id, category.id)}
                          className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                            checked ? "bg-blue-700 text-white shadow-lg shadow-blue-100" : "bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                          }`}
                        >
                          {categoryName(category, lang)}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm font-bold text-slate-500">{t.empty}</div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
