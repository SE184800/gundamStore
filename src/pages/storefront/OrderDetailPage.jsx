import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, MapPin, Package, RotateCcw, XCircle } from "lucide-react";
import {
  getOrderById,
  updateOrderStatus,
  ORDER_STATUS,
} from "../../services/OrderService";
import { getCart, saveCart } from "../../services/CartService";

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
  const navigate = useNavigate();
  const order = getOrderById(id);

  if (!order) {
    return (
      <main className="min-h-screen bg-slate-50 p-10">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center">
          <h1 className="text-2xl font-black">Không tìm thấy đơn hàng</h1>
          <Link to="/orders" className="mt-5 inline-block rounded-2xl bg-blue-600 px-6 py-3 font-black text-white">
            Quay lại đơn hàng
          </Link>
        </div>
      </main>
    );
  }

  const currentIndex = steps.indexOf(order.status);

  function cancelOrder() {
    if (!confirm("Bạn có chắc muốn hủy đơn hàng này không?")) return;
    updateOrderStatus(order.id, ORDER_STATUS.CANCELLED, "Khách hàng đã hủy đơn.");
    navigate("/orders");
  }

  function buyAgain() {
    const cart = getCart();
    const next = [...cart];

    (order.items || []).forEach((item) => {
      const found = next.find((x) => x.id === item.id);
      if (found) {
        found.quantity = (found.quantity || 1) + (item.quantity || 1);
      } else {
        next.push({ ...item, selected: true });
      }
    });

    saveCart(next);
    navigate("/cart");
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <Link to="/orders" className="font-black text-blue-600">
          ← Quay lại đơn hàng
        </Link>

        <div className="mt-5 rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
                Order Tracking
              </p>
              <h1 className="mt-2 text-3xl font-black text-slate-950">{order.id}</h1>
              <p className="mt-2 text-sm text-slate-500">
                Ngày đặt: {new Date(order.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 px-5 py-3 text-center">
              <div className="text-sm font-bold text-blue-600">Trạng thái hiện tại</div>
              <div className="text-xl font-black text-blue-700">{order.status}</div>
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-6">
            {steps.map((step, index) => {
              const active = currentIndex >= index && currentIndex !== -1;
              return (
                <div
                  key={step}
                  className={`rounded-2xl p-4 text-center text-sm font-black ${
                    active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <CheckCircle2 className="mx-auto mb-2" size={20} />
                  {step}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_390px]">
          <section className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-black">
                <Package size={22} /> Sản phẩm trong đơn
              </h2>

              <div className="mt-5 divide-y">
                {(order.items || []).map((item) => (
                  <div key={item.id} className="flex gap-4 py-4">
                    <img
                      src={item.image}
                      className="h-24 w-24 rounded-2xl bg-slate-100 object-cover"
                    />

                    <div className="flex-1">
                      <div className="font-black text-slate-950">{item.name}</div>
                      <div className="mt-1 text-sm text-slate-500">Số lượng: {item.quantity || 1}</div>
                      <div className="mt-2 font-black text-red-500">{money(item.price)}</div>
                    </div>

                    <div className="font-black text-slate-950">
                      {money((item.price || 0) * (item.quantity || 1))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black">Lịch sử xử lý</h2>

              <div className="mt-5 space-y-3">
                {(order.timeline || []).map((item, index) => (
                  <div key={index} className="rounded-2xl bg-slate-50 p-4">
                    <div className="font-black">{item.title || item.status}</div>
                    <p className="mt-1 text-sm text-slate-500">{item.note}</p>
                    <p className="mt-1 text-xs font-bold text-slate-400">
                      {item.time ? new Date(item.time).toLocaleString("vi-VN") : "-"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-black">
                <MapPin size={22} /> Nhận hàng
              </h2>

              <div className="mt-4 space-y-2 text-sm">
                <p><b>Người nhận:</b> {order.customer?.name || "-"}</p>
                <p><b>SĐT:</b> {order.customer?.phone || "-"}</p>
                <p><b>Tỉnh/TP:</b> {order.customer?.province || "-"}</p>
                <p><b>Địa chỉ:</b> {order.customer?.address || "-"}</p>
                <p><b>Ghi chú:</b> {order.customer?.note || "-"}</p>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black">Thanh toán</h2>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between"><span>Tạm tính</span><b>{money(order.subtotal)}</b></div>
                <div className="flex justify-between"><span>Phí vận chuyển</span><b>{money(order.shippingFee)}</b></div>
                <div className="flex justify-between text-green-600"><span>Giảm giá</span><b>-{money(order.discount)}</b></div>
                <div className="flex justify-between text-green-600"><span>Giảm ship</span><b>-{money(order.shippingDiscount)}</b></div>
                <div className="flex justify-between"><span>Voucher</span><b>{order.voucherCode || "-"}</b></div>
                <div className="flex justify-between"><span>Thanh toán</span><b>{order.paymentMethod || "-"}</b></div>

                <div className="flex justify-between border-t pt-4 text-xl font-black">
                  <span>Tổng</span>
                  <span className="text-red-500">{money(order.total)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <button
                onClick={buyAgain}
                className="w-full rounded-2xl bg-blue-600 py-4 font-black text-white"
              >
                <RotateCcw size={18} className="mr-2 inline" />
                Mua lại
              </button>

              {order.status === "Placed" && (
                <button
                  onClick={cancelOrder}
                  className="mt-3 w-full rounded-2xl bg-red-50 py-4 font-black text-red-600"
                >
                  <XCircle size={18} className="mr-2 inline" />
                  Hủy đơn
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
