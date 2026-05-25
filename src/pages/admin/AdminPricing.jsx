import { useEffect, useMemo, useState } from "react";
import { Edit3, Plus, RefreshCcw, Search, Trash2 } from "lucide-react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import { AdminTextarea, AdminTextField, AdminToggle } from "../../components/admin/AdminField";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { formatCurrency } from "../../utils/format";
import { logoutAdmin } from "../../services/AdminAuthService";
import {
  createAdminProductPriceApi,
  deactivateAdminProductPriceApi,
  getAdminProductPricesApi,
  getAdminProductsFromApi,
  updateAdminProductPriceApi,
} from "../../services/AdminCatalogApiService";

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function toInputDate(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

const emptyDraft = {
  id: "",
  productId: "",
  productName: "",
  sku: "",
  price: 0,
  oldPrice: 0,
  startDate: todayInput(),
  endDate: "",
  active: true,
  note: "",
};

function isEffective(row) {
  if (!row?.active) return false;

  const now = new Date();
  const start = new Date(row.startDate);
  const end = row.endDate ? new Date(row.endDate) : null;

  return start <= now && (!end || now <= end);
}

export default function AdminPricing() {
  const [products, setProducts] = useState([]);
  const [prices, setPrices] = useState([]);
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  async function reload() {
    setLoading(true);
    setApiError("");

    try {
      const [productRows, priceRows] = await Promise.all([
        getAdminProductsFromApi(),
        getAdminProductPricesApi(),
      ]);

      setProducts(productRows);
      setPrices(priceRows);
    } catch (error) {
      console.error("ADMIN_PRICING_ERROR", error);

      if (error?.status === 401 || error?.message === "Unauthorized") {
        logoutAdmin();
        window.location.href = "/admin/login";
        return;
      }

      setApiError(error?.message || "Cannot load pricing.");
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
      [item.sku, item.slug, item.nameVi, item.nameEn, item.category?.nameVi, item.supplier?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [products, query]);

  const priceByProduct = useMemo(() => {
    const map = new Map();

    for (const row of prices) {
      const list = map.get(row.productId) || [];
      list.push(row);
      map.set(row.productId, list);
    }

    return map;
  }, [prices]);

  const summary = useMemo(() => {
    return {
      products: products.length,
      prices: prices.length,
      activePrices: prices.filter((item) => item.active !== false).length,
      effectivePrices: prices.filter(isEffective).length,
    };
  }, [products, prices]);

  function openCreate(product) {
    setDraft({
      ...emptyDraft,
      productId: product.id,
      productName: product.nameVi,
      sku: product.sku,
      price: Number(product.price || 0),
      oldPrice: Number(product.oldPrice || 0),
      startDate: todayInput(),
    });
    setDrawerOpen(true);
  }

  function openEdit(row) {
    setDraft({
      id: row.id,
      productId: row.productId,
      productName: row.product?.nameVi || "",
      sku: row.product?.sku || "",
      price: Number(row.price || 0),
      oldPrice: Number(row.oldPrice || 0),
      startDate: toInputDate(row.startDate),
      endDate: toInputDate(row.endDate),
      active: row.active !== false,
      note: row.note || "",
    });
    setDrawerOpen(true);
  }

  function patch(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  async function save() {
    try {
      if (draft.id) {
        await updateAdminProductPriceApi(draft.id, draft);
      } else {
        await createAdminProductPriceApi(draft.productId, draft);
      }

      setDrawerOpen(false);
      await reload();
    } catch (error) {
      alert(error?.message || "Save product price failed.");
    }
  }

  async function remove(row) {
    if (!window.confirm(`Ẩn giá ${formatCurrency(row.price)} của ${row.product?.nameVi || row.productId}?`)) return;

    try {
      await deactivateAdminProductPriceApi(row.id);
      await reload();
    } catch (error) {
      alert(error?.message || "Deactivate price failed.");
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Product Management"
        title="Pricing Management"
        desc="Quản lý giá bán riêng theo thời gian hiệu lực: từ ngày, đến ngày, giá bán và giá cũ."
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
          <p className="text-xs font-black uppercase text-slate-400">Price rows</p>
          <p className="mt-2 text-2xl font-black text-blue-600">{summary.prices}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Active rows</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">{summary.activePrices}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Effective today</p>
          <p className="mt-2 text-2xl font-black text-red-500">{summary.effectivePrices}</p>
        </div>
      </section>

      <section className="mb-4 rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
        PostgreSQL Pricing · {loading ? "Loading..." : `${products.length} products · ${prices.length} price rows`}
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
            placeholder="Tìm sản phẩm để quản lý giá..."
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1350px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3 text-right">Current price</th>
                <th className="px-4 py-3">Price history</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((product) => {
                const history = priceByProduct.get(product.id) || [];

                return (
                  <tr key={product.id} className="border-t border-slate-100 align-top hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <div className="h-14 w-14 overflow-hidden rounded-2xl border bg-slate-50">
                          {product.imageUrl ? <img src={product.imageUrl} alt="" className="h-full w-full object-cover" /> : null}
                        </div>
                        <div>
                          <div className="font-black text-slate-950">{product.nameVi}</div>
                          <div className="text-xs text-slate-500">{product.category?.nameVi || "-"} · {product.supplier?.name || "-"}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-bold">{product.sku}</td>

                    <td className="px-4 py-3 text-right">
                      <div className="font-black text-red-500">{formatCurrency(product.price)}</div>
                      {Number(product.oldPrice || 0) > Number(product.price || 0) && (
                        <div className="text-xs font-bold text-slate-400 line-through">{formatCurrency(product.oldPrice)}</div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {history.length ? (
                        <div className="space-y-2">
                          {history.slice(0, 5).map((row) => (
                            <div key={row.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <div className="font-black text-slate-950">{formatCurrency(row.price)}</div>
                                  {Number(row.oldPrice || 0) > Number(row.price || 0) && (
                                    <div className="text-xs font-bold text-slate-400 line-through">{formatCurrency(row.oldPrice)}</div>
                                  )}
                                </div>

                                <div className="flex gap-2">
                                  <span className={`rounded-full px-3 py-1 text-[11px] font-black ${isEffective(row) ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                    {isEffective(row) ? "EFFECTIVE" : "SCHEDULED/EXPIRED"}
                                  </span>
                                  <button onClick={() => openEdit(row)} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-slate-700">
                                    <Edit3 size={13} />
                                  </button>
                                  <button onClick={() => void remove(row)} className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-600">
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>

                              <div className="mt-2 text-xs font-semibold text-slate-500">
                                {toInputDate(row.startDate)} → {toInputDate(row.endDate) || "Không giới hạn"}
                              </div>
                              {row.note && <div className="mt-1 text-xs text-slate-500">{row.note}</div>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs font-bold text-slate-400">
                          Chưa có lịch sử giá
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openCreate(product)}
                        className="rounded-md bg-blue-700 px-4 py-2 text-xs font-black text-white hover:bg-blue-800"
                      >
                        <Plus size={14} className="mr-1 inline" />
                        Add price
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <AdminDrawer
        open={drawerOpen}
        title={draft.id ? "Edit price" : "Create price"}
        subtitle={`${draft.sku} · ${draft.productName}`}
        onClose={() => setDrawerOpen(false)}
        onSave={save}
        saveLabel="Save price"
      >
        <div className="space-y-5">
          <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="text-sm font-black text-blue-800">{draft.productName}</div>
            <div className="mt-1 text-xs font-bold text-blue-700">{draft.sku}</div>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <AdminTextField
              label="Giá bán"
              type="number"
              suffix="đ"
              value={draft.price}
              onChange={(value) => patch("price", value)}
            />
            <AdminTextField
              label="Giá cũ"
              type="number"
              suffix="đ"
              value={draft.oldPrice}
              onChange={(value) => patch("oldPrice", value)}
            />
            <AdminTextField
              label="Từ ngày"
              type="date"
              value={draft.startDate}
              onChange={(value) => patch("startDate", value)}
            />
            <AdminTextField
              label="Đến ngày"
              type="date"
              value={draft.endDate}
              onChange={(value) => patch("endDate", value)}
            />
          </div>

          <AdminToggle
            label="Active"
            checked={draft.active !== false}
            onChange={(value) => patch("active", value)}
          />

          <AdminTextarea
            label="Ghi chú"
            rows={4}
            value={draft.note}
            onChange={(value) => patch("note", value)}
          />

          <section className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-xs font-semibold leading-5 text-amber-800">
            Nếu giá có hiệu lực trong ngày hôm nay, backend sẽ cập nhật Product.price / oldPrice để storefront hiển thị ngay.
          </section>
        </div>
      </AdminDrawer>
    </>
  );
}
