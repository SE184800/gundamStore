import { useEffect, useMemo, useState } from "react";
import { Edit3, Eye, Plus, Save, Search, Trash2, X, Zap } from "lucide-react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import { AdminSelect, AdminTextField, AdminToggle } from "../../components/admin/AdminField";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { formatCurrency } from "../../utils/format";
import { logoutAdmin } from "../../services/AdminAuthService";
import { getAdminProductsFromApi } from "../../services/AdminProductApiService";
import { getAdminCategoriesApi } from "../../services/AdminCatalogApiService";
import useToast from "../../hooks/useToast";
import Toast from "../../utils/Toast";
import {
  bulkGenerateAdminFlashSaleItemsApi,
  createAdminFlashSaleApi,
  deleteAdminFlashSaleApi,
  deleteAdminFlashSaleItemApi,
  getAdminFlashSalesApi,
  patchAdminFlashSaleItemApi,
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

const DISCOUNT_METHOD_OPTIONS = [
  { value: "FIXED_PRICE", label: "Đồng giá" },
  { value: "PERCENT", label: "Giảm theo %" },
  { value: "AMOUNT", label: "Giảm số tiền cố định" },
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

// Native <input type="time"> renders AM/PM based on the browser/OS locale —
// the `lang` attribute doesn't reliably override that picker widget across
// browsers. Two plain <select>s sidestep the native picker entirely so the
// admin always sees 24h (00-23), regardless of their machine's locale.
function TimeSelect({ value, onChange }) {
  const [hh, mm] = (value || "00:00").split(":");

  return (
    <div className="flex items-center gap-1">
      <select
        value={hh || "00"}
        onChange={(event) => onChange(`${event.target.value}:${mm || "00"}`)}
        className="rounded-md border border-slate-300 px-2 py-2 text-sm font-semibold outline-none focus:border-blue-500"
      >
        {HOUR_OPTIONS.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span className="text-slate-400">:</span>
      <select
        value={mm || "00"}
        onChange={(event) => onChange(`${hh || "00"}:${event.target.value}`)}
        className="rounded-md border border-slate-300 px-2 py-2 text-sm font-semibold outline-none focus:border-blue-500"
      >
        {MINUTE_OPTIONS.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  );
}

const SELECTOR_MODE_OPTIONS = [
  { value: "ALL", label: "Tất cả sản phẩm", desc: "Áp dụng cho toàn bộ sản phẩm đang active." },
  { value: "CATEGORY", label: "Theo danh mục", desc: "Chọn 1 hoặc nhiều danh mục — mọi sản phẩm active thuộc các danh mục này sẽ được áp dụng." },
  { value: "SPECIFIC", label: "Chọn cụ thể", desc: "Tìm kiếm và tick chọn từng sản phẩm." },
];

function computeFinalPrice(discountType, discountValue, sellingPrice) {
  const value = Number(discountValue) || 0;

  if (discountType === "PERCENT") {
    return Math.max(0, Math.round(sellingPrice * (1 - Math.min(Math.max(value, 0), 100) / 100)));
  }
  if (discountType === "AMOUNT") {
    return Math.max(0, sellingPrice - value);
  }
  return value;
}

function windowsOverlap(a, b) {
  return a.dailyStartTime < b.dailyEndTime && b.dailyStartTime < a.dailyEndTime;
}

function getWindowValidationErrors(windows = []) {
  const errors = [];

  windows.forEach((w, idx) => {
    if (!w.dailyStartTime || !w.dailyEndTime) {
      errors.push(`Khung giờ #${idx + 1}: cần đủ giờ mở và giờ đóng bán.`);
    } else if (w.dailyEndTime <= w.dailyStartTime) {
      errors.push(`Khung giờ #${idx + 1}: giờ đóng bán phải sau giờ mở bán (chưa hỗ trợ khung qua đêm).`);
    }
  });

  for (let i = 0; i < windows.length; i += 1) {
    for (let j = i + 1; j < windows.length; j += 1) {
      if (windows[i].dailyStartTime && windows[j].dailyStartTime && windowsOverlap(windows[i], windows[j])) {
        errors.push(`Khung giờ #${i + 1} và #${j + 1} bị chồng giờ nhau.`);
      }
    }
  }

  return errors;
}

function getCampaignValidationErrors(draft = {}) {
  const errors = [];

  if (!draft.nameVi?.trim()) errors.push("Tên campaign (VI) là bắt buộc.");
  if (!draft.dateFrom) errors.push("Ngày bắt đầu là bắt buộc.");
  if (!draft.dateTo) errors.push("Ngày kết thúc là bắt buộc.");
  if (draft.dateFrom && draft.dateTo && draft.dateTo < draft.dateFrom) {
    errors.push("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.");
  }
  if (!draft.windows?.length) {
    errors.push("Cần ít nhất 1 khung giờ bán hàng ngày.");
  } else {
    errors.push(...getWindowValidationErrors(draft.windows));
  }

  return Array.from(new Set(errors));
}

function productMatchesSearch(product, search) {
  const q = String(search || "").trim().toLowerCase();
  if (!q) return true;

  return [product.nameVi, product.nameEn, product.sku, product.slug, product.brand, product.grade, product.scale]
    .filter(Boolean)
    .some((field) => String(field).toLowerCase().includes(q));
}

function getSelectorMatches(products = [], selector = {}) {
  return products.filter((product) => {
    if (product.active === false) return false;

    if (selector.mode === "CATEGORY") {
      if (!selector.categoryIds?.length) return false;
      if (!selector.categoryIds.includes(product.categoryId)) return false;
    }

    if (selector.mode === "SPECIFIC") {
      if (!selector.productIds?.includes(product.id)) return false;
    }

    if (selector.mode !== "SPECIFIC" && !productMatchesSearch(product, selector.search)) return false;

    return true;
  });
}

function emptyWindow() {
  return { dailyStartTime: "09:00", dailyEndTime: "21:00" };
}

const emptyDraft = {
  id: "",
  nameVi: "",
  nameEn: "",
  dateFrom: todayDateInput(),
  dateTo: todayDateInput(),
  windows: [emptyWindow()],
  active: true,
  items: [],
};

const emptySelector = { mode: "ALL", categoryIds: [], productIds: [], search: "" };
const emptyBulkConfig = { discountType: "FIXED_PRICE", discountValue: "", dailyStockLimit: "" };

export default function AdminFlashSales() {
  const { toast, notify, dismiss } = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [loading, setLoading] = useState(false);
  const [savingCore, setSavingCore] = useState(false);
  const [apiError, setApiError] = useState("");

  const [selector, setSelector] = useState(emptySelector);
  const [bulkConfig, setBulkConfig] = useState(emptyBulkConfig);
  const [previewItems, setPreviewItems] = useState(null);
  const [applying, setApplying] = useState(false);
  const [pickerFilter, setPickerFilter] = useState({ categoryId: "", search: "" });

  const [editingItemId, setEditingItemId] = useState("");
  const [editItemForm, setEditItemForm] = useState({});

  async function reload() {
    setLoading(true);
    setApiError("");

    try {
      const [campaignRows, productRows, categoryRows] = await Promise.all([
        getAdminFlashSalesApi(),
        getAdminProductsFromApi(),
        getAdminCategoriesApi(),
      ]);

      setCampaigns(campaignRows || []);
      setProducts(productRows || []);
      setCategories((categoryRows || []).filter((c) => c.active !== false));

      return campaignRows || [];
    } catch (error) {
      console.error("ADMIN_FLASH_SALES_ERROR", error);

      if (error?.status === 401 || error?.message === "Unauthorized") {
        logoutAdmin();
        window.location.href = "/admin/login";
        return [];
      }

      setApiError(error?.message || "Cannot load flash sale campaigns.");
      return [];
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

  const validationErrors = useMemo(() => getCampaignValidationErrors(draft), [draft]);

  const pickerProducts = useMemo(() => {
    return products.filter((product) => {
      if (product.active === false) return false;
      if (pickerFilter.categoryId && product.categoryId !== pickerFilter.categoryId) return false;
      if (!productMatchesSearch(product, pickerFilter.search)) return false;
      return true;
    });
  }, [products, pickerFilter]);

  function resetPickerState() {
    setSelector(emptySelector);
    setBulkConfig(emptyBulkConfig);
    setPreviewItems(null);
    setPickerFilter({ categoryId: "", search: "" });
    setEditingItemId("");
  }

  function patch(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setPreviewItems(null);
  }

  function addWindow() {
    setDraft((prev) => ({ ...prev, windows: [...(prev.windows || []), emptyWindow()] }));
  }

  function updateWindow(index, field, value) {
    setDraft((prev) => ({
      ...prev,
      windows: prev.windows.map((w, i) => (i === index ? { ...w, [field]: value } : w)),
    }));
  }

  function removeWindow(index) {
    setDraft((prev) => ({ ...prev, windows: prev.windows.filter((_, i) => i !== index) }));
  }

  function openCreate() {
    setDraft(emptyDraft);
    resetPickerState();
    setDrawerOpen(true);
  }

  function openEdit(item) {
    setDraft({
      ...emptyDraft,
      ...item,
      dateFrom: toDateInput(item.dateFrom),
      dateTo: toDateInput(item.dateTo),
      windows:
        Array.isArray(item.windows) && item.windows.length
          ? item.windows.map((w) => ({ dailyStartTime: w.dailyStartTime, dailyEndTime: w.dailyEndTime }))
          : [emptyWindow()],
      items: item.items || [],
    });
    resetPickerState();
    setDrawerOpen(true);
  }

  async function saveCampaignCore() {
    const errors = getCampaignValidationErrors(draft);

    if (errors.length) {
      notify("error", errors.join("\n"));
      return;
    }

    setSavingCore(true);

    try {
      const payload = {
        nameVi: draft.nameVi,
        nameEn: draft.nameEn,
        dateFrom: draft.dateFrom,
        dateTo: draft.dateTo,
        windows: draft.windows.map((w) => ({ dailyStartTime: w.dailyStartTime, dailyEndTime: w.dailyEndTime })),
        active: draft.active !== false,
      };

      const campaign = draft.id
        ? await updateAdminFlashSaleApi(draft.id, payload)
        : await createAdminFlashSaleApi(payload);

      const rows2 = await reload();
      const fresh = rows2.find((c) => c.id === campaign.id) || campaign;

      setDraft((prev) => ({ ...prev, id: fresh.id, items: fresh.items || [] }));
      notify("success", "Đã lưu thông tin campaign.");
    } catch (error) {
      const detail = error?.data?.detail;
      if (detail?.conflictingCampaignName) {
        notify(
          "error",
          `Trùng khung giờ với campaign "${detail.conflictingCampaignName}" đang active cho cùng sản phẩm. Đổi ngày/giờ hoặc bỏ bớt sản phẩm trùng.`
        );
      } else {
        notify("error", error?.message || "Lưu thông tin campaign thất bại.");
      }
    } finally {
      setSavingCore(false);
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

  function toggleCategoryId(categoryId) {
    setSelector((prev) => {
      const has = prev.categoryIds.includes(categoryId);
      return {
        ...prev,
        categoryIds: has ? prev.categoryIds.filter((id) => id !== categoryId) : [...prev.categoryIds, categoryId],
      };
    });
    setPreviewItems(null);
  }

  function toggleProductId(productId) {
    setSelector((prev) => {
      const has = prev.productIds.includes(productId);
      return {
        ...prev,
        productIds: has ? prev.productIds.filter((id) => id !== productId) : [...prev.productIds, productId],
      };
    });
    setPreviewItems(null);
  }

  function getBulkConfigErrors() {
    const errors = [];
    const value = Number(bulkConfig.discountValue) || 0;

    if (bulkConfig.discountType === "PERCENT") {
      if (!(value > 0 && value <= 100)) errors.push("% giảm phải trong khoảng 1-100.");
    } else if (bulkConfig.discountType === "AMOUNT") {
      if (!(value > 0)) errors.push("Số tiền giảm phải lớn hơn 0.");
    } else if (!(value > 0)) {
      errors.push("Giá đồng giá phải lớn hơn 0.");
    }

    if (selector.mode === "CATEGORY" && !selector.categoryIds.length) {
      errors.push("Chọn ít nhất 1 danh mục.");
    }
    if (selector.mode === "SPECIFIC" && !selector.productIds.length) {
      errors.push("Chọn ít nhất 1 sản phẩm.");
    }

    return errors;
  }

  function buildPreview() {
    const errors = getBulkConfigErrors();
    if (errors.length) {
      notify("error", errors.join("\n"));
      setPreviewItems(null);
      return;
    }

    const value = Number(bulkConfig.discountValue) || 0;
    const matches = getSelectorMatches(products, selector);

    if (!matches.length) {
      notify("error", "Không có sản phẩm active nào khớp điều kiện đã chọn.");
      setPreviewItems([]);
      return;
    }

    if (bulkConfig.discountType === "AMOUNT") {
      const violating = matches.find((p) => value >= getProductSellingPrice(p));
      if (violating) {
        notify(
          "error",
          `${violating.nameVi}: số tiền giảm không được vượt quá giá gốc (${formatCurrency(getProductSellingPrice(violating))}).`
        );
        return;
      }
    }

    setPreviewItems(
      matches.map((p) => ({
        productId: p.id,
        sku: p.sku,
        nameVi: p.nameVi,
        sellingPrice: getProductSellingPrice(p),
        finalPrice: computeFinalPrice(bulkConfig.discountType, value, getProductSellingPrice(p)),
      }))
    );
  }

  async function refreshDraftItems() {
    const rows2 = await reload();
    const fresh = rows2.find((c) => c.id === draft.id);
    setDraft((prev) => ({ ...prev, items: fresh?.items || [] }));
    return fresh;
  }

  async function applyBulk() {
    if (!draft.id) {
      notify("error", "Vui lòng lưu thông tin campaign trước khi áp dụng sản phẩm.");
      return;
    }

    if (!previewItems || !previewItems.length) {
      notify("error", "Vui lòng bấm Xem trước và kiểm tra danh sách trước khi áp dụng.");
      return;
    }

    setApplying(true);

    try {
      const value = Number(bulkConfig.discountValue) || 0;
      const payload = {
        selector: {
          mode: selector.mode,
          ...(selector.mode === "CATEGORY" ? { categoryIds: selector.categoryIds } : {}),
          ...(selector.mode === "SPECIFIC" ? { productIds: selector.productIds } : {}),
          ...(selector.mode !== "SPECIFIC" && selector.search ? { search: selector.search } : {}),
        },
        discountType: bulkConfig.discountType,
        discountValue: value,
        dailyStockLimit: bulkConfig.dailyStockLimit === "" ? null : Number(bulkConfig.dailyStockLimit),
      };

      const result = await bulkGenerateAdminFlashSaleItemsApi(draft.id, payload);

      notify(
        "success",
        `Đã áp dụng: ${result.createdCount || 0} sản phẩm mới, cập nhật ${result.updatedCount || 0} sản phẩm.`
      );

      await refreshDraftItems();
      setPreviewItems(null);
    } catch (error) {
      const detail = error?.data?.detail;
      if (detail?.conflictingCampaignName) {
        notify(
          "error",
          `Trùng khung giờ với campaign "${detail.conflictingCampaignName}" đang active cho ${detail.productIds?.length || 0} sản phẩm trong danh sách vừa chọn.`
        );
      } else {
        notify("error", error?.message || "Áp dụng hàng loạt thất bại.");
      }
    } finally {
      setApplying(false);
    }
  }

  function startEditItem(item) {
    setEditingItemId(item.id);
    setEditItemForm({
      discountType: item.discountType || "FIXED_PRICE",
      discountValue: String(Number(item.discountValue) || 0),
      dailyStockLimit: item.dailyStockLimit ?? "",
    });
  }

  async function saveEditItem(item) {
    try {
      const value = Number(editItemForm.discountValue) || 0;

      await patchAdminFlashSaleItemApi(draft.id, item.id, {
        discountType: editItemForm.discountType,
        discountValue: value,
        dailyStockLimit: editItemForm.dailyStockLimit === "" ? null : Number(editItemForm.dailyStockLimit),
      });

      await refreshDraftItems();
      setEditingItemId("");
      notify("success", "Đã cập nhật sản phẩm trong campaign.");
    } catch (error) {
      notify("error", error?.message || "Cập nhật sản phẩm thất bại.");
    }
  }

  async function removeItem(item) {
    if (!window.confirm(`Bỏ "${item.product?.nameVi || item.sku || item.productId}" khỏi campaign?`)) return;

    try {
      await deleteAdminFlashSaleItemApi(draft.id, item.id);
      await refreshDraftItems();
      notify("success", "Đã xóa sản phẩm khỏi campaign.");
    } catch (error) {
      notify("error", error?.message || "Xóa sản phẩm thất bại.");
    }
  }

  return (
    <>
      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={dismiss} />
      <AdminPageHeader
        eyebrow="Pricing & Promotion"
        title="Flash Sale"
        desc="Quản lý các đợt Flash Sale độc lập với Khuyến mãi — mỗi campaign có khung ngày + nhiều khung giờ hàng ngày, cấu hình giảm giá hàng loạt theo phạm vi sản phẩm."
        action={
          <button onClick={openCreate} className="rounded-md bg-blue-700 px-4 py-2 text-xs font-black text-white hover:bg-blue-800">
            <Plus size={15} className="mr-1 inline" />
            Tạo campaign
          </button>
        }
      />

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
                      {(item.windows || []).length
                        ? item.windows.map((w) => `${w.dailyStartTime}–${w.dailyEndTime}`).join(", ")
                        : `${item.dailyStartTime || "-"} – ${item.dailyEndTime || "-"}`}
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
        onSave={savingCore ? undefined : saveCampaignCore}
        saveLabel={savingCore ? "Đang lưu..." : "Lưu thông tin campaign"}
      >
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <AdminTextField label="Tên campaign VI" required value={draft.nameVi} onChange={(value) => patch("nameVi", value)} />
            <AdminTextField label="Tên campaign EN" value={draft.nameEn} onChange={(value) => patch("nameEn", value)} />
            <AdminTextField label="Từ ngày" required type="date" value={draft.dateFrom} onChange={(value) => patch("dateFrom", value)} />
            <AdminTextField label="Đến ngày" required type="date" value={draft.dateTo} onChange={(value) => patch("dateTo", value)} />
          </div>

          <AdminToggle label="Active" checked={draft.active !== false} onChange={(value) => patch("active", value)} />

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="text-sm font-black text-slate-800">Khung giờ bán hàng ngày</div>
              <button
                type="button"
                onClick={addWindow}
                className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700 hover:bg-blue-100"
              >
                <Plus size={13} className="mr-1 inline" />
                Thêm khung giờ
              </button>
            </div>

            <p className="mb-3 text-xs font-semibold text-slate-500">
              Hỗ trợ nhiều khung giờ/ngày (VD: khung trưa 09:00–10:00 và khung tối 20:00–21:00). Các khung không được chồng giờ nhau.
            </p>

            <div className="space-y-2">
              {(draft.windows || []).map((w, index) => (
                <div key={index} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3">
                  <span className="w-6 shrink-0 text-xs font-black text-slate-400">#{index + 1}</span>
                  <TimeSelect
                    value={w.dailyStartTime}
                    onChange={(value) => updateWindow(index, "dailyStartTime", value)}
                  />
                  <span className="text-slate-400">–</span>
                  <TimeSelect
                    value={w.dailyEndTime}
                    onChange={(value) => updateWindow(index, "dailyEndTime", value)}
                  />
                  {(draft.windows || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeWindow(index)}
                      className="ml-auto rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {validationErrors.length > 0 && (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-xs font-bold leading-5 text-red-700">
              {validationErrors.map((error) => (
                <div key={error}>• {error}</div>
              ))}
            </div>
          )}

          {!draft.id ? (
            <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-4 text-sm font-bold text-blue-800">
              Lưu thông tin campaign ở trên trước, sau đó chọn phạm vi sản phẩm &amp; cấu hình giảm giá bên dưới.
            </div>
          ) : (
            <>
              <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-1 flex items-center gap-2 text-sm font-black text-slate-800">
                  <Zap size={16} className="text-amber-500" />
                  1. Phạm vi sản phẩm áp dụng
                </div>

                <div className="mt-3 space-y-2">
                  {SELECTOR_MODE_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 ${
                        selector.mode === option.value ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="selector-mode"
                        className="mt-1"
                        checked={selector.mode === option.value}
                        onChange={() => {
                          setSelector((prev) => ({ ...emptySelector, mode: option.value, search: prev.search }));
                          setPreviewItems(null);
                        }}
                      />
                      <div>
                        <div className="font-black text-slate-900">{option.label}</div>
                        <div className="text-xs font-semibold text-slate-500">{option.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>

                {selector.mode !== "SPECIFIC" && (
                  <div className="mt-3">
                    <AdminTextField
                      label="Lọc thêm theo tên/SKU (tùy chọn)"
                      placeholder="VD: RX-78, Nightingale..."
                      value={selector.search}
                      onChange={(value) => {
                        setSelector((prev) => ({ ...prev, search: value }));
                        setPreviewItems(null);
                      }}
                    />
                  </div>
                )}

                {selector.mode === "CATEGORY" && (
                  <div className="mt-3 max-h-64 space-y-1 overflow-auto rounded-2xl border border-slate-200 bg-white p-3">
                    {categories.length === 0 && (
                      <div className="text-xs font-bold text-slate-400">Chưa có danh mục nào.</div>
                    )}
                    {categories.map((category) => (
                      <label key={category.id} className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={selector.categoryIds.includes(category.id)}
                          onChange={() => toggleCategoryId(category.id)}
                        />
                        <span className="text-sm font-semibold text-slate-700">{category.nameVi}</span>
                      </label>
                    ))}
                  </div>
                )}

                {selector.mode === "SPECIFIC" && (
                  <div className="mt-3">
                    <div className="grid gap-2 sm:grid-cols-[1fr_220px]">
                      <div className="flex items-center rounded-2xl border border-slate-300 bg-white px-3 py-2">
                        <Search size={15} className="shrink-0 text-slate-400" />
                        <input
                          value={pickerFilter.search}
                          onChange={(event) => setPickerFilter((prev) => ({ ...prev, search: event.target.value }))}
                          placeholder="Tìm theo tên hoặc SKU..."
                          className="w-full bg-transparent px-2 text-sm font-semibold outline-none placeholder:text-slate-400"
                        />
                      </div>
                      <select
                        value={pickerFilter.categoryId}
                        onChange={(event) => setPickerFilter((prev) => ({ ...prev, categoryId: event.target.value }))}
                        className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold outline-none"
                      >
                        <option value="">Tất cả danh mục</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>{category.nameVi}</option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-2 text-xs font-bold text-slate-500">
                      Đã chọn {selector.productIds.length} sản phẩm.
                    </div>

                    <div className="mt-2 max-h-72 space-y-1 overflow-auto rounded-2xl border border-slate-200 bg-white p-2">
                      {pickerProducts.length === 0 && (
                        <div className="p-3 text-xs font-bold text-slate-400">Không có sản phẩm khớp bộ lọc.</div>
                      )}
                      {pickerProducts.map((product) => (
                        <label key={product.id} className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={selector.productIds.includes(product.id)}
                            onChange={() => toggleProductId(product.id)}
                          />
                          <span className="text-sm font-semibold text-slate-700">
                            {product.nameVi} <span className="text-slate-400">· {product.sku} · {formatCurrency(getProductSellingPrice(product))}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 text-sm font-black text-slate-800">2. Cấu hình giảm giá chung</div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <AdminSelect
                    label="Kiểu giảm giá"
                    options={DISCOUNT_METHOD_OPTIONS}
                    value={bulkConfig.discountType}
                    onChange={(value) => {
                      setBulkConfig((prev) => ({ ...prev, discountType: value }));
                      setPreviewItems(null);
                    }}
                  />
                  <AdminTextField
                    key={bulkConfig.discountType}
                    label={
                      bulkConfig.discountType === "PERCENT"
                        ? "Số % giảm"
                        : bulkConfig.discountType === "AMOUNT"
                          ? "Số tiền giảm"
                          : "Giá đồng giá"
                    }
                    required
                    type="number"
                    suffix={bulkConfig.discountType === "PERCENT" ? "%" : "đ"}
                    value={bulkConfig.discountValue}
                    onChange={(value) => {
                      setBulkConfig((prev) => ({ ...prev, discountValue: value }));
                      setPreviewItems(null);
                    }}
                  />
                </div>

                <div className="mt-3">
                  <AdminTextField
                    label="Giới hạn số lượng/ngày (áp dụng cho mọi sản phẩm khớp)"
                    tip="Bỏ trống = không giới hạn"
                    type="number"
                    value={bulkConfig.dailyStockLimit}
                    onChange={(value) => {
                      setBulkConfig((prev) => ({ ...prev, dailyStockLimit: value }));
                    }}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={buildPreview}
                    className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 hover:bg-blue-100"
                  >
                    <Eye size={14} />
                    3. Xem trước
                  </button>

                  <button
                    type="button"
                    onClick={() => void applyBulk()}
                    disabled={applying || !previewItems?.length}
                    className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save size={14} />
                    4. {applying ? "Đang áp dụng..." : "Áp dụng"}
                  </button>
                </div>

                {previewItems && (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-200 bg-white">
                    <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800">
                      Xem trước: {previewItems.length} sản phẩm sẽ được áp dụng
                    </div>
                    <div className="max-h-64 overflow-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 text-left font-black uppercase text-slate-500">
                          <tr>
                            <th className="px-3 py-2">SKU</th>
                            <th className="px-3 py-2">Sản phẩm</th>
                            <th className="px-3 py-2 text-right">Giá gốc</th>
                            <th className="px-3 py-2 text-right">Giá Flash Sale</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewItems.map((row) => (
                            <tr key={row.productId} className="border-t border-slate-100">
                              <td className="px-3 py-2 font-bold text-slate-500">{row.sku}</td>
                              <td className="px-3 py-2 font-semibold text-slate-800">{row.nameVi}</td>
                              <td className="px-3 py-2 text-right text-slate-400 line-through">{formatCurrency(row.sellingPrice)}</td>
                              <td className="px-3 py-2 text-right font-black text-emerald-700">{formatCurrency(row.finalPrice)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="mb-3 text-sm font-black text-slate-800">
                  Sản phẩm đang trong campaign ({(draft.items || []).length})
                </div>

                {(draft.items || []).length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs font-bold text-slate-400">
                    Chưa có sản phẩm nào — dùng khối cấu hình phía trên rồi bấm Áp dụng.
                  </div>
                ) : (
                  <div className="overflow-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-left font-black uppercase text-slate-500">
                        <tr>
                          <th className="px-3 py-2">SKU</th>
                          <th className="px-3 py-2">Sản phẩm</th>
                          <th className="px-3 py-2">Kiểu giảm</th>
                          <th className="px-3 py-2 text-right">Giá trị</th>
                          <th className="px-3 py-2 text-right">Giá cuối</th>
                          <th className="px-3 py-2 text-right">Giới hạn/ngày</th>
                          <th className="px-3 py-2">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {draft.items.map((item) => {
                          const isEditing = editingItemId === item.id;
                          const product = products.find((p) => p.id === item.productId);
                          const previewFinal = isEditing
                            ? computeFinalPrice(
                                editItemForm.discountType,
                                editItemForm.discountValue,
                                product ? getProductSellingPrice(product) : Number(item.finalPrice) || 0
                              )
                            : item.finalPrice;

                          return (
                            <tr key={item.id} className="border-t border-slate-100 align-top">
                              <td className="px-3 py-2 font-bold text-slate-500">{item.product?.sku || product?.sku || "-"}</td>
                              <td className="px-3 py-2 font-semibold text-slate-800">{item.product?.nameVi || product?.nameVi || item.productId}</td>
                              <td className="px-3 py-2">
                                {isEditing ? (
                                  <select
                                    value={editItemForm.discountType}
                                    onChange={(event) => setEditItemForm((prev) => ({ ...prev, discountType: event.target.value }))}
                                    className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold outline-none"
                                  >
                                    {DISCOUNT_METHOD_OPTIONS.map((opt) => (
                                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                  </select>
                                ) : (
                                  DISCOUNT_METHOD_OPTIONS.find((opt) => opt.value === item.discountType)?.label || item.discountType
                                )}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editItemForm.discountValue}
                                    onChange={(event) => setEditItemForm((prev) => ({ ...prev, discountValue: event.target.value }))}
                                    className="w-24 rounded-md border border-slate-300 px-2 py-1 text-right text-xs font-semibold outline-none"
                                  />
                                ) : (
                                  item.discountType === "PERCENT" ? `${item.discountValue}%` : formatCurrency(item.discountValue)
                                )}
                              </td>
                              <td className="px-3 py-2 text-right font-black text-emerald-700">{formatCurrency(previewFinal)}</td>
                              <td className="px-3 py-2 text-right">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editItemForm.dailyStockLimit}
                                    onChange={(event) => setEditItemForm((prev) => ({ ...prev, dailyStockLimit: event.target.value }))}
                                    className="w-20 rounded-md border border-slate-300 px-2 py-1 text-right text-xs font-semibold outline-none"
                                  />
                                ) : (
                                  item.dailyStockLimit ?? "Không giới hạn"
                                )}
                              </td>
                              <td className="px-3 py-2">
                                {isEditing ? (
                                  <div className="flex gap-1">
                                    <button onClick={() => void saveEditItem(item)} className="rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-black text-white">Lưu</button>
                                    <button onClick={() => setEditingItemId("")} className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-bold text-slate-600">Hủy</button>
                                  </div>
                                ) : (
                                  <div className="flex gap-1">
                                    <button onClick={() => startEditItem(item)} className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50">
                                      <Edit3 size={12} className="mr-1 inline" />Sửa
                                    </button>
                                    <button onClick={() => void removeItem(item)} className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-bold text-red-600 hover:bg-red-100">
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </AdminDrawer>
    </>
  );
}
