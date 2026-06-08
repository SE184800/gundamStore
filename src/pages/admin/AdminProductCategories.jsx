import { useEffect, useMemo, useState } from "react";
import { Edit3, Image as ImageIcon, Plus, RefreshCcw, Search, Trash2, UploadCloud, X } from "lucide-react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import { AdminTextarea, AdminTextField, AdminToggle } from "../../components/admin/AdminField";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { logoutAdmin } from "../../services/AdminAuthService";
import {
  createAdminCategoryApi,
  deleteAdminCategoryApi,
  getAdminCategoriesApi,
  updateAdminCategoryApi,
} from "../../services/AdminCatalogApiService";
import { fileToBase64 } from "../../utils/mediaUpload";

const empty = {
  id: "",
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

export default function AdminProductCategories() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState(empty);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  async function reload() {
    setLoading(true);
    setApiError("");

    try {
      setRows(await getAdminCategoriesApi());
    } catch (error) {
      console.error("ADMIN_CATEGORIES_ERROR", error);
      if (error?.status === 401 || error?.message === "Unauthorized") {
        logoutAdmin();
        window.location.href = "/admin/login";
        return;
      }
      setApiError(error?.message || "Cannot load categories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((item) =>
      !q ||
      [item.code, item.slug, item.nameVi, item.nameEn, item.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, query]);

  function patch(field, value) {
    setDraft((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "nameVi") {
        if (!prev.slug) next.slug = makeSlug(value);
        if (!prev.code) next.code = makeCode(value);
      }
      return next;
    });
  }

  function openCreate() {
    setDraft(empty);
    setDrawerOpen(true);
  }

  function openEdit(item) {
    setDraft({ ...empty, ...item });
    setDrawerOpen(true);
  }

  async function handleCategoryImageUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    try {
      const imageUrl = await fileToBase64(file);
      setDraft((prev) => ({
        ...prev,
        imageUrl,
        altText: prev.altText || prev.nameVi || prev.nameEn || "Product category",
      }));
    } catch (error) {
      alert(error?.message || "Upload category image failed.");
    }
  }

  function clearCategoryImage() {
    setDraft((prev) => ({
      ...prev,
      imageUrl: "",
      icon: "",
      altText: "",
    }));
  }

  async function save() {
    try {
      if (draft.id) await updateAdminCategoryApi(draft.id, draft);
      else await createAdminCategoryApi(draft);
      setDrawerOpen(false);
      await reload();
    } catch (error) {
      alert(error?.message || "Save category failed.");
    }
  }

  async function remove(item) {
    if (!window.confirm(`Ẩn danh mục ${item.nameVi}?`)) return;
    await deleteAdminCategoryApi(item.id);
    await reload();
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Product Management"
        title="Product Categories"
        desc="Quản lý danh mục sản phẩm từ PostgreSQL để dùng cho product master và storefront."
        action={
          <button onClick={openCreate} className="rounded-md bg-blue-700 px-4 py-2 text-xs font-black text-white hover:bg-blue-800">
            <Plus size={15} className="mr-1 inline" />
            Create category
          </button>
        }
      />

      <section className="mb-4 rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
        PostgreSQL Categories · {loading ? "Loading..." : `${rows.length} categories`}
      </section>

      {apiError && (
        <section className="mb-4 rounded-3xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          {apiError}
        </section>
      )}

      <section className="mb-4 rounded-md border border-slate-200 bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="flex items-center rounded-md border border-slate-300 bg-white px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent px-2 text-sm outline-none" placeholder="Tìm theo code, slug, tên danh mục..." />
          </div>
          <button onClick={() => void reload()} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
            <RefreshCcw size={15} className="mr-1 inline" />
            Refresh
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Actions</th>
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3 text-right">Sort</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(item)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                      <Edit3 size={14} className="mr-1 inline" /> Edit
                    </button>
                    <button onClick={() => void remove(item)} className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {item.imageUrl || item.icon ? (
                    <img
                      src={item.imageUrl || item.icon}
                      alt={item.altText || item.nameVi || "Category"}
                      className="h-12 w-12 rounded-xl border border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                      <ImageIcon size={18} />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-black text-blue-700">{item.code}</td>
                <td className="px-4 py-3">
                  <div className="font-black text-slate-950">{item.nameVi}</div>
                  <div className="text-xs text-slate-500">{item.nameEn}</div>
                </td>
                <td className="px-4 py-3 text-slate-500">{item.slug}</td>
                <td className="px-4 py-3 text-right font-black">{item.sortOrder}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-[11px] font-black ${item.active !== false ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {item.active !== false ? "ACTIVE" : "INACTIVE"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <AdminDrawer open={drawerOpen} title={draft.id ? "Edit category" : "Create category"} subtitle="PostgreSQL category" onClose={() => setDrawerOpen(false)} onSave={save} saveLabel="Save category">
        <div className="grid gap-5 md:grid-cols-2">
          <AdminTextField label="Tên VI" required value={draft.nameVi} onChange={(v) => patch("nameVi", v)} />
          <AdminTextField label="Tên EN" value={draft.nameEn} onChange={(v) => patch("nameEn", v)} />
          <AdminTextField label="Code" required value={draft.code} onChange={(v) => patch("code", makeCode(v))} />
          <AdminTextField label="Slug" required value={draft.slug} onChange={(v) => patch("slug", makeSlug(v))} />
          <AdminTextField label="Sort order" type="number" value={draft.sortOrder} onChange={(v) => patch("sortOrder", v)} />
          <AdminToggle label="Active" checked={draft.active !== false} onChange={(v) => patch("active", v)} />

          <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-black text-slate-900">Category image</div>
                <div className="text-xs font-bold text-slate-500">Used by storefront homepage category cards.</div>
              </div>
              {(draft.imageUrl || draft.icon) && (
                <button
                  type="button"
                  onClick={clearCategoryImage}
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-100"
                >
                  <X size={14} className="mr-1 inline" />
                  Remove
                </button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-[160px_1fr]">
              <div className="flex h-36 w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {draft.imageUrl || draft.icon ? (
                  <img
                    src={draft.imageUrl || draft.icon}
                    alt={draft.altText || draft.nameVi || "Category"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center text-xs font-bold text-slate-400">
                    <ImageIcon className="mx-auto mb-2" size={24} />
                    No image
                  </div>
                )}
              </div>

              <div className="grid gap-3">
                <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-blue-300 bg-blue-50 px-4 py-5 text-sm font-black text-blue-700 hover:bg-blue-100">
                  <UploadCloud size={18} className="mr-2" />
                  Upload category image
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={handleCategoryImageUpload}
                  />
                </label>

                <AdminTextField label="Image URL / Base64" value={draft.imageUrl || ""} onChange={(v) => patch("imageUrl", v)} />
                <AdminTextField label="Alt text" value={draft.altText || ""} onChange={(v) => patch("altText", v)} />
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <AdminTextarea label="Mô tả" rows={4} value={draft.description} onChange={(v) => patch("description", v)} />
          </div>
        </div>
      </AdminDrawer>
    </>
  );
}
