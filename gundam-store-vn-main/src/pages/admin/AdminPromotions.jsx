
import { useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { useCms, useLang } from "../../store/CmsStore";
import { getText } from "../../utils/format";

const empty = { id: "", name: { vi: "", en: "" }, type: "percent", value: 0, startAt: "", endAt: "", active: true, note: "" };

export default function AdminPromotions() {
  const { state, actions } = useCms();
  const [lang] = useLang();
  const [draft, setDraft] = useState(empty);
  const isVi = lang === "vi";

  function patch(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function patchName(locale, value) {
    setDraft((prev) => ({ ...prev, name: { ...prev.name, [locale]: value } }));
  }

  function save() {
    actions.savePromotion({ ...draft, id: draft.id || `promo-${Date.now()}`, value: Number(draft.value || 0) });
    setDraft(empty);
  }

  function getMappedProducts(promotionId) {
    return (state.promotionProductMappings || []).find((m) => m.promotionId === promotionId)?.productIds || [];
  }

  function toggleProduct(promotionId, productId) {
    const current = getMappedProducts(promotionId);
    const next = current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId];
    actions.setPromotionProducts(promotionId, next);
  }

  return (
    <>
      <section className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/50">
        <h1 className="text-3xl font-black text-slate-950">{isVi ? "Khuyến mãi / Chiết khấu" : "Promotions / Discounts"}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{isVi ? "Tách chiết khấu khỏi product master để quản lý campaign, voucher, combo." : "Separate discounts from product master for campaigns, vouchers and bundles."}</p>
      </section>

      <section className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="space-y-3">
            <input value={draft.name.vi} onChange={(e) => patchName("vi", e.target.value)} placeholder="Name VI" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none" />
            <input value={draft.name.en} onChange={(e) => patchName("en", e.target.value)} placeholder="Name EN" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none" />
            <div className="grid grid-cols-2 gap-3">
              <select value={draft.type} onChange={(e) => patch("type", e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold"><option value="percent">percent</option><option value="fixed">fixed</option><option value="combo">combo</option><option value="freeship">freeship</option></select>
              <input type="number" value={draft.value} onChange={(e) => patch("value", e.target.value)} placeholder="Value" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none" />
            </div>
            <textarea value={draft.note} onChange={(e) => patch("note", e.target.value)} placeholder="Note" className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none" />
            <label className="flex items-center gap-2 text-sm font-black text-slate-700"><input type="checkbox" checked={draft.active} onChange={(e) => patch("active", e.target.checked)} />Active</label>
            <button onClick={save} className="w-full rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white"><Save className="mr-2 inline" size={16}/>Save</button>
          </div>
        </div>

        <div className="space-y-4">
          {(state.promotions || []).map((promo) => {
            const mapped = getMappedProducts(promo.id);
            return (
              <div key={promo.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-black text-slate-950">{getText(promo.name, lang)}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">{promo.type} • {promo.value} • mapped {mapped.length}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setDraft({ ...empty, ...promo })} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Edit</button>
                    <button onClick={() => actions.deletePromotion(promo.id)} className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-red-600"><Trash2 size={15}/></button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {state.products.map((product) => {
                    const checked = mapped.includes(product.id);
                    return (
                      <button key={product.id} onClick={() => toggleProduct(promo.id, product.id)} className={`rounded-xl px-3 py-2 text-xs font-black ${checked ? "bg-amber-500 text-white" : "bg-slate-50 text-slate-600 hover:bg-amber-50"}`}>
                        {getText(product.name, lang)}
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
