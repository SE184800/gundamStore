import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Truck, CreditCard, ShieldCheck } from "lucide-react";
import {
  getCheckoutDraft,
  clearCheckoutDraft,
  clearCartItems,
} from "../../services/CartService";
import { createOrder } from "../../services/OrderService";

const money = (n) => (Number(n) || 0).toLocaleString("vi-VN") + "đ";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(null);
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    province: "Hồ Chí Minh",
    note: "",
    paymentMethod: "COD",
    shippingMethod: "FAST",
  });

  useEffect(() => {
    setDraft(getCheckoutDraft());
  }, []);

  if (!draft) {
    return (
      <main className="min-h-screen bg-slate-50 p-10">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center">
          <h1 className="text-2xl font-black">Không có dữ liệu checkout</h1>
          <button
            onClick={() => navigate("/cart")}
            className="mt-5 rounded-2xl bg-blue-600 px-6 py-3 font-black text-white"
          >
            Quay lại giỏ hàng
          </button>
        </div>
      </main>
    );
  }

  function submitOrder() {
    if (!customer.name || !customer.phone || !customer.address) {
      alert("Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ.");
      return;
    }

    const order = createOrder({
      customer,
      items: draft.items,
      subtotal: draft.subtotal,
      shippingFee: draft.shippingFee,
      discount: draft.discount,
      shippingDiscount: draft.shippingDiscount,
      voucherCode: draft.voucherCode,
      total: draft.total,
      paymentMethod: customer.paymentMethod,
      shippingMethod: customer.shippingMethod,
    });

    clearCartItems(draft.items.map((item) => item.id));
    clearCheckoutDraft();

    navigate(`/order-success/${order.id}`);
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
          Checkout
        </p>
        <h1 className="mt-2 text-4xl font-black text-slate-950">
          Thanh toán đơn hàng
        </h1>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_430px]">
          <section className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-black">
                <MapPin size={22} /> Địa chỉ nhận hàng
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <input
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  placeholder="Họ tên người nhận"
                  className="rounded-2xl border px-4 py-3 outline-none focus:border-blue-500"
                />

                <input
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  placeholder="Số điện thoại"
                  className="rounded-2xl border px-4 py-3 outline-none focus:border-blue-500"
                />

                <input
                  value={customer.province}
                  onChange={(e) => setCustomer({ ...customer, province: e.target.value })}
                  placeholder="Tỉnh / Thành phố"
                  className="rounded-2xl border px-4 py-3 outline-none focus:border-blue-500"
                />

                <input
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                  placeholder="Địa chỉ chi tiết"
                  className="rounded-2xl border px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-black">
                <Truck size={22} /> Phương thức vận chuyển
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="cursor-pointer rounded-2xl border p-4 hover:border-blue-500">
                  <input
                    type="radio"
                    name="shipping"
                    checked={customer.shippingMethod === "FAST"}
                    onChange={() => setCustomer({ ...customer, shippingMethod: "FAST" })}
                    className="mr-2"
                  />
                  <b>Giao nhanh</b>
                  <p className="mt-1 text-sm text-slate-500">
                    Dự kiến 1-3 ngày, phí đã tính trong đơn.
                  </p>
                </label>

                <label className="cursor-pointer rounded-2xl border p-4 hover:border-blue-500">
                  <input
                    type="radio"
                    name="shipping"
                    checked={customer.shippingMethod === "EXPRESS"}
                    onChange={() => setCustomer({ ...customer, shippingMethod: "EXPRESS" })}
                    className="mr-2"
                  />
                  <b>Hỏa tốc</b>
                  <p className="mt-1 text-sm text-slate-500">
                    Ưu tiên xử lý, giao nhanh nội thành.
                  </p>
                </label>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-black">
                <CreditCard size={22} /> Phương thức thanh toán
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {["COD", "BANK", "MOMO"].map((method) => (
                  <label
                    key={method}
                    className="cursor-pointer rounded-2xl border p-4 hover:border-blue-500"
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={customer.paymentMethod === method}
                      onChange={() =>
                        setCustomer({ ...customer, paymentMethod: method })
                      }
                      className="mr-2"
                    />
                    <b>{method}</b>
                  </label>
                ))}
              </div>

              <textarea
                value={customer.note}
                onChange={(e) => setCustomer({ ...customer, note: e.target.value })}
                placeholder="Lời nhắn cho shop"
                rows={4}
                className="mt-5 w-full rounded-2xl border px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>
          </section>

          <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black">Tóm tắt đơn hàng</h2>

            <div className="mt-5 max-h-80 space-y-4 overflow-y-auto pr-2">
              {draft.items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <img
                    src={item.image}
                    className="h-16 w-16 rounded-2xl bg-slate-100 object-cover"
                  />
                  <div className="flex-1">
                    <div className="font-bold">{item.name}</div>
                    <div className="mt-1 text-sm text-slate-500">
                      x{item.quantity || 1}
                    </div>
                  </div>
                  <b className="text-red-500">
                    {money((item.price || 0) * (item.quantity || 1))}
                  </b>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm font-bold text-blue-700">
              <ShieldCheck size={16} className="mr-1 inline" />
              Đơn hàng được lưu vào hệ thống quản lý đơn hàng.
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Tạm tính</span>
                <b>{money(draft.subtotal)}</b>
              </div>

              <div className="flex justify-between">
                <span>Phí vận chuyển</span>
                <b>{money(draft.shippingFee)}</b>
              </div>

              <div className="flex justify-between text-green-600">
                <span>Giảm giá</span>
                <b>-{money(draft.discount)}</b>
              </div>

              <div className="flex justify-between text-green-600">
                <span>Giảm phí ship</span>
                <b>-{money(draft.shippingDiscount)}</b>
              </div>

              {draft.voucherCode && (
                <div className="flex justify-between text-blue-600">
                  <span>Voucher</span>
                  <b>{draft.voucherCode}</b>
                </div>
              )}

              <div className="flex justify-between border-t pt-4 text-xl font-black">
                <span>Tổng thanh toán</span>
                <span className="text-red-500">{money(draft.total)}</span>
              </div>
            </div>

            <button
              onClick={submitOrder}
              className="mt-6 w-full rounded-2xl bg-blue-600 py-4 font-black text-white shadow-lg hover:bg-blue-700"
            >
              Đặt hàng
            </button>

            <button
              onClick={() => navigate("/cart")}
              className="mt-3 w-full rounded-2xl border py-4 font-black text-slate-700 hover:bg-slate-50"
            >
              Quay lại giỏ hàng
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}
