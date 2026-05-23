import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, TicketPercent, ShieldCheck, Truck } from "lucide-react";
import { getCart, saveCart, saveCheckoutDraft } from "../../services/CartService";
import { applyVoucher } from "../../services/VoucherService";
import { getStock } from "../../services/InventoryService";
import StorefrontShell from "../../components/storefront/StorefrontShell";

const money = (n) => (Number(n) || 0).toLocaleString("vi-VN") + "đ";

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [voucherCode, setVoucherCode] = useState("");
  const [shippingMethod, setShippingMethod] = useState("FAST");

  useEffect(() => {
    setCart(getCart());
  }, []);

  const selectedItems = cart.filter((item) => item.selected !== false);

  const subtotal = useMemo(
    () =>
      selectedItems.reduce(
        (sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1),
        0
      ),
    [selectedItems]
  );

  const baseShippingFee = selectedItems.length
    ? shippingMethod === "EXPRESS"
      ? 60000
      : 30000
    : 0;

  const voucher = applyVoucher(voucherCode, subtotal, baseShippingFee);
  const total = Math.max(
    0,
    subtotal + baseShippingFee - voucher.discount - voucher.shippingDiscount
  );

  function updateCart(next) {
    setCart(next);
    saveCart(next);
  }

  function getAvailable(item) {
    return Number(getStock(item.id).available) || 0;
  }

  function increaseQty(item) {
    const available = getAvailable(item);

    if ((item.quantity || 1) >= available) {
      alert(`Sản phẩm "${item.name}" chỉ còn ${available} sản phẩm trong kho.`);
      return;
    }

    updateCart(
      cart.map((x) =>
        x.id === item.id ? { ...x, quantity: (x.quantity || 1) + 1 } : x
      )
    );
  }

  function decreaseQty(item) {
    updateCart(
      cart.map((x) =>
        x.id === item.id
          ? { ...x, quantity: Math.max(1, (x.quantity || 1) - 1) }
          : x
      )
    );
  }

  function toggleAll() {
    const allSelected = cart.every((item) => item.selected !== false);
    updateCart(cart.map((item) => ({ ...item, selected: !allSelected })));
  }

  function goCheckout() {
    if (!selectedItems.length) {
      alert("Vui lòng chọn ít nhất 1 sản phẩm.");
      return;
    }

    const invalidItem = selectedItems.find(
      (item) => (item.quantity || 1) > getAvailable(item)
    );

    if (invalidItem) {
      alert(
        `Sản phẩm "${invalidItem.name}" chỉ còn ${getAvailable(
          invalidItem
        )} sản phẩm trong kho.`
      );
      return;
    }

    saveCheckoutDraft({
      items: selectedItems,
      subtotal,
      shippingFee: baseShippingFee,
      discount: voucher.discount,
      shippingDiscount: voucher.shippingDiscount,
      voucherCode: voucher.valid ? voucherCode.trim().toUpperCase() : "",
      total,
      shippingMethod,
    });

    navigate("/checkout");
  }

  return (
    <StorefrontShell>
      <main className="min-h-screen bg-[#F5F7FB] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
              Shopping Cart
            </p>
            <h1 className="mt-2 text-4xl font-black text-slate-950">
              Giỏ hàng của bạn
            </h1>
          </div>

          <Link to="/shop" className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-600 shadow-sm">
            Tiếp tục mua hàng
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
          <section className="space-y-4">
            <div className="hidden rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-500 shadow-sm md:grid md:grid-cols-[40px_1fr_130px_140px_150px_70px]">
              <div>
                <input
                  type="checkbox"
                  checked={cart.length > 0 && cart.every((item) => item.selected !== false)}
                  onChange={toggleAll}
                  className="h-5 w-5"
                />
              </div>
              <div>Sản phẩm</div>
              <div>Đơn giá</div>
              <div>Số lượng</div>
              <div>Thành tiền</div>
              <div></div>
            </div>

            {cart.length === 0 ? (
              <div className="rounded-3xl bg-white p-16 text-center shadow-sm">
                <div className="text-2xl font-black text-slate-800">Giỏ hàng đang trống</div>
                <Link to="/shop" className="mt-5 inline-block rounded-2xl bg-blue-600 px-6 py-3 font-black text-white">
                  Mua sắm ngay
                </Link>
              </div>
            ) : (
              cart.map((item) => {
                const available = getAvailable(item);
                const qty = item.quantity || 1;
                const lineTotal = (Number(item.price) || 0) * qty;
                const overStock = qty > available;

                return (
                  <div
                    key={item.id}
                    className={`grid items-center gap-4 rounded-3xl bg-white p-5 shadow-sm md:grid-cols-[40px_1fr_130px_140px_150px_70px] ${
                      overStock ? "ring-2 ring-red-200" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.selected !== false}
                      onChange={() =>
                        updateCart(
                          cart.map((x) =>
                            x.id === item.id
                              ? { ...x, selected: x.selected === false }
                              : x
                          )
                        )
                      }
                      className="h-5 w-5"
                    />

                    <div className="flex gap-4">
                      <img
                        src={item.image}
                        className="h-24 w-24 rounded-2xl bg-slate-100 object-cover"
                      />
                      <div>
                        <h3 className="font-black text-slate-950">{item.name}</h3>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          Chính hãng Bandai • Bọc chống sốc
                        </p>

                        <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                          <ShieldCheck size={13} /> Hàng đảm bảo
                        </div>

                        <div className={`mt-2 text-xs font-black ${available <= 0 ? "text-red-500" : "text-slate-500"}`}>
                          Còn {available} sản phẩm
                        </div>

                        {overStock && (
                          <div className="mt-1 text-xs font-black text-red-500">
                            Số lượng vượt tồn kho
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="font-black text-red-500">{money(item.price)}</div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => decreaseQty(item)}
                        className="rounded-xl border p-2 hover:bg-slate-50"
                      >
                        <Minus size={15} />
                      </button>

                      <span className="w-10 text-center font-black">
                        {qty}
                      </span>

                      <button
                        onClick={() => increaseQty(item)}
                        disabled={qty >= available}
                        className={`rounded-xl border p-2 ${
                          qty >= available
                            ? "cursor-not-allowed bg-slate-100 text-slate-300"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <Plus size={15} />
                      </button>
                    </div>

                    <div className="font-black text-slate-950">{money(lineTotal)}</div>

                    <button
                      onClick={() => updateCart(cart.filter((x) => x.id !== item.id))}
                      className="rounded-xl bg-red-50 p-3 text-red-500 hover:bg-red-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })
            )}
          </section>

          <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Tóm tắt thanh toán</h2>

            <div className="mt-5 rounded-2xl bg-blue-50 p-4">
              <div className="flex items-center gap-2 font-black text-blue-700">
                <TicketPercent size={18} />
                Mã khuyến mãi
              </div>

              <input
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                placeholder="GUNDAM10 / FREESHIP / VIP50"
                className="mt-3 w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm outline-none"
              />

              {voucherCode && (
                <p className={`mt-2 text-xs font-bold ${voucher.valid ? "text-green-600" : "text-red-500"}`}>
                  {voucher.message}
                </p>
              )}
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2 font-black text-slate-800">
                <Truck size={18} />
                Vận chuyển
              </div>

              <select
                value={shippingMethod}
                onChange={(e) => setShippingMethod(e.target.value)}
                className="w-full rounded-2xl border bg-white px-4 py-3 outline-none"
              >
                <option value="FAST">Giao nhanh - 30.000đ</option>
                <option value="EXPRESS">Hỏa tốc - 60.000đ</option>
              </select>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Sản phẩm đã chọn</span>
                <b>{selectedItems.length}</b>
              </div>

              <div className="flex justify-between">
                <span>Tạm tính</span>
                <b>{money(subtotal)}</b>
              </div>

              <div className="flex justify-between">
                <span>Phí vận chuyển</span>
                <b>{money(baseShippingFee)}</b>
              </div>

              <div className="flex justify-between text-green-600">
                <span>Giảm giá sản phẩm</span>
                <b>-{money(voucher.discount)}</b>
              </div>

              <div className="flex justify-between text-green-600">
                <span>Giảm phí ship</span>
                <b>-{money(voucher.shippingDiscount)}</b>
              </div>

              <div className="flex justify-between border-t pt-4 text-xl font-black">
                <span>Tổng thanh toán</span>
                <span className="text-red-500">{money(total)}</span>
              </div>
            </div>

            <button
              onClick={goCheckout}
              className="mt-6 w-full rounded-2xl bg-blue-600 py-4 font-black text-white shadow-lg hover:bg-blue-700"
            >
              Mua hàng ({selectedItems.length})
            </button>
          </aside>
        </div>
      </div>
      </main>
    </StorefrontShell>
  );
}