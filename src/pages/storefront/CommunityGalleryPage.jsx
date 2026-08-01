import { useMemo, useState } from "react";
import { Camera, CheckCircle2, Search, Send, Sparkles } from "lucide-react";
import PageShell from "../../components/common/PageShell";
import { getGallerySubmissions, submitGalleryBuild } from "../../services/CommunityGalleryService";
import { useLang } from "../../store/CmsStore";

function getCopy(lang) {
  return {
    title: lang === "en" ? "Community Build Gallery" : "Gallery thành phẩm cộng đồng",
    desc:
      lang === "en"
        ? "Share your Gunpla builds, custom paint, clean build and display ideas."
        : "Chia sẻ thành phẩm Gunpla, custom paint, clean build và ý tưởng trưng bày.",
    search: lang === "en" ? "Search builder, grade, series..." : "Tìm builder, grade, series...",
    submitTitle: lang === "en" ? "Submit your build" : "Gửi bài khoe build",
    titleField: lang === "en" ? "Build title" : "Tiêu đề bài đăng",
    builder: lang === "en" ? "Builder name" : "Tên builder",
    product: lang === "en" ? "Product name" : "Tên kit",
    imageUrl: lang === "en" ? "Image URL" : "URL hình ảnh",
    caption: lang === "en" ? "Caption" : "Mô tả ngắn",
    grade: "Grade",
    series: "Series",
    submit: lang === "en" ? "Submit for review" : "Gửi duyệt",
    success:
      lang === "en"
        ? "Submitted successfully. Admin will review before publishing."
        : "Đã gửi thành công. Admin sẽ duyệt trước khi hiển thị.",
    approved: lang === "en" ? "Approved builds" : "Bài build đã duyệt",
    noBuilds: lang === "en" ? "No builds found." : "Không có bài build phù hợp.",
  };
}

export default function CommunityGalleryPage() {
  const [lang] = useLang();
  const t = getCopy(lang);
  const [query, setQuery] = useState("");
  const [version, setVersion] = useState(0);
  const [form, setForm] = useState({
    title: "",
    builderName: "",
    productName: "",
    imageUrl: "",
    grade: "RG",
    series: "SEED",
    caption: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const rows = useMemo(() => getGallerySubmissions(), [version]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rows.filter((row) => {
      if (!q) return true;
      return [row.title, row.builderName, row.productName, row.grade, row.series, row.caption]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rows, query]);

  function patch(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      submitGalleryBuild(form);
      setMessage(t.success);
      setForm({
        title: "",
        builderName: "",
        productName: "",
        imageUrl: "",
        grade: "RG",
        series: "SEED",
        caption: "",
      });
      setVersion((value) => value + 1);
    } catch (err) {
      setError(err?.message || "Submit failed.");
    }
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8 lg:pr-28">
        <section className="relative overflow-hidden rounded-6xl bg-slate-950 p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(168,85,247,0.35),transparent_35%)]" />
          <div className="relative z-10 max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-xs font-black uppercase tracking-[0.25em]">
              <Camera size={15} />
              Community
            </div>
            <h1 className="mt-5 text-5xl font-black leading-tight md:text-7xl">{t.title}</h1>
            <p className="mt-5 max-w-3xl text-base font-semibold leading-8 text-white/75">{t.desc}</p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_420px]">
          <div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Search size={18} className="text-violet-600" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t.search}
                  className="w-full bg-transparent px-3 text-sm font-semibold outline-none"
                />
              </div>
            </div>

            <h2 className="mt-8 text-3xl font-black text-slate-950">{t.approved}</h2>

            {filtered.length === 0 ? (
              <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center font-black text-slate-400">
                {t.noBuilds}
              </div>
            ) : (
              <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((item) => (
                  <article key={item.id} className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                    <div className="relative h-72 bg-slate-100">
                      <img src={item.imageUrl} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
                      <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-violet-700">
                        {item.grade} • {item.series}
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 text-xs font-black uppercase text-violet-700">
                        <Sparkles size={14} />
                        {item.builderName}
                      </div>
                      <h3 className="mt-2 text-xl font-black text-slate-950">{item.title}</h3>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{item.caption}</p>
                      <div className="mt-3 text-xs font-bold text-slate-400">{item.productName}</div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="h-fit rounded-5xl border border-violet-100 bg-violet-50 p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-2xl font-black text-slate-950">{t.submitTitle}</h2>

            {message && (
              <div className="mt-4 rounded-2xl bg-green-50 p-4 text-sm font-black text-green-700">
                <CheckCircle2 size={17} className="mr-1 inline" />
                {message}
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-black text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={submit} className="mt-5 space-y-3">
              <input value={form.title} onChange={(e) => patch("title", e.target.value)} placeholder={t.titleField} className="w-full rounded-2xl border border-violet-100 bg-white px-4 py-3 text-sm font-bold outline-none" />
              <input value={form.builderName} onChange={(e) => patch("builderName", e.target.value)} placeholder={t.builder} className="w-full rounded-2xl border border-violet-100 bg-white px-4 py-3 text-sm font-bold outline-none" />
              <input value={form.productName} onChange={(e) => patch("productName", e.target.value)} placeholder={t.product} className="w-full rounded-2xl border border-violet-100 bg-white px-4 py-3 text-sm font-bold outline-none" />
              <input value={form.imageUrl} onChange={(e) => patch("imageUrl", e.target.value)} placeholder={t.imageUrl} className="w-full rounded-2xl border border-violet-100 bg-white px-4 py-3 text-sm font-bold outline-none" />

              <div className="grid grid-cols-2 gap-3">
                <select value={form.grade} onChange={(e) => patch("grade", e.target.value)} className="rounded-2xl border border-violet-100 bg-white px-4 py-3 text-sm font-bold outline-none">
                  {["HG", "RG", "MG", "MGEX", "PG", "SD"].map((item) => <option key={item}>{item}</option>)}
                </select>
                <select value={form.series} onChange={(e) => patch("series", e.target.value)} className="rounded-2xl border border-violet-100 bg-white px-4 py-3 text-sm font-bold outline-none">
                  {["SEED", "UC", "WFM", "IBO", "Wing", "00", "Build"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>

              <textarea value={form.caption} onChange={(e) => patch("caption", e.target.value)} placeholder={t.caption} rows={4} className="w-full rounded-2xl border border-violet-100 bg-white px-4 py-3 text-sm font-bold outline-none" />

              <button type="submit" className="w-full rounded-2xl bg-violet-700 px-5 py-4 text-sm font-black text-white shadow-lg shadow-violet-100">
                <Send size={17} className="mr-1 inline" />
                {t.submit}
              </button>
            </form>
          </aside>
        </section>
      </main>
    </PageShell>
  );
}
