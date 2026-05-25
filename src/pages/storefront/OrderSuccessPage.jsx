import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, PackageSearch } from "lucide-react";
import { getOrderById } from "../../services/OrderService";
import { getStorefrontOrderByIdFromApi } from "../../services/StorefrontOrderLookupApiService";
import StorefrontShell from "../../components/storefront/StorefrontShell";

const money = (n) => (Number(n) || 0).toLocaleString("vi-VN") + "đ";

export default function OrderSuccessPage() {
  const params = useParams();
  const id = params.id || params.orderId;

  const [backendOrder, setBackendOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const localOrder = getOrderById(id);
  const order = backendOrder || localOrder;
  const source = backendOrder ? "backend" : localOrder ? "local" : "";

  useEffect(() => {
    let alive = true;

    setLoading(true);
    setApiError("");

    getStorefrontOrderByIdFromApi(id)
      .then((item) => {
        if (!alive) return;
        setBackendOrder(item);
        setApiError("");
      })
      .catch((error) => {
        if (!alive) return;
        setBackendOrder(null);
        setApiError(error?.message || "Backend order lookup failed.");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id]);

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

          <div className="mt-5">
            <span
              className={`rounded-full px-3 py-2 text-xs font-black ${
                source === "backend"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {loading
                ? "Đang kiểm tra đơn backend..."
                : source === "backend"
                  ? "PostgreSQL Order"
                  : source === "local"
                    ? "Local Demo Order"
                    : apiError || "Không tìm thấy đơn"}
            </span>
          </div>

          {order && (
            <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-left">
              <div className="flex justify-between">
                <span className="font-bold text-slate-500">Mã đơn</span>
                <b className="text-blue-600">{order.orderCode || order.id}</b>
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
