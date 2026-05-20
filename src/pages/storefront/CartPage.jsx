import { Link } from "react-router-dom";
import { ChevronRight, CheckCircle2, CreditCard, Heart, MapPin, Minus, Plus, ShieldCheck, ShoppingCart, Tag, Trash2, Truck, Wallet } from "lucide-react";
import PageShell from "../../components/common/PageShell";
import ProductVisual from "../../components/common/ProductVisual";
import ProductCard from "../../components/storefront/ProductCard";
import { useCms, useLang } from "../../store/CmsStore";
import { formatCurrency, getText, productPayable } from "../../utils/format";

const text = {
  vi: { home: "Trang chủ", cart: "Giỏ hàng", title: "Giỏ hàng của bạn", subtitle: "Kiểm tra sản phẩm, số lượng, voucher và phí vận chuyển trước khi thanh toán.", selectAll: "Chọn tất cả", product: "Sản phẩm", unitPrice: "Đơn giá", quantity: "Số lượng", subtotal: "Tạm tính", actions: "Thao tác", inStock: "Hàng sẵn", preorder: "Pre-order", stockLeft: "Còn hàng", deposit: "Cọc trước", eta: "Dự kiến về", remaining: "Còn lại khi hàng về", boxCare: "Bọc chống sốc 3 lớp", note: "Lưu ý đơn hàng", voucher: "Voucher & ưu đãi", apply: "Áp dụng", shipping: "Giao hàng", deliverTo: "Giao đến", location: "TP.HCM, Quận 1", standardShip: "Giao tiêu chuẩn", expressShip: "Giao nhanh nội thành", payment: "Thanh toán dự kiến", selectedItems: "Sản phẩm đã chọn", merchandise: "Tiền hàng", discount: "Giảm giá", shippingFee: "Phí vận chuyển", total: "Tổng thanh toán", checkout: "Tiến hành thanh toán", continue: "Tiếp tục mua hàng", recommended: "Có thể bạn cần thêm" },
  en: { home: "Home", cart: "Cart", title: "Your shopping cart", subtitle: "Review products, quantities, vouchers and shipping fee before checkout.", selectAll: "Select all", product: "Product", unitPrice: "Unit price", quantity: "Quantity", subtotal: "Subtotal", actions: "Actions", inStock: "In stock", preorder: "Pre-order", stockLeft: "Available", deposit: "Deposit", eta: "ETA", remaining: "Remaining when arrived", boxCare: "Triple-layer box protection", note: "Order note", voucher: "Vouchers & deals", apply: "Apply", shipping: "Delivery", deliverTo: "Deliver to", location: "District 1, Ho Chi Minh City", standardShip: "Standard delivery", expressShip: "Express delivery", payment: "Payment options", selectedItems: "Selected items", merchandise: "Merchandise", discount: "Discount", shippingFee: "Shipping fee", total: "Total payment", checkout: "Proceed to checkout", continue: "Continue shopping", recommended: "You may also need" }
};

function Qty({ value, onChange, max = 99 }) {
  return (
    <div className="inline-flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button onClick={() => onChange(Math.max(1, value - 1))} className="p-3 hover:bg-slate-50"><Minus size={15} /></button>
      <div className="w-10 text-center text-sm font-black">{value}</div>
      <button onClick={() => onChange(Math.min(max, value + 1))} className="p-3 hover:bg-slate-50"><Plus size={15} /></button>
    </div>
  );
}

export default function CartPage() {
  const { state, actions } = useCms();
  const [lang] = useLang();
  const t = text[lang];

  const items = state.cart.map((item) => ({ ...item, product: state.products.find((p) => p.id === item.productId) })).filter((i) => i.product);
  const selected = items.filter((i) => i.selected);
  const selectedCount = selected.reduce((sum, item) => sum + item.qty, 0);
  const merchandise = selected.reduce((sum, item) => sum + productPayable(item.product) * item.qty, 0);
  const discount = selected.length > 0 ? 50000 : 0;
  const shippingFee = selected.length > 0 ? 25000 : 0;
  const total = Math.max(0, merchandise - discount + shippingFee);
  const allSelected = items.length > 0 && items.every((i) => i.selected);
  const recommended = state.products.filter((p) => !items.some((i) => i.productId === p.id)).slice(0, 4);

  return (
    <PageShell>
      <section className="mx-auto max-w-[1440px] px-4 py-5 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500"><Link to="/">{t.home}</Link><ChevronRight size={16} /><span className="text-slate-950">{t.cart}</span></div>
        <div className="mb-5 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div><div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700"><ShoppingCart size={15} />{t.cart}</div><h1 className="text-3xl font-black text-slate-950 lg:text-4xl">{t.title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{t.subtitle}</p></div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-black text-emerald-700"><CheckCircle2 className="mr-2 inline" size={18} />{t.boxCare}</div>
          </div>
        </div>

        <div className="mb-5 grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm md:grid-cols-4">
          {[["Bảo vệ người mua", "Hoàn tiền nếu sai sản phẩm / lỗi theo chính sách", ShieldCheck], ["Thanh toán an toàn", "COD, chuyển khoản, ví điện tử sau này", CreditCard], ["Đổi trả rõ ràng", "Khuyến khích quay video mở hộp", CheckCircle2], ["Tích điểm thành viên", "Nhận điểm cho đơn hàng hợp lệ", Wallet]].map(([title, desc, Icon], idx) => (
            <div key={title} className={`flex gap-3 p-4 ${idx > 0 ? "border-t border-slate-100 md:border-l md:border-t-0" : ""}`}><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700"><Icon size={21} /></div><div><div className="text-sm font-black text-slate-950">{title}</div><div className="mt-1 text-xs leading-5 text-slate-500">{desc}</div></div></div>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <label className="flex items-center gap-3 text-sm font-black text-slate-700"><input type="checkbox" checked={allSelected} onChange={() => items.forEach((item) => actions.updateCartItem(item.productId, { selected: !allSelected }))} className="h-4 w-4 rounded border-slate-300 text-blue-600" />{t.selectAll}</label>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-gradient-to-r from-amber-50 to-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-amber-800"><span className="flex items-center gap-2"><Tag size={16} />Voucher của shop: Lưu mã giảm giá trước khi thanh toán.</span><button className="rounded-xl bg-amber-500 px-3 py-1.5 text-[11px] font-black text-white hover:bg-amber-600">{t.apply}</button></div>
              </div>
              <div className="space-y-3 p-3">
                {items.map((item) => {
                  const product = item.product;
                  const isPreorder = product.status === "preorder" || product.preorder?.enabled;
                  return (
                    <div key={item.productId} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-lg hover:shadow-blue-100/50">
                      <div className="grid gap-4 lg:grid-cols-[32px_1fr_130px_130px_130px_96px] lg:items-center">
                        <div><input type="checkbox" checked={item.selected} onChange={() => actions.updateCartItem(item.productId, { selected: !item.selected })} className="h-4 w-4 rounded border-slate-300 text-blue-600" /></div>
                        <div className="flex gap-4"><div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-1"><ProductVisual tone={product.tone} imageUrl={product.imageUrl} /></div><div><div className="flex flex-wrap gap-2"><span className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase text-white ${isPreorder ? "bg-violet-600" : "bg-emerald-600"}`}>{isPreorder ? t.preorder : t.inStock}</span><span className="rounded-lg border border-blue-100 bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700">{product.brand}</span></div><Link to={`/product/${product.slug}`} className="mt-2 block line-clamp-2 text-sm font-black leading-5 text-slate-950 hover:text-blue-700">{getText(product.name, lang)}</Link><div className="mt-1 text-xs font-semibold text-slate-500">SKU: {product.sku}</div><div className="mt-2 text-xs font-bold text-slate-600">{isPreorder ? `${t.eta}: ${product.preorder?.eta}` : `${t.stockLeft}: ${product.stock}`}</div></div></div>
                        <div className="lg:text-right"><div className="text-sm font-black text-slate-950">{formatCurrency(product.price)}</div>{Number(product.oldPrice) > 0 && <div className="text-xs font-bold text-slate-400 line-through">{formatCurrency(product.oldPrice)}</div>}{isPreorder && <div className="mt-1 text-[11px] font-bold text-violet-700">{t.deposit}: {formatCurrency(product.preorder?.deposit)}</div>}</div>
                        <div><Qty value={item.qty} onChange={(qty) => actions.updateCartItem(item.productId, { qty })} max={product.stock || 99} /></div>
                        <div className="lg:text-right"><div className={isPreorder ? "text-sm font-black text-violet-700" : "text-sm font-black text-blue-700"}>{formatCurrency(productPayable(product) * item.qty)}</div>{isPreorder && <div className="mt-1 text-[11px] font-semibold text-slate-500">{t.remaining}: {formatCurrency((product.price - product.preorder?.deposit) * item.qty)}</div>}</div>
                        <div className="flex gap-2 lg:justify-end"><button className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm hover:text-rose-600"><Heart size={17} /></button><button onClick={() => actions.removeCartItem(item.productId)} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm hover:text-red-600"><Trash2 size={17} /></button></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-3 text-lg font-black text-slate-950">{t.note}</div><textarea className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium outline-none focus:border-blue-300" placeholder="Shop bọc kỹ hộp giúp mình..." /></div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-2 text-lg font-black text-slate-950"><Truck className="text-blue-600" />{t.shipping}</div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-xs font-black uppercase text-slate-500">{t.deliverTo}</div><div className="mt-1 flex items-center gap-2 text-sm font-black text-slate-950"><MapPin size={16} className="text-blue-600" />{t.location}</div></div>
              <div className="mt-4 grid gap-2"><button className="flex items-center justify-between rounded-2xl border border-blue-300 bg-blue-50 p-3 text-left text-sm font-bold text-blue-700"><span>{t.standardShip}</span><span>{formatCurrency(25000)}</span></button><button className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 text-left text-sm font-bold text-slate-600 hover:bg-slate-50"><span>{t.expressShip}</span><span>{formatCurrency(45000)}</span></button></div>
            </div>
          </div>

          <aside className="sticky top-28 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 text-lg font-black text-slate-950">{t.total}</div>
              <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 p-4"><div className="mb-2 flex items-center gap-2 text-xs font-black text-blue-800"><Truck size={16} />Mua thêm 350.000₫ để đạt ưu đãi freeship</div><div className="h-2 overflow-hidden rounded-full bg-white"><div className="h-full w-[72%] rounded-full bg-blue-600" /></div></div>
              <div className="space-y-3 text-sm font-semibold text-slate-600"><div className="flex justify-between"><span>{t.selectedItems}</span><b className="text-slate-950">{selectedCount}</b></div><div className="flex justify-between"><span>{t.merchandise}</span><b className="text-slate-950">{formatCurrency(merchandise)}</b></div><div className="flex justify-between"><span>{t.discount}</span><b className="text-red-600">- {formatCurrency(discount)}</b></div><div className="flex justify-between"><span>{t.shippingFee}</span><b className="text-slate-950">{formatCurrency(shippingFee)}</b></div></div>
              <div className="mt-4 border-t border-slate-100 pt-4"><div className="flex items-end justify-between gap-3"><span className="text-sm font-black text-slate-600">{t.total}</span><span className="text-2xl font-black text-blue-700">{formatCurrency(total)}</span></div></div>
              <Link to="/checkout" onClick={() => actions.track("checkout_started")} className="mt-5 block w-full rounded-2xl bg-blue-700 px-5 py-3 text-center text-sm font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-800">{t.checkout}</Link>
              <Link to="/shop" className="mt-3 block w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50">{t.continue}</Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-4 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-xl font-black text-slate-950">{t.recommended}</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{recommended.map((p) => <ProductCard key={p.id} product={p} compact />)}</div></div>
      </section>
    </PageShell>
  );
}
