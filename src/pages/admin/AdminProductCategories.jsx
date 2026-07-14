import { useEffect, useMemo, useState } from "react";
import { Edit3, FolderTree, PackageOpen, Plus, RefreshCcw, Search, Trash2 } from "lucide-react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import { AdminTextarea, AdminTextField, AdminToggle } from "../../components/admin/AdminField";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { logoutAdmin } from "../../services/AdminAuthService";
import {
  assignAdminCategoryToGroupApi,
  createAdminCategoryApi,
  createAdminCategoryGroupApi,
  deleteAdminCategoryApi,
  deleteAdminCategoryGroupApi,
  getAdminCategoryGroupsApi,
  updateAdminCategoryApi,
  updateAdminCategoryGroupApi,
} from "../../services/AdminCatalogApiService";

const emptyParent = {
  kind: "parent",
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

const emptyChild = {
  kind: "child",
  id: "",
  categoryGroupId: "",
  code: "",
  slug: "",
  nameVi: "",
  nameEn: "",
  description: "",
  imageUrl: "",
  icon: "",
  altText: "",
  sortOrder: 0,
  active: true,
};

function makeSlug(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function makeCode(value = "") {
  return String(value || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function itemImage(item = {}) {
  return item.imageUrl || item.icon || "";
}

function matchesQuery(item = {}, query = "") {
  if (!query) return true;
  return [item.code, item.slug, item.nameVi, item.nameEn, item.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(query);
}

export default function AdminProductCategories() {
  const [groups, setGroups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tree, setTree] = useState([]);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState(emptyChild);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  async function reload() {
    setLoading(true);
    setApiError("");

    try {
      const data = await getAdminCategoryGroupsApi();
      setGroups(Array.isArray(data.groups) ? data.groups : []);
      setCategories(Array.isArray(data.categories) ? data.categories : []);
      setTree(Array.isArray(data.tree) ? data.tree : []);
    } catch (error) {
      console.error("ADMIN_CATEGORY_TREE_ERROR", error);
      if (error?.status === 401 || error?.message === "Unauthorized") {
        logoutAdmin();
        window.location.href = "/admin/login";
        return;
      }
      setApiError(error?.message || "Không tải được cây danh mục.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const visibleTree = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tree;

    return tree
      .map((parent) => {
        const children = (parent.children || []).filter((child) => matchesQuery(child, q));
        if (matchesQuery(parent, q)) return parent;
        return children.length ? { ...parent, children } : null;
      })
      .filter(Boolean);
  }, [tree, query]);

  const activeParentOptions = useMemo(
    () => groups.filter((item) => item.active !== false || item.id === draft.categoryGroupId),
    [groups, draft.categoryGroupId]
  );

  function patch(field, value) {
    setDraft((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "nameVi") {
        if (!prev.slug) next.slug = makeSlug(value);
        if (!prev.code) next.code = makeCode(value);
        if (prev.kind === "child" && !prev.altText) next.altText = value;
      }
      return next;
    });
  }

  function openCreateParent() {
    setDraft({ ...emptyParent });
    setDrawerOpen(true);
  }

  function openCreateChild(categoryGroupId = "") {
    setDraft({ ...emptyChild, categoryGroupId: categoryGroupId === "ungrouped" ? "" : categoryGroupId });
    setDrawerOpen(true);
  }

  function openEditParent(item) {
    setDraft({ ...emptyParent, ...item, kind: "parent" });
    setDrawerOpen(true);
  }

  function openEditChild(item) {
    setDraft({ ...emptyChild, ...item, kind: "child", categoryGroupId: item.categoryGroupId || "" });
    setDrawerOpen(true);
  }

  async function save() {
    if (!draft.nameVi.trim() || !draft.code.trim() || !draft.slug.trim()) {
      alert("Vui lòng nhập Tên VI, Code và Slug.");
      return;
    }

    setSaving(true);
    try {
      if (draft.kind === "parent") {
        if (draft.id) await updateAdminCategoryGroupApi(draft.id, draft);
        else await createAdminCategoryGroupApi(draft);
      } else {
        const category = draft.id
          ? await updateAdminCategoryApi(draft.id, draft)
          : await createAdminCategoryApi(draft);
        await assignAdminCategoryToGroupApi(category.id, draft.categoryGroupId);
      }

      setDrawerOpen(false);
      await reload();
    } catch (error) {
      alert(error?.message || "Lưu danh mục thất bại.");
    } finally {
      setSaving(false);
    }
  }

  async function removeParent(item) {
    if (!window.confirm(`Xóa vĩnh viễn cấp cha “${item.nameVi}”? Các danh mục con sẽ được giữ lại và chuyển sang Chưa gán cấp cha.`)) return;
    try {
      await deleteAdminCategoryGroupApi(item.id);
      await reload();
    } catch (error) {
      alert(error?.message || "Xóa danh mục cấp cha thất bại.");
    }
  }

  async function removeChild(item) {
    if (!window.confirm(`Xóa vĩnh viễn cấp con “${item.nameVi}”? Chỉ có thể xóa khi danh mục không còn sản phẩm.`)) return;
    try {
      await deleteAdminCategoryApi(item.id);
      await reload();
    } catch (error) {
      alert(error?.message || "Xóa danh mục cấp con thất bại.");
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Product Management"
        title="Danh mục sản phẩm 2 cấp"
        desc="Cấp cha gom nhiều danh mục con. Ngoài shop, bấm cấp cha sẽ xem toàn bộ sản phẩm thuộc các danh mục con; bấm cấp con sẽ lọc đúng danh mục đó."
        action={
          <div className="flex flex-wrap gap-2">
            <button onClick={openCreateParent} className="rounded-2xl border border-blue-200 bg-white px-4 py-2 text-xs font-black text-blue-700 hover:bg-blue-50">
              <Plus size={15} className="mr-1 inline" /> Tạo cấp cha
            </button>
            <button onClick={() => openCreateChild()} className="rounded-2xl bg-blue-700 px-4 py-2 text-xs font-black text-white hover:bg-blue-800">
              <Plus size={15} className="mr-1 inline" /> Tạo cấp con
            </button>
          </div>
        }
      />

      <section className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
          <div className="text-xs font-black uppercase tracking-wide text-blue-600">Cấp cha</div>
          <div className="mt-1 text-2xl font-black text-blue-950">{groups.length}</div>
        </div>
        <div className="rounded-3xl border border-violet-100 bg-violet-50 p-4">
          <div className="text-xs font-black uppercase tracking-wide text-violet-600">Cấp con</div>
          <div className="mt-1 text-2xl font-black text-violet-950">{categories.length}</div>
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="text-xs font-black uppercase tracking-wide text-emerald-600">Sản phẩm đang hiển thị</div>
          <div className="mt-1 text-2xl font-black text-emerald-950">
            {tree.reduce((sum, item) => sum + Number(item.productCount || 0), 0)}
          </div>
        </div>
      </section>

      {apiError && <section className="mb-4 rounded-3xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">{apiError}</section>}

      <section className="mb-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="flex items-center rounded-2xl border border-slate-300 bg-white px-3 py-3">
            <Search size={16} className="text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent px-2 text-sm font-bold outline-none" placeholder="Tìm cấp cha hoặc cấp con..." />
          </div>
          <button onClick={() => void reload()} disabled={loading} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            <RefreshCcw size={15} className={`mr-1 inline ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </section>

      <section className="space-y-4">
        {visibleTree.map((parent) => {
          const isUngrouped = parent.id === "ungrouped";
          const image = itemImage(parent);

          return (
            <article key={parent.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white text-blue-600">
                    {image ? <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" /> : <FolderTree size={24} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-base font-black text-slate-950">{parent.nameVi}</h2>
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-black uppercase text-blue-700">Cấp cha</span>
                      {!isUngrouped && (
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${parent.active !== false ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                          {parent.active !== false ? "ACTIVE" : "INACTIVE"}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs font-bold text-slate-500">
                      {isUngrouped ? "Danh mục con chưa chọn cấp cha" : `${parent.code} · /${parent.slug}`} · {parent.categoryCount || parent.children?.length || 0} danh mục con · {parent.productCount || 0} sản phẩm
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!isUngrouped && (
                    <>
                      <button onClick={() => openEditParent(parent)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-100">
                        <Edit3 size={14} className="mr-1 inline" /> Sửa cha
                      </button>
                      <button onClick={() => void removeParent(parent)} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-100">
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                  <button onClick={() => openCreateChild(parent.id)} className="rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">
                    <Plus size={14} className="mr-1 inline" /> Thêm cấp con
                  </button>
                </div>
              </div>

              <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                {(parent.children || []).map((child) => {
                  const childImage = itemImage(child);
                  return (
                    <div key={child.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-violet-50 text-violet-600">
                            {childImage ? <img src={childImage} alt={child.altText || child.nameVi || ""} className="h-full w-full object-cover" loading="lazy" /> : <PackageOpen size={20} />}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-black text-slate-950">{child.nameVi}</div>
                            <div className="mt-1 text-[11px] font-bold text-slate-500">{child.code} · {child.productCount || 0} sản phẩm</div>
                          </div>
                        </div>
                        <span className="rounded-full bg-violet-100 px-2 py-1 text-[9px] font-black uppercase text-violet-700">Cấp con</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-black ${child.active !== false ? "text-emerald-600" : "text-slate-400"}`}>{child.active !== false ? "ACTIVE" : "INACTIVE"}</span>
                        <div className="flex gap-2">
                          <button onClick={() => openEditChild(child)} className="rounded-lg bg-slate-100 p-2 text-slate-700 hover:bg-slate-200" aria-label="Sửa danh mục con"><Edit3 size={14} /></button>
                          <button onClick={() => void removeChild(child)} className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100" aria-label="Xóa danh mục con"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {!parent.children?.length && (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-xs font-bold text-slate-500 md:col-span-2 xl:col-span-3">
                    Chưa có danh mục cấp con.
                  </div>
                )}
              </div>
            </article>
          );
        })}

        {!loading && !visibleTree.length && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm font-bold text-slate-500">
            Không tìm thấy danh mục phù hợp.
          </div>
        )}
      </section>

      <AdminDrawer
        open={drawerOpen}
        title={`${draft.id ? "Sửa" : "Tạo"} danh mục cấp ${draft.kind === "parent" ? "cha" : "con"}`}
        subtitle={draft.kind === "parent" ? "Cấp cha gom nhiều danh mục con ngoài shop" : "Mỗi danh mục con thuộc tối đa một cấp cha"}
        onClose={() => setDrawerOpen(false)}
        onSave={save}
        saveLabel={saving ? "Đang lưu..." : "Lưu danh mục"}
      >
        <div className="grid gap-5 md:grid-cols-2">
          {draft.kind === "child" && (
            <label className="md:col-span-2 block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">Danh mục cấp cha</span>
              <select value={draft.categoryGroupId || ""} onChange={(event) => patch("categoryGroupId", event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-500">
                <option value="">Chưa gán cấp cha</option>
                {activeParentOptions.map((item) => <option key={item.id} value={item.id}>{item.nameVi} ({item.productCount || 0})</option>)}
              </select>
            </label>
          )}

          <AdminTextField label="Tên VI" required value={draft.nameVi} onChange={(value) => patch("nameVi", value)} />
          <AdminTextField label="Tên EN" value={draft.nameEn} onChange={(value) => patch("nameEn", value)} />
          <AdminTextField label="Code" required value={draft.code} onChange={(value) => patch("code", makeCode(value))} />
          <AdminTextField label="Slug" required value={draft.slug} onChange={(value) => patch("slug", makeSlug(value))} />
          <AdminTextField label="Thứ tự" type="number" value={draft.sortOrder} onChange={(value) => patch("sortOrder", value)} />
          <AdminToggle label="Đang hiển thị" checked={draft.active !== false} onChange={(value) => patch("active", value)} />
          <AdminTextField label="Image URL" value={draft.imageUrl || ""} onChange={(value) => patch("imageUrl", value)} />
          {draft.kind === "child" && <AdminTextField label="Alt text" value={draft.altText || ""} onChange={(value) => patch("altText", value)} />}
          <div className="md:col-span-2">
            <AdminTextarea label="Mô tả" rows={4} value={draft.description || ""} onChange={(value) => patch("description", value)} />
          </div>
        </div>
      </AdminDrawer>
    </>
  );
}
