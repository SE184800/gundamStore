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
  createAdminBanner,
  deleteAdminBanner,
  getAdminHeroSettings,
  listAdminBanners,
  updateAdminBanner,
  updateAdminHeroSettings,
} from "../../services/BannerApiService";

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
  status: "Draft",
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

  // 🌟 ĐÃ THÊM: State dùng để giữ các File thô (Binary) trước khi submit FormData
  const [mediaFiles, setMediaFiles] = useState({
    mainImage: null,
    mobileImage: null,
    tabletImage: null,
    desktopImage: null,
    videoUrl: null
  });

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

  // 🛠️ ĐÃ SỬA: Loại bỏ hoàn toàn Base64, chuyển sang dùng URL RAM ảo siêu nhẹ
  async function uploadMedia(event) {
    const file = event.target.files?.[0];
    const targetField = event.target.name || "mainImage";

    if (!file) return;

    try {
      // Sinh link ảo để hiển thị preview tức thì trên giao diện admin
      const objectUrl = URL.createObjectURL(file);
      const isVideo = file.type.startsWith("video/");

      // Lưu file thô vào bộ nhớ tạm để tí đóng gói FormData
      setMediaFiles(prev => ({ ...prev, [targetField]: file }));

      setDraft((prev) => ({
        ...prev,
        mediaType: isVideo ? "video" : file.type.includes("gif") ? "gif" : "image",
        mainImage: targetField === "mainImage" ? objectUrl : prev.mainImage,
        imageUrl: targetField === "mainImage" ? objectUrl : prev.imageUrl,
        mobileImage: targetField === "mobileImage" ? objectUrl : prev.mobileImage,
        tabletImage: targetField === "tabletImage" ? objectUrl : prev.tabletImage,
        desktopImage: targetField === "desktopImage" ? objectUrl : prev.desktopImage,
        videoUrl: targetField === "videoUrl" ? objectUrl : prev.videoUrl,
      }));
    } catch (err) {
      window.alert(err?.message || "Invalid banner media file.");
    } finally {
      event.target.value = "";
    }
  }

  function createBanner() {
    setDraft(emptyBanner);
    setMediaFiles({ mainImage: null, mobileImage: null, tabletImage: null, desktopImage: null, videoUrl: null });
    setOpen(true);
  }

  function editBanner(banner) {
    setDraft({
      ...emptyBanner,
      ...banner,
      mainImage: banner.mainImage || banner.imageUrl || "",
      imageUrl: banner.imageUrl || banner.mainImage || "",
      fitMode: banner.fitMode || "cover",
      status: banner.status || "Draft",
    });
    setMediaFiles({ mainImage: null, mobileImage: null, tabletImage: null, desktopImage: null, videoUrl: null });
    setOpen(true);
  }

  function normalizePayload() {
    const cta = normalizeSafeCtaUrl(draft.ctaUrl, { fallback: "/shop" });
    const mainImage = draft.mainImage || draft.imageUrl;

    if (!mainImage) {
      throw new Error(
        lang === "en" ? "Main image is required." : "Banner cần có main image."
      );
    }

    if (!cta.ok) {
      throw new Error(
        lang === "en" ? "CTA URL is not allowed." : "CTA URL không hợp lệ."
      );
    }

    return {
      titleInternal: draft.titleInternal || draft.altText || "Storefront banner",
      altText: draft.altText || draft.titleInternal || "Storefront banner",
      placement: draft.placement || "Homepage Hero",
      mediaType: draft.mediaType || "image",
      mainImage,
      imageUrl: draft.imageUrl || mainImage,
      mobileImage: draft.mobileImage || "",
      tabletImage: draft.tabletImage || "",
      desktopImage: draft.desktopImage || "",
      videoUrl: draft.videoUrl || "",
      ctaUrl: cta.value,
      status: draft.status || "Draft",
      active: draft.active !== false,
      priority: Number(draft.priority || 1),
      fitMode: draft.fitMode || "cover",
      legacyText: draft.legacyText || null,
    };
  }

  // 🛠️ ĐÃ SỬA: Đóng gói toàn bộ payload và file thô thành FormData để bắn lên API Backend Multer
  async function saveBanner() {
    try {
      setError("");
      const cleanData = normalizePayload();

      // Khởi tạo FormData bọc dữ liệu nhị phân gửi đi an toàn
      const formData = new FormData();

      // Khởi tạo các trường text
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] !== null && cleanData[key] !== undefined) {
          formData.append(key, cleanData[key]);
        }
      });

      // Đính kèm các file thô thực tế nếu có thao tác upload mới
      if (mediaFiles.mainImage) formData.append("mainImageFile", mediaFiles.mainImage);
      if (mediaFiles.mobileImage) formData.append("mobileImageFile", mediaFiles.mobileImage);
      if (mediaFiles.tabletImage) formData.append("tabletImageFile", mediaFiles.tabletImage);
      if (mediaFiles.desktopImage) formData.append("desktopImageFile", mediaFiles.desktopImage);
      if (mediaFiles.videoUrl) formData.append("videoFile", mediaFiles.videoUrl);

      if (draft.id) {
        await updateAdminBanner(draft.id, formData); // Truyền formData thay vì JSON cũ
        setMessage("Banner updated.");
      } else {
        await createAdminBanner(formData); // Truyền formData thay vì JSON cũ
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

    if (banner.mediaType === "video" || String(url).startsWith("data:video") || String(url).startsWith("blob:")) {
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
        <div className="text-sm font-black text-blue-900">Image-first storefront banner</div>
        <div className="mt-1 text-xs font-semibold leading-5 text-blue-800">
          Nội dung chữ/CTA nên được thiết kế trực tiếp trong ảnh banner. Storefront chỉ hiển thị banner dạng hình ảnh. Title/alt text chỉ dùng để quản lý và hỗ trợ accessibility.
        </div>
      </section>

      <section className="mb-4 rounded-md border border-slate-200 bg-white p-4">
        <div className="mb-4">
          <h2 className="text-base font-black text-slate-950">Hero Layout Settings</h2>
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
                  <td colSpan={9} className="px-4 py-8 text-center font-bold text-slate-500">Loading banners...</td>
                </tr>
              ) : banners.length ? (
                banners.map((banner) => (
                  <tr key={banner.id} className="group border-t border-slate-100 hover:bg-slate-50">
                    <td className="sticky left-0 z-10 bg-white px-4 py-3 group-hover:bg-slate-50">
                      <button onClick={() => editBanner(banner)} className="mr-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold">
                        <Edit3 size={14} className="mr-1 inline" /> Edit
                      </button>
                      <button onClick={() => removeBanner(banner.id)} className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
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
                  <td colSpan={9} className="px-4 py-8 text-center font-bold text-slate-500">No banners yet.</td>
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
            <AdminTextField label="Internal title" value={draft.titleInternal} onChange={(value) => patch("titleInternal", value)} />
            <AdminTextField label="Alt text" value={draft.altText} onChange={(value) => patch("altText", value)} />
            <AdminSelect label="Placement" value={draft.placement} onChange={(value) => patch("placement", value)} options={["Homepage Hero", "Below Categories", "Shop Top", "Popup"]} />
            <AdminSelect label="Media type" value={draft.mediaType} onChange={(value) => patch("mediaType", value)} options={["image", "gif", "video"]} />
            <AdminSelect label="Fit mode" value={draft.fitMode || "cover"} onChange={(value) => patch("fitMode", value)} options={["cover", "contain"]} />
            <AdminTextField label="Priority" type="number" value={draft.priority} onChange={(value) => patch("priority", Number(value || 1))} />
            <AdminSelect label="Status" value={draft.status} onChange={(value) => patch("status", value)} options={["Live", "Draft", "Scheduled", "Inactive"]} />
            <AdminToggle label="Active" checked={draft.active !== false} onChange={(value) => patch("active", value)} />
          </div>

          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
            <div className="mb-2 text-sm font-black">Responsive banner media</div>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["mainImage", "Main image / required"],
                ["mobileImage", "Mobile image / optional"],
                ["tabletImage", "Tablet image / optional"],
                ["desktopImage", "Desktop image / optional"],
                ["videoUrl", "Video / optional"]
              ].map(([field, label]) => (
                <label key={field} className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-black text-white">
                  <UploadCloud size={16} /> {label}
                  <input name={field} type="file" accept="image/*,video/*" className="hidden" onChange={uploadMedia} />
                </label>
              ))}
            </div>

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
        </div>
      </AdminDrawer>
    </>
  );
}