import { useEffect, useMemo, useState } from "react";
import { Edit3, Plus, Search, Trash2, Zap } from "lucide-react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import { AdminTextField, AdminToggle } from "../../components/admin/AdminField";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { formatCurrency } from "../../utils/format";
import { logoutAdmin } from "../../services/AdminAuthService";
import { getAdminProductsFromApi } from "../../services/AdminProductApiService";
import useToast from "../../hooks/useToast";
import Toast from "../../utils/Toast";
import {
  createAdminFlashSaleApi,
  deleteAdminFlashSaleApi,
  getAdminFlashSalesApi,
  setAdminFlashSaleItemsApi,
  updateAdminFlashSaleApi,
} from "../../services/AdminFlashSaleApiService";

function todayDateInput() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toDateInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateDisplay(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("vi-VN");
}

const STATUS_STYLES = {
  LIVE: "bg-emerald-50 text-emerald-700",
  UPCOMING: "bg-amber-50 text-amber-700",
  ENDED: "bg-slate-100 text-slate-500",
  INACTIVE: "bg-slate-100 text-slate-400",
};

function getProductSellingPrice(product = {}) {
  return Number(product.finalPrice || product.effectivePrice || product.price || 0);
}

function getPromotionValidationErrors(draft = {}) {
  const errors = [];

  if (!draft.nameVi?.trim()) errors.push("Tên campaign (VI) là bắt buộc.");
  if (!draft.dateFrom) errors.push("Ngày bắt đầu là bắt buộc.");
  if (!draft.dateTo) errors.push("Ngày kết thúc là bắt buộc.");
  if (draft.dateFrom && draft.dateTo && draft.dateTo < draft.dateFrom) {
    errors.push("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.");
  }
  if (!draft.dailyStartTime) errors.push("Giờ mở bán hàng ngày là bắt buộc.");
  if (!draft.dailyEndTime) errors.push("Giờ đóng bán hàng ngày là bắt buộc.");
  if (draft.dailyStartTime && draft.dailyEndTime && draft.dailyEndTime <= draft.dailyStartTime) {
    errors.push("Giờ đóng bán phải sau giờ mở bán (chưa hỗ trợ khung giờ qua đêm).");
  }

  const items = Array.isArray(draft.items) ? draft.items : [];
  items.forEach((item) => {
    if (!(Number(item.flashPrice) > 0)) {
      errors.push(`Sản phẩm ${item.sku || item.productId} cần nhập giá Flash Sale > 0.`);
    }
  });

  return Array.from(new Set(errors));
}

const emptyDraft = {
  id: "",
  nameVi: "",
  nameEn: "",
  dateFrom: todayDateInput(),
  dateTo: todayDateInput(),
  dailyStartTime: "09:00",
  dailyEndTime: "21:00",
  active: true,
  items: [],
};

export default function AdminFlashSales() {
  const { toast, notify, dismiss } = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  async function reload() {
    setLoading(true);
    setApiError("");

    try {
      const [campaignRows, productRows] = await Promise.all([
        getAdminFlashSalesApi(),
        getAdminProductsFromApi(),
      ]);

      setCampaigns(campaignRows || []);
      setProducts(productRows || []);
    } catch (error) {
      console.error("ADMIN_FLASH_SALES_ERROR", error);

      if (error?.status === 401 || error?.message === "Unauthorized") {
        logoutAdmin();
        window.location.href = "/admin/login";
        return;
      }

      setApiError(error?.message || "Cannot load flash sale campaigns.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return campaigns.filter((item) =>
      !q ||
      [
        item.nameVi,
        item.nameEn,
        ...(item.items || []).map((link) => link.product?.sku),
        ...(item.items || []).map((link) => link.product?.nameVi),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [campaigns, query]);

  const summary = useMemo(() => {
    return {
      total: campaigns.length,
      live: campaigns.filter((item) => item.status === "LIVE").length,
      upcoming: campaigns.filter((item) => item.status === "UPCOMING").length,
      items: campaigns.reduce((sum, item) => sum + Number(item.items?.length || 0), 0),
    };
  }, [campaigns]);

  const validationErrors = useMemo(() => getPromotionValidationErrors(draft), [draft]);

  function patch(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function toggleProduct(product) {
    setDraft((prev) => {
      const items = Array.isArray(prev.items) ? prev.items : [];
      const exists = items.some((item) => item.productId === product.id);

      const nextItems = exists
        ? items.filter((item) => item.productId !== product.id)
        : [
            ...items,
            {
              productId: product.id,
              sku: product.sku,
              nameVi: product.nameVi,
              flashPrice: getProductSellingPrice(product),
              dailyStockLimit: "",
            },
          ];

      return { ...prev, items: nextItems };
    });
  }

  function updateItem(productId, field, value) {
    setDraft((prev) => ({
      ...prev,
      items: (prev.items || []).map((item) =>
        item.productId === productId ? { ...item, [field]: value } : item
      ),
    }));
  }

  function openCreate() {
    setDraft(emptyDraft);
    setDrawerOpen(true);
  }

  function openEdit(item) {
    setDraft({
      ...emptyDraft,
      ...item,
      dateFrom: toDateInput(item.dateFrom),
      dateTo: toDateInput(item.dateTo),
      items: (item.items || []).map((link) => ({
        productId: link.productId,
        sku: link.product?.sku,
        nameVi: link.product?.nameVi,
        flashPrice: Number(link.flashPrice || 0),
        dailyStockLimit: link.dailyStockLimit ?? "",
      })),
    });
    setDrawerOpen(true);
  }

  async function save() {
    const errors = getPromotionValidationErrors(draft);

    if (errors.length) {
      notify("error", errors.join("\n"));
      return;
    }

    setSaving(true);

    try {
      const payload = {
        nameVi: draft.nameVi,
        nameEn: draft.nameEn,
        dateFrom: draft.dateFrom,
        dateTo: draft.dateTo,
        dailyStartTime: draft.dailyStartTime,
        dailyEndTime: draft.dailyEndTime,
        active: draft.active !== false,
      };

      const campaign = draft.id
        ? await updateAdminFlashSaleApi(draft.id, payload)
        : await createAdminFlashSaleApi(payload);

      const campaignId = campaign?.id || draft.id;
      const items = (draft.items || []).map((item) => ({
        productId: item.productId,
        flashPrice: Number(item.flashPrice) || 0,
        dailyStockLimit: item.dailyStockLimit === "" || item.dailyStockLimit == null
          ? null
          : Number(item.dailyStockLimit),
      }));

      await setAdminFlashSaleItemsApi(campaignId, items);

      setDrawerOpen(false);
      await reload();
      notify("success", "Đã lưu Flash Sale campaign.");
    } catch (error) {
      const detail = error?.data?.detail;
      if (detail?.conflictingCampaignName) {
        notify(
          "error",
          `Trùng khung giờ với campaign "${detail.conflictingCampaignName}" đang active cho cùng sản phẩm. Đổi ngày/giờ hoặc bỏ bớt sản phẩm trùng.`
        );
      } else {
        notify("error", error?.message || "Save flash sale campaign failed.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(item) {
    if (!window.confirm(`Xóa hẳn campaign "${item.nameVi}"? Toàn bộ sản phẩm gán trong campaign này sẽ bị xóa theo.`)) return;

    try {
      await deleteAdminFlashSaleApi(item.id);
      await reload();
    } catch (error) {
      notify("error", error?.message || "Delete flash sale campaign failed.");
    }
  }

  return (
    <>
      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={dismiss} />
      <AdminPageHeader
        eyebrow="Pricing & Promotion"
        title="Flash Sale"
        desc="Quản lý các đợt Flash Sale độc lập với Khuyến mãi — mỗi campaign có khung ngày + khung giờ hàng ngày riêng, giá Flash Sale và giới hạn số lượng/ngày theo từng sản phẩm."
        action={
          <button onClick={openCreate} className="rounded-md bg-blue-700 px-4 py-2 text-xs font-black text-white hover:bg-blue-800">
            <Plus size={15} className="mr-1 inline" />
            Tạo campaign
          </button>
        }
      />

      {/* key forces a fresh DOM subtree once campaigns load — the legacy
          auto-translate MutationObserver caches a text node's first-seen
          value and keeps re-applying it, so an in-place "0" -> "1" update
          gets silently reverted without a fresh node (see ShopStatsBar). */}
      <section key={loading ? "loading" : "loaded"} className="mb-4 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Campaigns</p>
          <p className="mt-2 text-2xl font-black">{summary.total}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Đang LIVE</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">{summary.live}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Sắp mở (UPCOMING)</p>
          <p className="mt-2 text-2xl font-black text-amber-600">{summary.upcoming}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Product links</p>
          <p className="mt-2 text-2xl font-black text-blue-600">{summary.items}</p>
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
            placeholder="Tìm campaign, sản phẩm..."
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Actions</th>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Khung ngày</th>
                <th className="px-4 py-3">Khung giờ hàng ngày</th>
                <th className="px-4 py-3 text-right">Sản phẩm</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm font-bold text-slate-400">Đang tải...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm font-bold text-slate-400">Chưa có campaign nào.</td>
                </tr>
              ) : (
                rows.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100 align-top hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(item)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                          <Edit3 size={14} className="mr-1 inline" />
                          Edit
                        </button>
                        <button onClick={() => void remove(item)} className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-black text-slate-950">{item.nameVi}</div>
                      {item.nameEn && <div className="text-xs text-slate-500">{item.nameEn}</div>}
                      {!item.active && <div className="mt-1 text-[11px] font-black text-slate-400">TẮT (inactive)</div>}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {formatDateDisplay(item.dateFrom)} → {formatDateDisplay(item.dateTo)}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {item.dailyStartTime} – {item.dailyEndTime}
                    </td>

                    <td className="px-4 py-3 text-right font-black">{item.items?.length || 0}</td>

                    <td className="px-4 py-3">
                      <div className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black ${STATUS_STYLES[item.status] || "bg-slate-100 text-slate-500"}`}>
                        {item.status || (item.active ? "SCHEDULED/ENDED" : "INACTIVE")}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AdminDrawer
        open={drawerOpen}
        title={draft.id ? "Sửa Flash Sale campaign" : "Tạo Flash Sale campaign"}
        subtitle="Flash Sale campaign"
        onClose={() => setDrawerOpen(false)}
        onSave={saving ? undefined : save}
        saveLabel={saving ? "Đang lưu..." : "Lưu campaign"}
      >
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <AdminTextField label="Tên campaign VI" required value={draft.nameVi} onChange={(value) => patch("nameVi", value)} />
            <AdminTextField label="Tên campaign EN" value={draft.nameEn} onChange={(value) => patch("nameEn", value)} />
            <AdminTextField label="Từ ngày" required type="date" value={draft.dateFrom} onChange={(value) => patch("dateFrom", value)} />
            <AdminTextField label="Đến ngày" required type="date" value={draft.dateTo} onChange={(value) => patch("dateTo", value)} />
            <AdminTextField label="Giờ mở bán hàng ngày" required type="time" value={draft.dailyStartTime} onChange={(value) => patch("dailyStartTime", value)} />
            <AdminTextField label="Giờ đóng bán hàng ngày" required type="time" value={draft.dailyEndTime} onChange={(value) => patch("dailyEndTime", value)} />
          </div>

          <AdminToggle label="Active" checked={draft.active !== false} onChange={(value) => patch("active", value)} />

          {validationErrors.length > 0 && (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-xs font-bold leading-5 text-red-700">
              {validationErrors.map((error) => (
                <div key={error}>• {error}</div>
              ))}
            </div>
          )}

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-1 flex items-center gap-2 text-sm font-black text-slate-800">
              <Zap size={16} className="text-amber-500" />
              Sản phẩm áp dụng &amp; giá Flash Sale
            </div>
            <p className="mb-3 text-xs font-semibold text-slate-500">
              Chọn sản phẩm rồi nhập giá Flash Sale riêng. Giới hạn số lượng/ngày để bỏ trống nếu không muốn hiện thanh "Đã bán X".
            </p>
            <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
              {products.map((product) => {
                const selectedItem = draft.items?.find((item) => item.productId === product.id);
                const checked = Boolean(selectedItem);

                return (
                  <div
                    key={product.id}
                    className={`rounded-2xl border px-4 py-3 transition ${
                      checked ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleProduct(product)}
                      className="flex w-full items-center justify-between text-left"
                    >
                      <div>
                        <div className="font-black text-slate-900">{product.nameVi}</div>
                        <div className="text-xs font-semibold text-slate-500">
                          {product.sku} · Giá bán {formatCurrency(getProductSellingPrice(product))}
                        </div>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-[11px] font-black ${checked ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-500"}`}>
                        {checked ? "SELECTED" : "ADD"}
                      </div>
                    </button>

                    {checked && (
                      <div className="mt-3 grid gap-3 border-t border-blue-100 pt-3 sm:grid-cols-2">
                        <AdminTextField
                          label="Giá Flash Sale"
                          required
                          type="number"
                          value={selectedItem.flashPrice}
                          onChange={(value) => updateItem(product.id, "flashPrice", value)}
                        />
                        <AdminTextField
                          label="Giới hạn số lượng/ngày"
                          tip="Bỏ trống = không giới hạn"
                          type="number"
                          value={selectedItem.dailyStockLimit}
                          onChange={(value) => updateItem(product.id, "dailyStockLimit", value)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </AdminDrawer>
    </>
  );
}
