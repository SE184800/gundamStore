import { useEffect, useState } from "react";
import { ShoppingCart, Plus, Minus, Trash2, X, MapPin, TicketPercent, Truck } from "lucide-react";

const CART_KEY = "gundam-cart-final";
const CMS_KEY = "gundam-cms-state";

const PRODUCT_PRICE_MAP = [
  { key: "action base 5 clear", price: 180000 },
  { key: "hg 1/144 gundam aerial", price: 520000 },
  { key: "rg 1/144 hi-v gundam", price: 1150000 },
  { key: "mg 1/100 freedom gundam ver.2.0", price: 1250000 },
  { key: "rg 1/144 sazabi", price: 1200000 },
  { key: "mgex 1/100 strike freedom", price: 2950000 },
];

function money(n) {
  return (Number(n) || 0).toLocaleString("vi-VN") + "đ";
}

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

function normalize(text) {
  return String(text || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function findProductCard(button) {
  let el = button;
  for (let i = 0; i < 12; i++) {
    if (!el?.parentElement) break;
    el = el.parentElement;
    const text = normalize(el.innerText);
    const hasImage = !!el.querySelector("img");
    const hasProduct = text.includes("gundam") || text.includes("action base") || text.includes("strike freedom");
    if (hasImage && hasProduct) return el;
  }
  return button.closest("div");
}

function getPriceByText(text) {
  const clean = normalize(text);
  const mapped = PRODUCT_PRICE_MAP.find((p) => clean.includes(p.key));
  if (mapped) return mapped.price;

  const matches = [...String(text).matchAll(/(\d{1,3}(?:[.,]\d{3})+|\d+)\s*[đ₫]/gi)];
  const prices = matches.map((m) => Number(String(m[1]).replace(/[^\d]/g, ""))).filter((n) => n > 1000);
  return prices.length ? Math.max(...prices) : 0;
}

function extractProductFromButton(button) {
  const card = findProductCard(button);
  const text = card?.innerText || "";
  const img = card?.querySelector("img")?.src || "";
  const lines = text.split("\n").map((x) => x.trim()).filter(Boolean);

  const name =
    lines.find((x) => /action base 5 clear/i.test(x)) ||
    lines.find((x) => /hg 1\/144 gundam aerial/i.test(x)) ||
    lines.find((x) => /rg 1\/144 hi-v gundam/i.test(x)) ||
    lines.find((x) => /mg 1\/100 freedom gundam ver.2.0/i.test(x)) ||
    lines.find((x) => /rg 1\/144 sazabi/i.test(x)) ||
    lines.find((x) => /mgex 1\/100 strike freedom/i.test(x)) ||
    lines.find((x) => /gundam/i.test(x)) ||
    lines.find((x) => /action base/i.test(x)) ||
    "Gundam Product";

  return {
    id: normalize(name).replace(/\s+/g, "-"),
    name,
    image: img,
    price: getPriceByText(`${name}\n${text}`),
    selected: true,
  };
}

function addToCart(product) {
  const cart = readCart();
  const found = cart.find((x) => x.id === product.id);

  if (found) {
    found.quantity += 1;
    found.price = product.price || found.price || 0;
    found.selected = true;
  } else {
    cart.push({ ...product, quantity: 1, selected: true });
  }

  saveCart(cart);
}

export default function GlobalCart() {
  const [cart, setCart] = useState([]);
  const [open, setOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [voucher, setVoucher] = useState("");
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    note: "",
    payment: "COD",
    shipping: "FAST",
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

      const label = normalize(button.innerText);
      const isAddToCart = label.includes("thêm") || label.includes("add");
      const isBuyNow = label.includes("mua") || label.includes("buy");

      if (!isAddToCart && !isBuyNow) return;

      e.preventDefault();
      e.stopPropagation();

      const product = extractProductFromButton(button);
      addToCart(product);

      const oldText = button.innerText;

      if (isBuyNow) {
        button.innerText = "Đang mua...";
        setTimeout(() => {
          setOpen(true);
          setCheckoutOpen(true);
          button.innerText = oldText;
        }, 300);
      } else {
        button.innerText = "Đã thêm";
        setTimeout(() => {
          button.innerText = oldText;
        }, 800);
      }
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  const selectedItems = cart.filter((x) => x.selected !== false);
  const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const selectedCount = selectedItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const subtotal = selectedItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1), 0);
  const shippingFee = selectedItems.length === 0 ? 0 : customer.shipping === "EXPRESS" ? 60000 : 30000;
  const discount = voucher.trim().toUpperCase() === "GUNDAM10" ? Math.round(subtotal * 0.1) : 0;
  const total = Math.max(0, subtotal + shippingFee - discount);

  function updateCart(next) {
    setCart(next);
    saveCart(next);
  }

  function updateQty(id, delta) {
    updateCart(cart.map((item) => item.id === id ? { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) } : item));
  }

  function toggleItem(id) {
    updateCart(cart.map((item) => item.id === id ? { ...item, selected: item.selected === false } : item));
  }

  function removeItem(id) {
    updateCart(cart.filter((x) => x.id !== id));
  }

  function saveOrder() {
    if (!customer.name || !customer.phone || !customer.address) {
      alert("Vui lòng nhập đầy đủ tên, số điện thoại và địa chỉ.");
      return;
    }

    if (selectedItems.length === 0) {
      alert("Vui lòng chọn ít nhất 1 sản phẩm để thanh toán.");
      return;
    }

    const order = {
      id: "ORD-" + Date.now(),
      createdAt: new Date().toISOString(),
      customer,
      items: selectedItems,
      subtotal,
      shippingFee,
      discount,
      voucher,
      total,
      payment: customer.payment,
      shipping: customer.shipping,
      status: "Placed",
    };

    const oldCms = JSON.parse(localStorage.getItem(CMS_KEY) || "{}");
    const oldOrders = oldCms.orders || [];

    localStorage.setItem(CMS_KEY, JSON.stringify({ ...oldCms, orders: [order, ...oldOrders] }));

    const remainingCart = cart.filter((item) => item.selected === false);
    saveCart(remainingCart);

    setCheckoutOpen(false);
    setOpen(false);
    alert("Đặt hàng thành công! Mã đơn: " + order.id);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed right-6 top-24 z-[9999] flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl hover:bg-blue-700"
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
          <div className="ml-auto h-full w-full max-w-xl overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Giỏ hàng</h2>
                <p className="text-sm text-slate-500">{selectedCount}/{count} sản phẩm được chọn</p>
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
                    <input
                      type="checkbox"
                      checked={item.selected !== false}
                      onChange={() => toggleItem(item.id)}
                      className="mt-8 h-5 w-5"
                    />

                    <img src={item.image} className="h-20 w-20 rounded-xl bg-slate-100 object-cover" />

                    <div className="flex-1">
                      <div className="font-black text-slate-900">{item.name}</div>
                      <div className="mt-1 text-sm font-bold text-red-500">{money(item.price)}</div>
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

            <div className="mt-5 space-y-3 border-t pt-4">
              <div className="rounded-2xl bg-blue-50 p-4">
                <div className="flex items-center gap-2 font-black text-blue-700">
                  <TicketPercent size={18} /> Voucher
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    value={voucher}
                    onChange={(e) => setVoucher(e.target.value)}
                    placeholder="Nhập mã: GUNDAM10"
                    className="flex-1 rounded-xl border px-4 py-3 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2 rounded-2xl bg-slate-50 p-4 text-sm">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <b>{money(subtotal)}</b>
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển</span>
                  <b>{money(shippingFee)}</b>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <b>-{money(discount)}</b>
                </div>
                <div className="flex justify-between border-t pt-3 text-lg font-black">
                  <span>Tổng thanh toán</span>
                  <span className="text-red-500">{money(total)}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (selectedItems.length === 0) {
                    alert("Vui lòng chọn sản phẩm để thanh toán.");
                    return;
                  }
                  setCheckoutOpen(true);
                }}
                className="w-full rounded-2xl bg-blue-600 py-4 font-black text-white hover:bg-blue-700"
              >
                Mua hàng ({selectedCount})
              </button>
            </div>
          </div>
        </div>
      )}

      {checkoutOpen && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Thanh toán</h2>
                <p className="text-sm text-slate-500">Kiểm tra thông tin giao hàng và xác nhận đơn.</p>
              </div>
              <button onClick={() => setCheckoutOpen(false)} className="rounded-xl border p-2">
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-[1fr_320px]">
              <div className="space-y-4">
                <div className="rounded-2xl border p-4">
                  <div className="mb-3 flex items-center gap-2 font-black">
                    <MapPin size={18} /> Địa chỉ nhận hàng
                  </div>
                  <input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="Họ tên người nhận" className="mb-3 w-full rounded-xl border px-4 py-3 outline-none" />
                  <input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} placeholder="Số điện thoại" className="mb-3 w-full rounded-xl border px-4 py-3 outline-none" />
                  <input value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} placeholder="Địa chỉ giao hàng chi tiết" className="w-full rounded-xl border px-4 py-3 outline-none" />
                </div>

                <div className="rounded-2xl border p-4">
                  <div className="mb-3 flex items-center gap-2 font-black">
                    <Truck size={18} /> Vận chuyển & thanh toán
                  </div>
                  <select value={customer.shipping} onChange={(e) => setCustomer({ ...customer, shipping: e.target.value })} className="mb-3 w-full rounded-xl border px-4 py-3 outline-none">
                    <option value="FAST">Giao nhanh - 30.000đ</option>
                    <option value="EXPRESS">Hỏa tốc - 60.000đ</option>
                  </select>
                  <select value={customer.payment} onChange={(e) => setCustomer({ ...customer, payment: e.target.value })} className="mb-3 w-full rounded-xl border px-4 py-3 outline-none">
                    <option value="COD">COD - Thanh toán khi nhận hàng</option>
                    <option value="BANK">Chuyển khoản ngân hàng</option>
                    <option value="MOMO">Ví Momo</option>
                  </select>
                  <textarea value={customer.note} onChange={(e) => setCustomer({ ...customer, note: e.target.value })} placeholder="Lời nhắn cho shop" rows={3} className="w-full rounded-xl border px-4 py-3 outline-none" />
                </div>
              </div>

              <div className="rounded-2xl border p-4">
                <h3 className="font-black">Tóm tắt đơn hàng</h3>
                <div className="mt-4 max-h-56 space-y-3 overflow-y-auto">
                  {selectedItems.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <img src={item.image} className="h-14 w-14 rounded-xl object-cover" />
                      <div className="flex-1 text-sm">
                        <div className="font-bold">{item.name}</div>
                        <div className="text-slate-500">x{item.quantity || 1}</div>
                      </div>
                      <b className="text-red-500">{money((item.price || 0) * (item.quantity || 1))}</b>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-2 border-t pt-4 text-sm">
                  <div className="flex justify-between"><span>Tạm tính</span><b>{money(subtotal)}</b></div>
                  <div className="flex justify-between"><span>Phí ship</span><b>{money(shippingFee)}</b></div>
                  <div className="flex justify-between text-green-600"><span>Voucher</span><b>-{money(discount)}</b></div>
                  <div className="flex justify-between border-t pt-3 text-lg font-black">
                    <span>Tổng</span>
                    <span className="text-red-500">{money(total)}</span>
                  </div>
                </div>

                <button onClick={saveOrder} className="mt-4 w-full rounded-2xl bg-blue-600 py-4 font-black text-white hover:bg-blue-700">
                  Đặt hàng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
