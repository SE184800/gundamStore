import PageShell from "../../components/common/PageShell";
import ProductCard from "../../components/storefront/ProductCard";
import { useCms, useLang } from "../../store/CmsStore";
import { CalendarClock, ClipboardCheck, PackageCheck, WalletCards } from "lucide-react";

export default function PreOrderPage() {
  const { state, actions } = useCms();
  const [lang] = useLang();

  const products = state.products || [];
  const rows = products.filter((p) => String(p.status || "").toLowerCase().includes("pre"));

  return (
    <PageShell>
      <main className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8">
        <section className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-8 text-white shadow-[0_30px_120px_rgba(15,23,42,0.25)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(59,130,246,0.35),transparent_35%)]" />
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex rounded-full bg-amber-400 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-slate-950">
              Pre-order
            </div>
            <h1 className="mt-5 text-5xl font-black leading-[0.95] md:text-7xl">
              Đặt trước Gunpla sắp về
            </h1>
            <p className="mt-5 text-base font-semibold leading-8 text-white/75">
              Theo dõi ETA rõ ràng, quy trình cọc minh bạch và cập nhật trạng thái đơn hàng cho collector.
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <Step icon={ClipboardCheck} title="1. Chọn mẫu" desc="Chọn sản phẩm đang mở pre-order." />
          <Step icon={WalletCards} title="2. Đặt cọc" desc="Xác nhận giữ slot với mức cọc." />
          <Step icon={CalendarClock} title="3. Theo dõi ETA" desc="Shop cập nhật lịch hàng về." />
          <Step icon={PackageCheck} title="4. Nhận hàng" desc="Thanh toán phần còn lại và nhận hàng." />
        </section>

        <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-black uppercase text-amber-700">
                Now open
              </div>
              <h2 className="mt-2 text-3xl font-black text-slate-950">Sản phẩm đang mở pre-order</h2>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">{rows.length} items</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(rows.length ? rows : products.slice(0, 4)).map((product) => (
              <ProductCard key={product.id} product={{ ...product, status: "preorder" }} lang={lang} actions={actions} badge="PRE-ORDER" />
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-2xl font-black text-slate-950">Chính sách đặt trước</h3>
            <div className="mt-4 space-y-3 text-sm font-semibold leading-7 text-slate-600">
              <p>• Sản phẩm pre-order có ETA dự kiến, có thể thay đổi theo lịch hãng hoặc vận chuyển.</p>
              <p>• Khách đặt cọc để giữ slot, phần còn lại thanh toán khi hàng về.</p>
              <p>• Shop sẽ cập nhật trạng thái qua tài khoản, Zalo hoặc số điện thoại.</p>
            </div>
          </div>

          <div className="rounded-[30px] bg-gradient-to-br from-blue-700 to-cyan-500 p-6 text-white shadow-xl">
            <h3 className="text-2xl font-black">Cần tư vấn mẫu sắp về?</h3>
            <p className="mt-3 text-sm font-semibold leading-7 text-white/85">
              Liên hệ shop để được tư vấn dòng HG/RG/MG/PG phù hợp ngân sách và lịch hàng.
            </p>
            <button className="mt-5 rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-700">
              Chat với shop
            </button>
          </div>
        </section>
      </main>
    </PageShell>
  );
}

function Step({ icon: Icon, title, desc }) {
  return (
    <article className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
        <Icon size={22} />
      </div>
      <h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{desc}</p>
    </article>
  );
}
