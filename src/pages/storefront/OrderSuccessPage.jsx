import { Link, useParams } from "react-router-dom";
import { CheckCircle2, PackageSearch } from "lucide-react";
import { getOrderById } from "../../services/OrderService";
import StorefrontShell from "../../components/storefront/StorefrontShell";

const money = (n) => (Number(n) || 0).toLocaleString("vi-VN") + "đ";

export default function OrderSuccessPage() {
  const { id } = useParams();
  const order = getOrderById(id);

  return (
    <StorefrontShell>
      <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto text-green-500" size={72} />

        <h1 className="mt-5 text-3xl font-black text-slate-900">
          Đặt hàng thành công
        </h1>

        <p className="mt-3 text-slate-500">
          Cảm ơn bạn đã đặt hàng tại Gundam Store VN.
        </p>

        {order && (
          <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-left">
            <div className="flex justify-between">
              <span className="font-bold text-slate-500">Mã đơn</span>
              <b className="text-blue-600">{order.id}</b>
            </div>

            <div className="mt-3 flex justify-between">
              <span className="font-bold text-slate-500">Tổng tiền</span>
              <b className="text-red-500">{money(order.total)}</b>
            </div>

            <div className="mt-3 flex justify-between">
              <span className="font-bold text-slate-500">Trạng thái</span>
              <b>{order.status}</b>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to={`/orders/${id}`}
            className="rounded-2xl bg-blue-600 px-6 py-4 font-black text-white"
          >
            <PackageSearch size={18} className="mr-2 inline" />
            Xem chi tiết đơn
          </Link>

          <Link
            to="/"
            className="rounded-2xl border px-6 py-4 font-black text-slate-700"
          >
            Tiếp tục mua hàng
          </Link>
        </div>
      </div>
      </main>
    </StorefrontShell>
  );
}