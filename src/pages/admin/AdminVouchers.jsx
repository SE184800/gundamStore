import { useEffect, useMemo, useState } from "react";
import { Edit3, Plus, RefreshCcw, Search, Trash2 } from "lucide-react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import { AdminSelect, AdminTextarea, AdminTextField, AdminToggle } from "../../components/admin/AdminField";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { formatCurrency } from "../../utils/format";
import useToast from "../../hooks/useToast";
import Toast from "../../utils/Toast";
import {
  createAdminVoucherApi,
  deactivateAdminVoucherApi,
  getAdminVouchersApi,
  updateAdminVoucherApi,
} from "../../services/AdminVoucherApiService";

const emptyDraft = {
  id: "",
  code: "",
  nameVi: "",
  nameEn: "",
  description: "",
  type: "PERCENT",
  value: 10,
  maxDiscount: 0,
  minOrder: 0,
  usageLimit: 0,
  usageLimitPerCustomer: 0,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
  active: true,
  stackable: false,
  firstOrderOnly: false,
  productIdsText: "",
  categoryIdsText: "",
  note: "",
};

const TYPE_OPTIONS = [
  { value: "PERCENT", label: "Percent discount" },
  { value: "AMOUNT", label: "Fixed amount" },
  { value: "FREESHIP", label: "Free shipping" },
];

function listToText(value) {
  if (!value) return "";
  if (Array.isArray(value)) return value.join("\n");
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.join("\n") : "";
  } catch {
    return "";
  }
}

function textToList(value = "") {
  return String(value || "")
    .split(/[\n,;]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeDraft(voucher = {}) {
  return {
    ...emptyDraft,
    ...voucher,
    startDate: voucher.startDate ? String(voucher.startDate).slice(0, 10) : emptyDraft.startDate,
    endDate: voucher.endDate ? String(voucher.endDate).slice(0, 10) : "",
    productIdsText: listToText(voucher.productIds),
    categoryIdsText: listToText(voucher.categoryIds),
  };
}

function buildPayload(draft = {}) {
  return {
    code: String(draft.code || "").trim().toUpperCase(),
    nameVi: draft.nameVi,
    nameEn: draft.nameEn || draft.nameVi,
    description: draft.description || "",
    type: draft.type,
    value: Number(draft.value || 0),
    maxDiscount: Number(draft.maxDiscount || 0),
    minOrder: Number(draft.minOrder || 0),
    usageLimit: Number(draft.usageLimit || 0),
    usageLimitPerCustomer: Number(draft.usageLimitPerCustomer || 0),
    startDate: draft.startDate,
    endDate: draft.endDate || "",
    active: draft.active !== false,
    stackable: draft.stackable === true,
    firstOrderOnly: draft.firstOrderOnly === true,
    productIds: textToList(draft.productIdsText),
    categoryIds: textToList(draft.categoryIdsText),
    note: draft.note || "",
  };
}

function isEffective(voucher = {}) {
  const now = new Date();
  const start = voucher.startDate ? new Date(voucher.startDate) : null;
  const end = voucher.endDate ? new Date(voucher.endDate) : null;
  return voucher.active !== false && (!start || start <= now) && (!end || now <= end);
}

export default function AdminVouchers() {
  const { toast, notify, dismiss } = useToast();
  const [vouchers, setVouchers] = useState([]);
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  async function reload() {
    setLoading(true);
    setApiError("");

    try {
      const rows = await getAdminVouchersApi();
      setVouchers(rows);
    } catch (error) {
      setApiError(error?.message || "Không tải được danh sách voucher.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vouchers.filter((item) => {
      const haystack = [item.code, item.nameVi, item.nameEn, item.type, item.note]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return !q || haystack.includes(q);
    });
  }, [vouchers, query]);

  const summary = useMemo(() => {
    return {
      total: vouchers.length,
      active: vouchers.filter((item) => item.active !== false).length,
      effective: vouchers.filter(isEffective).length,
      used: vouchers.reduce((sum, item) => sum + Number(item.usedCount || 0), 0),
    };
  }, [vouchers]);

  function patch(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function openCreate() {
    setDraft(emptyDraft);
    setDrawerOpen(true);
  }

  function openEdit(item) {
    setDraft(normalizeDraft(item));
    setDrawerOpen(true);
  }

  async function save() {
    try {
      const payload = buildPayload(draft);

      if (payload.type === "PERCENT" && payload.value > 100) {
        notify("error", "Percent cannot exceed 100%.");
        return;
      }

      if (draft.id) {
        await updateAdminVoucherApi(draft.id, payload);
      } else {
        await createAdminVoucherApi(payload);
      }

      setDrawerOpen(false);
      await reload();
    } catch (error) {
      notify("error", error?.message || "Lưu voucher thất bại.");
    }
  }

  async function deactivate(item) {
    if (!window.confirm(`Deactivate voucher ${item.code}?`)) return;

    try {
      await deactivateAdminVoucherApi(item.id);
      await reload();
    } catch (error) {
      notify("error", error?.message || "Vô hiệu hóa voucher thất bại.");
    }
  }

  return (
    <>
      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={dismiss} />
      <AdminPageHeader
        eyebrow="Commercial Management"
        title="Vouchers / Coupons"
        desc="Manage DB vouchers for checkout: percent, fixed amount, free shipping, usage limits and effective dates."
        action={
          <button onClick={openCreate} className="rounded-md bg-blue-700 px-4 py-2 text-xs font-black text-white hover:bg-blue-800">
            <Plus size={15} className="mr-1 inline" />
            Create voucher
          </button>
        }
      />

      {apiError && (
        <section className="mb-4 rounded-3xl border border-red-100 bg-red-50 p-4 text-sm font-black text-red-700">
          {apiError}
        </section>
      )}

      <section className="mb-4 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">Total</p><p className="mt-2 text-2xl font-black">{summary.total}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">Active</p><p className="mt-2 text-2xl font-black text-emerald-600">{summary.active}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">Effective</p><p className="mt-2 text-2xl font-black text-blue-600">{summary.effective}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">Used</p><p className="mt-2 text-2xl font-black text-violet-600">{summary.used}</p></div>
      </section>

      <section className="mb-4 rounded-md border border-slate-200 bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="flex items-center rounded-md border border-slate-300 bg-white px-3">
            <Search size={16} className="text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search voucher code, name..."
              className="w-full bg-transparent px-3 py-3 text-sm font-semibold outline-none"
            />
          </div>
          <button onClick={() => void reload()} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">
            <RefreshCcw size={15} className="mr-1 inline" />
            Refresh
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Voucher</th>
                <th className="px-4 py-3">Rule</th>
                <th className="px-4 py-3">Limit</th>
                <th className="px-4 py-3">Effective</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="font-black text-slate-900">{item.code}</div>
                    <div className="text-xs font-bold text-slate-500">{item.nameVi}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-black">{item.type}</div>
                    <div className="text-xs text-slate-500">
                      {item.type === "PERCENT" ? `${item.value}%` : formatCurrency(item.value)}
                      {item.maxDiscount > 0 ? ` · Cap ${formatCurrency(item.maxDiscount)}` : ""}
                    </div>
                    <div className="text-xs text-slate-500">Min {formatCurrency(item.minOrder)}</div>
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-600">
                    Total: {item.usageLimit || "∞"}<br />
                    Per customer: {item.usageLimitPerCustomer || "∞"}
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-600">
                    {String(item.startDate || "").slice(0, 10)}
                    <br />
                    {item.endDate ? String(item.endDate).slice(0, 10) : "No end date"}
                  </td>
                  <td className="px-4 py-3 font-black">{item.usedCount || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${isEffective(item) ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {isEffective(item) ? "Effective" : item.active ? "Scheduled/Expired" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(item)} className="rounded-md border px-3 py-2 text-xs font-bold hover:bg-slate-50">
                        <Edit3 size={14} className="mr-1 inline" /> Edit
                      </button>
                      <button onClick={() => void deactivate(item)} className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!rows.length && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm font-bold text-slate-400">{loading ? "Loading..." : "No vouchers found."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AdminDrawer
        open={drawerOpen}
        title={draft.id ? "Edit voucher" : "Create voucher"}
        onClose={() => setDrawerOpen(false)}
        onSave={() => void save()}
        saveLabel="Save voucher"
        width="max-w-3xl"
      >
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <AdminTextField label="Code" required value={draft.code} onChange={(value) => patch("code", String(value).toUpperCase())} />
            <AdminSelect label="Type" options={TYPE_OPTIONS} value={draft.type} onChange={(value) => patch("type", value)} />
            <AdminTextField label="Name VI" required value={draft.nameVi} onChange={(value) => patch("nameVi", value)} />
            <AdminTextField label="Name EN" value={draft.nameEn} onChange={(value) => patch("nameEn", value)} />
            <AdminTextField label={draft.type === "PERCENT" ? "Value (%)" : "Value (đ)"} type="number" value={draft.value} onChange={(value) => patch("value", value)} />
            <AdminTextField label="Max discount / shipping cap" type="number" value={draft.maxDiscount} onChange={(value) => patch("maxDiscount", value)} />
            <AdminTextField label="Min order" type="number" value={draft.minOrder} onChange={(value) => patch("minOrder", value)} />
            <AdminTextField label="Usage limit" type="number" value={draft.usageLimit} onChange={(value) => patch("usageLimit", value)} />
            <AdminTextField label="Usage per customer" type="number" value={draft.usageLimitPerCustomer} onChange={(value) => patch("usageLimitPerCustomer", value)} />
            <AdminTextField label="Start date" type="date" value={draft.startDate} onChange={(value) => patch("startDate", value)} />
            <AdminTextField label="End date" type="date" value={draft.endDate} onChange={(value) => patch("endDate", value)} />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <AdminToggle label="Active" checked={draft.active !== false} onChange={(value) => patch("active", value)} />
            <AdminToggle label="Stackable" checked={draft.stackable === true} onChange={(value) => patch("stackable", value)} />
            <AdminToggle label="First order only" checked={draft.firstOrderOnly === true} onChange={(value) => patch("firstOrderOnly", value)} />
          </div>

          <AdminTextarea label="Product IDs allowlist (optional, one per line)" rows={3} value={draft.productIdsText} onChange={(value) => patch("productIdsText", value)} />
          <AdminTextarea label="Category IDs allowlist (optional, one per line)" rows={3} value={draft.categoryIdsText} onChange={(value) => patch("categoryIdsText", value)} />
          <AdminTextarea label="Description" rows={3} value={draft.description} onChange={(value) => patch("description", value)} />
          <AdminTextarea label="Internal note" rows={3} value={draft.note} onChange={(value) => patch("note", value)} />
        </div>
      </AdminDrawer>
    </>
  );
}
