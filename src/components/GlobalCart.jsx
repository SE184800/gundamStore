import { useEffect, useState } from "react";
import { ShoppingCart, Plus, Minus, Trash2, X } from "lucide-react";

const CART_KEY = "gundam-cart";

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("gundam-cart-updated"));
}

function addToCart(product) {
  const cart = readCart();
  const found = cart.find((x) => x.id === product.id);

  if (found) found.quantity += 1;
  else cart.push({ ...product, quantity: 1 });

  saveCart(cart);
}

function extractProductFromButton(button) {
  const card =
    button.closest("article") ||
    button.closest("[class*='card']") ||
    button.closest(".group") ||
    button.closest("div");

  const text = card?.innerText || "";
  const img = card?.querySelector("img")?.src || "";

  const lines = text
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

  const name =
    lines.find((x) => x.includes("Gundam")) ||
    lines.find((x) => x.includes("Action Base")) ||
    lines[0] ||
    "Gundam Product";

  const priceText = lines.find((x) => x.includes("đ")) || "0";
  const price = Number(priceText.replace(/[^\d]/g, "")) || 0;

  return {
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    image: img,
    price,
  };
}

export default function GlobalCart() {
  const [cart, setCart] = useState([]);
  const [open, setOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    note: "",
    payment: "COD",
  });

  function refresh() {
    setCart(readCart());
  }

  useEffect(() => {
    refresh();
    window.addEventListener("gundam-cart-updated", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("gundam-cart-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    function handleClick(e) {
      const button = e.target.closest("button");
      if (!button) return;

      const label = button.innerText?.trim()?.toLowerCase();
      if (label !== "thêm" && label !== "add") return;

      e.preventDefault();
      e.stopPropagation();

      addToCart(extractProductFromButton(button));

      const oldText = button.innerText;
      button.innerText = "Đã thêm";
      setTimeout(() => {
        button.innerText = oldText;
      }, 800);
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const total = cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

  function updateQty(id, delta) {
    const next = cart.map((item) =>
      item.id === id
        ? { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) }
        : item
    );
    saveCart(next);
  }

  function removeItem(id) {
    saveCart(cart.filter((x) => x.id !== id));
  }

  function saveOrder() {
    if (!customer.name || !customer.phone || !customer.address) {
      alert("Vui lòng nhập đầy đủ tên, số điện thoại và địa chỉ.");
      return;
    }

    const order = {
      id: "ORD-" + Date.now(),
      createdAt: new Date().toISOString(),
      customer,
      items: cart,
      total,
      payment: customer.payment,
      status: "Placed",
    };

    const cmsKey = "gundam-cms-state";
    const oldCms = JSON.parse(localStorage.getItem(cmsKey) || "{}");
    const oldOrders = oldCms.orders || [];

    localStorage.setItem(
      cmsKey,
      JSON.stringify({
        ...oldCms,
        orders: [order, ...oldOrders],
      })
    );

    localStorage.setItem(CART_KEY, JSON.stringify([]));
    window.dispatchEvent(new Event("gundam-cart-updated"));

    setCheckoutOpen(false);
    setOpen(false);

    alert("Đặt hàng thành công! Mã đơn: " + order.id);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed right-6 top-24 z-[9999] flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl hover:bg-blue-700"
        title="Giỏ hàng"
      >
        <ShoppingCart size={24} />
        {count > 0 && (
          <span className="absolute -right-2 -top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-black text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[10000] bg-black/40">
          <div className="ml-auto h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Giỏ hàng</h2>
                <p className="text-sm text-slate-500">{count} sản phẩm</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-xl border p-2">
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {cart.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">
                  Chưa có sản phẩm trong giỏ.
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-3 rounded-2xl border p-3">
                    <img src={item.image} className="h-20 w-20 rounded-xl bg-slate-100 object-cover" />
                    <div className="flex-1">
                      <div className="font-black text-slate-900">{item.name}</div>
                      <div className="mt-1 text-sm font-bold text-red-500">
                        {(item.price || 0).toLocaleString("vi-VN")}đ
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <button onClick={() => updateQty(item.id, -1)} className="rounded-lg border p-1">
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center font-black">{item.quantity || 1}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="rounded-lg border p-1">
                          <Plus size={14} />
                        </button>
                        <button onClick={() => removeItem(item.id)} className="ml-auto rounded-lg bg-red-50 p-2 text-red-600">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 border-t pt-4">
              <div className="flex justify-between text-lg font-black">
                <span>Tổng tiền</span>
                <span className="text-red-500">{total.toLocaleString("vi-VN")}đ</span>
              </div>

              <button
                onClick={() => {
                  if (cart.length === 0) {
                    alert("Giỏ hàng đang trống.");
                    return;
                  }
                  setCheckoutOpen(true);
                }}
                className="mt-4 w-full rounded-2xl bg-blue-600 py-4 font-black text-white hover:bg-blue-700"
              >
                Thanh toán
              </button>
            </div>
          </div>
        </div>
      )}

      {checkoutOpen && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Thông tin thanh toán</h2>
                <p className="text-sm text-slate-500">Nhập thông tin để tạo đơn hàng.</p>
              </div>
              <button onClick={() => setCheckoutOpen(false)} className="rounded-xl border p-2">
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <input
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                placeholder="Họ tên"
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
              />

              <input
                value={customer.phone}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                placeholder="Số điện thoại"
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
              />

              <input
                value={customer.address}
                onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                placeholder="Địa chỉ giao hàng"
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
              />

              <select
                value={customer.payment}
                onChange={(e) => setCustomer({ ...customer, payment: e.target.value })}
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="COD">COD - Thanh toán khi nhận hàng</option>
                <option value="BANK">Chuyển khoản ngân hàng</option>
                <option value="MOMO">Ví Momo</option>
              </select>

              <textarea
                value={customer.note}
                onChange={(e) => setCustomer({ ...customer, note: e.target.value })}
                placeholder="Ghi chú đơn hàng"
                rows={3}
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
              />

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex justify-between font-black">
                  <span>Tổng thanh toán</span>
                  <span className="text-red-500">{total.toLocaleString("vi-VN")}đ</span>
                </div>
              </div>

              <button
                onClick={saveOrder}
                className="w-full rounded-2xl bg-blue-600 py-4 font-black text-white hover:bg-blue-700"
              >
                Xác nhận đặt hàng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
