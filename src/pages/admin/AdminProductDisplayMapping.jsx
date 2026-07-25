import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, AlertTriangle } from "lucide-react";
import { useCms, useLang } from "../../store/CmsStore";
import { getText } from "../../utils/format";

const text = {
  vi: {
    staleWarningPrefix: "Trang này không còn được dùng, dữ liệu chỉ là demo cục bộ, không đồng bộ với hệ thống thật. Vui lòng dùng ",
    staleWarningLink: "Quản lý danh mục",
    title: "Product Display Mapping",
    desc: "Gán sản phẩm vào các block marketing ngoài trang chủ. Đây không phải category, mà là vị trí hiển thị.",
    search: "Tìm sản phẩm...",
    selected: "Đã gán",
  },
  en: {
    staleWarningPrefix: "This page is no longer used. Its data is local demo-only data and is not synced with the real system. Please use ",
    staleWarningLink: "Category Management",
    title: "Product Display Mapping",
    desc: "Assign products to homepage marketing blocks. This is not category; it controls display placement.",
    search: "Search products...",
    selected: "Mapped",
  },
};

const collections = [
  { key: "new_arrivals", vi: "Hàng mới về", en: "New arrivals" },
  { key: "preorder", vi: "Hàng order / Pre-order", en: "Order / Pre-order" },
  { key: "best_sellers", vi: "Hàng bán chạy", en: "Best sellers" },
  { key: "sale_products", vi: "Hàng Sales", en: "Sales" },
  { key: "featured", vi: "Sản phẩm nổi bật", en: "Featured" },
  { key: "tools", vi: "Tools / Phụ kiện", en: "Tools / Accessories" },
];

export default function AdminProductDisplayMapping() {
  const { state, actions } = useCms();
  const [lang] = useLang();
  const t = text[lang];
  const [query, setQuery] = useState("");

  const products = useMemo(() => {
    return (state.products || []).filter((product) => {
      const haystack = `${getText(product.name, lang)} ${product.sku || ""}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    });
  }, [state.products, lang, query]);

  function getMappedKeys(productId) {
    return (state.productDisplayMappings || []).find((item) => item.productId === productId)?.collectionKeys || [];
  }

  function toggle(productId, key) {
    const current = getMappedKeys(productId);
    const next = current.includes(key)
      ? current.filter((item) => item !== key)
      : [...current, key];
    actions.setProductDisplayCollections(productId, next);
  }

  return (
    <>
      <section className="flex items-start gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
        <AlertTriangle size={20} className="mt-0.5 shrink-0" />
        <p className="text-sm font-bold leading-6">
          {t.staleWarningPrefix}
          <Link to="/admin/product-categories" className="underline">{t.staleWarningLink}</Link>
          {" "}(/admin/product-categories).
        </p>
      </section>

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
            const mapped = getMappedKeys(product.id);
            return (
              <div key={product.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-black text-slate-950">{getText(product.name, lang)}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">{product.sku} • {product.grade} • {product.status}</div>
                  </div>
                  <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">
                    {t.selected}: {mapped.length}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {collections.map((collection) => {
                    const checked = mapped.includes(collection.key);
                    return (
                      <button
                        key={collection.key}
                        onClick={() => toggle(product.id, collection.key)}
                        className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                          checked ? "bg-amber-500 text-white shadow-lg shadow-amber-100" : "bg-white text-slate-600 hover:bg-amber-50 hover:text-amber-700"
                        }`}
                      >
                        {collection[lang]}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
