
import { useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { useCms, useLang } from "../../store/CmsStore";
import { makeSlug } from "../../utils/format";

const empty = { id: "", key: "", name: { vi: "", en: "" }, badgeText: "", tone: "blue", displayArea: "homepage", active: true, sort: 1 };

function label(group, lang) {
  return group.name?.[lang] || group.name?.vi || group.key;
}

export default function AdminProductGroups() {
  const { state, actions } = useCms();
  const [lang] = useLang();
  const [draft, setDraft] = useState(empty);
  const isVi = lang === "vi";

  function patch(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function patchName(locale, value) {
    setDraft((prev) => ({ ...prev, name: { ...prev.name, [locale]: value }, key: prev.key || makeSlug(value).replaceAll("-", "_") }));
  }

  function save() {
    actions.saveProductGroup({ ...draft, id: draft.id || `grp-${Date.now()}`, sort: Number(draft.sort || 0) });
    setDraft(empty);
  }

  return (
    <>
      <section className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/50">
        <h1 className="text-3xl font-black text-slate-950">{isVi ? "Product Groups" : "Product Groups"}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{isVi ? "Nhóm dùng cho tag và block hiển thị như Hot, Pre-order, Sale, Hàng mới." : "Groups for homepage blocks and marketing tags such as Hot, Pre-order, Sale and New."}</p>
      </section>

      <section className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="space-y-3">
            <input value={draft.name.vi} onChange={(e) => patchName("vi", e.target.value)} placeholder="Name VI" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none" />
            <input value={draft.name.en} onChange={(e) => patchName("en", e.target.value)} placeholder="Name EN" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none" />
            <input value={draft.key} onChange={(e) => patch("key", e.target.value)} placeholder="key, e.g. new_arrivals" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none" />
            <div className="grid grid-cols-2 gap-3">
              <input value={draft.badgeText} onChange={(e) => patch("badgeText", e.target.value)} placeholder="Badge" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none" />
              <input type="number" value={draft.sort} onChange={(e) => patch("sort", e.target.value)} placeholder="Sort" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select value={draft.tone} onChange={(e) => patch("tone", e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold"><option>blue</option><option>cyan</option><option>gold</option><option>red</option><option>slate</option><option>sky</option><option>violet</option></select>
              <select value={draft.displayArea} onChange={(e) => patch("displayArea", e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold"><option>homepage</option><option>shop</option><option>product</option></select>
            </div>
            <label className="flex items-center gap-2 text-sm font-black text-slate-700"><input type="checkbox" checked={draft.active} onChange={(e) => patch("active", e.target.checked)} />Active</label>
            <button onClick={save} className="w-full rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white"><Save className="mr-2 inline" size={16} />Save</button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3">
            {[...(state.productGroups || [])].sort((a,b)=>Number(a.sort||0)-Number(b.sort||0)).map((group) => (
              <div key={group.id} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_120px] md:items-center">
                <div>
                  <div className="font-black text-slate-950">{label(group, lang)}</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">{group.key} • {group.badgeText} • sort {group.sort}</div>
                </div>
                <div className="flex gap-2 md:justify-end">
                  <button onClick={() => setDraft({ ...empty, ...group })} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Edit</button>
                  <button onClick={() => actions.deleteProductGroup(group.id)} className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-red-600"><Trash2 size={15}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
