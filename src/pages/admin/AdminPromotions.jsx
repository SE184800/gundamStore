import { useEffect, useMemo, useState } from "react";
import { Edit3, Plus, RefreshCcw, Search, Trash2 } from "lucide-react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import { AdminSelect, AdminTextarea, AdminTextField, AdminToggle } from "../../components/admin/AdminField";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { formatCurrency } from "../../utils/format";
import { logoutAdmin } from "../../services/AdminAuthService";
import { getAdminProductsFromApi } from "../../services/AdminProductApiService";
import {
  createAdminPromotionApi,
  deactivateAdminPromotionApi,
  getAdminPromotionsApi,
  updateAdminPromotionApi,
} from "../../services/AdminPromotionApiService";

const TYPE_OPTIONS = [
  { value: "PERCENT", label: "Giảm theo % / Percent" },
  { value: "FIXED", label: "Giảm số tiền / Fixed amount" },
];

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function toInputDate(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
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

function isActiveNow(row) {
  if (!row?.active) return false;

  const now = new Date();
  const start = new Date(row.startDate);
  const end = row.endDate ? new Date(row.endDate) : null;

  return start <= now && (!end || now <= end);
}

const emptyDraft = {
  id: "",
  code: "",
  nameVi: "",
  nameEn: "",
  type: "PERCENT",
  value: 10,
  startDate: todayInput(),
  endDate: "",
  active: true,
  priority: 0,
  note: "",
  productIds: [],
};

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  async function reload() {
    setLoading(true);
    setApiError("");

    try {
      const [promotionRows, productRows] = await Promise.all([
        getAdminPromotionsApi(),
        getAdminProductsFromApi(),
      ]);

      setPromotions(promotionRows || []);
      setProducts(productRows || []);
    } catch (error) {
      console.error("ADMIN_PROMOTIONS_ERROR", error);

      if (error?.status === 401 || error?.message === "Unauthorized") {
        logoutAdmin();
        window.location.href = "/admin/login";
        return;
      }

      setApiError(error?.message || "Cannot load promotions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return promotions.filter((item) =>
      !q ||
      [
        item.code,
        item.nameVi,
        item.nameEn,
        item.type,
        item.note,
        ...(item.products || []).map((link) => link.product?.sku),
        ...(item.products || []).map((link) => link.product?.nameVi),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [promotions, query]);

  const summary = useMemo(() => {
    return {
      total: promotions.length,
      active: promotions.filter((item) => item.active !== false).length,
      effective: promotions.filter(isActiveNow).length,
      products: promotions.reduce((sum, item) => sum + Number(item.products?.length || 0), 0),
    };
  }, [promotions]);

  function patch(field, value) {
    setDraft((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "nameVi" && !prev.code) {
        next.code = makeCode(value);
      }

      return next;
    });
  }

  function toggleProduct(productId) {
    setDraft((prev) => {
      const current = Array.isArray(prev.productIds) ? prev.productIds : [];
      const next = current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId];

      return { ...prev, productIds: next };
    });
  }

  function openCreate() {
    setDraft(emptyDraft);
    setDrawerOpen(true);
  }

  function openEdit(item) {
    setDraft({
      ...emptyDraft,
      ...item,
      startDate: toInputDate(item.startDate),
      endDate: toInputDate(item.endDate),
      productIds: (item.products || []).map((link) => link.productId || link.product?.id).filter(Boolean),
    });
    setDrawerOpen(true);
  }

  async function save() {
    try {
      const payload = {
        code: draft.code,
        nameVi: draft.nameVi,
        nameEn: draft.nameEn,
        type: draft.type,
        value: Number(draft.value || 0),
        startDate: draft.startDate,
        endDate: draft.endDate,
        active: draft.active !== false,
        priority: Number(draft.priority || 0),
        note: draft.note,
        productIds: draft.productIds || [],
      };

      if (draft.id) {
        await updateAdminPromotionApi(draft.id, payload);
      } else {
        await createAdminPromotionApi(payload);
      }

      setDrawerOpen(false);
      await reload();
    } catch (error) {
      alert(error?.message || "Save promotion failed.");
    }
  }

  async function deactivate(item) {
    if (!window.confirm(`Ẩn khuyến mãi ${item.code}?`)) return;

    try {
      await deactivateAdminPromotionApi(item.id);
      await reload();
    } catch (error) {
      alert(error?.message || "Deactivate promotion failed.");
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Pricing & Promotion"
        title="Promotions"
        desc="Quản lý campaign giảm giá theo % hoặc số tiền cố định, áp dụng cho danh sách sản phẩm và tự hiển thị trên storefront khi còn hiệu lực."
        action={
          <button onClick={openCreate} className="rounded-md bg-blue-700 px-4 py-2 text-xs font-black text-white hover:bg-blue-800">
            <Plus size={15} className="mr-1 inline" />
            Create promotion
          </button>
        }
      />

      <section className="mb-4 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Promotions</p>
          <p className="mt-2 text-2xl font-black">{summary.total}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Active</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">{summary.active}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Effective now</p>
          <p className="mt-2 text-2xl font-black text-red-500">{summary.effective}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Product links</p>
          <p className="mt-2 text-2xl font-black text-blue-600">{summary.products}</p>
        </div>
      </section>

      {apiError && (
        <section className="mb-4 rounded-3xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          {apiError}
        </section>
      )}

      <section className="mb-4 rounded-md border border-slate-200 bg-white p-4">
        <div className="flex items-center rounded-md border border-slate-300 bg-white px-3 py-2">
          <Search size={16} className="text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent px-2 text-sm outline-none"
            placeholder="Tìm campaign, code, sản phẩm..."
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1300px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Actions</th>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Effective Date</th>
                <th className="px-4 py-3 text-right">Products</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 align-top hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(item)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                        <Edit3 size={14} className="mr-1 inline" />
                        Edit
                      </button>
                      <button onClick={() => void deactivate(item)} className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-black text-slate-950">{item.nameVi}</div>
                    <div className="text-xs font-bold text-blue-700">{item.code}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.note || "-"}</div>
                  </td>

                  <td className="px-4 py-3">
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600">
                      {item.type === "PERCENT" ? `${item.value}%` : formatCurrency(item.value)}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {toInputDate(item.startDate)} → {toInputDate(item.endDate) || "Không giới hạn"}
                  </td>

                  <td className="px-4 py-3 text-right font-black">{item.products?.length || 0}</td>

                  <td className="px-4 py-3">
                    <div className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black ${isActiveNow(item) ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {isActiveNow(item) ? "EFFECTIVE" : item.active ? "SCHEDULED/EXPIRED" : "INACTIVE"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Priority {item.priority || 0}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AdminDrawer
        open={drawerOpen}
        title={draft.id ? "Edit promotion" : "Create promotion"}
        subtitle="Promotion campaign"
        onClose={() => setDrawerOpen(false)}
        onSave={save}
        saveLabel="Save promotion"
      >
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <AdminTextField label="Tên campaign VI" required value={draft.nameVi} onChange={(value) => patch("nameVi", value)} />
            <AdminTextField label="Tên campaign EN" value={draft.nameEn} onChange={(value) => patch("nameEn", value)} />
            <AdminTextField label="Code" required value={draft.code} onChange={(value) => patch("code", makeCode(value))} />
            <AdminSelect label="Loại giảm giá" options={TYPE_OPTIONS} value={draft.type} onChange={(value) => patch("type", value)} />
            <AdminTextField label={draft.type === "PERCENT" ? "Giá trị %" : "Số tiền giảm"} type="number" value={draft.value} onChange={(value) => patch("value", value)} />
            <AdminTextField label="Priority" type="number" value={draft.priority} onChange={(value) => patch("priority", value)} />
            <AdminTextField label="Từ ngày" type="date" value={draft.startDate} onChange={(value) => patch("startDate", value)} />
            <AdminTextField label="Đến ngày" type="date" value={draft.endDate} onChange={(value) => patch("endDate", value)} />
          </div>

          <AdminToggle label="Active" checked={draft.active !== false} onChange={(value) => patch("active", value)} />

          <AdminTextarea label="Ghi chú" rows={3} value={draft.note} onChange={(value) => patch("note", value)} />

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 text-sm font-black text-slate-800">Sản phẩm áp dụng</div>
            <div className="max-h-[360px] space-y-2 overflow-auto pr-1">
              {products.map((product) => {
                const checked = draft.productIds?.includes(product.id);

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => toggleProduct(product.id)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      checked
                        ? "border-blue-200 bg-blue-50 text-blue-800"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="font-black">{product.nameVi}</div>
                      <div className="text-xs font-semibold text-slate-500">
                        {product.sku} · Price {formatCurrency(product.price || 0)}
                      </div>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-[11px] font-black ${checked ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-500"}`}>
                      {checked ? "SELECTED" : "ADD"}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </AdminDrawer>
    </>
  );
}
