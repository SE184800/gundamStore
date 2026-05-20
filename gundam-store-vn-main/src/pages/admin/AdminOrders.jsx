import { PackageCheck, Truck } from "lucide-react";
import { useCms, useLang } from "../../store/CmsStore";
import { formatCurrency } from "../../utils/format";

const text = {
  vi: { title: "Quản lý đơn hàng", desc: "Đơn được tạo từ Checkout sẽ xuất hiện tại đây.", customer: "Khách hàng", status: "Trạng thái", value: "Giá trị", update: "Cập nhật" },
  en: { title: "Order Manager", desc: "Orders created from Checkout appear here.", customer: "Customer", status: "Status", value: "Value", update: "Update" }
};

export default function AdminOrders() {
  const { state, actions } = useCms();
  const [lang] = useLang();
  const t = text[lang];
  const statuses = ["new", "confirmed", "packing", "shipping", "completed", "cancelled"];

  return (
    <>
      <section className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/50">
        <h1 className="text-3xl font-black text-slate-950">{t.title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{t.desc}</p>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-3">
          {state.orders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-4 lg:grid-cols-[160px_1fr_150px_170px] lg:items-center">
                <div><div className="font-black text-blue-700">#{order.id}</div><div className="mt-1 text-xs font-semibold text-slate-500">{order.createdAt}</div></div>
                <div><div className="font-black text-slate-950">{order.customer}</div><div className="mt-1 text-xs font-semibold text-slate-500">{order.phone} • {order.address}</div></div>
                <div className="font-black text-blue-700">{formatCurrency(order.total)}</div>
                <select value={order.status} onChange={(e) => actions.updateOrder(order.id, { status: e.target.value })} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold">{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</select>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                {(order.items || []).map((item, index) => <div key={index} className="rounded-xl bg-white p-3 text-xs font-bold text-slate-600"><PackageCheck className="mr-1 inline text-blue-600" size={14}/>{item.name} x{item.qty}</div>)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
