import { useState } from "react";
import { useCms } from "../../store/CmsStore";
import { formatCurrency } from "../../utils/format";

const STATUS_OPTIONS = [
  "Placed",
  "Confirmed",
  "Shipping",
  "Completed",
  "Cancelled",
];

export default function AdminOrders() {
  const { state } = useCms();

  const [orders, setOrders] = useState(state.orders || []);

  function updateStatus(id, status) {
    const updated = orders.map((order) =>
      order.id === id ? { ...order, status } : order
    );

    setOrders(updated);

    const cmsKey = "gundam-cms-state";
    const oldCms = JSON.parse(localStorage.getItem(cmsKey) || "{}");

    localStorage.setItem(
      cmsKey,
      JSON.stringify({
        ...oldCms,
        orders: updated,
      })
    );
  }

  function getStatusColor(status) {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700";

      case "Shipping":
        return "bg-blue-100 text-blue-700";

      case "Cancelled":
        return "bg-red-100 text-red-700";

      case "Confirmed":
        return "bg-amber-100 text-amber-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900">
          Quản lý đơn hàng
        </h1>

        <p className="mt-2 text-sm font-medium text-slate-500">
          Theo dõi toàn bộ đơn hàng từ storefront.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[1200px]">
          <thead className="bg-slate-50">
            <tr className="text-left text-sm font-black text-slate-600">
              <th className="px-4 py-4">Mã đơn</th>
              <th className="px-4 py-4">Khách hàng</th>
              <th className="px-4 py-4">SĐT</th>
              <th className="px-4 py-4">Địa chỉ</th>
              <th className="px-4 py-4">Sản phẩm</th>
              <th className="px-4 py-4">Thanh toán</th>
              <th className="px-4 py-4">Tổng tiền</th>
              <th className="px-4 py-4">Ngày đặt</th>
              <th className="px-4 py-4">Trạng thái</th>
            </tr>
          </thead>

          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan="9"
                  className="px-4 py-10 text-center text-sm font-bold text-slate-400"
                >
                  Chưa có đơn hàng nào.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-4 font-black text-blue-600">
                    {order.id}
                  </td>

                  <td className="px-4 py-4 text-sm font-bold">
                    {order.customer?.name || "-"}
                  </td>

                  <td className="px-4 py-4 text-sm">
                    {order.customer?.phone || "-"}
                  </td>

                  <td className="max-w-[250px] px-4 py-4 text-sm">
                    {order.customer?.address || "-"}
                  </td>

                  <td className="px-4 py-4 text-sm">
                    <div className="space-y-1">
                      {order.items?.map((item, index) => (
                        <div key={index}>
                          • {item.name} x {item.quantity || 1}
                        </div>
                      ))}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm">
                    {order.payment || "-"}
                  </td>

                  <td className="px-4 py-4 font-black text-red-500">
                    {formatCurrency(order.total || 0)}
                  </td>

                  <td className="px-4 py-4 text-sm">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString("vi-VN")
                      : "-"}
                  </td>

                  <td className="px-4 py-4">
                    <select
                      value={order.status || "Placed"}
                      onChange={(e) =>
                        updateStatus(order.id, e.target.value)
                      }
                      className={`rounded-xl px-3 py-2 text-xs font-black ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {STATUS_OPTIONS.map((status) => (
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
  );
}
