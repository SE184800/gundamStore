import { Link } from "react-router-dom";
import { getOrders } from "../../services/OrderService";

const money = (n) => (Number(n) || 0).toLocaleString("vi-VN") + "đ";

export default function MyOrdersPage() {
  const orders = getOrders();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
          My Orders
        </p>

        <h1 className="mt-2 text-4xl font-black text-slate-950">
          Đơn hàng của tôi
        </h1>

        <div className="mt-8 space-y-4">
          {orders.length === 0 ? (
            <div className="rounded-3xl bg-white p-10 text-center font-bold text-slate-500">
              Bạn chưa có đơn hàng nào.
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <div className="font-black text-blue-600">{order.id}</div>
                    <div className="mt-1 text-sm text-slate-500">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString("vi-VN")
                        : "-"}
                    </div>
                    <div className="mt-2 text-sm font-bold">
                      {order.items?.length || 0} sản phẩm • {order.status}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-black text-red-500">
                      {money(order.total)}
                    </div>
                    <Link
                      to={`/orders/${order.id}`}
                      className="mt-3 inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
