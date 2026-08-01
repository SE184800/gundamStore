import PageShell from "../../components/common/PageShell";

const faqs = [
  ["Sản phẩm có chính hãng không?", "Shop ưu tiên hàng chính hãng Bandai và ghi rõ thông tin nguồn hàng trên từng sản phẩm."],
  ["Pre-order hoạt động như thế nào?", "Khách đặt cọc để giữ slot, shop cập nhật ETA và thanh toán phần còn lại khi hàng về."],
  ["Có hỗ trợ đổi trả không?", "Có hỗ trợ nếu sản phẩm lỗi do vận chuyển hoặc sai sản phẩm so với đơn hàng."],
  ["Có giao hàng toàn quốc không?", "Có. Shop hỗ trợ đóng gói chống sốc và giao hàng toàn quốc."],
];

export default function FAQPage() {
  return (
    <PageShell>
      <main className="mx-auto max-w-[1100px] px-4 py-8 lg:px-8">
        <section className="rounded-2xl bg-slate-950 p-8 text-white">
          <div className="text-xs font-black tracking-wide text-blue-300">Support</div>
          <h1 className="mt-4 text-5xl font-black">FAQ</h1>
          <p className="mt-3 text-sm font-semibold text-white/70">Các câu hỏi thường gặp khi mua Gundam/Gunpla.</p>
        </section>

        <section className="mt-8 space-y-4">
          {faqs.map(([q, a]) => (
            <article key={q} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">{q}</h2>
              <p className="mt-2 text-sm font-semibold leading-7 text-slate-600">{a}</p>
            </article>
          ))}
        </section>
      </main>
    </PageShell>
  );
}
