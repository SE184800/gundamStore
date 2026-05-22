import { Link, useParams } from "react-router-dom";
import { getOrderById } from "../../services/OrderService";

const money = (n) => (Number(n) || 0).toLocaleString("vi-VN") + "đ";

const steps = [
  "Placed",
  "Confirmed",
  "Packing",
  "Shipping",
  "Delivered",
  "Completed",
];

export default function OrderDetailPage() {
  const { id } = useParams();
  const order = getOrderById(id);

  if (!order) {
    return (
      <main className="min-h-screen bg-slate-50 p-10">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center">
          Không tìm thấy đơn hàng.
        </div>
      </main>
    );
  }

  const currentIndex = steps.indexOf(order.status);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <Link to="/orders" className="font-bold text-blue-600">
          ← Quay lại đơn hàng
        </Link>

        <div className="mt-5 rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
                Order Detail
              </p>
              <h1 className="mt-2 text-3xl font-black">{order.id}</h1>
              <p className="mt-2 text-sm text-slate-500">
                {new Date(order.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 px-5 py-3 text-center">
              <div className="text-sm font-bold text-blue-600">Trạng thái</div>
              <div className="text-xl font-black text-blue-700">{order.status}</div>
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-6">
            {steps.map((step, index) => {
              const active = index <= currentIndex;

              return (
                <div
                  key={step}
                  className={`rounded-2xl p-4 text-center text-sm font-black ${
                    active
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {step}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black">Sản phẩm đã đặt</h2>

            {(order.items || []).map((item) => (
              <div key={item.id} className="flex gap-4 border-t pt-4">
                <img
                  src={item.image}
                  className="h-20 w-20 rounded-2xl bg-slate-100 object-cover"
                />

                <div className="flex-1">
                  <div className="font-black">{item.name}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    x{item.quantity || 1}
                  </div>
                  <div className="mt-1 font-black text-red-500">
                    {money(item.price)}
                  </div>
                </div>

                <div className="font-black">
                  {money((item.price || 0) * (item.quantity || 1))}
                </div>
              </div>
            ))}
          </section>

          <aside className="space-y-4">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black">Thông tin nhận hàng</h2>
              <div className="mt-4 space-y-2 text-sm">
                <p><b>Khách:</b> {order.customer?.name}</p>
                <p><b>SĐT:</b> {order.customer?.phone}</p>
                <p><b>Địa chỉ:</b> {order.customer?.address}</p>
                <p><b>Ghi chú:</b> {order.customer?.note || "-"}</p>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black">Thanh toán</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <b>{money(order.subtotal)}</b>
                </div>
                <div className="flex justify-between">
                  <span>Phí ship</span>
                  <b>{money(order.shippingFee)}</b>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <b>-{money(order.discount)}</b>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Giảm ship</span>
                  <b>-{money(order.shippingDiscount)}</b>
                </div>
                <div className="flex justify-between border-t pt-4 text-xl font-black">
                  <span>Tổng</span>
                  <span className="text-red-500">{money(order.total)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black">Lịch sử xử lý</h2>
              <div className="mt-4 space-y-3">
                {(order.timeline || []).map((item, index) => (
                  <div key={index} className="rounded-2xl bg-slate-50 p-3 text-sm">
                    <b>{item.title || item.status}</b>
                    <p className="mt-1 text-slate-500">{item.note}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(item.time).toLocaleString("vi-VN")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
