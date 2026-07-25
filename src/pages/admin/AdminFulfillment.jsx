import { useEffect, useMemo, useState } from "react";
import { Boxes, CheckCircle2, ClipboardList, Eye, PackageCheck, Printer, RefreshCcw, Search, Truck } from "lucide-react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import { AdminSelect, AdminTextarea, AdminTextField } from "../../components/admin/AdminField";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { formatCurrency } from "../../utils/format";
import useToast from "../../hooks/useToast";
import Toast from "../../utils/Toast";
import { escapePrintHtml } from "../../utils/escapePrintHtml";
import {
  bulkAdminFulfillmentActionApi,
  getAdminFulfillmentOrdersApi,
  updateAdminFulfillmentActionApi,
} from "../../services/AdminFulfillmentApiService";

const STAGE_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "PLACED", label: "Placed" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PACKING", label: "Packing" },
  { value: "READY_TO_SHIP", label: "Ready to ship" },
  { value: "SHIPPING", label: "Shipping" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "COMPLETED", label: "Completed" },
];

const CARRIER_OPTIONS = [
  { value: "", label: "Select carrier" },
  { value: "GHN", label: "GHN" },
  { value: "GHTK", label: "GHTK" },
  { value: "Viettel Post", label: "Viettel Post" },
  { value: "J&T Express", label: "J&T Express" },
  { value: "Ninja Van", label: "Ninja Van" },
  { value: "Shop Delivery", label: "Shop Delivery" },
];

const SHIPPING_METHOD_OPTIONS = [
  { value: "FAST", label: "Fast" },
  { value: "STANDARD", label: "Standard" },
  { value: "SAME_DAY", label: "Same day" },
  { value: "PICKUP", label: "Store pickup" },
];

function stageClass(stage = "") {
  if (stage === "PLACED") return "bg-amber-50 text-amber-700";
  if (stage === "CONFIRMED") return "bg-blue-50 text-blue-700";
  if (stage === "PACKING" || stage === "READY_TO_SHIP") return "bg-violet-50 text-violet-700";
  if (stage === "SHIPPING") return "bg-cyan-50 text-cyan-700";
  if (stage === "DELIVERED" || stage === "COMPLETED") return "bg-emerald-50 text-emerald-700";
  if (stage === "CANCELLED" || stage === "REFUNDED") return "bg-red-50 text-red-700";
  return "bg-slate-100 text-slate-600";
}

function shortDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN");
}

function printablePackingList(order) {
  const orderCode = escapePrintHtml(order.orderCode || "");
  const customerName = escapePrintHtml(order.customer?.name || "");
  const customerPhone = escapePrintHtml(order.customer?.phone || "");
  const customerAddress = escapePrintHtml(order.customer?.address || "");

  const rows = (order.items || [])
    .map((item) => {
      const sku = escapePrintHtml(item.sku || "");
      const name = escapePrintHtml(item.variantName || item.name || "");
      return `
        <tr>
          <td>${sku}</td>
          <td>${name}</td>
          <td style="text-align:right">${item.quantity || 0}</td>
        </tr>`;
    })
    .join("");

  return `
    <html>
      <head>
        <title>Packing List ${orderCode}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          h1 { font-size: 22px; margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 18px; }
          th, td { border: 1px solid #ddd; padding: 10px; font-size: 13px; }
          th { background: #f5f5f5; text-align: left; }
          .box { border: 1px solid #ddd; padding: 12px; margin-top: 12px; }
        </style>
      </head>
      <body>
        <h1>Packing List</h1>
        <div>Order: <strong>${orderCode}</strong></div>
        <div class="box">
          <div><strong>Customer:</strong> ${customerName}</div>
          <div><strong>Phone:</strong> ${customerPhone}</div>
          <div><strong>Address:</strong> ${customerAddress}</div>
        </div>
        <table>
          <thead>
            <tr><th>SKU</th><th>Item</th><th>Qty</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `;
}

function printPackingList(order) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  win.document.write(printablePackingList(order));
  win.document.close();
  win.focus();
  win.print();
}

export default function AdminFulfillment() {
  const { toast, notify, dismiss } = useToast();
  const [orders, setOrders] = useState([]);
  const [pickList, setPickList] = useState([]);
  const [summary, setSummary] = useState({});
  const [stage, setStage] = useState("ALL");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [shippingForm, setShippingForm] = useState({
    carrier: "",
    trackingCode: "",
    shippingMethod: "FAST",
    fee: 0,
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  async function reload() {
    setLoading(true);
    setApiError("");

    try {
      const data = await getAdminFulfillmentOrdersApi({ stage, q: query });
      setOrders(data.orders);
      setPickList(data.pickList || []);
      setSummary(data.summary || {});
      setSelectedIds([]);

      if (selectedOrder) {
        const refreshed = data.orders.find((item) => item.id === selectedOrder.id);
        setSelectedOrder(refreshed || null);
      }
    } catch (error) {
      setApiError(error?.message || "Cannot load fulfillment center.");
      setOrders([]);
      setPickList([]);
      setSummary({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const selectedOrders = useMemo(() => {
    return orders.filter((order) => selectedIds.includes(order.id));
  }, [orders, selectedIds]);

  function toggleSelected(id) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      return [...prev, id];
    });
  }

  function openDetail(order) {
    setSelectedOrder(order);
    setShippingForm({
      carrier: order.latestShipment?.carrier || order.shippingInfo?.carrier || "",
      trackingCode: order.latestShipment?.trackingCode || order.shippingInfo?.trackingCode || "",
      shippingMethod: order.latestShipment?.shippingMethod || order.shippingMethod || "FAST",
      fee: Number(order.latestShipment?.fee || order.shippingFee || 0),
      note: "",
    });
    setDrawerOpen(true);
  }

  async function runAction(order, action, extra = {}) {
    try {
      await updateAdminFulfillmentActionApi(order.id, {
        action,
        ...extra,
      });
      await reload();
    } catch (error) {
      notify("error", error?.message || "Fulfillment update failed.");
    }
  }

  async function saveShip() {
    if (!selectedOrder) return;

    try {
      await updateAdminFulfillmentActionApi(selectedOrder.id, {
        action: "SHIP",
        ...shippingForm,
        fee: Number(shippingForm.fee || 0),
      });
      setDrawerOpen(false);
      await reload();
    } catch (error) {
      notify("error", error?.message || "Ship order failed.");
    }
  }

  async function bulkAction(action) {
    if (!selectedIds.length) {
      notify("error", "Select at least one order.");
      return;
    }

    if (!window.confirm(`Run ${action} for ${selectedIds.length} order(s)?`)) return;

    try {
      await bulkAdminFulfillmentActionApi(selectedIds, action, `Bulk ${action}`);
      await reload();
    } catch (error) {
      notify("error", error?.message || "Bulk action failed.");
    }
  }

  return (
    <>
      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={dismiss} />
      <AdminPageHeader
        eyebrow="Operations"
        title="Shipping / Fulfillment Center"
        desc="Confirm, pack, print pick list, create shipment tracking, and manage delivery workflow."
        action={
          <button onClick={() => void reload()} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">
            <RefreshCcw size={15} className="mr-1 inline" />
            Refresh
          </button>
        }
      />

      {apiError && (
        <section className="mb-4 rounded-3xl border border-red-100 bg-red-50 p-4 text-sm font-black text-red-700">
          {apiError}
        </section>
      )}

      <section className="mb-4 grid gap-4 md:grid-cols-6">
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">Total</p><p className="mt-2 text-2xl font-black">{summary.total || 0}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">Placed</p><p className="mt-2 text-2xl font-black text-amber-600">{summary.placed || 0}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">Packing</p><p className="mt-2 text-2xl font-black text-violet-600">{summary.packing || 0}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">Shipping</p><p className="mt-2 text-2xl font-black text-cyan-600">{summary.shipping || 0}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">Delivered</p><p className="mt-2 text-2xl font-black text-emerald-600">{summary.delivered || 0}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">Need tracking</p><p className="mt-2 text-2xl font-black text-red-600">{summary.needsTracking || 0}</p></div>
      </section>

      <section className="mb-4 rounded-md border border-slate-200 bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[220px_1fr_auto_auto_auto]">
          <AdminSelect label="Stage" options={STAGE_OPTIONS} value={stage} onChange={setStage} />
          <div className="flex items-center self-end rounded-md border border-slate-300 bg-white px-3">
            <Search size={16} className="text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search order, customer, phone, tracking..."
              className="w-full bg-transparent px-3 py-3 text-sm font-semibold outline-none"
            />
          </div>
          <button onClick={() => void reload()} className="self-end rounded-md bg-slate-900 px-4 py-3 text-xs font-black text-white hover:bg-slate-800">
            Search
          </button>
          <button onClick={() => void bulkAction("CONFIRM")} className="self-end rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-black text-blue-700 disabled:opacity-50" disabled={!selectedIds.length}>
            Bulk confirm
          </button>
          <button onClick={() => void bulkAction("PACK")} className="self-end rounded-md border border-violet-200 bg-violet-50 px-4 py-3 text-xs font-black text-violet-700 disabled:opacity-50" disabled={!selectedIds.length}>
            Bulk pack
          </button>
        </div>
      </section>

      <section className="mb-4 rounded-3xl border border-blue-100 bg-blue-50 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-black text-blue-900">
          <ClipboardList size={16} />
          Aggregate pick list for confirmed/packing orders
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {pickList.slice(0, 8).map((item) => (
            <div key={`${item.sku}-${item.variantId}`} className="rounded-2xl bg-white p-3 shadow-sm">
              <div className="text-xs font-black text-slate-500">{item.sku}</div>
              <div className="mt-1 line-clamp-2 text-sm font-black text-slate-950">{item.name}</div>
              <div className="mt-2 text-lg font-black text-blue-700">Qty {item.quantity}</div>
              <div className="text-xs font-bold text-slate-400">{item.orderCount} order line(s)</div>
            </div>
          ))}
          {!pickList.length && (
            <div className="rounded-2xl border border-dashed border-blue-200 bg-white/70 p-5 text-sm font-bold text-blue-700">
              No active pick list.
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3"><input type="checkbox" checked={orders.length > 0 && selectedIds.length === orders.length} onChange={(e) => setSelectedIds(e.target.checked ? orders.map((order) => order.id) : [])} /></th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Shipment</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Quick actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selectedIds.includes(order.id)} onChange={() => toggleSelected(order.id)} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-black text-slate-950">{order.orderCode}</div>
                    <div className="text-xs font-bold text-slate-500">{shortDate(order.createdAt)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-black text-slate-900">{order.customer?.name}</div>
                    <div className="text-xs font-bold text-slate-500">{order.customer?.phone}</div>
                    <div className="line-clamp-1 text-xs text-slate-400">{order.customer?.address}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${stageClass(order.fulfillmentStage || order.status)}`}>
                      {order.fulfillmentStage || order.status}
                    </span>
                    {order.needsTracking && <div className="mt-2 text-xs font-black text-red-600">Missing tracking</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-bold text-slate-600">
                      {(order.items || []).slice(0, 3).map((item) => `${item.quantity}x ${item.variantName || item.name || item.sku}`).join(", ")}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-600">
                    <div>{order.latestShipment?.carrier || order.shippingInfo?.carrier || "-"}</div>
                    <div className="mt-1 font-black text-slate-900">{order.latestShipment?.trackingCode || order.shippingInfo?.trackingCode || "-"}</div>
                  </td>
                  <td className="px-4 py-3 font-black text-emerald-600">{formatCurrency(order.total)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {order.canConfirm && <button onClick={() => void runAction(order, "CONFIRM")} className="rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">Confirm</button>}
                      {order.canPack && <button onClick={() => void runAction(order, "PACK")} className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-black text-white">Pack</button>}
                      {order.canShip && <button onClick={() => openDetail(order)} className="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-black text-white">Ship</button>}
                      {order.canDeliver && <button onClick={() => void runAction(order, "DELIVER")} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white">Deliver</button>}
                      {order.canComplete && <button onClick={() => void runAction(order, "COMPLETE")} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white">Complete</button>}
                      <button onClick={() => printPackingList(order)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">
                        <Printer size={13} className="mr-1 inline" /> Print
                      </button>
                      <button onClick={() => openDetail(order)} className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 hover:bg-blue-100">
                        <Eye size={13} className="mr-1 inline" /> Detail
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!orders.length && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm font-bold text-slate-400">
                    {loading ? "Loading fulfillment orders..." : "No fulfillment orders found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AdminDrawer
        open={drawerOpen}
        title={selectedOrder ? `Fulfillment ${selectedOrder.orderCode}` : "Fulfillment detail"}
        onClose={() => setDrawerOpen(false)}
        onSave={selectedOrder?.canShip ? () => void saveShip() : undefined}
        saveLabel="Ship order"
        width="max-w-4xl"
      >
        {selectedOrder && (
          <div className="space-y-5">
            <section className="grid gap-4 md:grid-cols-4">
              <div className="rounded-3xl bg-blue-50 p-4">
                <div className="text-xs font-black uppercase text-blue-600">Order</div>
                <div className="mt-2 text-lg font-black">{selectedOrder.orderCode}</div>
              </div>
              <div className="rounded-3xl bg-violet-50 p-4">
                <div className="text-xs font-black uppercase text-violet-600">Stage</div>
                <div className="mt-2 text-lg font-black">{selectedOrder.fulfillmentStage}</div>
              </div>
              <div className="rounded-3xl bg-emerald-50 p-4">
                <div className="text-xs font-black uppercase text-emerald-600">Total</div>
                <div className="mt-2 text-lg font-black">{formatCurrency(selectedOrder.total)}</div>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="text-xs font-black uppercase text-slate-500">Payment</div>
                <div className="mt-2 text-lg font-black">{selectedOrder.paymentStatus}</div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900">
                <Boxes size={16} />
                Pick / pack items
              </div>
              <div className="space-y-2">
                {(selectedOrder.items || []).map((item) => (
                  <div key={item.id} className="grid grid-cols-[1fr_auto] rounded-2xl bg-slate-50 p-3 text-sm">
                    <div>
                      <div className="font-black text-slate-900">{item.variantName || item.name}</div>
                      <div className="text-xs font-bold text-slate-500">{item.sku}</div>
                    </div>
                    <div className="text-lg font-black text-blue-700">x{item.quantity}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-cyan-100 bg-cyan-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-black text-cyan-900">
                <Truck size={16} />
                Shipping information
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <AdminSelect label="Carrier" options={CARRIER_OPTIONS} value={shippingForm.carrier} onChange={(value) => setShippingForm((prev) => ({ ...prev, carrier: value }))} />
                <AdminSelect label="Shipping method" options={SHIPPING_METHOD_OPTIONS} value={shippingForm.shippingMethod} onChange={(value) => setShippingForm((prev) => ({ ...prev, shippingMethod: value }))} />
                <AdminTextField label="Tracking code" value={shippingForm.trackingCode} onChange={(value) => setShippingForm((prev) => ({ ...prev, trackingCode: value }))} />
                <AdminTextField label="Fee" type="number" value={shippingForm.fee} onChange={(value) => setShippingForm((prev) => ({ ...prev, fee: value }))} />
                <AdminTextarea label="Fulfillment note" rows={3} value={shippingForm.note} onChange={(value) => setShippingForm((prev) => ({ ...prev, note: value }))} />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900">
                <PackageCheck size={16} />
                Timeline
              </div>
              <div className="space-y-2">
                {(selectedOrder.auditLogs || selectedOrder.backendRaw?.auditLogs || []).slice(0, 10).map((log) => (
                  <div key={log.id} className="rounded-2xl bg-slate-50 p-3 text-xs font-bold text-slate-600">
                    <div className="font-black text-slate-900">{log.action}</div>
                    <div className="mt-1">{shortDate(log.createdAt)}</div>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex flex-wrap gap-2">
              <button onClick={() => printPackingList(selectedOrder)} className="rounded-2xl border border-slate-200 px-4 py-3 text-xs font-black text-slate-700 hover:bg-slate-50">
                <Printer size={14} className="mr-1 inline" />
                Print packing list
              </button>
              {selectedOrder.canConfirm && <button onClick={() => void runAction(selectedOrder, "CONFIRM")} className="rounded-2xl bg-blue-700 px-4 py-3 text-xs font-black text-white hover:bg-blue-800">Confirm</button>}
              {selectedOrder.canPack && <button onClick={() => void runAction(selectedOrder, "PACK")} className="rounded-2xl bg-violet-600 px-4 py-3 text-xs font-black text-white">Pack</button>}
              {selectedOrder.canDeliver && <button onClick={() => void runAction(selectedOrder, "DELIVER")} className="rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-black text-white">Mark delivered</button>}
              {selectedOrder.canComplete && <button onClick={() => void runAction(selectedOrder, "COMPLETE")} className="rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black text-white">Complete</button>}
            </div>
          </div>
        )}
      </AdminDrawer>
    </>
  );
}
