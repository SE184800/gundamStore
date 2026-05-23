import { useEffect, useMemo, useState } from "react";
import {
  CheckSquare,
  Download,
  Eye,
  FileText,
  RefreshCcw,
  Search,
  Truck,
} from "lucide-react";
import {
  getOrders,
  ORDER_STATUS,
  updateOrderStatus,
  updatePaymentStatus,
  updateOrderShipping,
  updateOrderAdminNote,
} from "../../services/OrderService";
import { formatCurrency } from "../../utils/format";

const STATUS_TABS = [
  { key: "all", label: "Tất cả" },
  { key: "Placed", label: "Chờ xác nhận" },
  { key: "Confirmed", label: "Đã xác nhận" },
  { key: "Packing", label: "Đang đóng gói" },
  { key: "Shipping", label: "Đang giao" },
  { key: "Delivered", label: "Đã giao" },
  { key: "Completed", label: "Hoàn tất" },
  { key: "Cancelled", label: "Đã hủy" },
];

const NEXT_FLOW = ["Placed", "Confirmed", "Packing", "Shipping", "Delivered", "Completed"];

function statusClass(status) {
  if (status === "Completed") return "bg-green-100 text-green-700";
  if (status === "Delivered") return "bg-emerald-100 text-emerald-700";
  if (status === "Shipping") return "bg-blue-100 text-blue-700";
  if (status === "Packing") return "bg-purple-100 text-purple-700";
  if (status === "Confirmed") return "bg-amber-100 text-amber-700";
  if (status === "Cancelled") return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-700";
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  function reload() {
    setOrders(getOrders());
  }

  useEffect(() => {
    reload();
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const text = [
        order.id,
        order.orderCode,
        order.customer?.name,
        order.customer?.phone,
        order.customer?.address,
        order.status,
        order.shippingInfo?.trackingCode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (tab !== "all" && order.status !== tab) return false;
      if (query && !text.includes(query.toLowerCase())) return false;
      return true;
    });
  }, [orders, query, tab]);

  const summary = useMemo(() => {
    return {
      total: orders.length,
      revenue: orders.reduce((s, o) => s + (Number(o.total) || 0), 0),
      pending: orders.filter((o) => o.status === "Placed").length,
      shipping: orders.filter((o) => o.status === "Shipping").length,
      completed: orders.filter((o) => o.status === "Completed").length,
    };
  }, [orders]);

  function toggleSelect(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    const ids = filtered.map((o) => o.id);
    const allSelected = ids.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : ids);
  }

  function changeStatus(id, status) {
    updateOrderStatus(id, status);
    reload();
    setSelectedOrder(getOrders().find((o) => o.id === id) || null);
  }

  function nextStep(order) {
    const index = NEXT_FLOW.indexOf(order.status || "Placed");
    const next = NEXT_FLOW[index + 1] || "Completed";
    changeStatus(order.id, next);
  }

  function bulkStatus(status) {
    selectedIds.forEach((id) => updateOrderStatus(id, status));
    setSelectedIds([]);
    reload();
  }

  function exportCsv() {
    const rows = [
      ["Order ID", "Customer", "Phone", "Status", "Payment", "Total", "Tracking"],
      ...filtered.map((o) => [
        o.id,
        o.customer?.name || "",
        o.customer?.phone || "",
        o.status || "",
        o.paymentStatus || "",
        o.total || 0,
        o.shippingInfo?.trackingCode || "",
      ]),
    ];

    const csv = rows.map((r) => r.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(",")).join("\\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function printPickList(order) {
    const html = `
      <html>
        <head><title>Pick List ${order.id}</title></head>
        <body style="font-family: Arial; padding: 24px;">
          <h2>Phiếu soạn hàng</h2>
          <p><b>Đơn:</b> ${order.id}</p>
          <p><b>Khách:</b> ${order.customer?.name || ""} - ${order.customer?.phone || ""}</p>
          <p><b>Địa chỉ:</b> ${order.customer?.address || ""}</p>
          <hr/>
          ${(order.items || []).map(i => `<p>□ ${i.name} - SL: ${i.quantity || 1}</p>`).join("")}
          <hr/>
          <p><b>Tổng:</b> ${formatCurrency(order.total || 0)}</p>
        </body>
      </html>
    `;
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    w.print();
  }

  function saveShipping(orderId) {
    const carrier = document.getElementById("carrier")?.value || "";
    const trackingCode = document.getElementById("trackingCode")?.value || "";
    const eta = document.getElementById("eta")?.value || "";
    const adminNote = document.getElementById("adminNote")?.value || "";

    updateOrderShipping(orderId, { carrier, trackingCode, eta });
    updateOrderAdminNote(orderId, adminNote);
    reload();
    setSelectedOrder(getOrders().find((o) => o.id === orderId));
    alert("Đã lưu thông tin vận chuyển.");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-600">
            Order Operation Center
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">
            Trung tâm xử lý đơn hàng
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Quản lý trạng thái, vận chuyển, thanh toán, pick list và export đơn hàng.
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={exportCsv} className="rounded-2xl border bg-white px-4 py-3 text-sm font-black hover:bg-slate-50">
            <Download size={16} className="mr-2 inline" />
            Export CSV
          </button>
          <button onClick={reload} className="rounded-2xl border bg-white px-4 py-3 text-sm font-black hover:bg-slate-50">
            <RefreshCcw size={16} className="mr-2 inline" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Tổng đơn</p>
          <p className="mt-2 text-2xl font-black">{summary.total}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm md:col-span-2">
          <p className="text-xs font-black uppercase text-slate-400">Doanh thu</p>
          <p className="mt-2 text-2xl font-black text-red-500">{formatCurrency(summary.revenue)}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Chờ xử lý</p>
          <p className="mt-2 text-2xl font-black text-amber-600">{summary.pending}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Đang giao</p>
          <p className="mt-2 text-2xl font-black text-blue-600">{summary.shipping}</p>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`rounded-2xl px-4 py-2 text-sm font-black ${
                tab === item.key ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center rounded-2xl border px-4 py-3">
          <Search size={18} className="text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm mã đơn, khách hàng, SĐT, tracking..."
            className="ml-2 w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="rounded-3xl bg-blue-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <b>Đã chọn {selectedIds.length} đơn</b>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => bulkStatus("Confirmed")} className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-black text-white">Xác nhận</button>
              <button onClick={() => bulkStatus("Packing")} className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-black text-white">Đóng gói</button>
              <button onClick={() => bulkStatus("Shipping")} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white">Giao hàng</button>
              <button onClick={() => bulkStatus("Cancelled")} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white">Hủy</button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1550px]">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-black uppercase text-slate-500">
                <th className="px-4 py-4">
                  <button onClick={toggleSelectAll}>
                    <CheckSquare size={18} />
                  </button>
                </th>
                <th className="px-4 py-4">Action</th>
                <th className="px-4 py-4">Mã đơn</th>
                <th className="px-4 py-4">Khách hàng</th>
                <th className="px-4 py-4">SĐT</th>
                <th className="px-4 py-4">Sản phẩm</th>
                <th className="px-4 py-4">Tổng</th>
                <th className="px-4 py-4">Payment</th>
                <th className="px-4 py-4">Vận chuyển</th>
                <th className="px-4 py-4">Trạng thái</th>
                <th className="px-4 py-4">Next</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-4 py-12 text-center font-bold text-slate-400">
                    Không có đơn phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.id} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        className="h-5 w-5"
                      />
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedOrder(order)} className="rounded-xl bg-blue-50 p-2 text-blue-600">
                          <Eye size={17} />
                        </button>
                        <button onClick={() => printPickList(order)} className="rounded-xl bg-slate-100 p-2 text-slate-700">
                          <FileText size={17} />
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-black text-blue-600">{order.id}</div>
                      <div className="text-xs text-slate-400">
                        {order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "-"}
                      </div>
                    </td>

                    <td className="px-4 py-4 font-bold">{order.customer?.name || "-"}</td>
                    <td className="px-4 py-4">{order.customer?.phone || "-"}</td>

                    <td className="px-4 py-4 text-sm">
                      {(order.items || []).slice(0, 2).map((item, idx) => (
                        <div key={idx}>• {item.name} x {item.quantity || 1}</div>
                      ))}
                      {(order.items || []).length > 2 && <b className="text-slate-400">+{(order.items || []).length - 2} sản phẩm</b>}
                    </td>

                    <td className="px-4 py-4 font-black text-red-500">{formatCurrency(order.total || 0)}</td>

                    <td className="px-4 py-4">
                      <select
                        value={order.paymentStatus || "Unpaid"}
                        onChange={(e) => {
                          updatePaymentStatus(order.id, e.target.value);
                          reload();
                        }}
                        className="rounded-xl border px-3 py-2 text-xs font-black"
                      >
                        <option>Unpaid</option>
                        <option>Paid</option>
                        <option>Refunded</option>
                      </select>
                    </td>

                    <td className="px-4 py-4 text-sm">
                      <div className="font-bold">{order.shippingInfo?.carrier || order.shippingMethod || "-"}</div>
                      <div className="text-xs text-slate-400">{order.shippingInfo?.trackingCode || "No tracking"}</div>
                    </td>

                    <td className="px-4 py-4">
                      <select
                        value={order.status || "Placed"}
                        onChange={(e) => changeStatus(order.id, e.target.value)}
                        className={`rounded-xl px-3 py-2 text-xs font-black ${statusClass(order.status)}`}
                      >
                        {Object.values(ORDER_STATUS).map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-4">
                      <button onClick={() => nextStep(order)} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white hover:bg-blue-600">
                        Next step
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[9999] bg-black/40 p-6">
          <div className="ml-auto h-full w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b pb-5">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">Order Detail</p>
                <h2 className="mt-2 text-2xl font-black">{selectedOrder.id}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString("vi-VN") : "-"}
                </p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="rounded-2xl border px-5 py-3 font-black">Đóng</button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-6">
              {NEXT_FLOW.map((step) => (
                <button
                  key={step}
                  onClick={() => changeStatus(selectedOrder.id, step)}
                  className={`rounded-2xl p-3 text-xs font-black ${
                    selectedOrder.status === step ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {step}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-3xl border p-5">
                <h3 className="font-black">Khách hàng</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <p><b>Tên:</b> {selectedOrder.customer?.name || "-"}</p>
                  <p><b>SĐT:</b> {selectedOrder.customer?.phone || "-"}</p>
                  <p><b>Tỉnh/TP:</b> {selectedOrder.customer?.province || "-"}</p>
                  <p><b>Địa chỉ:</b> {selectedOrder.customer?.address || "-"}</p>
                  <p><b>Ghi chú:</b> {selectedOrder.customer?.note || "-"}</p>
                </div>
              </div>

              <div className="rounded-3xl border p-5">
                <h3 className="font-black">Shipment</h3>
                <div className="mt-3 grid gap-3">
                  <input id="carrier" defaultValue={selectedOrder.shippingInfo?.carrier || ""} placeholder="Carrier: GHN / GHTK / Viettel Post" className="rounded-xl border px-4 py-3" />
                  <input id="trackingCode" defaultValue={selectedOrder.shippingInfo?.trackingCode || ""} placeholder="Tracking code" className="rounded-xl border px-4 py-3" />
                  <input id="eta" defaultValue={selectedOrder.shippingInfo?.eta || ""} placeholder="ETA: 1-3 ngày" className="rounded-xl border px-4 py-3" />
                  <textarea id="adminNote" defaultValue={selectedOrder.adminNote || ""} placeholder="Ghi chú nội bộ" rows={3} className="rounded-xl border px-4 py-3" />
                  <button onClick={() => saveShipping(selectedOrder.id)} className="rounded-2xl bg-blue-600 py-3 font-black text-white">
                    <Truck size={17} className="mr-2 inline" />
                    Lưu vận chuyển
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border">
              <div className="border-b bg-slate-50 px-5 py-4 font-black">Pick list sản phẩm</div>
              {(selectedOrder.items || []).map((item, idx) => (
                <div key={idx} className="flex gap-4 border-b p-5 last:border-b-0">
                  <img src={item.image} className="h-20 w-20 rounded-2xl bg-slate-100 object-cover" />
                  <div className="flex-1">
                    <div className="font-black">{item.name}</div>
                    <div className="mt-1 text-sm text-slate-500">SL cần soạn: {item.quantity || 1}</div>
                    <div className="mt-1 font-bold text-red-500">{formatCurrency(item.price || 0)}</div>
                  </div>
                  <div className="font-black">{formatCurrency((item.price || 0) * (item.quantity || 1))}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-3xl bg-slate-50 p-5">
              <h3 className="font-black">Timeline logs</h3>
              <div className="mt-4 space-y-3">
                {(selectedOrder.timeline || []).map((item, index) => (
                  <div key={index} className="rounded-2xl bg-white p-4 text-sm">
                    <b>{item.title || item.status}</b>
                    <p className="mt-1 text-slate-500">{item.note}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.time ? new Date(item.time).toLocaleString("vi-VN") : "-"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-between rounded-3xl bg-blue-50 p-5 text-xl font-black">
              <span>Tổng đơn</span>
              <span className="text-red-500">{formatCurrency(selectedOrder.total || 0)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
