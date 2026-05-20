import { AlertTriangle } from "lucide-react";
import { useCms, useLang } from "../../store/CmsStore";

const text = {
  vi: { title: "Khiếu nại / Ticket", desc: "Xử lý đổi trả, thiếu phụ kiện, móp hộp, hoàn tiền.", status: "Trạng thái", priority: "Ưu tiên" },
  en: { title: "Complaints / Tickets", desc: "Handle returns, missing parts, damaged boxes and refunds.", status: "Status", priority: "Priority" }
};

export default function AdminComplaints() {
  const { state, actions } = useCms();
  const [lang] = useLang();
  const t = text[lang];
  const statuses = ["Mới", "Đang xác minh", "Chờ ảnh/video", "Đã xử lý", "Từ chối"];

  return (
    <>
      <section className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/50">
        <h1 className="text-3xl font-black text-slate-950">{t.title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{t.desc}</p>
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        {state.tickets.map((ticket) => (
          <div key={ticket.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-600"><AlertTriangle size={22}/></div>
            <div className="font-black text-blue-700">{ticket.id}</div>
            <div className="mt-1 text-lg font-black text-slate-950">{ticket.issue}</div>
            <div className="mt-2 text-sm font-semibold text-slate-500">{ticket.customer} • {ticket.createdAt}</div>
            <div className="mt-4 grid gap-2">
              <label className="text-xs font-black uppercase text-slate-400">{t.status}</label>
              <select value={ticket.status} onChange={(e) => actions.updateTicket(ticket.id, { status: e.target.value })} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold">{statuses.map((s) => <option key={s}>{s}</option>)}</select>
              <label className="text-xs font-black uppercase text-slate-400">{t.priority}</label>
              <select value={ticket.priority} onChange={(e) => actions.updateTicket(ticket.id, { priority: e.target.value })} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold"><option>Cao</option><option>Trung bình</option><option>Thấp</option></select>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
