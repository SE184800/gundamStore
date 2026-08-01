import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, FileText, Headphones } from "lucide-react";
import PageShell from "../../components/common/PageShell";
import SeoMeta from "../../components/storefront/SeoMeta";
import { useLang } from "../../store/CmsStore";
import { POLICY_PAGES } from "../../data/policyPages";

export default function PolicyPage({ pageKey = "faq" }) {
  const [lang] = useLang();
  const page = POLICY_PAGES[pageKey] || POLICY_PAGES.faq;
  const title = lang === "en" ? page.titleEn : page.titleVi;
  const description = lang === "en" ? page.descriptionEn : page.descriptionVi;

  return (
    <PageShell>
      <SeoMeta title={title} description={description} />

      <main className="min-h-screen bg-[#F5F7FB] px-4 py-8 md:px-6">
        <div className="mx-auto max-w-5xl">
          <Link to="/" className="inline-flex items-center text-sm font-black text-blue-700">
            <ArrowLeft size={16} className="mr-1" />
            {lang === "en" ? "Back to home" : "Về trang chủ"}
          </Link>

          <section className="mt-6 rounded-xl bg-white p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <FileText size={28} />
              </div>
              <div>
                <p className="text-sm font-black tracking-wide text-blue-600">
                  Trust center
                </p>
                <h1 className="mt-2 text-4xl font-black text-slate-950">{title}</h1>
                <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-500">
                  {description}
                </p>
              </div>
            </div>
          </section>

          <section className="mt-6 space-y-4">
            {(page.sections || []).map((section) => (
              <article key={section.titleVi || section.titleEn} className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-black text-slate-950">
                  {lang === "en" ? section.titleEn : section.titleVi}
                </h2>

                <div className="mt-4 space-y-3">
                  {(lang === "en" ? section.bulletsEn : section.bulletsVi).map((bullet) => (
                    <div key={bullet} className="flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600">
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </section>

          <section className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-black text-blue-950">
                  <Headphones size={20} />
                  {lang === "en" ? "Need help?" : "Cần hỗ trợ?"}
                </h2>
                <p className="mt-1 text-sm font-bold text-blue-800">
                  {lang === "en"
                    ? "Submit a support ticket and the shop team will follow up."
                    : "Gửi ticket hỗ trợ để shop kiểm tra và phản hồi."}
                </p>
              </div>

              <Link to="/support" className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white">
                {lang === "en" ? "Open support" : "Mở hỗ trợ"}
              </Link>
            </div>
          </section>
        </div>
      </main>
    </PageShell>
  );
}
