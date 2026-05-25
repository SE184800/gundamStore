import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCcw, Save, Trash2 } from "lucide-react";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { AdminSelect, AdminTextarea, AdminTextField } from "../../components/admin/AdminField";
import { formatCurrency } from "../../utils/format";
import { logoutAdmin } from "../../services/AdminAuthService";
import { getAdminCatalogReferenceApi } from "../../services/AdminCatalogApiService";
import {
  createPurchaseReceiptApi,
  getInventoryDashboardApi,
  getPurchaseReceiptsApi,
} from "../../services/AdminInventoryRealApiService";

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function makeEmptyLine() {
  return {
    productId: "",
    quantity: 1,
    unitCost: 0,
  };
}

export default function AdminInventoryReceipts() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const [draft, setDraft] = useState({
    receiptNo: "",
    supplierId: "",
    receiptDate: todayInput(),
    note: "",
    items: [makeEmptyLine()],
  });

  async function reload() {
    setLoading(true);
    setApiError("");

    try {
      const [inventory, ref, receiptRows] = await Promise.all([
        getInventoryDashboardApi(),
        getAdminCatalogReferenceApi(),
        getPurchaseReceiptsApi(),
      ]);

      setProducts(inventory.products || []);
      setSuppliers(ref.suppliers || []);
      setReceipts(receiptRows || []);
    } catch (error) {
      console.error("ADMIN_RECEIPTS_ERROR", error);

      if (error?.status === 401 || error?.message === "Unauthorized") {
        logoutAdmin();
        window.location.href = "/admin/login";
        return;
      }

      setApiError(error?.message || "Cannot load receipt page.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const productOptions = useMemo(() => {
    return [
      { value: "", label: "Chọn sản phẩm" },
      ...products.map((item) => ({
        value: item.id,
        label: `${item.sku} · ${item.nameVi} · Stock ${item.stock || 0} · Avg ${formatCurrency(item.avgCost || 0)}`,
      })),
    ];
  }, [products]);

  const supplierOptions = useMemo(() => {
    return [
      { value: "", label: "Không chọn supplier" },
      ...suppliers.map((item) => ({
        value: item.id,
        label: `${item.name} (${item.code})`,
      })),
    ];
  }, [suppliers]);

  const totalAmount = useMemo(() => {
    return draft.items.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitCost || 0),
      0
    );
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

  function addLine() {
    setDraft((prev) => ({ ...prev, items: [...prev.items, makeEmptyLine()] }));
  }

  function removeLine(index) {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.length <= 1 ? prev.items : prev.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function saveReceipt() {
    try {
      const payload = {
        receiptNo: draft.receiptNo,
        supplierId: draft.supplierId,
        receiptDate: draft.receiptDate,
        note: draft.note,
        items: draft.items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity || 0),
          unitCost: Number(item.unitCost || 0),
        })),
      };

      await createPurchaseReceiptApi(payload);

      setDraft({
        receiptNo: "",
        supplierId: "",
        receiptDate: todayInput(),
        note: "",
        items: [makeEmptyLine()],
      });

      await reload();
      alert("Đã tạo phiếu nhập hàng và cập nhật tồn kho / giá vốn bình quân.");
    } catch (error) {
      alert(error?.message || "Create receipt failed.");
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Inventory Management"
        title="Nhập hàng / Goods Receipt"
        desc="Tạo phiếu nhập hàng, tăng tồn kho và tự động tính lại giá vốn bình quân theo transaction nhập mua."
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
        PostgreSQL Goods Receipt · {loading ? "Loading..." : `${products.length} products · ${receipts.length} receipts`}
      </section>

      {apiError && (
        <section className="mb-4 rounded-3xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          {apiError}
        </section>
      )}

      <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 text-lg font-black text-slate-950">Tạo phiếu nhập hàng</div>

        <div className="grid gap-4 md:grid-cols-4">
          <AdminTextField
            label="Mã phiếu nhập"
            placeholder="Tự sinh nếu để trống"
            value={draft.receiptNo}
            onChange={(value) => patch("receiptNo", value)}
          />
          <AdminSelect
            label="Nhà cung cấp"
            options={supplierOptions}
            value={draft.supplierId}
            onChange={(value) => patch("supplierId", value)}
          />
          <AdminTextField
            label="Ngày nhập"
            type="date"
            value={draft.receiptDate}
            onChange={(value) => patch("receiptDate", value)}
          />
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="text-xs font-black uppercase text-blue-700">Tổng tiền nhập</div>
            <div className="mt-2 text-2xl font-black text-blue-900">{formatCurrency(totalAmount)}</div>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full min-w-[950px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Sản phẩm</th>
                <th className="px-4 py-3 text-right">Số lượng nhập</th>
                <th className="px-4 py-3 text-right">Đơn giá nhập</th>
                <th className="px-4 py-3 text-right">Thành tiền</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {draft.items.map((item, index) => (
                <tr key={index} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <select
                      value={item.productId}
                      onChange={(e) => patchLine(index, "productId", e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-blue-500"
                    >
                      {productOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => patchLine(index, "quantity", e.target.value)}
                      className="w-32 rounded-md border border-slate-300 px-3 py-2 text-right text-sm font-bold outline-none focus:border-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={item.unitCost}
                      onChange={(e) => patchLine(index, "unitCost", e.target.value)}
                      className="w-40 rounded-md border border-slate-300 px-3 py-2 text-right text-sm font-bold outline-none focus:border-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-right font-black text-red-500">
                    {formatCurrency(Number(item.quantity || 0) * Number(item.unitCost || 0))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => removeLine(index)}
                      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={addLine}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
          >
            <Plus size={14} className="mr-1 inline" />
            Thêm dòng
          </button>

          <button
            onClick={saveReceipt}
            className="rounded-md bg-blue-700 px-5 py-2 text-xs font-black text-white hover:bg-blue-800"
          >
            <Save size={14} className="mr-1 inline" />
            Lưu phiếu nhập
          </button>
        </div>

        <div className="mt-5">
          <AdminTextarea
            label="Ghi chú"
            rows={3}
            value={draft.note}
            onChange={(value) => patch("note", value)}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 text-lg font-black text-slate-950">
          Phiếu nhập gần đây
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Mã phiếu</th>
                <th className="px-4 py-3">Ngày</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3 text-right">Items</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Note</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((receipt) => (
                <tr key={receipt.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-black text-blue-700">{receipt.receiptNo}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(receipt.receiptDate).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-4 py-3">{receipt.supplier?.name || "-"}</td>
                  <td className="px-4 py-3 text-right font-bold">{receipt.items?.length || 0}</td>
                  <td className="px-4 py-3 text-right font-black text-red-500">
                    {formatCurrency(receipt.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{receipt.note || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
