import { useEffect, useMemo, useState } from "react";
import { Edit3, Plus, RefreshCcw, Search, Trash2 } from "lucide-react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import { AdminTextarea, AdminTextField, AdminToggle } from "../../components/admin/AdminField";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { logoutAdmin } from "../../services/AdminAuthService";
import {
  createAdminGroupApi,
  deleteAdminGroupApi,
  getAdminGroupsApi,
  updateAdminGroupApi,
} from "../../services/AdminCatalogApiService";

const empty = {
  id: "",
  code: "",
  slug: "",
  nameVi: "",
  nameEn: "",
  description: "",
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

export default function AdminProductGroups() {
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
      setRows(await getAdminGroupsApi());
    } catch (error) {
      console.error("ADMIN_GROUPS_ERROR", error);
      if (error?.status === 401 || error?.message === "Unauthorized") {
        logoutAdmin();
        window.location.href = "/admin/login";
        return;
      }
      setApiError(error?.message || "Cannot load product groups.");
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

  async function save() {
    try {
      if (draft.id) await updateAdminGroupApi(draft.id, draft);
      else await createAdminGroupApi(draft);
      setDrawerOpen(false);
      await reload();
    } catch (error) {
      alert(error?.message || "Save product group failed.");
    }
  }

  async function remove(item) {
    if (!window.confirm(`Ẩn nhóm ${item.nameVi}?`)) return;
    await deleteAdminGroupApi(item.id);
    await reload();
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Product Management"
        title="Product Groups"
        desc="Quản lý nhóm hiển thị như Hàng mới về, Hàng order, Hàng bán chạy, Hàng sale."
        action={
          <button onClick={openCreate} className="rounded-md bg-blue-700 px-4 py-2 text-xs font-black text-white hover:bg-blue-800">
            <Plus size={15} className="mr-1 inline" />
            Create group
          </button>
        }
      />

      <section className="mb-4 rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
        PostgreSQL Product Groups · {loading ? "Loading..." : `${rows.length} groups`}
      </section>

      {apiError && <section className="mb-4 rounded-3xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">{apiError}</section>}

      <section className="mb-4 rounded-md border border-slate-200 bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="flex items-center rounded-md border border-slate-300 bg-white px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent px-2 text-sm outline-none" placeholder="Tìm nhóm sản phẩm..." />
          </div>
          <button onClick={() => void reload()} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
            <RefreshCcw size={15} className="mr-1 inline" />
            Refresh
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Actions</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Group</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3 text-right">Products</th>
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
                <td className="px-4 py-3 font-black text-blue-700">{item.code}</td>
                <td className="px-4 py-3">
                  <div className="font-black text-slate-950">{item.nameVi}</div>
                  <div className="text-xs text-slate-500">{item.nameEn}</div>
                </td>
                <td className="px-4 py-3 text-slate-500">{item.slug}</td>
                <td className="px-4 py-3 text-right font-black">{item.products?.length || 0}</td>
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

      <AdminDrawer open={drawerOpen} title={draft.id ? "Edit group" : "Create group"} subtitle="PostgreSQL product group" onClose={() => setDrawerOpen(false)} onSave={save} saveLabel="Save group">
        <div className="grid gap-5 md:grid-cols-2">
          <AdminTextField label="Tên VI" required value={draft.nameVi} onChange={(v) => patch("nameVi", v)} />
          <AdminTextField label="Tên EN" value={draft.nameEn} onChange={(v) => patch("nameEn", v)} />
          <AdminTextField label="Code" required value={draft.code} onChange={(v) => patch("code", makeCode(v))} />
          <AdminTextField label="Slug" required value={draft.slug} onChange={(v) => patch("slug", makeSlug(v))} />
          <AdminTextField label="Sort order" type="number" value={draft.sortOrder} onChange={(v) => patch("sortOrder", v)} />
          <AdminToggle label="Active" checked={draft.active !== false} onChange={(v) => patch("active", v)} />
          <div className="md:col-span-2">
            <AdminTextarea label="Mô tả" rows={4} value={draft.description} onChange={(v) => patch("description", v)} />
          </div>
        </div>
      </AdminDrawer>
    </>
  );
}
