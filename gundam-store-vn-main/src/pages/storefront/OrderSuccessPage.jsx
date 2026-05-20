import { Link, useParams } from "react-router-dom";
import { CalendarDays, CheckCircle2, ChevronRight, ClipboardCheck, Copy, Home, MessageCircle, Receipt, SearchCheck, ShieldCheck, Truck } from "lucide-react";
import PageShell from "../../components/common/PageShell";
import ProductVisual from "../../components/common/ProductVisual";
import ProductCard from "../../components/storefront/ProductCard";
import { useCms, useLang } from "../../store/CmsStore";
import { formatCurrency } from "../../utils/format";

const text = {
  vi: {
    home: "Trang chủ", checkout: "Thanh toán", success: "Đặt hàng thành công", title: "Đặt hàng thành công!", subtitle: "Cảm ơn bạn đã mua hàng tại Gundam Store VN. Shop sẽ xác nhận và chuẩn bị đơn trong thời gian sớm nhất.",
    orderCode: "Mã đơn hàng", orderStatus: "Trạng thái đơn", statusConfirmed: "Đã ghi nhận đơn hàng", paymentStatus: "Trạng thái thanh toán", cod: "Thanh toán khi nhận hàng / COD", delivery: "Dự kiến giao hàng", deliveryTime: "1-3 ngày làm việc", trackingTitle: "Tiến trình đơn hàng",
    step1: "Đặt hàng thành công", step2: "Shop xác nhận", step3: "Đóng gói", step4: "Đang giao hàng", step5: "Hoàn tất",
    addressTitle: "Thông tin nhận hàng", productList: "Sản phẩm trong đơn", summaryTitle: "Tóm tắt đơn hàng", total: "Cần thanh toán hiện tại", actions: "Bạn muốn làm gì tiếp theo?", trackOrder: "Theo dõi đơn hàng", continueShopping: "Tiếp tục mua hàng", contactSupport: "Liên hệ hỗ trợ", viewInvoice: "Xem hóa đơn", recommended: "Gợi ý mua thêm cho builder"
  },
  en: {
    home: "Home", checkout: "Checkout", success: "Order placed", title: "Order placed successfully!", subtitle: "Thank you for shopping at Gundam Store VN. The shop will confirm and prepare your order soon.",
    orderCode: "Order code", orderStatus: "Order status", statusConfirmed: "Order received", paymentStatus: "Payment status", cod: "Cash on delivery / COD", delivery: "Estimated delivery", deliveryTime: "1-3 business days", trackingTitle: "Order timeline",
    step1: "Order placed", step2: "Shop confirmation", step3: "Packing", step4: "Shipping", step5: "Completed",
    addressTitle: "Shipping information", productList: "Order items", summaryTitle: "Order summary", total: "Payment due now", actions: "What would you like to do next?", trackOrder: "Track order", continueShopping: "Continue shopping", contactSupport: "Contact support", viewInvoice: "View invoice", recommended: "Builder add-on suggestions"
  }
};

export default function OrderSuccessPage() {
  const { orderId } = useParams();
  const { state } = useCms();
  const [lang] = useLang();
  const t = text[lang];
  const order = state.orders.find((o) => o.id === orderId) || state.orders[0];
  const steps = [t.step1, t.step2, t.step3, t.step4, t.step5];

  return (
    <PageShell>
      <section className="mx-auto max-w-[1440px] px-4 py-5 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500"><Link to="/">{t.home}</Link><ChevronRight size={16} /><span>{t.checkout}</span><ChevronRight size={16} /><span className="text-slate-950">{t.success}</span></div>

        <section className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-100/60 lg:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-emerald-50 to-blue-50" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_360px] lg:items-center">
            <div>
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-600 text-white shadow-lg shadow-emerald-200"><CheckCircle2 size={34} /></div>
              <h1 className="text-3xl font-black text-slate-950 lg:text-5xl">{t.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{t.subtitle}</p>
              <div className="mt-5 flex flex-wrap gap-3"><Link to="/shop" className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-800">{t.continueShopping}</Link><button className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50">{t.contactSupport}</button></div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
              <div className="mb-2 text-xs font-black uppercase text-slate-500">{t.orderCode}</div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4"><div className="text-xl font-black text-blue-700">#{order?.id}</div><button className="rounded-xl bg-white p-2 text-blue-700 shadow-sm hover:bg-blue-100" onClick={() => navigator.clipboard?.writeText(order?.id || "")}><Copy size={18} /></button></div>
              <div className="mt-4 grid gap-3"><div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs font-black text-slate-500">{t.orderStatus}</div><div className="mt-1 font-black text-slate-950">{t.statusConfirmed}</div></div><div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs font-black text-slate-500">{t.paymentStatus}</div><div className="mt-1 font-black text-slate-950">{t.cod}</div></div></div>
            </div>
          </div>
        </section>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-2 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-blue-700 shadow-sm"><Truck size={26} /><div className="mt-3 text-xs font-black uppercase opacity-75">{t.delivery}</div><div className="mt-1 text-lg font-black">{t.deliveryTime}</div></div>
          <div className="rounded-3xl border border-violet-100 bg-violet-50 p-5 text-violet-700 shadow-sm"><CalendarDays size={26} /><div className="mt-3 text-xs font-black uppercase opacity-75">Pre-order ETA</div><div className="mt-1 text-lg font-black">T08/2026</div></div>
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-emerald-700 shadow-sm"><ShieldCheck size={26} /><div className="mt-3 text-xs font-black uppercase opacity-75">Protection</div><div className="mt-1 text-lg font-black">Box care</div></div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-5 px-4 py-5 lg:grid-cols-[1fr_360px] lg:px-8">
        <div className="space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2 text-xl font-black text-slate-950"><ClipboardCheck className="text-blue-600" />{t.trackingTitle}</div>
            <div className="space-y-4">{steps.map((step, index) => <div key={step} className="flex gap-4"><div className="flex flex-col items-center"><div className={`flex h-10 w-10 items-center justify-center rounded-2xl border text-sm font-black ${index < 2 ? "border-emerald-200 bg-emerald-600 text-white" : "border-slate-200 bg-slate-50 text-slate-400"}`}>{index + 1}</div>{index < steps.length - 1 && <div className={`mt-2 h-10 w-px ${index < 1 ? "bg-emerald-200" : "bg-slate-200"}`} />}</div><div className="pb-2"><div className="text-sm font-black text-slate-950">{step}</div><p className="mt-1 text-sm leading-6 text-slate-500">Gundam Store VN cập nhật trạng thái theo thời gian xử lý thực tế.</p></div></div>)}</div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="p-4"><div className="mb-3 text-lg font-black text-slate-950">{t.productList}</div><div className="space-y-3">{(order?.items || []).map((item, idx) => <div key={idx} className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_140px_110px_140px] lg:items-center"><div className="flex gap-4"><div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-1"><ProductVisual tone={item.preorder ? "gold" : "blue"} /></div><div><h3 className="mt-2 text-sm font-black leading-5 text-slate-950">{item.name}</h3><div className="mt-1 text-xs font-semibold text-slate-500">{item.preorder ? "Pre-order" : "In stock"}</div></div></div><div className="text-sm font-black text-slate-950 lg:text-right">{formatCurrency(item.price)}</div><div className="text-sm font-black text-slate-600 lg:text-center">x{item.qty}</div><div className="text-sm font-black text-blue-700 lg:text-right">{formatCurrency(item.price * item.qty)}</div></div>)}</div></div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 text-lg font-black text-slate-950">{t.actions}</div><div className="grid gap-3 sm:grid-cols-2">{[[t.trackOrder, SearchCheck, true], [t.contactSupport, MessageCircle], [t.viewInvoice, Receipt], [t.continueShopping, Home]].map(([label, Icon, primary]) => <button key={label} className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black shadow-sm transition ${primary ? "bg-blue-700 text-white shadow-blue-200 hover:bg-blue-800" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}><Icon size={17} />{label}</button>)}</div></section>
        </div>

        <aside className="sticky top-28 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 text-lg font-black text-slate-950">{t.summaryTitle}</div><div className="space-y-3 text-sm font-semibold text-slate-600"><div className="flex justify-between gap-3"><span>{t.total}</span><b className="text-blue-700">{formatCurrency(order?.total || 0)}</b></div></div></div>
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5"><div className="mb-2 flex items-center gap-2 text-sm font-black text-emerald-800"><ShieldCheck size={18} />Order protection</div><p className="text-xs font-semibold leading-5 text-emerald-700/80">Shop hỗ trợ xử lý nếu sản phẩm lỗi, thiếu phụ kiện hoặc vấn đề vận chuyển.</p></div>
        </aside>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-4 lg:px-8"><div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-xl font-black text-slate-950">{t.recommended}</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{state.products.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} compact />)}</div></div></section>
    </PageShell>
  );
}
