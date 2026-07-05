import { useEffect, useMemo, useState } from "react";
import {
  assignAdminCategoryToGroupApi,
  createAdminCategoryGroupApi,
  deleteAdminCategoryGroupApi,
  getAdminCategoryGroupsApi,
  updateAdminCategoryGroupApi,
} from "../../services/AdminCatalogApiService";

const emptyForm = {
  id: "",
  code: "",
  slug: "",
  nameVi: "",
  nameEn: "",
  description: "",
  imageUrl: "",
  icon: "",
  sortOrder: 0,
  active: true,
};

function slugify(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function codeify(value = "") {
  return String(value || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export default function CategoryGroupManager() {
  const [groups, setGroups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminCategoryGroupsApi();
      setGroups(data.groups || []);
      setCategories(data.categories || []);
      if (!selectedGroupId && data.groups?.[0]?.id) setSelectedGroupId(data.groups[0].id);
    } catch (err) {
      setError(err?.message || "Không tải được nhóm danh mục.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedGroup = useMemo(() => groups.find((group) => group.id === selectedGroupId) || null, [groups, selectedGroupId]);
  const assignedCategories = useMemo(() => categories.filter((category) => category.categoryGroupId === selectedGroupId), [categories, selectedGroupId]);
  const unassignedCategories = useMemo(() => categories.filter((category) => !category.categoryGroupId), [categories]);

  function editGroup(group) {
    setForm({ ...emptyForm, ...group });
    setSelectedGroupId(group.id);
  }

  function updateForm(key, value) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "nameVi" && !prev.slug) next.slug = slugify(value);
      if (key === "nameVi" && !prev.code) next.code = codeify(value);
      return next;
    });
  }

  async function saveGroup() {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      if (form.id) {
        await updateAdminCategoryGroupApi(form.id, form);
        setMessage("Đã cập nhật nhóm danh mục.");
      } else {
        const created = await createAdminCategoryGroupApi(form);
        setSelectedGroupId(created.id);
        setMessage("Đã tạo nhóm danh mục.");
      }
      setForm(emptyForm);
      await loadData();
    } catch (err) {
      setError(err?.message || "Không lưu được nhóm danh mục.");
    } finally {
      setLoading(false);
    }
  }

  async function deactivateGroup(id) {
    if (!window.confirm("Deactivate nhóm danh mục này? Category con sẽ được bỏ khỏi nhóm.")) return;
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await deleteAdminCategoryGroupApi(id);
      setMessage("Đã deactivate nhóm danh mục.");
      if (selectedGroupId === id) setSelectedGroupId("");
      await loadData();
    } catch (err) {
      setError(err?.message || "Không deactivate được nhóm danh mục.");
    } finally {
      setLoading(false);
    }
  }

  async function assignCategory(categoryId, groupId) {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await assignAdminCategoryToGroupApi(categoryId, groupId);
      await loadData();
    } catch (err) {
      setError(err?.message || "Không gán được category vào nhóm.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950">Nhóm danh mục sản phẩm</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Tạo nhóm cha để gom các Product Category hiện có. Count sản phẩm được tính tự động từ product.categoryId.</p>
          </div>
          <button type="button" onClick={() => setForm(emptyForm)} className="rounded-2xl bg-blue-700 px-4 py-2 text-sm font-black text-white">Tạo nhóm mới</button>
        </div>
        {message && <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">{message}</div>}
        {error && <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-700">{error}</div>}
      </div>

      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Form nhóm cha</div>
            <div className="grid gap-3">
              <input value={form.nameVi} onChange={(e) => updateForm("nameVi", e.target.value)} placeholder="Tên nhóm VI, ví dụ: GUNPLA - GUNDAM" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none" />
              <input value={form.nameEn || ""} onChange={(e) => updateForm("nameEn", e.target.value)} placeholder="Tên nhóm EN" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none" />
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={form.code} onChange={(e) => updateForm("code", e.target.value)} placeholder="CODE" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold uppercase outline-none" />
                <input value={form.slug} onChange={(e) => updateForm("slug", e.target.value)} placeholder="slug" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none" />
              </div>
              <input value={form.sortOrder || 0} onChange={(e) => updateForm("sortOrder", Number(e.target.value || 0))} type="number" placeholder="Sort order" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none" />
              <input value={form.icon || ""} onChange={(e) => updateForm("icon", e.target.value)} placeholder="Icon/Image URL optional" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none" />
              <textarea value={form.description || ""} onChange={(e) => updateForm("description", e.target.value)} placeholder="Mô tả optional" className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none" />
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <input type="checkbox" checked={form.active !== false} onChange={(e) => updateForm("active", e.target.checked)} /> Active
              </label>
              <button type="button" onClick={saveGroup} disabled={loading || !form.nameVi} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:opacity-50">{form.id ? "Cập nhật nhóm" : "Tạo nhóm"}</button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Danh sách nhóm</div>
            <div className="space-y-2">
              {groups.map((group) => (
                <button key={group.id} type="button" onClick={() => setSelectedGroupId(group.id)} className={`w-full rounded-2xl border px-4 py-3 text-left ${selectedGroupId === group.id ? "border-blue-600 bg-blue-50" : "border-slate-100 bg-slate-50"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-black text-slate-950">{group.nameVi}</div>
                    <div className="text-xs font-black text-slate-400">{Number(group.productCount || 0)} SP</div>
                  </div>
                  <div className="mt-1 text-xs font-bold text-slate-500">{Number(group.categoryCount || 0)} category • sort {group.sortOrder || 0}</div>
                  <div className="mt-2 flex gap-2">
                    <span onClick={(e) => { e.stopPropagation(); editGroup(group); }} className="rounded-xl bg-white px-3 py-1 text-xs font-black text-blue-700">Sửa</span>
                    <span onClick={(e) => { e.stopPropagation(); deactivateGroup(group.id); }} className="rounded-xl bg-white px-3 py-1 text-xs font-black text-red-600">Deactivate</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-black uppercase tracking-wide text-slate-500">Gán category vào nhóm</div>
              <div className="mt-1 text-lg font-black text-slate-950">{selectedGroup?.nameVi || "Chọn nhóm"}</div>
            </div>
            <button type="button" onClick={loadData} className="rounded-2xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-700">Refresh</button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <div className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Đang thuộc nhóm</div>
              <div className="space-y-2">
                {assignedCategories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                    <div>
                      <div className="text-sm font-black text-slate-950">{category.nameVi}</div>
                      <div className="text-xs font-bold text-slate-500">{Number(category.productCount || 0)} sản phẩm</div>
                    </div>
                    <button type="button" onClick={() => assignCategory(category.id, "")} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-red-600">Bỏ</button>
                  </div>
                ))}
                {!assignedCategories.length && <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">Chưa có category trong nhóm này.</div>}
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Chưa thuộc nhóm</div>
              <div className="space-y-2">
                {unassignedCategories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div>
                      <div className="text-sm font-black text-slate-950">{category.nameVi}</div>
                      <div className="text-xs font-bold text-slate-500">{Number(category.productCount || 0)} sản phẩm</div>
                    </div>
                    <button type="button" disabled={!selectedGroupId} onClick={() => assignCategory(category.id, selectedGroupId)} className="rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white disabled:opacity-40">Thêm</button>
                  </div>
                ))}
                {!unassignedCategories.length && <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">Tất cả category đã được gán nhóm.</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
