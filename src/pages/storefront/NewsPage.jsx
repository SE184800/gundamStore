import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronRight, Newspaper, Search, Sparkles, Tag, X } from "lucide-react";
import PageShell from "../../components/common/PageShell";
import { useLang } from "../../store/CmsStore";
import { getPublicNewsApi } from "../../services/ContentApiService";

function getCopy(lang) {
  return {
    home: lang === "en" ? "Home" : "Trang chủ",
    news: lang === "en" ? "News" : "Tin tức",
    title: lang === "en" ? "Gunpla News & Builder Hub" : "Tin tức Gunpla & Builder Hub",
    desc:
      lang === "en"
        ? "Follow new arrivals, pre-order updates, build guides, reviews, anime/lore and community activities."
        : "Theo dõi hàng mới, cập nhật pre-order, hướng dẫn build, review, anime/lore và hoạt động cộng đồng.",
    featured: lang === "en" ? "Featured" : "Nổi bật",
    trending: lang === "en" ? "Trending" : "Đang quan tâm",
    latest: lang === "en" ? "Latest articles" : "Bài viết mới",
    events: lang === "en" ? "Events" : "Sự kiện",
    eventsTitle: lang === "en" ? "Gunpla event calendar" : "Lịch sự kiện Gunpla",
    eventsDesc:
      lang === "en"
        ? "Workshops, build contests, live streams and community meetups."
        : "Workshop, build contest, livestream và offline cộng đồng.",
    viewEvents: lang === "en" ? "View events" : "Xem lịch sự kiện",
    search: lang === "en" ? "Search news, series, product..." : "Tìm tin tức, series, sản phẩm...",
    all: lang === "en" ? "All" : "Tất cả",
    noNews: lang === "en" ? "No articles found." : "Không có bài viết phù hợp.",
    productNews: lang === "en" ? "Product News" : "Tin sản phẩm",
    preorder: lang === "en" ? "Pre-order" : "Pre-order",
    buildGuide: lang === "en" ? "Build Guide" : "Hướng dẫn build",
    review: lang === "en" ? "Review" : "Review",
    animeLore: lang === "en" ? "Anime/Lore" : "Anime/Lore",
    storeNews: lang === "en" ? "Store News" : "Tin cửa hàng",
  };
}

function normalize(value = "") {
  return String(value || "").toLowerCase().trim();
}

function getArticleCategory(article = "") {
  const text = normalize([article.tag, article.title, article.excerpt, article.content].filter(Boolean).join(" "));

  if (text.includes("pre-order") || text.includes("preorder") || text.includes("đặt trước")) return "preorder";
  if (text.includes("guide") || text.includes("hướng dẫn") || text.includes("build")) return "buildGuide";
  if (text.includes("review") || text.includes("đánh giá")) return "review";
  if (text.includes("anime") || text.includes("lore") || text.includes("series")) return "animeLore";
  if (text.includes("store") || text.includes("policy") || text.includes("vận chuyển")) return "storeNews";
  return "productNews";
}

function getCategoryLabel(key, t) {
  return {
    productNews: t.productNews,
    preorder: t.preorder,
    buildGuide: t.buildGuide,
    review: t.review,
    animeLore: t.animeLore,
    storeNews: t.storeNews,
  }[key] || key;
}

export default function NewsPage() {
  const [lang] = useLang();
  const t = getCopy(lang);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [newsRows, setNewsRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    getPublicNewsApi()
      .then((rows) => {
        if (alive) setNewsRows(Array.isArray(rows) ? rows : []);
      })
      .catch((error) => {
        console.error("PUBLIC_NEWS_LOAD_ERROR", error);
        if (alive) setNewsRows([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const articles = useMemo(() => {
    return newsRows.map((item) => ({
      ...item,
      category: item.category || getArticleCategory(item),
    }));
  }, [newsRows]);

  const categories = [
    "all",
    "productNews",
    "preorder",
    "buildGuide",
    "review",
    "animeLore",
    "storeNews",
  ];

  const filtered = useMemo(() => {
    const q = normalize(query);

    return articles.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (!q) return true;

      const text = normalize([item.title, item.excerpt, item.tag, item.category].filter(Boolean).join(" "));
      return text.includes(q);
    });
  }, [articles, category, query]);

  const featured = filtered.find((item) => item.featured) || filtered[0] || articles[0];
  const rest = filtered.filter((item) => item.id !== featured?.id);

  return (
    <PageShell>
      <main className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
          <span>{t.home}</span>
          <ChevronRight size={16} />
          <span className="text-slate-950">{t.news}</span>
        </div>

        <section className="relative overflow-hidden rounded-2xl bg-slate-950 p-8 text-white shadow-[0_30px_120px_rgba(15,23,42,0.25)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(37,99,235,0.35),transparent_35%)]" />
          <div className="relative z-10 max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-700 px-4 py-2 text-xs font-black tracking-wide">
              <Newspaper size={15} />
              {t.news}
            </div>
            <h1 className="mt-5 text-5xl font-black leading-[0.95] md:text-7xl">
              {t.title}
            </h1>
            <p className="mt-5 max-w-3xl text-base font-semibold leading-8 text-white/75">
              {t.desc}
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex flex-1 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Search size={18} className="text-blue-600" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.search}
                className="w-full bg-transparent px-3 text-sm font-semibold outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label={lang === "en" ? "Clear search" : "Xóa tìm kiếm"}
                  className="rounded-xl p-1 text-slate-400 hover:bg-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((item) => (
                <button
                  key={item}
                  onClick={() => setCategory(item)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ${
                    category === item
                      ? "bg-blue-700 text-white"
                      : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  }`}
                >
                  {item === "all" ? t.all : getCategoryLabel(item, t)}
                </button>
              ))}
            </div>
          </div>
        </section>

        {featured && (
          <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
            <a href={`/news/${featured.slug}`} className="group overflow-hidden rounded-2xl bg-slate-950 shadow-lg">
              <div className="relative h-[420px]">
                <img
                  src={featured.image}
                  alt={featured.title}
                  loading="lazy"
                  className="h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent" />
                <div className="absolute bottom-8 left-8 max-w-2xl text-white">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-700 px-3 py-1 text-xs font-black">
                    <Sparkles size={14} />
                    {t.featured}
                  </div>
                  <h2 className="text-4xl font-black leading-tight md:text-5xl">{featured.title}</h2>
                  <p className="mt-3 text-sm font-semibold leading-7 text-white/75">{featured.excerpt}</p>
                </div>
              </div>
            </a>

            <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-xs font-black tracking-wide text-blue-700">{t.trending}</div>
              <h2 className="mt-2 text-2xl font-black text-slate-950">{lang === "en" ? "Top reads" : "Tin nổi bật"}</h2>
              <div className="mt-5 space-y-4">
                {filtered.slice(0, 5).map((item) => (
                  <a key={item.id} href={`/news/${item.slug}`} className="block rounded-2xl border border-slate-100 p-4 hover:bg-slate-50">
                    <div className="flex items-center gap-2 text-xs font-black text-blue-700">
                      <Tag size={13} />
                      {getCategoryLabel(item.category, t)}
                    </div>
                    <div className="mt-1 text-sm font-black text-slate-950">{item.title}</div>
                  </a>
                ))}
              </div>
            </aside>
          </section>
        )}

        <section className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-black tracking-wide text-blue-700">
                <CalendarDays size={15} />
                {t.events}
              </div>
              <h2 className="mt-1 text-2xl font-black text-slate-950">{t.eventsTitle}</h2>
              <p className="mt-2 text-sm font-semibold text-slate-600">{t.eventsDesc}</p>
            </div>
            <a href="/news/events" className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white">
              {t.viewEvents}
            </a>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-3xl font-black text-slate-950">{t.latest}</h2>

          {loading ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center font-black text-slate-400">
              {lang === "en" ? "Loading..." : "Đang tải..."}
            </div>
          ) : rest.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center font-black text-slate-400">
              {t.noNews}
            </div>
          ) : (
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((item) => (
                <a key={item.id} href={`/news/${item.slug}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="h-56 overflow-hidden bg-slate-100">
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-5">
                    <div className="text-xs font-black text-blue-700">{getCategoryLabel(item.category, t)}</div>
                    <h3 className="mt-2 text-xl font-black text-slate-950">{item.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-500">{item.excerpt}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      </main>
    </PageShell>
  );
}
