import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Search } from "lucide-react";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { formatCurrency } from "../../utils/format";
import { logoutAdmin } from "../../services/AdminAuthService";
import { getInventoryTransactionsApi } from "../../services/AdminInventoryRealApiService";

const TYPE_OPTIONS = [
  { value: "", label: "Tất cả giao dịch" },
  { value: "PURCHASE_RECEIPT", label: "Nhập hàng" },
  { value: "STOCK_ADJUSTMENT", label: "Điều chỉnh tồn" },
  { value: "STOCK_COUNT", label: "Kiểm tồn" },
];

function typeLabel(type) {
  if (type === "PURCHASE_RECEIPT") return "Nhập hàng";
  if (type === "STOCK_ADJUSTMENT") return "Điều chỉnh tồn";
  if (type === "STOCK_COUNT") return "Kiểm tồn";
  return type || "-";
}

export default function AdminInventoryTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  async function reload() {
    setLoading(true);
    setApiError("");

    try {
      const rows = await getInventoryTransactionsApi();
      setTransactions(rows || []);
    } catch (error) {
      console.error("ADMIN_INVENTORY_TRANSACTIONS_ERROR", error);

      if (error?.status === 401 || error?.message === "Unauthorized") {
        logoutAdmin();
        window.location.href = "/admin/login";
        return;
      }

      setApiError(error?.message || "Cannot load inventory transactions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return transactions.filter((item) => {
      const matchType = !type || item.type === type;
      const haystack = [
        item.type,
        item.refType,
        item.refId,
        item.note,
        item.product?.sku,
        item.product?.slug,
        item.product?.nameVi,
        item.product?.nameEn,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchType && (!q || haystack.includes(q));
    });
  }, [transactions, query, type]);

  const summary = useMemo(() => {
    return {
      total: transactions.length,
      receipt: transactions.filter((item) => item.type === "PURCHASE_RECEIPT").length,
      adjustment: transactions.filter((item) => item.type === "STOCK_ADJUSTMENT").length,
      stockCount: transactions.filter((item) => item.type === "STOCK_COUNT").length,
    };
  }, [transactions]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Inventory Management"
        title="Inventory Transactions"
        desc="Lịch sử giao dịch kho: nhập hàng, điều chỉnh tồn, kiểm tồn và giá vốn bình quân sau mỗi transaction."
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
          <p className="text-xs font-black uppercase text-slate-400">Transactions</p>
          <p className="mt-2 text-2xl font-black">{summary.total}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Receipts</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">{summary.receipt}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Adjustments</p>
          <p className="mt-2 text-2xl font-black text-amber-600">{summary.adjustment}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Stock Counts</p>
          <p className="mt-2 text-2xl font-black text-blue-600">{summary.stockCount}</p>
        </div>
      </section>

      {apiError && (
        <section className="mb-4 rounded-3xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          {apiError}
        </section>
      )}

      <section className="mb-4 rounded-md border border-slate-200 bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
          <div className="flex items-center rounded-md border border-slate-300 bg-white px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent px-2 text-sm outline-none"
              placeholder="Tìm SKU, sản phẩm, refId, ghi chú..."
            />
          </div>

          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-blue-500"
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1400px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Unit Cost</th>
                <th className="px-4 py-3 text-right">Before</th>
                <th className="px-4 py-3 text-right">After</th>
                <th className="px-4 py-3 text-right">Avg Before</th>
                <th className="px-4 py-3 text-right">Avg After</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Note</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-4 py-12 text-center font-bold text-slate-400">
                    {loading ? "Loading transactions..." : "No transactions found."}
                  </td>
                </tr>
              ) : (
                rows.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-black text-slate-950">{item.product?.nameVi || item.productId}</div>
                      <div className="text-xs text-slate-500">{item.product?.sku || "-"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black text-blue-700">
                        {typeLabel(item.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-black">{item.quantity}</td>
                    <td className="px-4 py-3 text-right font-bold">{formatCurrency(item.unitCost || 0)}</td>
                    <td className="px-4 py-3 text-right">{item.beforeStock}</td>
                    <td className="px-4 py-3 text-right font-black text-blue-700">{item.afterStock}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(item.avgCostBefore || 0)}</td>
                    <td className="px-4 py-3 text-right font-black text-emerald-600">{formatCurrency(item.avgCostAfter || 0)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      <div>{item.refType || "-"}</div>
                      <div>{item.refId || "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.note || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
