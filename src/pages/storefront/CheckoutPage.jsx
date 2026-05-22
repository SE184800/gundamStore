import { useEffect, useState } from "react";
import { MapPin, Truck } from "lucide-react";

const CART_KEY = "gundam-cart-final";
const CHECKOUT_KEY = "gundam-checkout-draft";
const CMS_KEY = "gundam-cms-state";

const money = (n) => (Number(n) || 0).toLocaleString("vi-VN") + "đ";

export default function CheckoutPage() {
  const [draft, setDraft] = useState(null);
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    note: "",
    payment: "COD",
    shipping: "FAST",
  });

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem(CHECKOUT_KEY) || "null");
    setDraft(data);
  }, []);

  if (!draft) {
    return (
      <main className="min-h-screen bg-slate-50 p-10">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center">
          Không có dữ liệu checkout. Vui lòng quay lại giỏ hàng.
        </div>
      </main>
    );
  }

  function submitOrder() {
    if (!customer.name || !customer.phone || !customer.address) {
      alert("Vui lòng nhập đầy đủ thông tin giao hàng.");
      return;
    }

    const order = {
      id: "ORD-" + Date.now(),
      createdAt: new Date().toISOString(),
      customer,
      items: draft.items,
      subtotal: draft.subtotal,
      shippingFee: draft.shippingFee,
      discount: draft.discount,
      voucher: draft.voucher,
      total: draft.total,
      payment: customer.payment,
      shipping: customer.shipping,
      status: "Placed",
    };

    const cms = JSON.parse(localStorage.getItem(CMS_KEY) || "{}");
    localStorage.setItem(CMS_KEY, JSON.stringify({ ...cms, orders: [order, ...(cms.orders || [])] }));

    const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    const remain = cart.filter((x) => !draft.items.some((i) => i.id === x.id));
    localStorage.setItem(CART_KEY, JSON.stringify(remain));
    localStorage.removeItem(CHECKOUT_KEY);

    alert("Đặt hàng thành công! Mã đơn: " + order.id);
    window.location.href = "/admin/orders";
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-black">Thanh toán</h1>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_420px]">
          <section className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-black">
                <MapPin size={20} /> Địa chỉ nhận hàng
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <input placeholder="Họ tên" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className="rounded-2xl border px-4 py-3" />
                <input placeholder="Số điện thoại" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} className="rounded-2xl border px-4 py-3" />
                <input placeholder="Địa chỉ giao hàng" value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} className="rounded-2xl border px-4 py-3 md:col-span-2" />
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-black">
                <Truck size={20} /> Vận chuyển & thanh toán
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <select value={customer.shipping} onChange={(e) => setCustomer({ ...customer, shipping: e.target.value })} className="rounded-2xl border px-4 py-3">
                  <option value="FAST">Giao nhanh</option>
                  <option value="EXPRESS">Hỏa tốc</option>
                </select>

                <select value={customer.payment} onChange={(e) => setCustomer({ ...customer, payment: e.target.value })} className="rounded-2xl border px-4 py-3">
                  <option value="COD">COD</option>
                  <option value="BANK">Chuyển khoản</option>
                  <option value="MOMO">Momo</option>
                </select>

                <textarea placeholder="Ghi chú đơn hàng" value={customer.note} onChange={(e) => setCustomer({ ...customer, note: e.target.value })} className="rounded-2xl border px-4 py-3 md:col-span-2" rows={4} />
              </div>
            </div>
          </section>

          <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black">Tóm tắt đơn hàng</h2>

            <div className="mt-5 space-y-4">
              {draft.items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <img src={item.image} className="h-16 w-16 rounded-2xl object-cover" />
                  <div className="flex-1">
                    <div className="font-bold">{item.name}</div>
                    <div className="text-sm text-slate-500">x{item.quantity || 1}</div>
                  </div>
                  <b className="text-red-500">{money((item.price || 0) * (item.quantity || 1))}</b>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3 border-t pt-5">
              <div className="flex justify-between"><span>Tạm tính</span><b>{money(draft.subtotal)}</b></div>
              <div className="flex justify-between"><span>Phí ship</span><b>{money(draft.shippingFee)}</b></div>
              <div className="flex justify-between text-green-600"><span>Voucher</span><b>-{money(draft.discount)}</b></div>
              <div className="flex justify-between border-t pt-4 text-xl font-black">
                <span>Tổng</span>
                <span className="text-red-500">{money(draft.total)}</span>
              </div>
            </div>

            <button onClick={submitOrder} className="mt-6 w-full rounded-2xl bg-blue-600 py-4 font-black text-white">
              Đặt hàng
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}
