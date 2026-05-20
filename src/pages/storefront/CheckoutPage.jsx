import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BadgePercent, ChevronRight, CheckCircle2, CreditCard, Home, Lock, MapPin, Receipt, Store, Tag, Truck, Wallet } from "lucide-react";
import PageShell from "../../components/common/PageShell";
import ProductVisual from "../../components/common/ProductVisual";
import { useCms, useLang } from "../../store/CmsStore";
import { formatCurrency, getText, productPayable } from "../../utils/format";

const text = {
  vi: {
    home: "Trang chủ", cart: "Giỏ hàng", checkout: "Thanh toán", title: "Xác nhận thanh toán", subtitle: "Kiểm tra địa chỉ, vận chuyển, thanh toán và đơn hàng trước khi đặt mua.",
    addressTitle: "Địa chỉ nhận hàng", defaultAddress: "Địa chỉ mặc định", receiver: "Nguyễn Minh Khang", phone: "0909 123 456", address: "12 Nguyễn Huệ, Quận 1, TP.HCM", change: "Thay đổi",
    shopTitle: "Gundam Store VN", official: "Shop chính thức", productList: "Sản phẩm thanh toán", inStock: "Hàng sẵn", preorder: "Pre-order", deposit: "Cọc trước", remaining: "Còn lại khi hàng về",
    shippingTitle: "Phương thức vận chuyển", standardShip: "Giao tiêu chuẩn", standardDesc: "Nhận hàng dự kiến 1-3 ngày", expressShip: "Giao nhanh nội thành", expressDesc: "Áp dụng TP.HCM",
    voucherTitle: "Voucher & ưu đãi", voucherInput: "Nhập mã voucher", apply: "Áp dụng",
    paymentTitle: "Phương thức thanh toán", cod: "Thanh toán khi nhận hàng / COD", bank: "Chuyển khoản ngân hàng", ewallet: "Ví điện tử / cổng thanh toán sau này", invoiceTitle: "Thông tin hóa đơn", invoiceOption: "Tôi cần xuất hóa đơn / thông tin công ty",
    summaryTitle: "Tóm tắt thanh toán", merchandise: "Tiền hàng", depositTotal: "Tổng tiền cọc Pre-order", shippingFee: "Phí vận chuyển", discount: "Giảm giá", total: "Tổng cần thanh toán", remainingPayment: "Còn lại khi hàng Pre-order về", placeOrder: "Đặt hàng", backToCart: "Quay lại giỏ hàng", secure: "Thanh toán an toàn"
  },
  en: {
    home: "Home", cart: "Cart", checkout: "Checkout", title: "Confirm checkout", subtitle: "Review address, shipping, payment and order details before placing your order.",
    addressTitle: "Shipping address", defaultAddress: "Default address", receiver: "Nguyen Minh Khang", phone: "0909 123 456", address: "12 Nguyen Hue, District 1, Ho Chi Minh City", change: "Change",
    shopTitle: "Gundam Store VN", official: "Official shop", productList: "Checkout items", inStock: "In stock", preorder: "Pre-order", deposit: "Deposit", remaining: "Remaining when arrived",
    shippingTitle: "Shipping method", standardShip: "Standard delivery", standardDesc: "Estimated arrival in 1-3 days", expressShip: "Express delivery", expressDesc: "Available in HCMC",
    voucherTitle: "Vouchers & deals", voucherInput: "Enter voucher code", apply: "Apply",
    paymentTitle: "Payment method", cod: "Cash on delivery / COD", bank: "Bank transfer", ewallet: "E-wallet / payment gateway later", invoiceTitle: "Invoice information", invoiceOption: "I need invoice / company information",
    summaryTitle: "Payment summary", merchandise: "Merchandise", depositTotal: "Pre-order deposit total", shippingFee: "Shipping fee", discount: "Discount", total: "Total payment now", remainingPayment: "Remaining Pre-order payment", placeOrder: "Place order", backToCart: "Back to cart", secure: "Secure checkout"
  }
};

export default function CheckoutPage() {
  const { state, actions } = useCms();
  const [lang] = useLang();
  const t = text[lang];
  const navigate = useNavigate();
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const items = state.cart.map((item) => ({ ...item, product: state.products.find((p) => p.id === item.productId) })).filter((i) => i.product && i.selected);
  const merchandise = items.filter((i) => !(i.product.status === "preorder" || i.product.preorder?.enabled)).reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const depositTotal = items.filter((i) => i.product.status === "preorder" || i.product.preorder?.enabled).reduce((sum, item) => sum + productPayable(item.product) * item.qty, 0);
  const remainingPayment = items.filter((i) => i.product.status === "preorder" || i.product.preorder?.enabled).reduce((sum, item) => sum + (item.product.price - productPayable(item.product)) * item.qty, 0);
  const shippingFee = shippingMethod === "express" ? 45000 : 25000;
  const discount = items.length ? 50000 : 0;
  const total = Math.max(0, merchandise + depositTotal + shippingFee - discount);

  function placeOrder() {
    const orderId = actions.createOrder({
      customer: t.receiver,
      phone: t.phone,
      address: t.address,
      payment: paymentMethod,
      total,
      items: items.map((i) => ({ productId: i.product.id, name: getText(i.product.name, lang), qty: i.qty, price: productPayable(i.product), preorder: i.product.status === "preorder" || i.product.preorder?.enabled })),
    });
    navigate(`/order-success/${orderId}`);
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-[1440px] px-4 py-5 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500"><Link to="/">{t.home}</Link><ChevronRight size={16} /><Link to="/cart">{t.cart}</Link><ChevronRight size={16} /><span className="text-slate-950">{t.checkout}</span></div>
        <div className="mb-5 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700"><Lock size={15} />{t.checkout}</div><h1 className="text-3xl font-black text-slate-950 lg:text-4xl">{t.title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{t.subtitle}</p></div><div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-black text-emerald-700"><CheckCircle2 className="mr-2 inline" size={18} />{t.secure}</div></div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-lg font-black text-slate-950"><MapPin className="text-blue-600" />{t.addressTitle}</div><button className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black text-blue-700">{t.change}</button></div>
              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4"><div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-black text-blue-700"><Home size={14} />{t.defaultAddress}</div><div className="text-base font-black text-slate-950">{t.receiver} • {t.phone}</div><p className="mt-2 text-sm leading-6 text-slate-600">{t.address}</p></div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-cyan-500 text-white shadow-lg shadow-blue-100"><Store size={22} /></div><div><div className="flex flex-wrap items-center gap-2"><div className="text-sm font-black text-slate-950">{t.shopTitle}</div><span className="rounded-lg bg-red-50 px-2 py-1 text-[10px] font-black uppercase text-red-600">{t.official}</span></div></div></div></div>
              <div className="p-4"><div className="mb-3 text-lg font-black text-slate-950">{t.productList}</div><div className="space-y-3">
                {items.map((item) => {
                  const product = item.product;
                  const isPreorder = product.status === "preorder" || product.preorder?.enabled;
                  const payable = productPayable(product);
                  return <div key={item.productId} className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_140px_110px_140px] lg:items-center"><div className="flex gap-4"><div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-1"><ProductVisual tone={product.tone} imageUrl={product.imageUrl} /></div><div><div className="flex flex-wrap gap-2"><span className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase text-white ${isPreorder ? "bg-violet-600" : "bg-emerald-600"}`}>{isPreorder ? t.preorder : t.inStock}</span><span className="rounded-lg border border-blue-100 bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700">{product.brand}</span></div><h3 className="mt-2 text-sm font-black leading-5 text-slate-950">{getText(product.name, lang)}</h3><div className="mt-1 text-xs font-semibold text-slate-500">SKU: {product.sku}</div></div></div><div className="text-sm font-black text-slate-950 lg:text-right">{formatCurrency(product.price)}</div><div className="text-sm font-black text-slate-600 lg:text-center">x{item.qty}</div><div className="lg:text-right"><div className={isPreorder ? "text-sm font-black text-violet-700" : "text-sm font-black text-blue-700"}>{formatCurrency(payable * item.qty)}</div>{isPreorder && <div className="mt-1 text-[11px] font-semibold text-slate-500">{t.remaining}: {formatCurrency((product.price - payable) * item.qty)}</div>}</div></div>;
                })}
              </div></div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2 text-lg font-black text-slate-950"><Truck className="text-blue-600" />{t.shippingTitle}</div><div className="grid gap-3 md:grid-cols-2">{[{ key: "standard", title: t.standardShip, desc: t.standardDesc, fee: 25000 }, { key: "express", title: t.expressShip, desc: t.expressDesc, fee: 45000 }].map((method) => <button key={method.key} onClick={() => setShippingMethod(method.key)} className={`rounded-3xl border p-4 text-left transition ${shippingMethod === method.key ? "border-blue-300 bg-blue-50 shadow-lg shadow-blue-100" : "border-slate-200 bg-white hover:bg-slate-50"}`}><div className="flex items-center justify-between gap-3"><div className="text-sm font-black text-slate-950">{method.title}</div><div className="text-sm font-black text-blue-700">{formatCurrency(method.fee)}</div></div><div className="mt-2 text-xs font-semibold text-slate-500">{method.desc}</div></button>)}</div></section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2 text-lg font-black text-slate-950"><BadgePercent className="text-amber-500" />{t.voucherTitle}</div><div className="flex gap-2"><input className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-300" placeholder={t.voucherInput} /><button className="rounded-2xl bg-blue-700 px-4 py-3 text-sm font-black text-white hover:bg-blue-800">{t.apply}</button></div><div className="mt-4 grid gap-2 md:grid-cols-2"><div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800"><Tag size={16} />GUNDAM10 - 10% off builder accessories</div><div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800"><Tag size={16} />FREESHIP - Conditional free shipping</div></div></section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2 text-lg font-black text-slate-950"><CreditCard className="text-blue-600" />{t.paymentTitle}</div><div className="grid gap-3">{[{ key: "cod", label: t.cod, icon: Wallet }, { key: "bank", label: t.bank, icon: CreditCard }, { key: "ewallet", label: t.ewallet, icon: Lock }].map((method) => { const Icon = method.icon; return <button key={method.key} onClick={() => setPaymentMethod(method.key)} className={`flex items-center justify-between rounded-2xl border p-4 text-left text-sm font-bold transition ${paymentMethod === method.key ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}><span className="flex items-center gap-3"><Icon size={18} />{method.label}</span>{paymentMethod === method.key && <CheckCircle2 size={18} />}</button>; })}</div></section>
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2 text-lg font-black text-slate-950"><Receipt className="text-blue-600" />{t.invoiceTitle}</div><label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700"><input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600" />{t.invoiceOption}</label></section>
          </div>

          <aside className="sticky top-28 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 text-lg font-black text-slate-950">{t.summaryTitle}</div>
              <div className="space-y-3 text-sm font-semibold text-slate-600"><div className="flex justify-between gap-3"><span>{t.merchandise}</span><b className="text-slate-950">{formatCurrency(merchandise)}</b></div><div className="flex justify-between gap-3"><span>{t.depositTotal}</span><b className="text-violet-700">{formatCurrency(depositTotal)}</b></div><div className="flex justify-between gap-3"><span>{t.shippingFee}</span><b className="text-slate-950">{formatCurrency(shippingFee)}</b></div><div className="flex justify-between gap-3"><span>{t.discount}</span><b className="text-red-600">- {formatCurrency(discount)}</b></div></div>
              <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50 p-3"><div className="flex items-center justify-between gap-3 text-xs font-black text-violet-800"><span>{t.remainingPayment}</span><span>{formatCurrency(remainingPayment)}</span></div></div>
              <div className="mt-4 border-t border-slate-100 pt-4"><div className="flex items-end justify-between gap-3"><span className="text-sm font-black text-slate-600">{t.total}</span><span className="text-2xl font-black text-blue-700">{formatCurrency(total)}</span></div></div>
              <button onClick={placeOrder} disabled={!items.length} className="mt-5 w-full rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">{t.placeOrder}</button>
              <Link to="/cart" className="mt-3 block w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50">{t.backToCart}</Link>
            </div>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}
