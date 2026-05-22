import { useEffect, useMemo, useState } from "react";
import { Eye, RefreshCcw, Trash2 } from "lucide-react";
import { useCms } from "../../store/CmsStore";
import { formatCurrency } from "../../utils/format";

const CMS_KEY = "gundam-cms-state";
const ORDER_STATUSES = ["Placed", "Confirmed", "Packing", "Shipping", "Completed", "Cancelled"];

function loadOrdersFromStorage() {
  try {
    const cms = JSON.parse(localStorage.getItem(CMS_KEY) || "{}");
    return Array.isArray(cms.orders) ? cms.orders : [];
  } catch {
    return [];
  }
}

function saveOrdersToStorage(orders) {
  const cms = JSON.parse(localStorage.getItem(CMS_KEY) || "{}");
  localStorage.setItem(CMS_KEY, JSON.stringify({ ...cms, orders }));
}

export default function AdminOrders() {
  const { state } = useCms();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  function reloadOrders() {
    const storageOrders = loadOrdersFromStorage();
    const stateOrders = Array.isArray(state.orders) ? state.orders : [];

    const merged = [...storageOrders, ...stateOrders].reduce((acc, order) => {
      if (!order?.id) return acc;
      if (!acc.find((x) => x.id === order.id)) acc.push(order);
      return acc;
    }, []);

    setOrders(merged);
    saveOrdersToStorage(merged);
  }

  useEffect(() => {
    reloadOrders();

    const timer = setInterval(reloadOrders, 1000);
    return () => clearInterval(timer);
  }, []);

  function updateStatus(orderId, status) {
    const updated = orders.map((order) =>
      order.id === orderId ? { ...order, status } : order
    );

    setOrders(updated);
    saveOrdersToStorage(updated);
  }

  function deleteOrder(orderId) {
    if (!confirm("Bạn có chắc muốn xóa đơn hàng này không?")) return;

    const updated = orders.filter((order) => order.id !== orderId);
    setOrders(updated);
    saveOrdersToStorage(updated);
  }

  const summary = useMemo(() => {
    return {
      totalOrders: orders.length,
      revenue: orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0),
      placed: orders.filter((o) => o.status === "Placed").length,
      shipping: orders.filter((o) => o.status === "Shipping").length,
      completed: orders.filter((o) => o.status === "Completed").length,
      cancelled: orders.filter((o) => o.status === "Cancelled").length,
    };
  }, [orders]);

  function statusClass(status) {
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
          <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
            Sales & Orders
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">
            Quản lý đơn hàng
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Theo dõi đơn checkout từ storefront, cập nhật trạng thái xử lý và xem chi tiết đơn hàng.
          </p>
        </div>

        <button
          onClick={reloadOrders}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
        >
          <RefreshCcw size={16} className="mr-2 inline" />
          Refresh orders
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-xs font-black uppercase text-slate-400">Total orders</p>
          <p className="mt-2 text-2xl font-black">{summary.totalOrders}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-xs font-black uppercase text-slate-400">Revenue</p>
          <p className="mt-2 text-2xl font-black text-red-500">{formatCurrency(summary.revenue)}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-xs font-black uppercase text-slate-400">Placed</p>
          <p className="mt-2 text-2xl font-black">{summary.placed}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-xs font-black uppercase text-slate-400">Shipping</p>
          <p className="mt-2 text-2xl font-black text-blue-600">{summary.shipping}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-xs font-black uppercase text-slate-400">Completed</p>
          <p className="mt-2 text-2xl font-black text-green-600">{summary.completed}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-xs font-black uppercase text-slate-400">Cancelled</p>
          <p className="mt-2 text-2xl font-black text-red-600">{summary.cancelled}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1350px]">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-black uppercase text-slate-500">
                <th className="px-4 py-4">Action</th>
                <th className="px-4 py-4">Mã đơn</th>
                <th className="px-4 py-4">Ngày</th>
                <th className="px-4 py-4">Khách hàng</th>
                <th className="px-4 py-4">SĐT</th>
                <th className="px-4 py-4">Địa chỉ</th>
                <th className="px-4 py-4">Sản phẩm</th>
                <th className="px-4 py-4">Thanh toán</th>
                <th className="px-4 py-4">Tổng tiền</th>
                <th className="px-4 py-4">Trạng thái</th>
              </tr>
            </thead>

            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-4 py-12 text-center text-sm font-bold text-slate-400">
                    Chưa có đơn hàng nào. Hãy thử checkout ngoài storefront rồi bấm Refresh orders.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => deleteOrder(order.id)}
                          className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100"
                          title="Xóa đơn"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-4 font-black text-blue-600">{order.id}</td>

                    <td className="px-4 py-4 text-sm">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "-"}
                    </td>

                    <td className="px-4 py-4 text-sm font-bold">
                      {order.customer?.name || "-"}
                    </td>

                    <td className="px-4 py-4 text-sm">
                      {order.customer?.phone || "-"}
                    </td>

                    <td className="max-w-[260px] px-4 py-4 text-sm">
                      {order.customer?.address || "-"}
                    </td>

                    <td className="px-4 py-4 text-sm">
                      <div className="space-y-1">
                        {(order.items || []).slice(0, 3).map((item, idx) => (
                          <div key={idx}>
                            • {item.name} x {item.quantity || 1}
                          </div>
                        ))}
                        {(order.items || []).length > 3 && (
                          <div className="font-bold text-slate-400">
                            + {(order.items || []).length - 3} sản phẩm khác
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm font-bold">{order.payment || "-"}</td>

                    <td className="px-4 py-4 font-black text-red-500">
                      {formatCurrency(Number(order.total) || 0)}
                    </td>

                    <td className="px-4 py-4">
                      <select
                        value={order.status || "Placed"}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className={`rounded-xl px-3 py-2 text-xs font-black ${statusClass(order.status)}`}
                      >
                        {ORDER_STATUSES.map((status) => (
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
          <div className="ml-auto h-full w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
                  Order detail
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
                className="rounded-xl border px-4 py-2 font-black"
              >
                Đóng
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border p-4">
                <h3 className="font-black">Thông tin khách hàng</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <p><b>Tên:</b> {selectedOrder.customer?.name || "-"}</p>
                  <p><b>SĐT:</b> {selectedOrder.customer?.phone || "-"}</p>
                  <p><b>Địa chỉ:</b> {selectedOrder.customer?.address || "-"}</p>
                  <p><b>Ghi chú:</b> {selectedOrder.customer?.note || "-"}</p>
                </div>
              </div>

              <div className="rounded-2xl border p-4">
                <h3 className="font-black">Thanh toán & trạng thái</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <p><b>Payment:</b> {selectedOrder.payment || "-"}</p>
                  <p><b>Status:</b> {selectedOrder.status || "Placed"}</p>
                  <p><b>Total:</b> <span className="font-black text-red-500">{formatCurrency(Number(selectedOrder.total) || 0)}</span></p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border">
              <div className="border-b bg-slate-50 px-4 py-3 font-black">
                Danh sách sản phẩm
              </div>

              <div className="divide-y">
                {(selectedOrder.items || []).map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-4">
                    <img
                      src={item.image}
                      className="h-20 w-20 rounded-xl bg-slate-100 object-cover"
                    />
                    <div className="flex-1">
                      <div className="font-black">{item.name}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        SL: {item.quantity || 1}
                      </div>
                      <div className="mt-1 font-black text-red-500">
                        {formatCurrency(Number(item.price) || 0)}
                      </div>
                    </div>
                    <div className="font-black">
                      {formatCurrency((Number(item.price) || 0) * (item.quantity || 1))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-between rounded-2xl bg-slate-50 p-4 text-xl font-black">
              <span>Tổng đơn</span>
              <span className="text-red-500">{formatCurrency(Number(selectedOrder.total) || 0)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
