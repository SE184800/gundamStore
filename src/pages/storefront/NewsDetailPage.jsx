import { useEffect, useState } from "react";
import PageShell from "../../components/common/PageShell";
import { getPublicNewsBySlugApi } from "../../services/ContentApiService";

export default function NewsDetailPage() {
  const slug = window.location.pathname.split("/").pop();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    getPublicNewsBySlugApi(slug)
      .then((row) => {
        if (alive) setArticle(row || null);
      })
      .catch((error) => {
        console.error("PUBLIC_NEWS_DETAIL_ERROR", error);
        if (alive) setArticle(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [slug]);

  if (!article) {
    return (
      <PageShell>
        <main className="mx-auto max-w-[1100px] px-4 py-16 text-center">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 font-bold text-slate-500">
            {loading ? "Đang tải bài viết..." : "Không tìm thấy bài viết."}
          </div>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-[1100px] px-4 py-8 lg:px-8">
        <article className="overflow-hidden rounded-6xl border border-slate-200 bg-white shadow-sm">
          <div className="h-[460px] bg-slate-100">
            <img src={article.image} alt="" loading="eager" decoding="async" className="h-full w-full object-cover" />
          </div>

          <div className="p-7 lg:p-10">
            <div className="text-xs font-black uppercase tracking-[0.25em] text-blue-700">{article.tag}</div>
            <h1 className="mt-3 text-5xl font-black leading-tight text-slate-950">{article.title}</h1>
            <p className="mt-4 text-sm font-semibold text-slate-500">{article.date}</p>

            <div className="mt-8 space-y-5 text-base font-semibold leading-8 text-slate-700">
              {(Array.isArray(article.content) ? article.content : []).map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
        </article>
      </main>
    </PageShell>
  );
}
