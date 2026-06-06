import { useEffect, useMemo, useState } from "react";
import { Edit3, Plus, RefreshCcw, Trash2 } from "lucide-react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import { AdminTextarea, AdminTextField, AdminToggle } from "../../components/admin/AdminField";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { formatCurrency } from "../../utils/format";
import { logoutAdmin } from "../../services/AdminAuthService";
import {
  createSellingPriceApi,
  deactivateSellingPriceApi,
  getPricingProductsApi,
  getSellingPricesApi,
  updateSellingPriceApi,
} from "../../services/AdminPricingRealApiService";

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function toInputDate(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function isEffective(row) {
  if (!row?.active) return false;

  const now = new Date();
  const start = new Date(row.startDate);
  const end = row.endDate ? new Date(row.endDate) : null;

  return start <= now && (!end || now <= end);
}

const emptyDraft = {
  id: "",
  productId: "",
  productName: "",
  sku: "",
  baseCost: 0,
  marginPercent: 30,
  suggestedPrice: 0,
  price: 0,
  oldPrice: 0,
  startDate: todayInput(),
  endDate: "",
  active: true,
  note: "",
};

export default function AdminPricing() {
  const [products, setProducts] = useState([]);
  const [prices, setPrices] = useState([]);
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [autoOpenProductId, setAutoOpenProductId] = useState("");

  async function reload() {
    setLoading(true);
    setApiError("");

    try {
      const [productRows, priceRows] = await Promise.all([
        getPricingProductsApi(),
        getSellingPricesApi(),
      ]);

      setProducts(productRows);
      setPrices(priceRows);
    } catch (error) {
      console.error("ADMIN_REAL_PRICING_ERROR", error);

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
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("productId") || "";
    setAutoOpenProductId(productId);
    void reload();
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    let result = products;

    if (autoOpenProductId) {
      result = result.filter((item) => item.id === autoOpenProductId);
    }

    return result.filter((item) =>
      !q ||
      [item.sku, item.slug, item.nameVi, item.nameEn, item.category?.nameVi, item.supplier?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [products, query, autoOpenProductId]);

  const priceByProduct = useMemo(() => {
    const map = new Map();

    for (const row of prices) {
      const list = map.get(row.productId) || [];
      list.push(row);
      map.set(row.productId, list);
    }

    return map;
  }, [prices]);

  useEffect(() => {
    if (!autoOpenProductId || drawerOpen || !products.length) return;

    const product = products.find((item) => item.id === autoOpenProductId);

    if (product) {
      console.info("ADMIN_PRICING_AUTO_OPEN", product.sku);
      openCreate(product);
      setQuery(product.sku || product.slug || product.nameVi || "");
      setAutoOpenProductId("");
    }
  }, [autoOpenProductId, drawerOpen, products]);

  const summary = useMemo(() => {
    return {
      products: products.length,
      withCost: products.filter((item) => Number(item.avgCost || 0) > 0).length,
      priceRows: prices.length,
      effective: prices.filter(isEffective).length,
    };
  }, [products, prices]);

  function calcSuggested(baseCost, marginPercent) {
    return Math.round(Number(baseCost || 0) * (1 + Number(marginPercent || 0) / 100));
  }

  function openCreate(product) {
    const baseCost = Number(product.avgCost || product.lastPurchaseCost || 0);
    const marginPercent = 30;
    const suggestedPrice = calcSuggested(baseCost, marginPercent);

    setDraft({
      ...emptyDraft,
      productId: product.id,
      productName: product.nameVi,
      sku: product.sku,
      baseCost,
      marginPercent,
      suggestedPrice,
      price: suggestedPrice,
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
      baseCost: Number(row.baseCost || row.product?.avgCost || 0),
      marginPercent: Number(row.marginPercent || 0),
      suggestedPrice: Number(row.suggestedPrice || row.price || 0),
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
    setDraft((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "baseCost" || field === "marginPercent") {
        const suggestedPrice = calcSuggested(
          field === "baseCost" ? value : prev.baseCost,
          field === "marginPercent" ? value : prev.marginPercent
        );

        next.suggestedPrice = suggestedPrice;

        if (!prev.price || Number(prev.price) === Number(prev.suggestedPrice)) {
          next.price = suggestedPrice;
        }
      }

      return next;
    });
  }

  async function save() {
    try {
      const payload = {
        baseCost: Number(draft.baseCost || 0),
        marginPercent: Number(draft.marginPercent || 0),
        suggestedPrice: Number(draft.suggestedPrice || 0),
        price: Number(draft.price || 0),
        oldPrice: Number(draft.oldPrice || 0),
        startDate: draft.startDate,
        endDate: draft.endDate,
        active: draft.active !== false,
        note: draft.note,
      };

      if (draft.id) {
        await updateSellingPriceApi(draft.id, payload);
      } else {
        await createSellingPriceApi(draft.productId, payload);
      }

      setDrawerOpen(false);
      await reload();
    } catch (error) {
      alert(error?.message || "Save selling price failed.");
    }
  }

  async function remove(row) {
    if (!window.confirm(`Ẩn giá ${formatCurrency(row.price)}?`)) return;

    try {
      await deactivateSellingPriceApi(row.id);
      await reload();
    } catch (error) {
      alert(error?.message || "Deactivate selling price failed.");
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Pricing Management"
        title="Giá bán theo giá vốn bình quân"
        desc="Giá vốn bình quân lấy từ transaction nhập hàng. Admin thiết lập margin, hệ thống tính giá đề xuất và duyệt giá bán chính thức."
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
          <p className="text-xs font-black uppercase text-slate-400">With avg cost</p>
          <p className="mt-2 text-2xl font-black text-blue-600">{summary.withCost}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Price rows</p>
          <p className="mt-2 text-2xl font-black text-violet-600">{summary.priceRows}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Effective today</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">{summary.effective}</p>
        </div>
      </section>

      <section className="mb-4 rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
        Pricing = Avg Cost + Margin · {loading ? "Loading..." : `${products.length} products`}
      </section>

      {autoOpenProductId && (
        <section className="mb-4 rounded-3xl border border-blue-100 bg-blue-50 p-4 text-sm font-bold text-blue-800">
          Đang mở sản phẩm vừa tạo để thiết lập giá bán...
        </section>
      )}

      {apiError && (
        <section className="mb-4 rounded-3xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          {apiError}
        </section>
      )}

      <section className="mb-4 rounded-md border border-slate-200 bg-white p-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          placeholder="Tìm SKU, tên sản phẩm, danh mục, supplier..."
        />
      </section>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3 text-right">Avg Cost</th>
                <th className="px-4 py-3 text-right">Last Cost</th>
                <th className="px-4 py-3 text-right">Current Selling</th>
                <th className="px-4 py-3">Price History</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((product) => {
                const history = priceByProduct.get(product.id) || [];

                return (
                  <tr key={product.id} className="border-t border-slate-100 align-top hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-black text-slate-950">{product.nameVi}</div>
                      <div className="text-xs text-slate-500">
                        {product.category?.nameVi || "-"} · Stock {product.stock || 0}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-bold">{product.sku}</td>

                    <td className="px-4 py-3 text-right font-black text-blue-700">
                      {formatCurrency(product.avgCost || 0)}
                    </td>

                    <td className="px-4 py-3 text-right font-bold text-slate-600">
                      {formatCurrency(product.lastPurchaseCost || 0)}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="font-black text-red-500">{formatCurrency(product.price || 0)}</div>
                      {Number(product.oldPrice || 0) > Number(product.price || 0) && (
                        <div className="text-xs font-bold text-slate-400 line-through">
                          {formatCurrency(product.oldPrice)}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {history.length ? (
                        <div className="space-y-2">
                          {history.slice(0, 4).map((row) => (
                            <div key={row.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <div className="font-black text-red-500">{formatCurrency(row.price)}</div>
                                  <div className="text-xs font-semibold text-slate-500">
                                    Cost {formatCurrency(row.baseCost || 0)} · Margin {Number(row.marginPercent || 0)}% · Suggested {formatCurrency(row.suggestedPrice || 0)}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-400">
                                    {toInputDate(row.startDate)} → {toInputDate(row.endDate) || "Không giới hạn"}
                                  </div>
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
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs font-bold text-slate-400">
                          Chưa có giá bán theo avg cost
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openCreate(product)}
                        className="rounded-md bg-blue-700 px-4 py-2 text-xs font-black text-white hover:bg-blue-800"
                      >
                        <Plus size={14} className="mr-1 inline" />
                        Set price
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
        title={draft.id ? "Edit selling price" : "Set selling price"}
        subtitle={`${draft.sku} · ${draft.productName}`}
        onClose={() => setDrawerOpen(false)}
        onSave={save}
        saveLabel="Save price"
      >
        <div className="space-y-5">
          <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="text-sm font-black text-blue-800">{draft.productName}</div>
            <div className="mt-1 text-xs font-bold text-blue-700">{draft.sku}</div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div>
                <div className="text-xs font-black uppercase text-blue-600">Base avg cost</div>
                <div className="mt-1 text-lg font-black text-blue-950">{formatCurrency(draft.baseCost)}</div>
              </div>
              <div>
                <div className="text-xs font-black uppercase text-blue-600">Suggested price</div>
                <div className="mt-1 text-lg font-black text-blue-950">{formatCurrency(draft.suggestedPrice)}</div>
              </div>
              <div>
                <div className="text-xs font-black uppercase text-blue-600">Approved price</div>
                <div className="mt-1 text-lg font-black text-red-500">{formatCurrency(draft.price)}</div>
              </div>
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <AdminTextField
              label="Base cost"
              type="number"
              suffix="đ"
              value={draft.baseCost}
              onChange={(value) => patch("baseCost", value)}
            />
            <AdminTextField
              label="Margin %"
              type="number"
              suffix="%"
              value={draft.marginPercent}
              onChange={(value) => patch("marginPercent", value)}
            />
            <AdminTextField
              label="Suggested price"
              type="number"
              suffix="đ"
              value={draft.suggestedPrice}
              onChange={(value) => patch("suggestedPrice", value)}
            />
            <AdminTextField
              label="Giá bán duyệt chính thức"
              type="number"
              suffix="đ"
              value={draft.price}
              onChange={(value) => patch("price", value)}
            />
            <AdminTextField
              label="Giá cũ / Compare at price"
              type="number"
              suffix="đ"
              value={draft.oldPrice}
              onChange={(value) => patch("oldPrice", value)}
            />
            <AdminToggle
              label="Active"
              checked={draft.active !== false}
              onChange={(value) => patch("active", value)}
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

          <AdminTextarea
            label="Ghi chú"
            rows={4}
            value={draft.note}
            onChange={(value) => patch("note", value)}
          />

          <section className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-xs font-semibold leading-5 text-amber-800">
            Giá bán chính thức có hiệu lực hôm nay sẽ cập nhật vào Product.price để homepage, product detail và checkout dùng ngay.
            Nếu muốn giá bán bằng giá vốn bình quân, nhập margin = 0%.
          </section>
        </div>
      </AdminDrawer>
    </>
  );
}
