import { useCms } from "../../store/CmsStore";
import { formatCurrency } from "../../utils/format";

export default function AdminOrders() {
  const { state } = useCms();
  const orders = state.orders || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Quản lý đơn hàng</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Theo dõi đơn checkout từ storefront.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[900px]">
          <thead className="bg-slate-50">
            <tr className="text-left text-sm font-black text-slate-600">
              <th className="px-4 py-4">Mã đơn</th>
              <th className="px-4 py-4">Ngày</th>
              <th className="px-4 py-4">Sản phẩm</th>
              <th className="px-4 py-4">Thanh toán</th>
              <th className="px-4 py-4">Tổng tiền</th>
              <th className="px-4 py-4">Trạng thái</th>
            </tr>
          </thead>

          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-10 text-center text-sm font-bold text-slate-400">
                  Chưa có đơn hàng nào. Hãy thử checkout để tạo đơn.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-4 font-black text-blue-600">{order.id}</td>
                  <td className="px-4 py-4 text-sm">
                    {order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-4 py-4 text-sm">{order.items?.length || 0} sản phẩm</td>
                  <td className="px-4 py-4 text-sm">{order.payment || "-"}</td>
                  <td className="px-4 py-4 font-black text-red-500">{formatCurrency(order.total || 0)}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                      {order.status || "Placed"}
                    </span>
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
