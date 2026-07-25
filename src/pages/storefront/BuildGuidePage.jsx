import PageShell from "../../components/common/PageShell";

const guides = [
  ["Người mới bắt đầu", "Cách chọn HG/RG/MG phù hợp và bộ tool cơ bản."],
  ["Cắt runner sạch", "Hướng dẫn dùng kìm, dao hobby và xử lý nub mark."],
  ["Decal & panel line", "Các bước làm nổi chi tiết mô hình mà không quá khó."],
  ["Bảo quản mô hình", "Cách trưng bày, chống bụi và bảo vệ box."],
];

export default function BuildGuidePage() {
  return (
    <PageShell>
      <main className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8">
        <section className="rounded-5xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-xs font-black uppercase tracking-[0.25em] text-blue-700">Build Guide</div>
          <h1 className="mt-3 text-5xl font-black text-slate-950">Hướng dẫn build</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-600">
            Nội dung hướng dẫn giúp khách mới dễ bắt đầu và giúp builder nâng chất lượng mô hình.
          </p>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          {guides.map(([title, desc]) => (
            <article key={title} className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <h2 className="text-2xl font-black text-slate-950">{title}</h2>
              <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">{desc}</p>
              <button className="mt-5 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white">Xem hướng dẫn</button>
            </article>
          ))}
        </section>
      </main>
    </PageShell>
  );
}
