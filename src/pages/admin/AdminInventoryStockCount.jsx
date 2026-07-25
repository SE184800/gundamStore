import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Save } from "lucide-react";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { AdminTextarea, AdminTextField } from "../../components/admin/AdminField";
import { logoutAdmin } from "../../services/AdminAuthService";
import useToast from "../../hooks/useToast";
import Toast from "../../utils/Toast";
import {
  createStockCountApi,
  getInventoryDashboardApi,
  getStockCountsApi,
} from "../../services/AdminInventoryRealApiService";

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminInventoryStockCount() {
  const { toast, notify, dismiss } = useToast();
  const [products, setProducts] = useState([]);
  const [counts, setCounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const [draft, setDraft] = useState({
    countNo: "",
    countDate: todayInput(),
    note: "",
    items: [],
  });

  async function reload() {
    setLoading(true);
    setApiError("");

    try {
      const [inventory, countRows] = await Promise.all([
        getInventoryDashboardApi(),
        getStockCountsApi(),
      ]);

      setProducts(inventory.products || []);
      setCounts(countRows || []);
      setDraft((prev) => ({
        ...prev,
        items: (inventory.products || []).map((product) => ({
          productId: product.id,
          sku: product.sku,
          nameVi: product.nameVi,
          systemStock: Number(product.stock || 0),
          countedStock: Number(product.stock || 0),
          reason: "",
        })),
      }));
    } catch (error) {
      console.error("ADMIN_STOCK_COUNT_ERROR", error);

      if (error?.status === 401 || error?.message === "Unauthorized") {
        logoutAdmin();
        window.location.href = "/admin/login";
        return;
      }

      setApiError(error?.message || "Cannot load stock count.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const changedItems = useMemo(() => {
    return draft.items.filter((item) => Number(item.countedStock) !== Number(item.systemStock));
  }, [draft.items]);

  function patch(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function patchLine(index, field, value) {
    setDraft((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  }

  async function saveCount() {
    try {
      if (!changedItems.length) {
        notify("error", "Không có chênh lệch tồn kho để ghi nhận.");
        return;
      }

      await createStockCountApi({
        countNo: draft.countNo,
        countDate: draft.countDate,
        note: draft.note,
        items: changedItems.map((item) => ({
          productId: item.productId,
          countedStock: Number(item.countedStock || 0),
          reason: item.reason || draft.note || "Kiểm tồn",
        })),
      });

      await reload();
      notify("success", "Đã ghi nhận kiểm tồn và cập nhật chênh lệch.");
    } catch (error) {
      notify("error", error?.message || "Create stock count failed.");
    }
  }

  return (
    <>
      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={dismiss} />
      <AdminPageHeader
        eyebrow="Inventory Management"
        title="Kiểm tồn / Stock Count"
        desc="Đếm tồn thực tế, so sánh với tồn hệ thống và xác nhận điều chỉnh chênh lệch."
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

      <section className="mb-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Products</p>
          <p className="mt-2 text-2xl font-black">{products.length}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Changed items</p>
          <p className="mt-2 text-2xl font-black text-red-500">{changedItems.length}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Stock counts</p>
          <p className="mt-2 text-2xl font-black text-blue-600">{counts.length}</p>
        </div>
      </section>

      {apiError && (
        <section className="mb-4 rounded-3xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          {apiError}
        </section>
      )}

      <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 text-lg font-black text-slate-950">Phiếu kiểm tồn</div>

        <div className="grid gap-4 md:grid-cols-3">
          <AdminTextField
            label="Mã phiếu kiểm"
            placeholder="Tự sinh nếu để trống"
            value={draft.countNo}
            onChange={(value) => patch("countNo", value)}
          />
          <AdminTextField
            label="Ngày kiểm"
            type="date"
            value={draft.countDate}
            onChange={(value) => patch("countDate", value)}
          />
          <AdminTextarea
            label="Ghi chú"
            rows={2}
            value={draft.note}
            onChange={(value) => patch("note", value)}
          />
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Sản phẩm</th>
                <th className="px-4 py-3 text-right">Tồn hệ thống</th>
                <th className="px-4 py-3 text-right">Tồn thực đếm</th>
                <th className="px-4 py-3 text-right">Chênh lệch</th>
                <th className="px-4 py-3">Lý do</th>
              </tr>
            </thead>
            <tbody>
              {draft.items.map((item, index) => {
                const diff = Number(item.countedStock || 0) - Number(item.systemStock || 0);

                return (
                  <tr key={item.productId} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div className="font-black text-slate-950">{item.nameVi}</div>
                      <div className="text-xs text-slate-500">{item.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-black">{item.systemStock}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.countedStock}
                        onChange={(e) => patchLine(index, "countedStock", e.target.value)}
                        className="ml-auto block w-28 rounded-md border border-slate-300 px-3 py-2 text-right text-sm font-bold outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className={`px-4 py-3 text-right font-black ${diff === 0 ? "text-slate-400" : diff > 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {diff > 0 ? "+" : ""}{diff}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={item.reason}
                        onChange={(e) => patchLine(index, "reason", e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        placeholder="Lý do chênh lệch"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button
          onClick={saveCount}
          className="mt-4 rounded-md bg-blue-700 px-5 py-2 text-xs font-black text-white hover:bg-blue-800"
        >
          <Save size={14} className="mr-1 inline" />
          Xác nhận kiểm tồn
        </button>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 text-lg font-black text-slate-950">
          Lịch sử kiểm tồn
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Mã phiếu</th>
                <th className="px-4 py-3">Ngày kiểm</th>
                <th className="px-4 py-3 text-right">Items</th>
                <th className="px-4 py-3 text-right">Changed</th>
                <th className="px-4 py-3">Note</th>
              </tr>
            </thead>
            <tbody>
              {counts.map((count) => {
                const changed = (count.items || []).filter((item) => Number(item.difference || 0) !== 0).length;

                return (
                  <tr key={count.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-black text-blue-700">{count.countNo}</td>
                    <td className="px-4 py-3">{new Date(count.countDate).toLocaleDateString("vi-VN")}</td>
                    <td className="px-4 py-3 text-right font-bold">{count.items?.length || 0}</td>
                    <td className="px-4 py-3 text-right font-black text-red-500">{changed}</td>
                    <td className="px-4 py-3 text-slate-500">{count.note || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
