import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { getOrders } from "../../services/OrderService";
import StorefrontShell from "../../components/storefront/StorefrontShell";

const money = (n) => (Number(n) || 0).toLocaleString("vi-VN") + "đ";

export default function OrderLookupPage() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return getOrders().filter((order) => {
      const text = [
        order.id,
        order.orderCode,
        order.customer?.phone,
        order.customer?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(q);
    });
  }, [query]);

  return (
    <StorefrontShell>
      <main className="min-h-screen bg-[#F5F7FB] px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
            Order Lookup
          </p>

          <h1 className="mt-2 text-4xl font-black text-slate-950">
            Tra cứu đơn hàng
          </h1>

          <p className="mt-3 text-slate-500">
            Nhập mã đơn hoặc số điện thoại để kiểm tra trạng thái đơn hàng.
          </p>

          <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center rounded-2xl border px-4 py-3">
              <Search size={20} className="text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ví dụ: ORD-... hoặc 090..."
                className="ml-3 w-full bg-transparent outline-none"
              />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {query && results.length === 0 ? (
              <div className="rounded-3xl bg-white p-10 text-center font-bold text-slate-400">
                Không tìm thấy đơn hàng phù hợp.
              </div>
            ) : (
              results.map((order) => (
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
                        {order.customer?.name || "-"} • {order.customer?.phone || "-"}
                      </div>
                      <div className="mt-2 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                        {order.status || "Placed"}
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
    </StorefrontShell>
  );
}
