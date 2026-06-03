import { useState } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import ProductVisual from "../../components/common/ProductVisual";
import { useCms, useLang } from "../../store/CmsStore";
import { getText } from "../../utils/format";

const MAX_BANNER_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_BANNER_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const text = {
  vi: {
    title: "Quản lý banner",
    desc: "Upload/thay banner, tiêu đề, CTA và vị trí hiển thị. Storefront cập nhật ngay.",
    add: "Thêm banner",
    upload: "Upload ảnh",
    active: "Bật",
    save: "Lưu",
    edit: "Sửa banner",
    invalidLink: "CTA chỉ được phép dùng đường dẫn nội bộ như /shop, /promotions.",
    invalidFile: "Ảnh banner phải là JPG, PNG, WEBP hoặc GIF và tối đa 2MB.",
  },
  en: {
    title: "Banner Manager",
    desc: "Upload/edit banners, title, CTA and placement. Storefront updates immediately.",
    add: "Add banner",
    upload: "Upload image",
    active: "Active",
    save: "Save",
    edit: "Edit banner",
    invalidLink: "CTA must be an internal path such as /shop or /promotions.",
    invalidFile: "Banner image must be JPG, PNG, WEBP or GIF and max 2MB.",
  }
};

const emptyBanner = {
  id: "",
  placement: "home_hero",
  title: { vi: "", en: "" },
  subtitle: { vi: "", en: "" },
  ctaText: { vi: "Mua ngay", en: "Buy now" },
  link: "/shop",
  tone: "blue",
  imageUrl: "",
  active: true,
  sort: 1
};

function normalizeInternalCtaUrl(value = "") {
  const raw = String(value || "").trim();

  if (!raw) return { ok: true, value: "/shop" };

  if (/^(javascript|data|vbscript):/i.test(raw)) {
    return { ok: false, value: "" };
  }

  if (raw.startsWith("/") && !raw.startsWith("//")) {
    return { ok: true, value: raw.slice(0, 160) };
  }

  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) {
      return { ok: false, value: "" };
    }

    return {
      ok: true,
      value: `${url.pathname}${url.search}${url.hash}`.slice(0, 160) || "/shop",
    };
  } catch {
    return { ok: false, value: "" };
  }
}

function validateBannerFile(file) {
  if (!file) return { ok: false };

  return {
    ok: ALLOWED_BANNER_IMAGE_TYPES.has(file.type) && file.size <= MAX_BANNER_IMAGE_SIZE,
  };
}

export default function AdminBanners() {
  const { state, actions } = useCms();
  const [lang] = useLang();
  const t = text[lang];
  const [draft, setDraft] = useState(emptyBanner);

  function setField(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function setTextField(field, locale, value) {
    setDraft((prev) => ({ ...prev, [field]: { ...prev[field], [locale]: value } }));
  }

  function save() {
    const cta = normalizeInternalCtaUrl(draft.link);

    if (!cta.ok) {
      window.alert(t.invalidLink);
      return;
    }

    actions.saveBanner({ ...draft, link: cta.value });
    setDraft(emptyBanner);
  }

  function upload(file) {
    if (!file) return;

    const validation = validateBannerFile(file);
    if (!validation.ok) {
      window.alert(t.invalidFile);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setField("imageUrl", reader.result);
    reader.readAsDataURL(file);
  }

  return (
    <>
      <section className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/50">
        <h1 className="text-3xl font-black text-slate-950">{t.title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{t.desc}</p>
      </section>

      <section className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 text-lg font-black text-slate-950">{draft.id ? t.edit : t.add}</div>

          <div className="space-y-3">
            <input value={getText(draft.title, "vi")} onChange={(e) => setTextField("title", "vi", e.target.value)} placeholder="Tiêu đề VI" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none" />
            <input value={getText(draft.title, "en")} onChange={(e) => setTextField("title", "en", e.target.value)} placeholder="Title EN" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none" />
            <textarea value={getText(draft.subtitle, "vi")} onChange={(e) => setTextField("subtitle", "vi", e.target.value)} placeholder="Mô tả VI" className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none" />
            <textarea value={getText(draft.subtitle, "en")} onChange={(e) => setTextField("subtitle", "en", e.target.value)} placeholder="Subtitle EN" className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none" />

            <div className="grid grid-cols-2 gap-3">
              <select value={draft.placement} onChange={(e) => setField("placement", e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold">
                <option value="home_hero">home_hero</option>
                <option value="home_ad">home_ad</option>
              </select>
              <select value={draft.tone} onChange={(e) => setField("tone", e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold">
                <option>blue</option>
                <option>cyan</option>
                <option>gold</option>
                <option>red</option>
                <option>slate</option>
              </select>
            </div>

            <input value={draft.link} onChange={(e) => setField("link", e.target.value)} placeholder="/shop" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none" />

            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-blue-200 bg-blue-50 px-4 py-4 text-sm font-black text-blue-700">
              <Upload size={17}/>
              {t.upload}
              <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => upload(e.target.files?.[0])} />
            </label>

            <div className="h-40 overflow-hidden rounded-2xl border border-slate-200">
              <ProductVisual tone={draft.tone} imageUrl={draft.imageUrl} />
            </div>

            <button onClick={save} className="w-full rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-800">{t.save}</button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {(state.banners || []).map((banner) => (
            <div key={banner.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="h-44"><ProductVisual tone={banner.tone} imageUrl={banner.imageUrl} /></div>
              <div className="space-y-3 p-4">
                <div className="text-lg font-black text-slate-950">{getText(banner.title, lang)}</div>
                <div className="text-xs font-semibold leading-5 text-slate-500">{getText(banner.subtitle, lang)}</div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700">{banner.placement}</span>
                  <span className={`rounded-lg px-2 py-1 text-[10px] font-black ${banner.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{banner.active ? "Active" : "Off"}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setDraft(banner)} className="flex-1 rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Edit</button>
                  <button onClick={() => actions.saveBanner({ ...banner, active: !banner.active })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700">{banner.active ? "Off" : "On"}</button>
                  <button onClick={() => actions.deleteBanner(banner.id)} className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-red-600"><Trash2 size={15}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
