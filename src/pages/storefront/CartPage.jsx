import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, TicketPercent } from "lucide-react";

const CART_KEY = "gundam-cart-final";
const CHECKOUT_KEY = "gundam-checkout-draft";

const money = (n) => (Number(n) || 0).toLocaleString("vi-VN") + "đ";

function readCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("gundam-cart-updated"));
}

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [voucher, setVoucher] = useState("");

  useEffect(() => {
    setCart(readCart());
  }, []);

  const selected = cart.filter((x) => x.selected !== false);
  const subtotal = selected.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);
  const discount = voucher.trim().toUpperCase() === "GUNDAM10" ? Math.round(subtotal * 0.1) : 0;
  const shippingFee = selected.length ? 30000 : 0;
  const total = subtotal + shippingFee - discount;

  function update(next) {
    setCart(next);
    saveCart(next);
  }

  function goCheckout() {
    if (!selected.length) {
      alert("Vui lòng chọn ít nhất 1 sản phẩm.");
      return;
    }

    localStorage.setItem(
      CHECKOUT_KEY,
      JSON.stringify({ items: selected, voucher, subtotal, discount, shippingFee, total })
    );

    window.location.href = "/checkout";
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-black text-slate-900">Giỏ hàng</h1>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
          <section className="space-y-4">
            {cart.length === 0 ? (
              <div className="rounded-3xl bg-white p-10 text-center font-bold text-slate-500">
                Giỏ hàng đang trống.
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex gap-4 rounded-3xl bg-white p-5 shadow-sm">
                  <input
                    type="checkbox"
                    checked={item.selected !== false}
                    onChange={() =>
                      update(cart.map((x) => x.id === item.id ? { ...x, selected: x.selected === false } : x))
                    }
                    className="mt-10 h-5 w-5"
                  />

                  <img src={item.image} className="h-28 w-28 rounded-2xl object-cover" />

                  <div className="flex-1">
                    <h3 className="text-lg font-black">{item.name}</h3>
                    <p className="mt-2 font-black text-red-500">{money(item.price)}</p>

                    <div className="mt-4 flex items-center gap-2">
                      <button onClick={() => update(cart.map((x) => x.id === item.id ? { ...x, quantity: Math.max(1, (x.quantity || 1) - 1) } : x))} className="rounded-xl border p-2">
                        <Minus size={16} />
                      </button>

                      <span className="w-10 text-center font-black">{item.quantity || 1}</span>

                      <button onClick={() => update(cart.map((x) => x.id === item.id ? { ...x, quantity: (x.quantity || 1) + 1 } : x))} className="rounded-xl border p-2">
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  <button onClick={() => update(cart.filter((x) => x.id !== item.id))} className="h-10 rounded-xl bg-red-50 p-3 text-red-500">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </section>

          <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 font-black text-blue-700">
              <TicketPercent size={18} />
              Mã khuyến mãi
            </div>

            <input
              value={voucher}
              onChange={(e) => setVoucher(e.target.value)}
              placeholder="Nhập GUNDAM10"
              className="mt-3 w-full rounded-2xl border px-4 py-3 outline-none"
            />

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between"><span>Tạm tính</span><b>{money(subtotal)}</b></div>
              <div className="flex justify-between"><span>Phí ship</span><b>{money(shippingFee)}</b></div>
              <div className="flex justify-between text-green-600"><span>Giảm giá</span><b>-{money(discount)}</b></div>
              <div className="flex justify-between border-t pt-4 text-xl font-black">
                <span>Tổng</span>
                <span className="text-red-500">{money(total)}</span>
              </div>
            </div>

            <button onClick={goCheckout} className="mt-6 w-full rounded-2xl bg-blue-600 py-4 font-black text-white">
              Tiến hành đặt hàng
            </button>

            <Link to="/" className="mt-3 block text-center text-sm font-bold text-blue-600">
              Tiếp tục mua hàng
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
