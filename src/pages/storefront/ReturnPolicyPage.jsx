import PageShell from "../../components/common/PageShell";

export default function ReturnPolicyPage() {
  return (
    <PageShell>
      <main className="mx-auto max-w-[1100px] px-4 py-8 lg:px-8">
        <section className="rounded-6xl bg-gradient-to-br from-blue-700 to-cyan-500 p-8 text-white">
          <div className="text-xs font-black uppercase tracking-[0.25em] text-white/75">Policy</div>
          <h1 className="mt-4 text-5xl font-black">Chính sách đổi trả</h1>
          <p className="mt-3 text-sm font-semibold text-white/80">Minh bạch để khách yên tâm mua hàng và pre-order.</p>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          {[
            ["Điều kiện hỗ trợ", "Sản phẩm sai mẫu, thiếu phụ kiện hoặc hư hỏng do vận chuyển."],
            ["Thời gian phản hồi", "Khách vui lòng liên hệ trong 48 giờ sau khi nhận hàng."],
            ["Bằng chứng cần có", "Video mở hộp, hình ảnh kiện hàng và mã đơn."],
            ["Không áp dụng", "Sản phẩm đã build, đã cắt runner hoặc mất phụ kiện do người dùng."],
          ].map(([title, desc]) => (
            <article key={title} className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">{title}</h2>
              <p className="mt-2 text-sm font-semibold leading-7 text-slate-600">{desc}</p>
            </article>
          ))}
        </section>
      </main>
    </PageShell>
  );
}
