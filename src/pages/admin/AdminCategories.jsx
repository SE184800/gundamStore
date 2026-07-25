import { useState } from "react";
import { Link } from "react-router-dom";
import { Save, Trash2, AlertTriangle } from "lucide-react";
import { useCms, useLang } from "../../store/CmsStore";
import { makeSlug } from "../../utils/format";

const text = {
  vi: {
    staleWarningPrefix: "Trang này không còn được dùng, dữ liệu chỉ là demo cục bộ, không đồng bộ với hệ thống thật. Vui lòng dùng ",
    staleWarningLink: "Quản lý danh mục",
    title: "Category Master",
    desc: "Quản lý danh mục độc lập. Sản phẩm sẽ được gán vào danh mục ở màn hình Product Category Mapping.",
    add: "Thêm danh mục",
    edit: "Sửa danh mục",
    save: "Lưu danh mục",
    reset: "Làm mới",
    nameVi: "Tên VI",
    nameEn: "Tên EN",
    slug: "Slug",
    label: "Label ngắn",
    descField: "Mô tả ngắn",
    type: "Loại danh mục",
    sort: "Thứ tự",
    active: "Đang hiển thị",
  },
  en: {
    staleWarningPrefix: "This page is no longer used. Its data is local demo-only data and is not synced with the real system. Please use ",
    staleWarningLink: "Category Management",
    title: "Category Master",
    desc: "Manage categories independently. Products are assigned to categories in Product Category Mapping.",
    add: "Add category",
    edit: "Edit category",
    save: "Save category",
    reset: "Reset",
    nameVi: "Name VI",
    nameEn: "Name EN",
    slug: "Slug",
    label: "Short label",
    descField: "Short description",
    type: "Category type",
    sort: "Sort",
    active: "Active",
  },
};

const emptyCategory = {
  id: "",
  slug: "",
  name: { vi: "", en: "" },
  label: "",
  desc: "",
  type: "grade",
  parentId: "",
  tone: "blue",
  active: true,
  sort: 1,
};

function getName(category, lang) {
  return category.name?.[lang] || category.name?.vi || category.label || category.id;
}

export default function AdminCategories() {
  const { state, actions } = useCms();
  const [lang] = useLang();
  const t = text[lang];
  const [draft, setDraft] = useState(emptyCategory);

  function patch(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function patchName(locale, value) {
    setDraft((prev) => ({
      ...prev,
      name: { ...prev.name, [locale]: value },
      slug: prev.slug || makeSlug(value),
      label: prev.label || value,
    }));
  }

  function save() {
    const id = draft.id || `cat-${Date.now()}`;
    actions.saveCategory({
      ...draft,
      id,
      slug: draft.slug || makeSlug(draft.name.vi || draft.name.en || id),
      sort: Number(draft.sort || 0),
    });
    setDraft(emptyCategory);
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

      <section className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-lg font-black text-slate-950">{draft.id ? t.edit : t.add}</div>
            <button onClick={() => setDraft(emptyCategory)} className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">{t.reset}</button>
          </div>

          <div className="space-y-3">
            <input value={draft.name.vi} onChange={(e) => patchName("vi", e.target.value)} placeholder={t.nameVi} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none" />
            <input value={draft.name.en} onChange={(e) => patchName("en", e.target.value)} placeholder={t.nameEn} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none" />
            <input value={draft.slug} onChange={(e) => patch("slug", e.target.value)} placeholder={t.slug} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none" />
            <div className="grid grid-cols-2 gap-3">
              <input value={draft.label} onChange={(e) => patch("label", e.target.value)} placeholder={t.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none" />
              <input value={draft.desc} onChange={(e) => patch("desc", e.target.value)} placeholder={t.descField} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select value={draft.type} onChange={(e) => patch("type", e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold">
                <option value="grade">grade</option>
                <option value="brand">brand</option>
                <option value="accessory">accessory</option>
                <option value="marketing">marketing</option>
              </select>
              <input type="number" value={draft.sort} onChange={(e) => patch("sort", e.target.value)} placeholder={t.sort} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none" />
            </div>
            <select value={draft.tone} onChange={(e) => patch("tone", e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold">
              <option>blue</option><option>cyan</option><option>gold</option><option>red</option><option>slate</option><option>sky</option><option>violet</option>
            </select>
            <label className="flex items-center gap-2 text-sm font-black text-slate-700">
              <input type="checkbox" checked={draft.active} onChange={(e) => patch("active", e.target.checked)} />
              {t.active}
            </label>
            <button onClick={save} className="w-full rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-800">
              <Save className="mr-2 inline" size={16} />{t.save}
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3">
            {[...(state.categories || [])].sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0)).map((category) => (
              <div key={category.id} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_120px_120px] md:items-center">
                <div>
                  <div className="font-black text-slate-950">{getName(category, lang)}</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">{category.slug} • {category.type} • sort {category.sort}</div>
                </div>
                <div className={`rounded-xl px-3 py-2 text-center text-xs font-black ${category.active !== false ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {category.active !== false ? "Active" : "Inactive"}
                </div>
                <div className="flex gap-2 md:justify-end">
                  <button onClick={() => setDraft({ ...emptyCategory, ...category, name: category.name || { vi: category.label || "", en: category.label || "" } })} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Edit</button>
                  <button onClick={() => actions.deleteCategory(category.id)} className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-red-600"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
