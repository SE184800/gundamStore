import { useEffect, useMemo, useState } from "react";
import { Edit3, Plus, RefreshCcw, Search, Trash2 } from "lucide-react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import { AdminTextarea, AdminTextField, AdminToggle } from "../../components/admin/AdminField";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { logoutAdmin } from "../../services/AdminAuthService";
import useToast from "../../hooks/useToast";
import Toast from "../../utils/Toast";
import {
  createAdminShippingMethodApi,
  deleteAdminShippingMethodApi,
  listAdminShippingMethodsApi,
  updateAdminShippingMethodApi,
} from "../../services/AdminShippingApiService";

const empty = {
  id: "",
  code: "",
  nameVi: "",
  nameEn: "",
  descVi: "",
  descEn: "",
  fee: 0,
  sortOrder: 0,
  active: true,
};

function makeCode(value = "") {
  return String(value || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function money(value) {
  return (Number(value) || 0).toLocaleString("vi-VN") + "đ";
}

export default function AdminShipping() {
  const { toast, notify, dismiss } = useToast();
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
      setRows(await listAdminShippingMethodsApi());
    } catch (error) {
      console.error("ADMIN_SHIPPING_METHODS_ERROR", error);
      if (error?.status === 401 || error?.message === "Unauthorized") {
        logoutAdmin();
        window.location.href = "/admin/login";
        return;
      }
      setApiError(error?.message || "Cannot load shipping methods.");
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
      [item.code, item.nameVi, item.nameEn, item.descVi, item.descEn]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, query]);

  function patch(field, value) {
    setDraft((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "nameVi" && !prev.code) next.code = makeCode(value);
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
      if (draft.id) await updateAdminShippingMethodApi(draft.id, draft);
      else await createAdminShippingMethodApi(draft);
      setDrawerOpen(false);
      await reload();
      notify("success", "Đã lưu phương thức vận chuyển.");
    } catch (error) {
      notify("error", error?.message || "Save shipping method failed.");
    }
  }

  async function remove(item) {
    if (!window.confirm(`Xóa phương thức "${item.nameVi}"?`)) return;
    try {
      await deleteAdminShippingMethodApi(item.id);
      await reload();
      notify("success", "Đã xóa phương thức vận chuyển.");
    } catch (error) {
      if (error?.status === 409) {
        const detail = error?.data?.message || error?.message || "Phương thức này đang được đơn hàng sử dụng.";
        notify("error", `${detail} Vui lòng dùng nút "Tắt Active" (Edit → Active = off) thay vì xóa.`);
        return;
      }
      notify("error", error?.message || "Delete shipping method failed.");
    }
  }

  return (
    <>
      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={dismiss} />
      <AdminPageHeader
        eyebrow="Order Management"
        title="Shipping Methods"
        desc="Quản lý phương thức và phí vận chuyển hiển thị ở giỏ hàng/thanh toán."
        action={
          <button onClick={openCreate} className="rounded-md bg-blue-700 px-4 py-2 text-xs font-black text-white hover:bg-blue-800">
            <Plus size={15} className="mr-1 inline" />
            Create method
          </button>
        }
      />

      <section className="mb-4 rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
        PostgreSQL Shipping Methods · {loading ? "Loading..." : `${rows.length} methods`}
      </section>

      {apiError && <section className="mb-4 rounded-3xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">{apiError}</section>}

      <section className="mb-4 rounded-md border border-slate-200 bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="flex items-center rounded-md border border-slate-300 bg-white px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent px-2 text-sm outline-none" placeholder="Tìm phương thức vận chuyển..." />
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
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3 text-right">Fee</th>
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
                  <div className="text-xs text-slate-500">{item.descVi}</div>
                </td>
                <td className="px-4 py-3 text-right font-black">{money(item.fee)}</td>
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

      <AdminDrawer open={drawerOpen} title={draft.id ? "Edit method" : "Create method"} subtitle="Shipping method" onClose={() => setDrawerOpen(false)} onSave={save} saveLabel="Save method">
        <div className="grid gap-5 md:grid-cols-2">
          <AdminTextField label="Tên VI" required value={draft.nameVi} onChange={(v) => patch("nameVi", v)} />
          <AdminTextField label="Tên EN" value={draft.nameEn} onChange={(v) => patch("nameEn", v)} />
          <AdminTextField label="Code" required value={draft.code} onChange={(v) => patch("code", makeCode(v))} />
          <AdminTextField label="Phí vận chuyển (đ)" type="number" required value={draft.fee} onChange={(v) => patch("fee", v)} />
          <AdminTextField label="Sort order" type="number" value={draft.sortOrder} onChange={(v) => patch("sortOrder", v)} />
          <AdminToggle label="Active" checked={draft.active !== false} onChange={(v) => patch("active", v)} />
          <AdminTextarea label="Mô tả VI" rows={3} value={draft.descVi} onChange={(v) => patch("descVi", v)} />
          <AdminTextarea label="Mô tả EN" rows={3} value={draft.descEn} onChange={(v) => patch("descEn", v)} />
        </div>
      </AdminDrawer>
    </>
  );
}
