import PageShell from "../../components/common/PageShell";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";

export default function ContactPage() {
  return (
    <PageShell>
      <main className="mx-auto max-w-[1200px] px-4 py-8 lg:px-8">
        <section className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-xs font-black uppercase tracking-[0.25em] text-blue-700">Contact</div>
          <h1 className="mt-4 text-5xl font-black text-slate-950">Liên hệ Gundam Store</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-600">
            Cần tư vấn sản phẩm, pre-order, bảo hành hoặc hợp tác sự kiện? Gửi thông tin cho shop.
          </p>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-4">
            <Info icon={Phone} title="Hotline" value="0900 000 000" />
            <Info icon={MessageCircle} title="Zalo/Facebook" value="Chat với shop 09:00 - 22:00" />
            <Info icon={Mail} title="Email" value="support@gundamstore.vn" />
            <Info icon={MapPin} title="Địa chỉ" value="TP.HCM, Việt Nam" />
          </div>

          <form className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <input className="rounded-2xl border border-slate-200 px-4 py-4 text-sm font-semibold outline-none" placeholder="Họ tên" />
              <input className="rounded-2xl border border-slate-200 px-4 py-4 text-sm font-semibold outline-none" placeholder="Số điện thoại" />
            </div>
            <input className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-4 text-sm font-semibold outline-none" placeholder="Chủ đề" />
            <textarea className="mt-4 min-h-[160px] w-full rounded-2xl border border-slate-200 px-4 py-4 text-sm font-semibold outline-none" placeholder="Nội dung cần hỗ trợ..." />
            <button type="button" className="mt-4 rounded-2xl bg-blue-700 px-6 py-4 text-sm font-black text-white">Gửi yêu cầu</button>
          </form>
        </section>
      </main>
    </PageShell>
  );
}

function Info({ icon: Icon, title, value }) {
  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
        <Icon size={22} />
      </div>
      <h2 className="mt-4 text-lg font-black text-slate-950">{title}</h2>
      <p className="mt-1 text-sm font-semibold text-slate-500">{value}</p>
    </div>
  );
}
