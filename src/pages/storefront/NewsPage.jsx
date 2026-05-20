import PageShell from "../../components/common/PageShell";
import { seedNews } from "../../data/news";
import { useCms } from "../../store/CmsStore";

export default function NewsPage() {
  const { state } = useCms();
  const articles = (state.news && state.news.length ? state.news : seedNews).filter((n) => n.status !== "Draft");
  const featured = articles.find((n) => n.featured) || articles[0];
  const rest = articles.filter((n) => n.id !== featured.id);

  return (
    <PageShell>
      <main className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <a href={`/news/${featured.slug}`} className="group overflow-hidden rounded-[36px] bg-slate-950 shadow-xl">
            <div className="relative h-[420px]">
              <img src={featured.image} alt="" className="h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent" />
              <div className="absolute bottom-8 left-8 max-w-2xl text-white">
                <div className="mb-3 inline-flex rounded-full bg-blue-700 px-3 py-1 text-xs font-black uppercase">
                  Featured
                </div>
                <h1 className="text-5xl font-black leading-tight">{featured.title}</h1>
                <p className="mt-3 text-sm font-semibold leading-7 text-white/75">{featured.excerpt}</p>
              </div>
            </div>
          </a>

          <aside className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-black uppercase tracking-[0.25em] text-blue-700">Trending</div>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Tin nổi bật</h2>
            <div className="mt-5 space-y-4">
              {articles.map((item) => (
                <a key={item.id} href={`/news/${item.slug}`} className="block rounded-2xl border border-slate-100 p-4 hover:bg-slate-50">
                  <div className="text-xs font-black text-blue-700">{item.tag}</div>
                  <div className="mt-1 text-sm font-black text-slate-950">{item.title}</div>
                </a>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-8 rounded-[30px] border border-blue-100 bg-blue-50 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">Events</div>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Lịch sự kiện Gunpla</h2>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                Xem workshop, build contest, expo và sự kiện cộng đồng.
              </p>
            </div>
            <a href="/news/events" className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white">
              Xem lịch sự kiện
            </a>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-3xl font-black text-slate-950">Bài viết mới</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {rest.concat(articles).map((item, index) => (
              <a key={`${item.id}-${index}`} href={`/news/${item.slug}`} className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="h-56 overflow-hidden bg-slate-100">
                  <img src={item.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                </div>
                <div className="p-5">
                  <div className="text-xs font-black uppercase text-blue-700">{item.tag}</div>
                  <h3 className="mt-2 text-xl font-black text-slate-950">{item.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-500">{item.excerpt}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      </main>
    </PageShell>
  );
}
