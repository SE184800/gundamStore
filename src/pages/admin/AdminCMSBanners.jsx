import { useEffect, useState } from "react";
import { Edit3, Plus, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminStatusBadge from "../../components/admin/AdminStatusBadge";
import {
  AdminSelect,
  AdminTextField,
  AdminToggle,
} from "../../components/admin/AdminField";
import { useLang } from "../../store/CmsStore";
import { normalizeSafeCtaUrl } from "../../utils/urlSafety";
import {
  uploadAdminMediaImages,
  uploadAdminMediaVideo,
} from "../../services/AdminMediaApiService";
import {
  createAdminBanner,
  deleteAdminBanner,
  getAdminHeroSettings,
  listAdminBanners,
  updateAdminBanner,
  updateAdminHeroSettings,
} from "../../services/BannerApiService";

function cleanBannerMediaUrl(value = "") {
  const url = String(value || "").trim();

  return url.toLowerCase().startsWith("data:") ||
    url.toLowerCase().includes(";base64,")
    ? ""
    : url;
}

const emptyBanner = {
  id: "",
  titleInternal: "",
  altText: "",
  placement: "Homepage Hero",
  mediaType: "image",
  mainImage: "",
  imageUrl: "",
  mobileImage: "",
  tabletImage: "",
  desktopImage: "",
  videoUrl: "",
  ctaUrl: "/shop",
  status: "Live",
  active: true,
  priority: 1,
  fitMode: "cover",
  legacyText: null,
};

const defaultHeroSettings = {
  layout: "v2",
  autoplay: true,
  interval: 4500,
  maxBanners: 5,
};

export default function AdminCMSBanners() {
  const [lang] = useLang();
  const [banners, setBanners] = useState([]);
  const [heroSettings, setHeroSettings] = useState(defaultHeroSettings);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyBanner);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingField, setUploadingField] = useState("");

  function patch(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  async function refresh() {
    setLoading(true);
    setError("");

    try {
      const [bannerRows, settings] = await Promise.all([
        listAdminBanners(),
        getAdminHeroSettings(),
      ]);

      setBanners(bannerRows);
      setHeroSettings(settings || defaultHeroSettings);
    } catch (err) {
      setError(err?.message || "Cannot load banners.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function uploadMedia(event) {
    const file = event.target.files?.[0];
    const targetField = event.target.name || "mainImage";

    if (!file) return;

    setUploadingField(targetField);

    try {
      const isVideo = file.type.startsWith("video/");

      const upload = isVideo
        ? await uploadAdminMediaVideo(file)
        : await uploadAdminMediaImages([file]);

      const uploadedUrl = isVideo
        ? upload?.videoUrl || upload?.video?.url || upload?.url
        : upload?.images?.[0]?.detailUrl ||
          upload?.images?.[0]?.cardUrl ||
          upload?.images?.[0]?.url ||
          upload?.imageUrl ||
          upload?.url;

      if (!uploadedUrl) {
        throw new Error(
          "Upload thành công nhưng backend không trả về URL Supabase."
        );
      }

      if (
        String(uploadedUrl).startsWith("data:") ||
        String(uploadedUrl).includes(";base64,")
      ) {
        throw new Error(
          "Backend trả về dữ liệu base64 không hợp lệ."
        );
      }

      setDraft((prev) => ({
        ...prev,
        mediaType: isVideo
          ? "video"
          : file.type.includes("gif")
            ? "gif"
            : "image",

        mainImage:
          !isVideo && targetField === "mainImage"
            ? uploadedUrl
            : prev.mainImage,

        imageUrl:
          !isVideo && targetField === "mainImage"
            ? uploadedUrl
            : prev.imageUrl,

        mobileImage:
          !isVideo && targetField === "mobileImage"
            ? uploadedUrl
            : prev.mobileImage,

        tabletImage:
          !isVideo && targetField === "tabletImage"
            ? uploadedUrl
            : prev.tabletImage,

        desktopImage:
          !isVideo && targetField === "desktopImage"
            ? uploadedUrl
            : prev.desktopImage,

        videoUrl: isVideo
          ? uploadedUrl
          : prev.videoUrl,
      }));

      setError("");
      setMessage(
        lang === "en"
          ? "Media uploaded. Click Save banner to publish."
          : "Đã upload lên Supabase. Bấm Save banner để lưu."
      );
    } catch (err) {
      console.error("BANNER_UPLOAD_ERROR", err);
      setError(
        err?.message || "Không thể upload banner."
      );
      window.alert(
        err?.message || "Không thể upload banner."
      );
    } finally {
      setUploadingField("");
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
      mainImage: cleanBannerMediaUrl(banner.mainImage || banner.imageUrl || ""),
      imageUrl: cleanBannerMediaUrl(banner.imageUrl || banner.mainImage || ""),
      mobileImage: cleanBannerMediaUrl(banner.mobileImage),
      tabletImage: cleanBannerMediaUrl(banner.tabletImage),
      desktopImage: cleanBannerMediaUrl(banner.desktopImage),
      videoUrl: cleanBannerMediaUrl(banner.videoUrl),
      fitMode: banner.fitMode || "cover",
      status: banner.status || "Draft",
    });
    setOpen(true);
  }

  function normalizePayload() {
    const cta = normalizeSafeCtaUrl(draft.ctaUrl, { fallback: "/shop" });
    const mainImage = cleanBannerMediaUrl(draft.mainImage || draft.imageUrl);

    if (!mainImage) {
      throw new Error(
        lang === "en"
          ? "Main image is required."
          : "Banner cần có main image."
      );
    }

    if (!cta.ok) {
      throw new Error(
        lang === "en"
          ? "CTA URL is not allowed."
          : "CTA URL không hợp lệ."
      );
    }

    return {
      titleInternal: draft.titleInternal || draft.altText || "Storefront banner",
      altText: draft.altText || draft.titleInternal || "Storefront banner",
      placement: draft.placement || "Homepage Hero",
      mediaType: draft.mediaType || "image",
      mainImage,
      imageUrl: cleanBannerMediaUrl(draft.imageUrl) || mainImage,
      mobileImage: cleanBannerMediaUrl(draft.mobileImage),
      tabletImage: cleanBannerMediaUrl(draft.tabletImage),
      desktopImage: cleanBannerMediaUrl(draft.desktopImage),
      videoUrl: cleanBannerMediaUrl(draft.videoUrl),
      ctaUrl: cta.value,
      status: draft.status || "Draft",
      active: draft.active !== false,
      priority: Number(draft.priority || 1),
      fitMode: draft.fitMode || "cover",
      legacyText: draft.legacyText || null,
    };
  }

  async function saveBanner() {
    try {
      setError("");
      const payload = normalizePayload();

      if (draft.id) {
        await updateAdminBanner(draft.id, payload);
        setMessage("Banner updated.");
      } else {
        await createAdminBanner(payload);
        setMessage("Banner created.");
      }

      setOpen(false);
      await refresh();
    } catch (err) {
      setError(err?.message || "Cannot save banner.");
    }
  }

  async function removeBanner(id) {
    if (!window.confirm("Delete this banner?")) return;

    try {
      await deleteAdminBanner(id);
      setMessage("Banner deleted.");
      await refresh();
    } catch (err) {
      setError(err?.message || "Cannot delete banner.");
    }
  }

  async function saveHeroSettingPatch(patch) {
    try {
      const next = await updateAdminHeroSettings({
        ...heroSettings,
        ...patch,
      });

      setHeroSettings(next || { ...heroSettings, ...patch });
      setMessage("Hero settings updated.");
    } catch (err) {
      setError(err?.message || "Cannot update hero settings.");
    }
  }

  function mediaPreview(banner) {
    const url =
      banner.videoUrl ||
      banner.mainImage ||
      banner.imageUrl ||
      banner.mobileImage ||
      banner.tabletImage ||
      banner.desktopImage;

    if (!url) {
      return <div className="h-16 w-28 rounded-md bg-gradient-to-r from-blue-600 to-cyan-500" />;
    }

    if (banner.mediaType === "video" || String(url).startsWith("data:video")) {
      return <video src={url} className="h-16 w-28 rounded-md object-cover" muted />;
    }

    return <img src={url} alt={banner.altText || banner.titleInternal || "Banner"} className="h-16 w-28 rounded-md object-cover" />;
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Storefront CMS"
        title="Banner Management"
        desc="Backend-managed image-first banners. Storefront only renders image/video clickable banners."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={refresh}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw size={15} className="mr-1 inline" />
              Refresh
            </button>

            <button
              onClick={createBanner}
              className="rounded-md bg-blue-700 px-4 py-2 text-xs font-black text-white"
            >
              <Plus size={15} className="mr-1 inline" />
              Create banner
            </button>
          </div>
        }
      />

      {message && (
        <section className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-800">
          {message}
        </section>
      )}

      {error && (
        <section className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">
          {error}
        </section>
      )}

      <section className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-4">
        <div className="text-sm font-black text-blue-900">
          Image-first storefront banner
        </div>
        <div className="mt-1 text-xs font-semibold leading-5 text-blue-800">
          Nội dung chữ/CTA nên được thiết kế trực tiếp trong ảnh banner. Storefront chỉ hiển thị banner dạng hình ảnh. Title/alt text chỉ dùng để quản lý và hỗ trợ accessibility.
        </div>
        <div className="mt-2 text-xs font-semibold leading-5 text-blue-800">
          Banner text should be embedded directly in the artwork image. Storefront will display image-only banners. Title/alt text is used for management and accessibility only.
        </div>
      </section>

      <section className="mb-4 rounded-md border border-slate-200 bg-white p-4">
        <div className="mb-4">
          <h2 className="text-base font-black text-slate-950">Hero Layout Settings</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            V2 and V3 are both image-first. They only differ by visual layout.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <AdminSelect
            label="Hero layout"
            value={heroSettings.layout}
            onChange={(value) => saveHeroSettingPatch({ layout: value })}
            options={[
              { label: "V2 - Classic image carousel", value: "v2" },
              { label: "V3 - Bento image layout", value: "v3" },
            ]}
          />

          <AdminToggle
            label="Autoplay"
            checked={heroSettings.autoplay !== false}
            onChange={(value) => saveHeroSettingPatch({ autoplay: value })}
          />

          <AdminTextField
            label="Interval milliseconds"
            type="number"
            value={heroSettings.interval || 4500}
            onChange={(value) => saveHeroSettingPatch({ interval: Number(value || 4500) })}
          />

          <AdminTextField
            label="Max active banners"
            type="number"
            value={heroSettings.maxBanners || 5}
            onChange={(value) => saveHeroSettingPatch({ maxBanners: Number(value || 5) })}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3">Actions</th>
                <th className="px-4 py-3">Preview</th>
                <th className="px-4 py-3">Internal title</th>
                <th className="px-4 py-3">Placement</th>
                <th className="px-4 py-3">Fit</th>
                <th className="px-4 py-3">CTA</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 text-right">Priority</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center font-bold text-slate-500">
                    Loading banners...
                  </td>
                </tr>
              ) : banners.length ? (
                banners.map((banner) => (
                  <tr key={banner.id} className="group border-t border-slate-100 hover:bg-slate-50">
                    <td className="sticky left-0 z-10 bg-white px-4 py-3 group-hover:bg-slate-50">
                      <button
                        onClick={() => editBanner(banner)}
                        className="mr-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold"
                      >
                        <Edit3 size={14} className="mr-1 inline" />
                        Edit
                      </button>

                      <button
                        onClick={() => removeBanner(banner.id)}
                        className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>

                    <td className="px-4 py-3">{mediaPreview(banner)}</td>
                    <td className="px-4 py-3 font-black">{banner.titleInternal}</td>
                    <td className="px-4 py-3">{banner.placement}</td>
                    <td className="px-4 py-3">{banner.fitMode || "cover"}</td>
                    <td className="max-w-[220px] truncate px-4 py-3">{banner.ctaUrl}</td>
                    <td className="px-4 py-3"><AdminStatusBadge>{banner.status}</AdminStatusBadge></td>
                    <td className="px-4 py-3"><AdminStatusBadge>{banner.active === false ? "Inactive" : "Active"}</AdminStatusBadge></td>
                    <td className="px-4 py-3 text-right font-black">{banner.priority || 1}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center font-bold text-slate-500">
                    No banners yet. Create the first image-first banner.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AdminDrawer
        open={open}
        title={draft.id ? "Edit banner" : "Create banner"}
        onClose={() => setOpen(false)}
        onSave={saveBanner}
      >
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <AdminTextField
              label="Internal title"
              tip="Management/SEO/accessibility only. Not rendered as overlay."
              value={draft.titleInternal}
              onChange={(value) => patch("titleInternal", value)}
            />

            <AdminTextField
              label="Alt text"
              tip="Accessibility text. Not rendered visually."
              value={draft.altText}
              onChange={(value) => patch("altText", value)}
            />

            <AdminSelect
              label="Placement"
              value={draft.placement}
              onChange={(value) => patch("placement", value)}
              options={["Homepage Hero", "Below Categories", "Shop Top", "Popup"]}
            />

            <AdminSelect
              label="Media type"
              value={draft.mediaType}
              onChange={(value) => patch("mediaType", value)}
              options={["image", "gif", "video"]}
            />

            <AdminSelect
              label="Fit mode"
              tip="cover: fills frame, may crop. contain: full image, may leave blank space."
              value={draft.fitMode || "cover"}
              onChange={(value) => patch("fitMode", value)}
              options={["cover", "contain"]}
            />

            <AdminTextField
              label="Priority"
              type="number"
              value={draft.priority}
              onChange={(value) => patch("priority", Number(value || 1))}
            />

            <AdminSelect
              label="Status"
              value={draft.status}
              onChange={(value) => patch("status", value)}
              options={["Live", "Draft", "Scheduled", "Inactive"]}
            />

            <AdminToggle
              label="Active"
              checked={draft.active !== false}
              onChange={(value) => patch("active", value)}
            />
          </div>

          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
            <div className="mb-2 text-sm font-black">Responsive banner media</div>
            <div className="mb-3 text-xs font-semibold text-slate-500">
              Main image is required. Mobile/tablet/desktop images are optional and fallback to main image.
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["mainImage", "Main image / required"],
                ["mobileImage", "Mobile image / optional"],
                ["tabletImage", "Tablet image / optional"],
                ["desktopImage", "Desktop image / optional"],
              ].map(([field, label]) => (
                <label
                  key={field}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-black text-white"
                >
                  <UploadCloud size={16} />
                  {label}
                  <input
                    name={field}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/ogg"
                    className="hidden"
                    onChange={uploadMedia}
                  />
                </label>
              ))}
            </div>

            {(draft.mainImage ||
              draft.imageUrl ||
              draft.mobileImage ||
              draft.desktopImage ||
              draft.videoUrl) && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3">
                <div className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">
                  Preview
                </div>

                {draft.videoUrl ? (
                  <video
                    src={draft.videoUrl}
                    controls
                    muted
                    className="max-h-72 w-full rounded-xl object-contain"
                  />
                ) : (
                  <img
                    src={
                      draft.desktopImage ||
                      draft.mainImage ||
                      draft.imageUrl ||
                      draft.mobileImage
                    }
                    alt={
                      draft.altText ||
                      draft.titleInternal ||
                      "Banner preview"
                    }
                    className="max-h-72 w-full rounded-xl bg-slate-100 object-contain"
                  />
                )}
              </div>
            )}

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <AdminTextField
                label="Main image URL"
                value={draft.mainImage || draft.imageUrl}
                onChange={(value) => {
                  patch("mainImage", value);
                  patch("imageUrl", value);
                }}
              />
              <AdminTextField label="Mobile image URL" value={draft.mobileImage} onChange={(value) => patch("mobileImage", value)} />
              <AdminTextField label="Tablet image URL" value={draft.tabletImage} onChange={(value) => patch("tabletImage", value)} />
              <AdminTextField label="Desktop image URL" value={draft.desktopImage} onChange={(value) => patch("desktopImage", value)} />
              <AdminTextField label="Video URL / optional" value={draft.videoUrl} onChange={(value) => patch("videoUrl", value)} />
              <AdminTextField label="CTA URL" value={draft.ctaUrl} onChange={(value) => patch("ctaUrl", value)} />
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 text-sm font-black text-slate-950">
              Legacy text overlay / not used on storefront
            </div>
            <div className="text-xs font-semibold leading-5 text-slate-500">
              Old fields such as heading/title/subtitle/CTA/chips are intentionally not rendered on the storefront. Put campaign text directly into the artwork image.
            </div>
          </div>
        </div>
      </AdminDrawer>
    </>
  );
}
