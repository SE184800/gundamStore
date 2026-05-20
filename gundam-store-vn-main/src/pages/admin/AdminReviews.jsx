import { Star, Trash2 } from "lucide-react";
import { useCms, useLang } from "../../store/CmsStore";

const text = {
  vi: { title: "Review & Comment Manager", desc: "Duyệt đánh giá/comment sản phẩm. Review được duyệt sẽ hiển thị ở Product Detail.", approve: "Duyệt", delete: "Xóa", approved: "Đã duyệt", pending: "Chờ duyệt" },
  en: { title: "Review & Comment Manager", desc: "Moderate product reviews/comments. Approved reviews show on Product Detail.", approve: "Approve", delete: "Delete", approved: "Approved", pending: "Pending" }
};

export default function AdminReviews() {
  const { state, actions } = useCms();
  const [lang] = useLang();
  const t = text[lang];

  return (
    <>
      <section className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/50">
        <h1 className="text-3xl font-black text-slate-950">{t.title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{t.desc}</p>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        {state.reviews.map((review) => {
          const product = state.products.find((p) => p.id === review.productId);
          return (
            <div key={review.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-black text-slate-950">{review.customer}</div>
                  <div className="mt-1 text-xs font-bold text-slate-500">{product?.name?.vi || review.productId}</div>
                  <div className="mt-2 flex gap-1 text-amber-400">{Array.from({ length: review.rating }).map((_, index) => <Star key={index} size={15} fill="currentColor" />)}</div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{review.comment}</p>
                </div>
                <span className={`rounded-xl px-3 py-1 text-xs font-black ${review.approved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{review.approved ? t.approved : t.pending}</span>
              </div>
              <div className="mt-4 flex gap-2">
                {!review.approved && <button onClick={() => actions.approveReview(review.id)} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-700">{t.approve}</button>}
                <button onClick={() => actions.deleteReview(review.id)} className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-black text-red-600"><Trash2 className="mr-1 inline" size={14}/>{t.delete}</button>
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
