
import { useMemo, useState } from "react";
import { Save } from "lucide-react";
import { useCms, useLang } from "../../store/CmsStore";
import { formatCurrency, getText } from "../../utils/format";

export default function AdminPricingInventory() {
  const { state, actions } = useCms();
  const [lang] = useLang();
  const [selectedProductId, setSelectedProductId] = useState(state.products?.[0]?.id || "");

  const product = state.products.find((p) => p.id === selectedProductId);
  const currentPrice = (state.productPrices || []).find((p) => p.productId === selectedProductId && p.channel === "website") || {};
  const currentInventory = (state.inventory || []).find((i) => i.productId === selectedProductId && i.warehouseId === "main") || {};

  const [priceDraft, setPriceDraft] = useState({});
  const [inventoryDraft, setInventoryDraft] = useState({});

  const price = { productId: selectedProductId, channel: "website", customerGroup: "retail", currency: "VND", active: true, ...currentPrice, ...priceDraft };
  const inventory = { productId: selectedProductId, warehouseId: "main", onHand: 0, reserved: 0, incoming: 0, lowStockThreshold: 3, ...currentInventory, ...inventoryDraft };

  function selectProduct(id) {
    setSelectedProductId(id);
    setPriceDraft({});
    setInventoryDraft({});
  }

  function savePrice() {
    actions.saveProductPrice({
      ...price,
      price: Number(price.price || 0),
      compareAtPrice: Number(price.compareAtPrice || 0),
      costPrice: Number(price.costPrice || 0),
    });
    setPriceDraft({});
  }

  function saveInventory() {
    actions.saveInventory({
      ...inventory,
      onHand: Number(inventory.onHand || 0),
      reserved: Number(inventory.reserved || 0),
      incoming: Number(inventory.incoming || 0),
      lowStockThreshold: Number(inventory.lowStockThreshold || 0),
    });
    setInventoryDraft({});
  }

  const rows = useMemo(() => state.products.map((p) => {
    const pr = (state.productPrices || []).find((item) => item.productId === p.id && item.channel === "website");
    const inv = (state.inventory || []).find((item) => item.productId === p.id && item.warehouseId === "main");
    return { product: p, price: pr, inventory: inv };
  }), [state.products, state.productPrices, state.inventory]);

  return (
    <>
      <section className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/50">
        <h1 className="text-3xl font-black text-slate-950">Pricing & Inventory</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Tách riêng bảng giá, tồn kho và lịch sử cập nhật khỏi Product Master.</p>
      </section>

      <section className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 text-sm font-black text-slate-950">Products</div>
          <div className="space-y-2">
            {state.products.map((p) => (
              <button key={p.id} onClick={() => selectProduct(p.id)} className={`w-full rounded-2xl px-3 py-3 text-left text-sm font-black ${selectedProductId === p.id ? "bg-blue-700 text-white" : "bg-slate-50 text-slate-700 hover:bg-blue-50"}`}>
                {getText(p.name, lang)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 text-xl font-black text-slate-950">{product ? getText(product.name, lang) : "Select product"}</div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
                <div className="mb-3 text-sm font-black text-blue-900">Pricing</div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input type="number" value={price.price || 0} onChange={(e) => setPriceDraft((p) => ({ ...p, price: e.target.value }))} placeholder="Price" className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-bold outline-none" />
                  <input type="number" value={price.compareAtPrice || 0} onChange={(e) => setPriceDraft((p) => ({ ...p, compareAtPrice: e.target.value }))} placeholder="Compare price" className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-bold outline-none" />
                  <input type="number" value={price.costPrice || 0} onChange={(e) => setPriceDraft((p) => ({ ...p, costPrice: e.target.value }))} placeholder="Cost price" className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-bold outline-none" />
                  <select value={price.customerGroup || "retail"} onChange={(e) => setPriceDraft((p) => ({ ...p, customerGroup: e.target.value }))} className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-bold">
                    <option value="retail">retail</option>
                    <option value="vip">vip</option>
                    <option value="wholesale">wholesale</option>
                  </select>
                </div>
                <button onClick={savePrice} className="mt-4 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white"><Save className="mr-2 inline" size={16}/>Save price</button>
              </div>

              <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="mb-3 text-sm font-black text-emerald-900">Inventory</div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input type="number" value={inventory.onHand || 0} onChange={(e) => setInventoryDraft((p) => ({ ...p, onHand: e.target.value }))} placeholder="On hand" className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-bold outline-none" />
                  <input type="number" value={inventory.reserved || 0} onChange={(e) => setInventoryDraft((p) => ({ ...p, reserved: e.target.value }))} placeholder="Reserved" className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-bold outline-none" />
                  <input type="number" value={inventory.incoming || 0} onChange={(e) => setInventoryDraft((p) => ({ ...p, incoming: e.target.value }))} placeholder="Incoming" className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-bold outline-none" />
                  <input type="number" value={inventory.lowStockThreshold || 0} onChange={(e) => setInventoryDraft((p) => ({ ...p, lowStockThreshold: e.target.value }))} placeholder="Low stock threshold" className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-bold outline-none" />
                </div>
                <button onClick={saveInventory} className="mt-4 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white"><Save className="mr-2 inline" size={16}/>Save inventory</button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 text-xl font-black text-slate-950">Overview</div>
            <div className="grid gap-3">
              {rows.map(({ product, price, inventory }) => (
                <div key={product.id} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_130px_100px_100px] md:items-center">
                  <div className="font-black text-slate-950">{getText(product.name, lang)}</div>
                  <div className="font-black text-blue-700">{formatCurrency(price?.price || product.price || 0)}</div>
                  <div className="text-sm font-black text-emerald-700">Avail: {inventory?.available ?? product.stock ?? 0}</div>
                  <div className="text-sm font-black text-slate-500">Incoming: {inventory?.incoming || 0}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
