import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useCms, useLang } from "../../store/CmsStore";
import { getText } from "../../utils/format";
import AdminPageHeader from "../../components/admin/AdminPageHeader";

const text = {
  vi: { title: "Landing Page Builder", desc: "Bật/tắt, đổi thứ tự, chỉnh tiêu đề và nguồn dữ liệu cho từng section trang chủ.", add: "Thêm section", enabled: "Hiển thị", type: "Loại", source: "Nguồn dữ liệu", rows: "Dòng", columns: "Cột", save: "Tự lưu vào localStorage" },
  en: { title: "Landing Page Builder", desc: "Enable/disable, reorder, edit titles and data sources for homepage sections.", add: "Add section", enabled: "Enabled", type: "Type", source: "Data source", rows: "Rows", columns: "Columns", save: "Auto-saved to localStorage" }
};

export default function AdminHomeBuilder() {
  const { state, actions } = useCms();
  const [lang] = useLang();
  const t = text[lang];
  const sections = [...state.homeSections].sort((a, b) => a.sort - b.sort);

  function move(section, dir) {
    const targetSort = section.sort + dir;
    const other = state.homeSections.find((s) => s.sort === targetSort);
    if (other) actions.updateHomeSection(other.id, { sort: section.sort });
    actions.updateHomeSection(section.id, { sort: targetSort });
  }

  function addSection() {
    actions.addHomeSection({
      type: "productCarousel",
      title: { vi: "Section mới", en: "New section" },
      dataSource: "new_arrivals",
      enabled: true,
      layout: { rows: 1, columns: 4, compact: true }
    });
  }

  return (
    <>
      <AdminPageHeader
        title={t.title}
        desc={t.desc}
        action={
          <div className="flex gap-3">
            <button onClick={addSection} className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-800"><Plus className="mr-2 inline" size={16}/>{t.add}</button>
            <span className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700">{t.save}</span>
          </div>
        }
      />

      <section className="space-y-3">
        {sections.map((section, idx) => (
          <div key={section.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[1fr_160px_180px_100px_100px_150px] lg:items-center">
              <div>
                <input value={getText(section.title, "vi")} onChange={(e) => actions.updateHomeSection(section.id, { title: { ...section.title, vi: e.target.value } })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-950 outline-none focus:border-blue-300" />
                <input value={getText(section.title, "en")} onChange={(e) => actions.updateHomeSection(section.id, { title: { ...section.title, en: e.target.value } })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600 outline-none focus:border-blue-300" />
              </div>
              <select value={section.type} onChange={(e) => actions.updateHomeSection(section.id, { type: e.target.value })} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold">
                <option value="heroSlider">Hero Slider</option>
                <option value="categoryGrid">Category Grid</option>
                <option value="productCarousel">Product Carousel</option>
                <option value="promoBanner">Promo Banner</option>
              </select>
              <select value={section.dataSource} onChange={(e) => actions.updateHomeSection(section.id, { dataSource: e.target.value })} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold">
                <option value="home_hero">home_hero</option>
                <option value="home_ad">home_ad</option>
                <option value="new_arrivals">new_arrivals</option>
                <option value="preorder">preorder</option>
                <option value="best_sellers">best_sellers</option>
                <option value="sale_products">sale_products</option>
                <option value="categories">categories</option>
              </select>
              <input type="number" value={section.layout?.rows || 1} onChange={(e) => actions.updateHomeSection(section.id, { layout: { rows: Number(e.target.value) } })} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold" />
              <input type="number" value={section.layout?.columns || 4} onChange={(e) => actions.updateHomeSection(section.id, { layout: { columns: Number(e.target.value) } })} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold" />
              <div className="flex gap-2 lg:justify-end">
                <button onClick={() => actions.updateHomeSection(section.id, { enabled: !section.enabled })} className={`rounded-xl p-3 ${section.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>{section.enabled ? <Eye size={17}/> : <EyeOff size={17}/>}</button>
                <button disabled={idx === 0} onClick={() => move(section, -1)} className="rounded-xl border border-slate-200 bg-white p-3 text-slate-600 disabled:opacity-30"><ArrowUp size={17}/></button>
                <button disabled={idx === sections.length - 1} onClick={() => move(section, 1)} className="rounded-xl border border-slate-200 bg-white p-3 text-slate-600 disabled:opacity-30"><ArrowDown size={17}/></button>
                <button onClick={() => actions.deleteHomeSection(section.id)} className="rounded-xl border border-red-100 bg-red-50 p-3 text-red-600"><Trash2 size={17}/></button>
              </div>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
