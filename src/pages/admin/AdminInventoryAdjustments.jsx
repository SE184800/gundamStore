import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Save } from "lucide-react";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { AdminSelect, AdminTextarea, AdminTextField } from "../../components/admin/AdminField";
import { logoutAdmin } from "../../services/AdminAuthService";
import useToast from "../../hooks/useToast";
import Toast from "../../utils/Toast";
import {
  createStockAdjustmentApi,
  getInventoryDashboardApi,
  getStockAdjustmentsApi,
} from "../../services/AdminInventoryRealApiService";

const REASONS = [
  { value: "Hư hỏng", label: "Hư hỏng" },
  { value: "Thất lạc", label: "Thất lạc" },
  { value: "Bổ sung tồn", label: "Bổ sung tồn" },
  { value: "Sai lệch hệ thống", label: "Sai lệch hệ thống" },
  { value: "Khác", label: "Khác" },
];

export default function AdminInventoryAdjustments() {
  const { toast, notify, dismiss } = useToast();
  const [products, setProducts] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const [draft, setDraft] = useState({
    adjustmentNo: "",
    productId: "",
    quantityDelta: 0,
    reason: "Sai lệch hệ thống",
    note: "",
  });

  async function reload() {
    setLoading(true);
    setApiError("");

    try {
      const [inventory, rows] = await Promise.all([
        getInventoryDashboardApi(),
        getStockAdjustmentsApi(),
      ]);

      setProducts(inventory.products || []);
      setAdjustments(rows || []);
    } catch (error) {
      console.error("ADMIN_ADJUSTMENTS_ERROR", error);

      if (error?.status === 401 || error?.message === "Unauthorized") {
        logoutAdmin();
        window.location.href = "/admin/login";
        return;
      }

      setApiError(error?.message || "Cannot load adjustments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("productId") || "";
    if (productId) setDraft((prev) => ({ ...prev, productId }));
    void reload();
  }, []);

  const productOptions = useMemo(() => {
    return [
      { value: "", label: "Chọn sản phẩm" },
      ...products.map((item) => ({
        value: item.id,
        label: `${item.sku} · ${item.nameVi} · Tồn hiện tại: ${item.stock || 0}`,
      })),
    ];
  }, [products]);

  const selectedProduct = products.find((item) => item.id === draft.productId);
  const beforeStock = Number(selectedProduct?.stock || 0);
  const afterStock = beforeStock + Number(draft.quantityDelta || 0);

  function patch(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  async function save() {
    try {
      await createStockAdjustmentApi({
        adjustmentNo: draft.adjustmentNo,
        productId: draft.productId,
        quantityDelta: Number(draft.quantityDelta || 0),
        reason: draft.reason,
        note: draft.note,
      });

      setDraft({
        adjustmentNo: "",
        productId: "",
        quantityDelta: 0,
        reason: "Sai lệch hệ thống",
        note: "",
      });

      await reload();
      notify("success", "Đã điều chỉnh tồn kho.");
    } catch (error) {
      notify("error", error?.message || "Create stock adjustment failed.");
    }
  }

  return (
    <>
      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={dismiss} />
      <AdminPageHeader
        eyebrow="Inventory Management"
        title="Điều chỉnh tồn kho"
        desc="Tạo phiếu điều chỉnh tồn riêng, tăng/giảm tồn và ghi lịch sử transaction."
        action={
          <button
            onClick={() => void reload()}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
          >
            <RefreshCcw size={15} className="mr-1 inline" />
            Refresh
          </button>
        }
      />

      <section className="mb-4 rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
        PostgreSQL Stock Adjustment · {loading ? "Loading..." : `${adjustments.length} adjustments`}
      </section>

      {apiError && (
        <section className="mb-4 rounded-3xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          {apiError}
        </section>
      )}

      <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 text-lg font-black text-slate-950">Tạo phiếu điều chỉnh tồn</div>

        <div className="grid gap-4 md:grid-cols-3">
          <AdminTextField
            label="Mã phiếu"
            placeholder="Tự sinh nếu để trống"
            value={draft.adjustmentNo}
            onChange={(value) => patch("adjustmentNo", value)}
          />
          <AdminSelect
            label="Sản phẩm"
            options={productOptions}
            value={draft.productId}
            onChange={(value) => patch("productId", value)}
          />
          <AdminTextField
            label="Số lượng điều chỉnh"
            tip="Số dương để tăng tồn, số âm để giảm tồn."
            type="number"
            value={draft.quantityDelta}
            onChange={(value) => patch("quantityDelta", value)}
          />
          <AdminSelect
            label="Lý do"
            options={REASONS}
            value={draft.reason}
            onChange={(value) => patch("reason", value)}
          />
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="text-xs font-black uppercase text-blue-700">Tồn trước</div>
            <div className="mt-1 text-xl font-black text-blue-900">{beforeStock}</div>
          </div>
          <div className={`rounded-2xl border p-4 ${afterStock < 0 ? "border-red-100 bg-red-50" : "border-emerald-100 bg-emerald-50"}`}>
            <div className={`text-xs font-black uppercase ${afterStock < 0 ? "text-red-700" : "text-emerald-700"}`}>Tồn sau</div>
            <div className={`mt-1 text-xl font-black ${afterStock < 0 ? "text-red-900" : "text-emerald-900"}`}>{afterStock}</div>
          </div>
        </div>

        <div className="mt-5">
          <AdminTextarea
            label="Ghi chú"
            rows={4}
            value={draft.note}
            onChange={(value) => patch("note", value)}
          />
        </div>

        <button
          onClick={save}
          className="mt-4 rounded-md bg-blue-700 px-5 py-2 text-xs font-black text-white hover:bg-blue-800"
        >
          <Save size={14} className="mr-1 inline" />
          Lưu điều chỉnh
        </button>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 text-lg font-black text-slate-950">
          Lịch sử điều chỉnh tồn
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Mã phiếu</th>
                <th className="px-4 py-3">Sản phẩm</th>
                <th className="px-4 py-3 text-right">Delta</th>
                <th className="px-4 py-3 text-right">Before</th>
                <th className="px-4 py-3 text-right">After</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-black text-blue-700">{item.adjustmentNo}</td>
                  <td className="px-4 py-3">
                    <div className="font-bold">{item.product?.nameVi || item.productId}</div>
                    <div className="text-xs text-slate-500">{item.product?.sku || "-"}</div>
                  </td>
                  <td className={`px-4 py-3 text-right font-black ${Number(item.quantityDelta) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {Number(item.quantityDelta) >= 0 ? "+" : ""}{item.quantityDelta}
                  </td>
                  <td className="px-4 py-3 text-right">{item.beforeStock}</td>
                  <td className="px-4 py-3 text-right font-black">{item.afterStock}</td>
                  <td className="px-4 py-3">{item.reason}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("vi-VN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
