import { useMemo, useState } from "react";
import { Edit3, Plus, Search, Trash2 } from "lucide-react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import { AdminImageUploader, AdminTextField, AdminToggle } from "../../components/admin/AdminField";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminStatusBadge from "../../components/admin/AdminStatusBadge";
import { useCms, useLang } from "../../store/CmsStore";
import { getAdminText, makeAdminId, makeAdminSlug } from "./productAdminV4Helpers";

const emptyCategory = {
  id: "",
  code: "",
  slug: "",
  name: { vi: "", en: "" },
  description: { vi: "", en: "" },
  icon: "",
  sort: 1,
  active: true,
};

export default function AdminProductCategories() {
  const { state, actions } = useCms();
  const [lang] = useLang();
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState(emptyCategory);

  const rows = useMemo(() => {
    const list = state.productCategories || state.categories || [];
    return list.filter((item) => {
      const q = query.toLowerCase();
      return `${item.code || ""} ${item.slug || ""} ${getAdminText(item.name, lang)}`.toLowerCase().includes(q);
    });
  }, [state.productCategories, state.categories, query, lang]);

  function patch(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function patchName(locale, value) {
    setDraft((prev) => ({
      ...prev,
      name: { ...prev.name, [locale]: value },
      slug: prev.slug || makeAdminSlug(value),
      code: prev.code || makeAdminSlug(value).toUpperCase(),
    }));
  }

  function openCreate() {
    setDraft(emptyCategory);
    setDrawerOpen(true);
  }

  function openEdit(item) {
    setDraft({ ...emptyCategory, ...item });
    setDrawerOpen(true);
  }

  function save() {
    const id = draft.id || makeAdminId("cat");
    const payload = {
      ...draft,
      id,
      slug: draft.slug || makeAdminSlug(draft.name?.vi || draft.name?.en || id),
      sort: Number(draft.sort || 1),
    };

    if (actions.saveProductCategory) actions.saveProductCategory(payload);
    else if (actions.saveCategory) actions.saveCategory(payload);

    setDrawerOpen(false);
  }

  function remove(id) {
    if (actions.deleteProductCategory) actions.deleteProductCategory(id);
    else if (actions.deleteCategory) actions.deleteCategory(id);
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Product Management"
        title="Product Categories"
        desc="Quản lý danh mục sản phẩm như HG, RG, MG, PG, Tools. Danh mục có icon để hiển thị ngoài storefront."
        action={<button onClick={openCreate} className="rounded-md bg-blue-700 px-4 py-2 text-xs font-black text-white hover:bg-blue-800"><Plus size={15} className="mr-1 inline" />Create category</button>}
      />

      <section className="mb-4 rounded-md border border-slate-200 bg-white p-4">
        <div className="flex items-center rounded-md border border-slate-300 bg-white px-3 py-2">
          <Search size={16} className="text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent px-2 text-sm outline-none" placeholder="Tìm theo mã, tên danh mục, slug..." />
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3">Actions</th>
                <th className="px-4 py-3">Icon</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Category name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3 text-right">Sort</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className="group border-t border-slate-100 hover:bg-slate-50">
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 group-hover:bg-slate-50">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(item)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><Edit3 size={14} className="mr-1 inline" />Edit</button>
                      <button onClick={() => remove(item.id)} className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"><Trash2 size={14} /></button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-12 w-12 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                      {item.icon ? <img src={item.icon} className="h-full w-full object-cover" /> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-black text-blue-700">{item.code || "-"}</td>
                  <td className="px-4 py-3 font-black text-slate-950">{getAdminText(item.name, lang)}</td>
                  <td className="px-4 py-3 text-slate-500">{item.slug || "-"}</td>
                  <td className="px-4 py-3 text-right font-black">{item.sort || 1}</td>
                  <td className="px-4 py-3"><AdminStatusBadge>{item.active === false ? "Inactive" : "Active"}</AdminStatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AdminDrawer open={drawerOpen} title={draft.id ? "Edit category" : "Create category"} subtitle="Danh mục dùng để phân loại sản phẩm và hiển thị icon ngoài storefront." onClose={() => setDrawerOpen(false)} onSave={save} saveLabel="Save category">
        <div className="grid gap-5 md:grid-cols-2">
          <AdminTextField label="Tên danh mục tiếng Việt" required tip="Tên khách hàng nhìn thấy, ví dụ: Real Grade, Master Grade." value={draft.name?.vi} onChange={(v) => patchName("vi", v)} />
          <AdminTextField label="Tên danh mục tiếng Anh" tip="Tên khi website chuyển sang tiếng Anh." value={draft.name?.en} onChange={(v) => patchName("en", v)} />
          <AdminTextField label="Mã danh mục" required tip="Mã ngắn để quản trị, ví dụ: HG, RG, MG, PG." value={draft.code} onChange={(v) => patch("code", v.toUpperCase())} />
          <AdminTextField label="Đường dẫn danh mục" tip="URL lọc danh mục ngoài website." value={draft.slug} onChange={(v) => patch("slug", v)} />
          <AdminTextField label="Thứ tự hiển thị" tip="Số nhỏ sẽ hiển thị trước." type="number" value={draft.sort} onChange={(v) => patch("sort", v)} />
          <AdminToggle label="Hiển thị danh mục" tip="Tắt nếu chưa muốn khách thấy danh mục này." checked={draft.active !== false} onChange={(v) => patch("active", v)} />
          <div className="md:col-span-2">
            <AdminImageUploader label="Icon danh mục" tip="Icon hiển thị ngoài trang chủ. Bắt buộc dùng ảnh vuông, khuyến nghị 512 x 512 px." recommended="512 x 512 px" value={draft.icon} onChange={(v) => patch("icon", v)} />
          </div>
        </div>
      </AdminDrawer>
    </>
  );
}
