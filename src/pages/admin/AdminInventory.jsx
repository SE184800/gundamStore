import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Save, Search } from "lucide-react";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { AdminTextarea, AdminTextField } from "../../components/admin/AdminField";
import AdminDrawer from "../../components/admin/AdminDrawer";
import { formatCurrency } from "../../utils/format";
import { logoutAdmin } from "../../services/AdminAuthService";
import {
  adjustAdminProductInventoryApi,
  getAdminInventoryLogsApi,
  getAdminProductsFromApi,
} from "../../services/AdminCatalogApiService";

const emptyAdjust = {
  productId: "",
  productName: "",
  sku: "",
  currentStock: 0,
  delta: 0,
  reason: "",
};

function logTypeLabel(type) {
  if (type === "IMPORT") return "Nhập kho";
  if (type === "EXPORT") return "Xuất kho";
  if (type === "RESTORE") return "Hoàn kho";
  if (type === "RESERVE") return "Giữ kho";
  return "Điều chỉnh";
}

export default function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [adjust, setAdjust] = useState(emptyAdjust);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  async function reload() {
    setLoading(true);
    setApiError("");

    try {
      const [productRows, logRows] = await Promise.all([
        getAdminProductsFromApi(),
        getAdminInventoryLogsApi(),
      ]);

      setProducts(productRows);
      setLogs(logRows);
    } catch (error) {
      console.error("ADMIN_INVENTORY_ERROR", error);

      if (error?.status === 401 || error?.message === "Unauthorized") {
        logoutAdmin();
        window.location.href = "/admin/login";
        return;
      }

      setApiError(error?.message || "Cannot load inventory.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return products.filter((item) =>
      !q ||
      [
        item.sku,
        item.slug,
        item.nameVi,
        item.nameEn,
        item.category?.nameVi,
        item.supplier?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [products, query]);

  const summary = useMemo(() => {
    return {
      products: products.length,
      stock: products.reduce((sum, item) => sum + Number(item.stock || 0), 0),
      value: products.reduce(
        (sum, item) => sum + Number(item.stock || 0) * Number(item.price || 0),
        0
      ),
      outOfStock: products.filter((item) => Number(item.stock || 0) <= 0).length,
    };
  }, [products]);

  function openAdjust(product, mode = "import") {
    const currentStock = Number(product.stock || 0);

    setAdjust({
      productId: product.id,
      productName: product.nameVi,
      sku: product.sku,
      currentStock,
      delta: mode === "export" ? -1 : 1,
      reason: mode === "export" ? "Xuất kho thủ công" : "Nhập kho thủ công",
    });

    setDrawerOpen(true);
  }

  function patch(field, value) {
    setAdjust((prev) => ({ ...prev, [field]: value }));
  }

  async function saveAdjust() {
    try {
      await adjustAdminProductInventoryApi(adjust.productId, {
        delta: Number(adjust.delta || 0),
        reason: adjust.reason,
      });

      setDrawerOpen(false);
      await reload();
    } catch (error) {
      alert(error?.message || "Adjust inventory failed.");
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Product Management"
        title="Inventory Management"
        desc="Quản lý tồn kho riêng: nhập kho, xuất kho, điều chỉnh và xem lịch sử tồn kho."
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

      <section className="mb-4 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Products</p>
          <p className="mt-2 text-2xl font-black">{summary.products}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Total stock</p>
          <p className="mt-2 text-2xl font-black text-blue-600">{summary.stock}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Inventory value</p>
          <p className="mt-2 text-2xl font-black text-red-500">{formatCurrency(summary.value)}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Out of stock</p>
          <p className="mt-2 text-2xl font-black text-amber-600">{summary.outOfStock}</p>
        </div>
      </section>

      <section className="mb-4 rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
        PostgreSQL Inventory · {loading ? "Loading..." : `${products.length} products · ${logs.length} logs`}
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
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent px-2 text-sm outline-none"
            placeholder="Tìm sản phẩm để điều chỉnh tồn kho..."
          />
        </div>
      </section>

      <section className="mb-6 overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3 text-sm font-black text-slate-800">
          Current stock
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-right">Value</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((product) => (
                <tr key={product.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <div className="h-14 w-14 overflow-hidden rounded-2xl border bg-slate-50">
                        {product.imageUrl ? <img src={product.imageUrl} alt="" className="h-full w-full object-cover" /> : null}
                      </div>
                      <div>
                        <div className="font-black text-slate-950">{product.nameVi}</div>
                        <div className="text-xs text-slate-500">{product.nameEn}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold">{product.sku}</td>
                  <td className="px-4 py-3 text-slate-600">{product.category?.nameVi || "-"}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatCurrency(product.price)}</td>
                  <td className="px-4 py-3 text-right text-lg font-black text-blue-700">{product.stock}</td>
                  <td className="px-4 py-3 text-right font-black text-red-500">
                    {formatCurrency(Number(product.price || 0) * Number(product.stock || 0))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openAdjust(product, "import")}
                        className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-700"
                      >
                        + Nhập
                      </button>
                      <button
                        onClick={() => openAdjust(product, "export")}
                        className="rounded-md bg-amber-600 px-3 py-2 text-xs font-black text-white hover:bg-amber-700"
                      >
                        - Xuất
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3 text-sm font-black text-slate-800">
          Inventory logs
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Before</th>
                <th className="px-4 py-3 text-right">After</th>
                <th className="px-4 py-3">Reason</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 80).map((log) => (
                <tr key={log.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(log.createdAt).toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold">{log.product?.nameVi || log.productId}</div>
                    <div className="text-xs text-slate-500">{log.product?.sku || "-"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-600">
                      {logTypeLabel(log.type)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-black">{log.quantity}</td>
                  <td className="px-4 py-3 text-right">{log.beforeStock}</td>
                  <td className="px-4 py-3 text-right font-black text-blue-700">{log.afterStock}</td>
                  <td className="px-4 py-3 text-slate-600">{log.reason || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AdminDrawer
        open={drawerOpen}
        title="Adjust inventory"
        subtitle={`${adjust.sku} · ${adjust.productName}`}
        onClose={() => setDrawerOpen(false)}
        onSave={saveAdjust}
        saveLabel="Save inventory"
      >
        <div className="space-y-5">
          <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="text-sm font-black text-blue-800">{adjust.productName}</div>
            <div className="mt-1 text-xs font-bold text-blue-700">Current stock: {adjust.currentStock}</div>
            <div className="mt-1 text-xs font-bold text-blue-700">
              After stock: {Number(adjust.currentStock || 0) + Number(adjust.delta || 0)}
            </div>
          </section>

          <AdminTextField
            label="Số lượng điều chỉnh"
            tip="Nhập số dương để nhập kho, số âm để xuất kho."
            type="number"
            value={adjust.delta}
            onChange={(value) => patch("delta", value)}
          />

          <AdminTextarea
            label="Lý do điều chỉnh"
            rows={4}
            value={adjust.reason}
            onChange={(value) => patch("reason", value)}
          />
        </div>
      </AdminDrawer>
    </>
  );
}
