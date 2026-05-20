import PageShell from "../../components/common/PageShell";
import { seedNews } from "../../data/news";
import { useCms } from "../../store/CmsStore";

export default function NewsDetailPage() {
  const { state } = useCms();
  const articles = state.news && state.news.length ? state.news : seedNews;
  const slug = window.location.pathname.split("/").pop();
  const article = articles.find((item) => item.slug === slug) || articles[0];

  return (
    <PageShell>
      <main className="mx-auto max-w-[1100px] px-4 py-8 lg:px-8">
        <article className="overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-sm">
          <div className="h-[460px] bg-slate-100">
            <img src={article.image} alt="" className="h-full w-full object-cover" />
          </div>

          <div className="p-7 lg:p-10">
            <div className="text-xs font-black uppercase tracking-[0.25em] text-blue-700">{article.tag}</div>
            <h1 className="mt-3 text-5xl font-black leading-tight text-slate-950">{article.title}</h1>
            <p className="mt-4 text-sm font-semibold text-slate-500">{article.date}</p>

            <div className="mt-8 space-y-5 text-base font-semibold leading-8 text-slate-700">
              {article.content.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
        </article>
      </main>
    </PageShell>
  );
}
