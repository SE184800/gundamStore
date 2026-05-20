
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useCms, useLang } from "../../store/CmsStore";
import { getText } from "../../utils/format";

function groupName(group, lang) {
  return group.name?.[lang] || group.name?.vi || group.key;
}

export default function AdminProductGroupMapping() {
  const { state, actions } = useCms();
  const [lang] = useLang();
  const [query, setQuery] = useState("");

  const groups = [...(state.productGroups || [])].filter((g) => g.active !== false).sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));

  const products = useMemo(() => {
    return (state.products || []).filter((product) => {
      const haystack = `${getText(product.name, lang)} ${product.sku || ""}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    });
  }, [state.products, lang, query]);

  function getMapped(productId) {
    return (state.productGroupMappings || []).find((item) => item.productId === productId)?.groupIds || [];
  }

  function toggle(productId, groupId) {
    const current = getMapped(productId);
    const next = current.includes(groupId) ? current.filter((id) => id !== groupId) : [...current, groupId];
    actions.setProductGroups(productId, next);
  }

  return (
    <>
      <section className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/50">
        <h1 className="text-3xl font-black text-slate-950">Product Group Mapping</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Gắn sản phẩm vào nhiều group: Hot, New, Pre-order, Sales. Trang chủ/block sản phẩm đọc từ mapping này.</p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Search size={18} className="text-blue-600" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products..." className="w-full bg-transparent px-3 text-sm font-bold outline-none" />
        </div>

        <div className="space-y-4">
          {products.map((product) => {
            const mapped = getMapped(product.id);
            return (
              <div key={product.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-black text-slate-950">{getText(product.name, lang)}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">{product.sku} • {product.status}</div>
                  </div>
                  <div className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">Mapped: {mapped.length}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {groups.map((group) => {
                    const checked = mapped.includes(group.id);
                    return (
                      <button key={group.id} onClick={() => toggle(product.id, group.id)} className={`rounded-xl px-3 py-2 text-xs font-black transition ${checked ? "bg-blue-700 text-white shadow-lg shadow-blue-100" : "bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}>
                        {groupName(group, lang)}
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
