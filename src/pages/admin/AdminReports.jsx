import { useMemo } from "react";
import { BarChart3, Package, ShoppingBag, Users } from "lucide-react";
import { getOrders } from "../../services/OrderService";
import { getCustomers } from "../../services/CustomerService";
import { formatCurrency } from "../../utils/format";

export default function AdminReports() {
  const orders = getOrders();
  const customers = getCustomers();

  const report = useMemo(() => {
    const revenue = orders.reduce((s, o) => s + (Number(o.total) || 0), 0);

    const statusMap = {};
    const productMap = {};
    const revenueByDay = {};

    orders.forEach((order) => {
      const status = order.status || "Placed";
      statusMap[status] = (statusMap[status] || 0) + 1;

      const day = order.createdAt
        ? new Date(order.createdAt).toLocaleDateString("vi-VN")
        : "-";

      revenueByDay[day] = (revenueByDay[day] || 0) + (Number(order.total) || 0);

      (order.items || []).forEach((item) => {
        if (!productMap[item.id]) {
          productMap[item.id] = {
            id: item.id,
            name: item.name,
            quantity: 0,
            revenue: 0,
          };
        }

        productMap[item.id].quantity += item.quantity || 1;
        productMap[item.id].revenue +=
          (Number(item.price) || 0) * (item.quantity || 1);
      });
    });

    return {
      revenue,
      totalOrders: orders.length,
      avgOrder: orders.length ? Math.round(revenue / orders.length) : 0,
      statusList: Object.entries(statusMap),
      topProducts: Object.values(productMap).sort(
        (a, b) => b.quantity - a.quantity
      ),
      revenueByDay: Object.entries(revenueByDay),
    };
  }, [orders]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-600">
          Analytics
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">
          Báo cáo bán hàng
        </h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Tổng quan doanh thu, đơn hàng, khách hàng và sản phẩm bán chạy.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase text-slate-400">
              Doanh thu
            </p>
            <BarChart3 className="text-blue-600" size={22} />
          </div>
          <p className="mt-3 text-2xl font-black text-red-500">
            {formatCurrency(report.revenue)}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase text-slate-400">
              Tổng đơn
            </p>
            <ShoppingBag className="text-blue-600" size={22} />
          </div>
          <p className="mt-3 text-2xl font-black">{report.totalOrders}</p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase text-slate-400">
              AOV
            </p>
            <Package className="text-blue-600" size={22} />
          </div>
          <p className="mt-3 text-2xl font-black">
            {formatCurrency(report.avgOrder)}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase text-slate-400">
              Khách hàng
            </p>
            <Users className="text-blue-600" size={22} />
          </div>
          <p className="mt-3 text-2xl font-black">{customers.length}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Đơn hàng theo trạng thái</h2>

          <div className="mt-5 space-y-3">
            {report.statusList.length === 0 ? (
              <p className="text-sm font-bold text-slate-400">Chưa có dữ liệu.</p>
            ) : (
              report.statusList.map(([status, count]) => (
                <div key={status}>
                  <div className="flex justify-between text-sm font-bold">
                    <span>{status}</span>
                    <span>{count}</span>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{
                        width: `${Math.min(
                          100,
                          (count / Math.max(1, report.totalOrders)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Doanh thu theo ngày</h2>

          <div className="mt-5 space-y-3">
            {report.revenueByDay.length === 0 ? (
              <p className="text-sm font-bold text-slate-400">Chưa có dữ liệu.</p>
            ) : (
              report.revenueByDay.map(([day, revenue]) => (
                <div
                  key={day}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"
                >
                  <span className="font-bold">{day}</span>
                  <span className="font-black text-red-500">
                    {formatCurrency(revenue)}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Top sản phẩm bán chạy</h2>

          <div className="mt-5 overflow-hidden rounded-2xl border">
            <table className="w-full">
              <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Sản phẩm</th>
                  <th className="px-4 py-3">SL bán</th>
                  <th className="px-4 py-3">Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {report.topProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan="3"
                      className="px-4 py-8 text-center text-sm font-bold text-slate-400"
                    >
                      Chưa có dữ liệu.
                    </td>
                  </tr>
                ) : (
                  report.topProducts.slice(0, 10).map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="px-4 py-3 font-bold">{p.name}</td>
                      <td className="px-4 py-3">{p.quantity}</td>
                      <td className="px-4 py-3 font-black text-red-500">
                        {formatCurrency(p.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Khách hàng mua nhiều</h2>

          <div className="mt-5 overflow-hidden rounded-2xl border">
            <table className="w-full">
              <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Khách</th>
                  <th className="px-4 py-3">SĐT</th>
                  <th className="px-4 py-3">Chi tiêu</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="3"
                      className="px-4 py-8 text-center text-sm font-bold text-slate-400"
                    >
                      Chưa có dữ liệu.
                    </td>
                  </tr>
                ) : (
                  customers
                    .sort((a, b) => b.totalSpent - a.totalSpent)
                    .slice(0, 10)
                    .map((c) => (
                      <tr key={c.phone} className="border-t">
                        <td className="px-4 py-3 font-bold">{c.name}</td>
                        <td className="px-4 py-3">{c.phone}</td>
                        <td className="px-4 py-3 font-black text-red-500">
                          {formatCurrency(c.totalSpent)}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
