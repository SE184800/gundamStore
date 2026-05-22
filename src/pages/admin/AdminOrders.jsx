import { useEffect, useMemo, useState } from "react";
import { Eye, RefreshCcw, Search, Trash2 } from "lucide-react";
import {
  deleteOrder,
  getOrders,
  ORDER_STATUS,
  updateOrderStatus,
  updatePaymentStatus,
} from "../../services/OrderService";
import { formatCurrency } from "../../utils/format";

const STATUSES = Object.values(ORDER_STATUS);
const PAYMENT_STATUSES = ["Unpaid", "Paid", "Refunded"];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);

  function reload() {
    setOrders(getOrders());
  }

  useEffect(() => {
    reload();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const q = query.toLowerCase();

      const haystack = [
        order.id,
        order.orderCode,
        order.customer?.name,
        order.customer?.phone,
        order.customer?.address,
        order.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (q && !haystack.includes(q)) return false;
      if (statusFilter !== "all" && order.status !== statusFilter) return false;

      return true;
    });
  }, [orders, query, statusFilter]);

  const summary = useMemo(() => {
    return {
      totalOrders: orders.length,
      revenue: orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
      placed: orders.filter((o) => o.status === "Placed").length,
      shipping: orders.filter((o) => o.status === "Shipping").length,
      completed: orders.filter((o) => o.status === "Completed").length,
      cancelled: orders.filter((o) => o.status === "Cancelled").length,
    };
  }, [orders]);

  function changeStatus(id, status) {
    updateOrderStatus(id, status);
    reload();
  }

  function changePayment(id, paymentStatus) {
    updatePaymentStatus(id, paymentStatus);
    reload();
  }

  function removeOrder(id) {
    if (!confirm("Bạn có chắc muốn xóa đơn này không?")) return;
    deleteOrder(id);
    reload();
  }

  function badgeClass(status) {
    if (status === "Completed") return "bg-green-100 text-green-700";
    if (status === "Shipping") return "bg-blue-100 text-blue-700";
    if (status === "Packing") return "bg-purple-100 text-purple-700";
    if (status === "Confirmed") return "bg-amber-100 text-amber-700";
    if (status === "Cancelled") return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-700";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-600">
            Sales & Orders
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">
            Quản lý đơn hàng
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Theo dõi đơn hàng, xử lý trạng thái, thanh toán và xem chi tiết đơn.
          </p>
        </div>

        <button
          onClick={reload}
          className="rounded-2xl border bg-white px-4 py-3 text-sm font-black hover:bg-slate-50"
        >
          <RefreshCcw size={16} className="mr-2 inline" />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Orders</p>
          <p className="mt-2 text-2xl font-black">{summary.totalOrders}</p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm xl:col-span-2">
          <p className="text-xs font-black uppercase text-slate-400">Revenue</p>
          <p className="mt-2 text-2xl font-black text-red-500">
            {formatCurrency(summary.revenue)}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Placed</p>
          <p className="mt-2 text-2xl font-black">{summary.placed}</p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Shipping</p>
          <p className="mt-2 text-2xl font-black text-blue-600">{summary.shipping}</p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Done</p>
          <p className="mt-2 text-2xl font-black text-green-600">{summary.completed}</p>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="flex items-center rounded-2xl border px-4 py-3">
            <Search size={18} className="text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm mã đơn, tên khách, số điện thoại, địa chỉ..."
              className="ml-2 w-full bg-transparent text-sm outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-2xl border px-4 py-3 text-sm font-bold outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1450px]">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-black uppercase text-slate-500">
                <th className="px-4 py-4">Action</th>
                <th className="px-4 py-4">Mã đơn</th>
                <th className="px-4 py-4">Ngày</th>
                <th className="px-4 py-4">Khách hàng</th>
                <th className="px-4 py-4">SĐT</th>
                <th className="px-4 py-4">Sản phẩm</th>
                <th className="px-4 py-4">Voucher</th>
                <th className="px-4 py-4">Payment</th>
                <th className="px-4 py-4">Tổng tiền</th>
                <th className="px-4 py-4">Trạng thái</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-4 py-12 text-center font-bold text-slate-400">
                    Chưa có đơn hàng phù hợp.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="rounded-xl bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          onClick={() => removeOrder(order.id)}
                          className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-black text-blue-600">{order.id}</div>
                      <div className="text-xs text-slate-400">{order.orderCode}</div>
                    </td>

                    <td className="px-4 py-4 text-sm">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "-"}
                    </td>

                    <td className="px-4 py-4 font-bold">
                      {order.customer?.name || "-"}
                    </td>

                    <td className="px-4 py-4 text-sm">
                      {order.customer?.phone || "-"}
                    </td>

                    <td className="px-4 py-4 text-sm">
                      {(order.items || []).slice(0, 2).map((item, index) => (
                        <div key={index}>• {item.name} x {item.quantity || 1}</div>
                      ))}
                      {(order.items || []).length > 2 && (
                        <div className="font-bold text-slate-400">
                          +{(order.items || []).length - 2} sản phẩm
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4 text-sm font-bold text-green-600">
                      {order.voucherCode || "-"}
                    </td>

                    <td className="px-4 py-4">
                      <select
                        value={order.paymentStatus || "Unpaid"}
                        onChange={(e) => changePayment(order.id, e.target.value)}
                        className="rounded-xl border px-3 py-2 text-xs font-black"
                      >
                        {PAYMENT_STATUSES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-4 font-black text-red-500">
                      {formatCurrency(Number(order.total) || 0)}
                    </td>

                    <td className="px-4 py-4">
                      <select
                        value={order.status || "Placed"}
                        onChange={(e) => changeStatus(order.id, e.target.value)}
                        className={`rounded-xl px-3 py-2 text-xs font-black ${badgeClass(order.status)}`}
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
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
          <div className="ml-auto h-full w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b pb-5">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
                  Order Detail
                </p>
                <h2 className="mt-2 text-2xl font-black">{selectedOrder.id}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedOrder.createdAt
                    ? new Date(selectedOrder.createdAt).toLocaleString("vi-VN")
                    : "-"}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-2xl border px-5 py-3 font-black"
              >
                Đóng
              </button>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-3xl border p-5">
                <h3 className="font-black">Khách hàng</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <p><b>Tên:</b> {selectedOrder.customer?.name || "-"}</p>
                  <p><b>SĐT:</b> {selectedOrder.customer?.phone || "-"}</p>
                  <p><b>Địa chỉ:</b> {selectedOrder.customer?.address || "-"}</p>
                  <p><b>Tỉnh/TP:</b> {selectedOrder.customer?.province || "-"}</p>
                  <p><b>Ghi chú:</b> {selectedOrder.customer?.note || "-"}</p>
                </div>
              </div>

              <div className="rounded-3xl border p-5">
                <h3 className="font-black">Thanh toán</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <p><b>Payment method:</b> {selectedOrder.paymentMethod || "-"}</p>
                  <p><b>Payment status:</b> {selectedOrder.paymentStatus || "-"}</p>
                  <p><b>Shipping:</b> {selectedOrder.shippingMethod || "-"}</p>
                  <p><b>Voucher:</b> {selectedOrder.voucherCode || "-"}</p>
                  <p><b>Total:</b> <span className="font-black text-red-500">{formatCurrency(selectedOrder.total)}</span></p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border">
              <div className="border-b bg-slate-50 px-5 py-4 font-black">
                Sản phẩm
              </div>

              {(selectedOrder.items || []).map((item, index) => (
                <div key={index} className="flex gap-4 border-b p-5 last:border-b-0">
                  <img src={item.image} className="h-20 w-20 rounded-2xl bg-slate-100 object-cover" />
                  <div className="flex-1">
                    <div className="font-black">{item.name}</div>
                    <div className="mt-1 text-sm text-slate-500">SL: {item.quantity || 1}</div>
                    <div className="mt-1 font-bold text-red-500">{formatCurrency(item.price)}</div>
                  </div>
                  <div className="font-black">
                    {formatCurrency((Number(item.price) || 0) * (item.quantity || 1))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-3xl bg-slate-50 p-5">
              <h3 className="font-black">Timeline xử lý</h3>
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
              <span className="text-red-500">
                {formatCurrency(Number(selectedOrder.total) || 0)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
