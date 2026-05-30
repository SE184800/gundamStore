import { useState } from "react";
import { Edit3, Plus, Trash2, UploadCloud } from "lucide-react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminStatusBadge from "../../components/admin/AdminStatusBadge";
import {
  AdminSelect,
  AdminTextField,
  AdminTextarea,
  AdminToggle,
} from "../../components/admin/AdminField";
import { useCms, useLang } from "../../store/CmsStore";
import { fileToBase64 } from "../../utils/mediaUpload";
import { normalizeSafeCtaUrl } from "../../utils/urlSafety";

const emptyBanner = {
  id: "",
  name: "",
  placement: "Homepage Hero",
  mediaType: "image",
  imageUrl: "",
  videoUrl: "",
  title: { vi: "", en: "" },
  heading: { vi: "GUNDAM / GUNPLA", en: "GUNDAM / GUNPLA" },
  subtitle: { vi: "", en: "" },
  ctaText: { vi: "Mua ngay", en: "Shop now" },
  ctaUrl: "/shop",
  status: "Live",
  active: true,
  priority: 1,
  backgroundColor: "#ffffff",
  fontFamily: "system",
  headingColor: "#020617",
  titleColor: "#1e293b",
  subtitleColor: "#475569",
  headingSize: 48,
  titleSize: 24,
  subtitleSize: 14,
  showEyebrow: true,
  showHeading: true,
  showTitle: true,
  showSubtitle: true,
  showCta: true,
  showChips: true,
};

export default function AdminCMSBanners() {
  const { state, actions } = useCms();
  const [lang] = useLang();
  const [open, setOpen] = useState(false);
  const [publishMessage, setPublishMessage] = useState("");
  const [draft, setDraft] = useState(emptyBanner);

  const banners = state.banners || [];
  const publishedHero = state.publishedHero || null;
  const heroSettings = state.heroSettings || {
    layout: "v2",
    autoplay: true,
    interval: 4500,
    maxBanners: 5,
  };

  function patch(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function patchText(field, locale, value) {
    setDraft((prev) => ({
      ...prev,
      [field]: { ...prev[field], [locale]: value },
    }));
  }

  async function uploadMedia(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file, { mediaKind: "banner" });
      const isVideo = file.type.startsWith("video/");

      setDraft((prev) => ({
        ...prev,
        mediaType: isVideo ? "video" : file.type.includes("gif") ? "gif" : "image",
        imageUrl: isVideo ? prev.imageUrl : base64,
        videoUrl: isVideo ? base64 : "",
      }));
    } catch (error) {
      window.alert(error?.message || "Invalid banner media file.");
    } finally {
      event.target.value = "";
    }
  }

  function createBanner() {
    setDraft(emptyBanner);
    setOpen(true);
  }

  function editBanner(banner) {
    setDraft({
      ...emptyBanner,
      ...banner,
      title: banner.title || { vi: "", en: "" },
      heading: banner.heading || { vi: "GUNDAM / GUNPLA", en: "GUNDAM / GUNPLA" },
      subtitle: banner.subtitle || { vi: "", en: "" },
      ctaText: banner.ctaText || { vi: "Mua ngay", en: "Shop now" },
    });
    setOpen(true);
  }

  function saveBanner() {
    const cta = normalizeSafeCtaUrl(draft.ctaUrl, { fallback: "/shop" });

    if (!cta.ok) {
      window.alert(
        lang === "en"
          ? "CTA URL is not allowed. Use an internal path such as /shop or an allowlisted HTTPS domain."
          : "CTA URL không hợp lệ. Chỉ dùng đường dẫn nội bộ như /shop hoặc domain HTTPS trong allowlist."
      );
      return;
    }

    actions.saveBanner({
      ...draft,
      ctaUrl: cta.value,
      id: draft.id || `banner-${Date.now()}`,
      priority: Number(draft.priority || 1),
    });
    setOpen(false);
  }

  function mediaPreview(banner) {
    const url = banner.videoUrl || banner.imageUrl || banner.mediaUrl;

    if (!url) {
      return <div className="h-16 w-28 rounded-md bg-gradient-to-r from-blue-600 to-cyan-500" />;
    }

    if (banner.mediaType === "video" || String(url).startsWith("data:video")) {
      return <video src={url} className="h-16 w-28 rounded-md object-cover" muted />;
    }

    return <img src={url} className="h-16 w-28 rounded-md object-cover" />;
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Storefront CMS"
        title="Banner Management"
        desc="Quản lý banner cho homepage. Trang chủ chỉ lấy banner Active + Live + Homepage Hero, tối đa 5 banner."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                actions.publishHero();
                setPublishMessage(`Published successfully at ${new Date().toLocaleString()}`);
              }}
              className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700"
            >
              Publish hero
            </button>

            <button onClick={createBanner} className="rounded-md bg-blue-700 px-4 py-2 text-xs font-black text-white">
              <Plus size={15} className="mr-1 inline" />
              Create banner
            </button>
          </div>
        }
      />

      
      {publishMessage && (
        <section className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm font-black text-blue-800">
          {publishMessage}
        </section>
      )}

      <section className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-4">
        <div className="text-sm font-black text-emerald-800">Published version</div>
        <div className="mt-1 text-xs font-semibold text-emerald-700">
          {publishedHero
            ? `Version: ${publishedHero.version} • Published: ${new Date(publishedHero.publishedAt).toLocaleString()}`
            : "Chưa publish. Homepage đang dùng fallback/draft hiện có."}
        </div>
      </section>

      <section className="mb-4 rounded-md border border-slate-200 bg-white p-4">
        <div className="mb-4">
          <h2 className="text-base font-black text-slate-950">Hero Layout Settings</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Chọn kiểu hiển thị hero ngoài trang chủ. V2 là classic hero, V3 là Bento Campaign hiện đại.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <AdminSelect
            label="Hero layout"
            tip="V2 Classic giữ layout cũ. V3 Bento dùng hero lớn + side campaign + thumbnail slider."
            value={heroSettings.layout}
            onChange={(v) => actions.saveHeroSettings({ layout: v })}
            options={[
              { label: "V2 - Classic Hero", value: "v2" },
              { label: "V3 - Bento Campaign", value: "v3" },
            ]}
          />

          <AdminToggle
            label="Autoplay"
            tip="Tự động chuyển banner theo thời gian."
            checked={heroSettings.autoplay !== false}
            onChange={(v) => actions.saveHeroSettings({ autoplay: v })}
          />

          <AdminTextField
            label="Interval milliseconds"
            tip="Thời gian chuyển slide. Ví dụ 4500 = 4.5 giây."
            type="number"
            value={heroSettings.interval || 4500}
            onChange={(v) => actions.saveHeroSettings({ interval: Number(v || 4500) })}
          />

          <AdminTextField
            label="Max active banners"
            tip="Số banner tối đa ngoài homepage."
            type="number"
            value={heroSettings.maxBanners || 5}
            onChange={(v) => actions.saveHeroSettings({ maxBanners: Number(v || 5) })}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3">Actions</th>
                <th className="px-4 py-3">Preview</th>
                <th className="px-4 py-3">Banner name</th>
                <th className="px-4 py-3">Placement</th>
                <th className="px-4 py-3">Media</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 text-right">Priority</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((banner) => (
                <tr key={banner.id} className="group border-t border-slate-100 hover:bg-slate-50">
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 group-hover:bg-slate-50">
                    <button onClick={() => editBanner(banner)} className="mr-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold">
                      <Edit3 size={14} className="mr-1 inline" />
                      Edit
                    </button>
                    <button onClick={() => actions.deleteBanner(banner.id)} className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </td>
                  <td className="px-4 py-3">{mediaPreview(banner)}</td>
                  <td className="px-4 py-3 font-black">{banner.name || banner.title?.[lang] || banner.title?.vi}</td>
                  <td className="px-4 py-3">{banner.placement}</td>
                  <td className="px-4 py-3">{banner.mediaType || "image"}</td>
                  <td className="px-4 py-3"><AdminStatusBadge>{banner.status}</AdminStatusBadge></td>
                  <td className="px-4 py-3"><AdminStatusBadge>{banner.active === false ? "Inactive" : "Active"}</AdminStatusBadge></td>
                  <td className="px-4 py-3 text-right font-black">{banner.priority || 1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AdminDrawer open={open} title={draft.id ? "Edit banner" : "Create banner"} onClose={() => setOpen(false)} onSave={saveBanner}>
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <AdminTextField label="Tên banner trong admin" tip="Tên nội bộ để dễ quản lý." value={draft.name} onChange={(v) => patch("name", v)} />
            <AdminSelect label="Vị trí hiển thị" tip="Homepage Hero sẽ hiện ở banner chính trang chủ." value={draft.placement} onChange={(v) => patch("placement", v)} options={["Homepage Hero", "Below Categories", "Shop Top", "Popup"]} />
            <AdminSelect label="Loại media" tip="Hỗ trợ image, gif hoặc video." value={draft.mediaType} onChange={(v) => patch("mediaType", v)} options={["image", "gif", "video"]} />
            <AdminTextField label="Thứ tự ưu tiên" tip="Số nhỏ hiển thị trước. Trang chủ lấy tối đa 5 banner active." type="number" value={draft.priority} onChange={(v) => patch("priority", v)} />
            <AdminTextField label="Màu nền hero" tip="Màu nền chung của khung banner. Ví dụ: #ffffff, #f8fbff, #eef6ff." value={draft.backgroundColor} onChange={(v) => patch("backgroundColor", v)} />
            <AdminSelect label="Trạng thái" tip="Chỉ banner Live mới được hiện ngoài trang chủ." value={draft.status} onChange={(v) => patch("status", v)} options={["Live", "Draft", "Scheduled", "Inactive"]} />
            <AdminToggle label="Active banner" tip="Bật để cho phép banner xuất hiện ngoài website." checked={draft.active !== false} onChange={(v) => patch("active", v)} />
          </div>

          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
            <div className="mb-2 text-sm font-black">Upload media</div>
            <div className="mb-2 text-xs font-semibold text-slate-500">
              Hero desktop khuyến nghị 1600 x 700 px. Ảnh JPG/PNG/WEBP/GIF tối đa 2MB. Video MP4/WebM/OGG tối đa 10MB.
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-black text-white">
              <UploadCloud size={16} />
              Upload image / gif / video
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/ogg" className="hidden" onChange={uploadMedia} />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <AdminTextField label="Heading VI" tip="Dòng tiêu đề lớn." value={draft.heading.vi} onChange={(v) => patchText("heading", "vi", v)} />
            <AdminTextField label="Heading EN" tip="English heading." value={draft.heading.en} onChange={(v) => patchText("heading", "en", v)} />
            <AdminTextField label="Tiêu đề VI" tip="Dòng nội dung chính dưới heading." value={draft.title.vi} onChange={(v) => patchText("title", "vi", v)} />
            <AdminTextField label="Title EN" tip="English title." value={draft.title.en} onChange={(v) => patchText("title", "en", v)} />
          </div>

          <AdminTextarea label="Mô tả VI" tip="Mô tả ngắn trên banner." value={draft.subtitle.vi} onChange={(v) => patchText("subtitle", "vi", v)} />
          <AdminTextarea label="Description EN" tip="English description." value={draft.subtitle.en} onChange={(v) => patchText("subtitle", "en", v)} />

          <div className="rounded-md border border-slate-200 bg-white p-4">
            <div className="mb-3 text-sm font-black text-slate-950">Hiển thị nội dung trên banner</div>
            <div className="grid gap-4 md:grid-cols-3">
              <AdminToggle label="Hiện eyebrow / label" tip="Ví dụ: Build Your Legend hoặc Campaign." checked={draft.showEyebrow !== false} onChange={(v) => patch("showEyebrow", v)} />
              <AdminToggle label="Hiện heading lớn" tip="Tiêu đề lớn nhất trên banner." checked={draft.showHeading !== false} onChange={(v) => patch("showHeading", v)} />
              <AdminToggle label="Hiện tiêu đề phụ" tip="Dòng title dưới heading." checked={draft.showTitle !== false} onChange={(v) => patch("showTitle", v)} />
              <AdminToggle label="Hiện mô tả" tip="Đoạn mô tả ngắn." checked={draft.showSubtitle !== false} onChange={(v) => patch("showSubtitle", v)} />
              <AdminToggle label="Hiện nút CTA" tip="Ẩn nếu ảnh banner đã có sẵn nút hoặc không muốn khách bấm." checked={draft.showCta !== false} onChange={(v) => patch("showCta", v)} />
              <AdminToggle label="Hiện chips bán hàng" tip="Ví dụ: Chính hãng, Giao nhanh, Bọc chống sốc." checked={draft.showChips !== false} onChange={(v) => patch("showChips", v)} />
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 text-sm font-black text-slate-950">Typography / Preview</div>

            <div className="grid gap-4 md:grid-cols-4">
              <AdminSelect
                label="Font chữ"
                tip="Chỉ dùng font an toàn, không bản quyền: system font, serif, mono."
                value={draft.fontFamily}
                onChange={(v) => patch("fontFamily", v)}
                options={[
                  { label: "System Sans", value: "system" },
                  { label: "Serif", value: "serif" },
                  { label: "Mono", value: "mono" },
                ]}
              />

              <AdminTextField label="Màu heading" tip="Ví dụ: #020617" value={draft.headingColor} onChange={(v) => patch("headingColor", v)} />
              <AdminTextField label="Màu tiêu đề" tip="Ví dụ: #1e293b" value={draft.titleColor} onChange={(v) => patch("titleColor", v)} />
              <AdminTextField label="Màu mô tả" tip="Ví dụ: #475569" value={draft.subtitleColor} onChange={(v) => patch("subtitleColor", v)} />

              <AdminTextField label="Cỡ heading" tip="Khuyến nghị 36–64px." type="number" value={draft.headingSize} onChange={(v) => patch("headingSize", Number(v || 48))} />
              <AdminTextField label="Cỡ tiêu đề" tip="Khuyến nghị 18–32px." type="number" value={draft.titleSize} onChange={(v) => patch("titleSize", Number(v || 24))} />
              <AdminTextField label="Cỡ mô tả" tip="Khuyến nghị 13–18px." type="number" value={draft.subtitleSize} onChange={(v) => patch("subtitleSize", Number(v || 14))} />
            </div>

            <div
              className="mt-4 rounded-2xl border border-slate-200 p-5"
              style={{ backgroundColor: draft.backgroundColor || "#ffffff" }}
            >
              <div
                className="font-black leading-tight"
                style={{
                  color: draft.headingColor,
                  fontSize: Number(draft.headingSize || 48),
                  fontFamily: draft.fontFamily === "serif" ? "Georgia, serif" : draft.fontFamily === "mono" ? "ui-monospace, SFMono-Regular, Menlo, monospace" : "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
                }}
              >
                {draft.heading.vi || "GUNDAM / GUNPLA"}
              </div>

              <div
                className="mt-2 font-black"
                style={{
                  color: draft.titleColor,
                  fontSize: Number(draft.titleSize || 24),
                  fontFamily: draft.fontFamily === "serif" ? "Georgia, serif" : draft.fontFamily === "mono" ? "ui-monospace, SFMono-Regular, Menlo, monospace" : "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
                }}
              >
                {draft.title.vi || "RG Hi-ν Gundam"}
              </div>

              <div
                className="mt-2 font-semibold"
                style={{
                  color: draft.subtitleColor,
                  fontSize: Number(draft.subtitleSize || 14),
                  fontFamily: draft.fontFamily === "serif" ? "Georgia, serif" : draft.fontFamily === "mono" ? "ui-monospace, SFMono-Regular, Menlo, monospace" : "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
                }}
              >
                {draft.subtitle.vi || "Hàng chính hãng Bandai."}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <AdminTextField label="CTA VI" value={draft.ctaText.vi} onChange={(v) => patchText("ctaText", "vi", v)} />
            <AdminTextField label="CTA EN" value={draft.ctaText.en} onChange={(v) => patchText("ctaText", "en", v)} />
            <AdminTextField label="CTA URL" tip="Ví dụ: /shop hoặc /product/..." value={draft.ctaUrl} onChange={(v) => patch("ctaUrl", v)} />
          </div>
        </div>
      </AdminDrawer>
    </>
  );
}
