import { useEffect, useState } from "react";
import { ImagePlus, Info, UploadCloud, X } from "lucide-react";
import { uploadAdminMediaImages, uploadAdminMediaVideo } from "../../services/AdminMediaApiService";
import { useLang } from "../../store/CmsStore";

export function AdminFieldTip({ children }) {
  if (!children) return null;

  return (
    <div className="mt-1 flex items-start gap-1.5 text-xs leading-5 text-slate-500">
      <Info size={13} className="mt-0.5 shrink-0 text-blue-500" />
      <span>{children}</span>
    </div>
  );
}

export function AdminFieldLabel({ label, required, tip }) {
  const [lang] = useLang();

  return (
    <div className="mb-1.5">
      <div className="flex items-center gap-2 text-sm font-black text-slate-800">
        <span>{label}</span>
        {required && (
          <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-black text-red-600">
            {lang === "en" ? "Required" : "Bắt buộc"}
          </span>
        )}
      </div>
      <AdminFieldTip>{tip}</AdminFieldTip>
    </div>
  );
}

export function AdminTextField({
  label,
  tip,
  required,
  placeholder,
  value,
  onChange,
  suffix,
  type = "text",
}) {
  return (
    <label className="block">
      <AdminFieldLabel label={label} tip={tip} required={required} />
      <div className="flex rounded-md border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
        <input
          type={type}
          className="min-w-0 flex-1 rounded-md bg-transparent px-3 py-2 text-sm font-semibold outline-none placeholder:text-slate-400"
          placeholder={placeholder}
          value={value ?? ""}
          onChange={(event) => onChange?.(event.target.value)}
        />
        {suffix && <div className="border-l border-slate-200 px-3 py-2 text-xs font-bold text-slate-500">{suffix}</div>}
      </div>
    </label>
  );
}

export function AdminTextarea({
  label,
  tip,
  required,
  placeholder,
  value,
  onChange,
  rows = 4,
}) {
  return (
    <label className="block">
      <AdminFieldLabel label={label} tip={tip} required={required} />
      <textarea
        rows={rows}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </label>
  );
}

export function AdminSelect({
  label,
  tip,
  required,
  options = [],
  value,
  onChange,
}) {
  return (
    <label className="block">
      <AdminFieldLabel label={label} tip={tip} required={required} />
      <select
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        value={value ?? ""}
        onChange={(event) => onChange?.(event.target.value)}
      >
        {options.map((option) => {
          const normalized = typeof option === "string" ? { label: option, value: option } : option;
          return (
            <option key={normalized.value} value={normalized.value}>
              {normalized.label}
            </option>
          );
        })}
      </select>
    </label>
  );
}

export function AdminToggle({ label, tip, checked = true, onChange }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-4">
        <AdminFieldLabel label={label} tip={tip} />
        <button
          type="button"
          onClick={() => onChange?.(!checked)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-blue-700" : "bg-slate-300"}`}
        >
          <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${checked ? "left-6" : "left-1"}`} />
        </button>
      </div>
    </div>
  );
}

function pickUploadedImageUrl(image = {}) {
  if (!image) return "";
  if (typeof image === "string") return image;
  return image.cardUrl || image.url || image.detailUrl || image.thumbUrl || image.originalUrl || "";
}

function pickUploadedVideoUrl(payload = {}) {
  return payload.videoUrl || payload.url || payload.video?.url || payload.video?.videoUrl || "";
}

export function AdminImageUploader({
  label,
  tip,
  required,
  value,
  onChange,
  recommended = "1200 x 630 px",
}) {
  const [lang] = useLang();
  const [preview, setPreview] = useState(value || "");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setPreview(value || "");
  }, [value]);

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const data = await uploadAdminMediaImages([file]);
      const url = pickUploadedImageUrl(data?.images?.[0]) || data?.url || "";

      if (!url) {
        throw new Error(lang === "en" ? "Backend did not return uploaded image URL." : "Backend không trả về URL ảnh đã tải lên.");
      }

      setPreview(url);
      onChange?.(url);
    } catch (error) {
      window.alert(error?.message || (lang === "en" ? "Invalid image file." : "File ảnh không hợp lệ."));
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function remove() {
    setPreview("");
    onChange?.("");
  }

  return (
    <div>
      <AdminFieldLabel label={label} tip={tip} required={required} />

      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
        <div className="flex min-h-36 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white">
          {preview ? (
            <img src={preview} alt="" loading="lazy" decoding="async" className="h-full max-h-56 w-full object-cover" />
          ) : (
            <div className="text-center">
              <ImagePlus className="mx-auto text-slate-300" size={32} />
              <div className="mt-2 text-sm font-black text-slate-800">{lang === "en" ? "No image selected" : "Chưa chọn ảnh"}</div>
              <div className="mt-1 text-xs font-semibold text-slate-500">{lang === "en" ? "Recommended" : "Khuyến nghị"}: {recommended}</div>
            </div>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <label className={`inline-flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-xs font-black text-white ${uploading ? "bg-blue-400" : "bg-blue-700 hover:bg-blue-800"}`}>
            <UploadCloud size={14} />
            {uploading ? (lang === "en" ? "Uploading..." : "Đang tải lên...") : (lang === "en" ? "Upload image" : "Tải ảnh lên")}
            <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handleUpload} />
          </label>

          <button
            type="button"
            onClick={remove}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            <X size={14} />
            {lang === "en" ? "Remove" : "Xóa"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminMultiImageUploader({
  label,
  tip,
  required,
  value = [],
  onChange,
  recommended = "1200 x 1200 px",
}) {
  const [lang] = useLang();
  const images = Array.isArray(value) ? value.filter(Boolean) : [];
  const [uploading, setUploading] = useState(false);

  async function handleUpload(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    try {
      setUploading(true);
      const data = await uploadAdminMediaImages(files);
      const uploadedUrls = (data?.images || []).map(pickUploadedImageUrl).filter(Boolean);

      if (!uploadedUrls.length) {
        throw new Error(lang === "en" ? "Backend did not return uploaded gallery image URLs." : "Backend không trả về URL ảnh gallery đã tải lên.");
      }

      const next = Array.from(new Set([...images, ...uploadedUrls]));
      onChange?.(next);
    } catch (error) {
      window.alert(error?.message || (lang === "en" ? "Invalid gallery image file." : "File ảnh gallery không hợp lệ."));
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function remove(index) {
    onChange?.(images.filter((_, itemIndex) => itemIndex !== index));
  }

  function move(index, direction) {
    const next = [...images];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange?.(next);
  }

  return (
    <div>
      <AdminFieldLabel label={label} tip={tip} required={required} />

      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
        {images.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((src, index) => (
              <div key={`${src}-${index}`} className="overflow-hidden rounded-md border border-slate-200 bg-white">
                <div className="h-36 bg-slate-100">
                  <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                </div>
                <div className="flex items-center justify-between gap-2 p-2">
                  <span className="text-[11px] font-black text-slate-500">
                    {index === 0
                      ? (lang === "en" ? "Primary" : "Ảnh chính")
                      : (lang === "en" ? `Gallery ${index + 1}` : `Ảnh ${index + 1}`)}
                  </span>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => move(index, -1)} className="rounded border px-2 py-1 text-[11px] font-bold">↑</button>
                    <button type="button" onClick={() => move(index, 1)} className="rounded border px-2 py-1 text-[11px] font-bold">↓</button>
                    <button type="button" onClick={() => remove(index)} className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-bold text-red-600">X</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-36 items-center justify-center rounded-md border border-slate-200 bg-white text-center">
            <div>
              <ImagePlus className="mx-auto text-slate-300" size={32} />
              <div className="mt-2 text-sm font-black text-slate-800">{lang === "en" ? "No gallery images selected" : "Chưa chọn ảnh gallery"}</div>
              <div className="mt-1 text-xs font-semibold text-slate-500">{lang === "en" ? "Recommended" : "Khuyến nghị"}: {recommended}</div>
            </div>
          </div>
        )}

        <div className="mt-3">
          <label className={`inline-flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-xs font-black text-white ${uploading ? "bg-blue-400" : "bg-blue-700 hover:bg-blue-800"}`}>
            <UploadCloud size={14} />
            {uploading ? (lang === "en" ? "Uploading..." : "Đang tải lên...") : (lang === "en" ? "Upload multiple images" : "Tải nhiều ảnh lên")}
            <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={handleUpload} />
          </label>
        </div>
      </div>
    </div>
  );
}

export function AdminVideoUploader({
  label,
  tip,
  required,
  value,
  onChange,
  accept = "video/*",
}) {
  const [lang] = useLang();
  const [preview, setPreview] = useState(value || "");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setPreview(value || "");
  }, [value]);

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const data = await uploadAdminMediaVideo(file);
      const url = pickUploadedVideoUrl(data);

      if (!url) {
        throw new Error(lang === "en" ? "Backend did not return uploaded video URL." : "Backend không trả về URL video đã tải lên.");
      }

      setPreview(url);
      onChange?.(url);
    } catch (error) {
      window.alert(error?.message || (lang === "en" ? "Invalid video file." : "File video không hợp lệ."));
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function remove() {
    setPreview("");
    onChange?.("");
  }

  return (
    <div>
      <AdminFieldLabel label={label} tip={tip} required={required} />

      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
        <div className="flex min-h-44 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white">
          {preview ? (
            <video src={preview} className="max-h-64 w-full object-contain" controls />
          ) : (
            <div className="text-center">
              <UploadCloud className="mx-auto text-slate-300" size={32} />
              <div className="mt-2 text-sm font-black text-slate-800">{lang === "en" ? "No video selected" : "Chưa chọn video"}</div>
              <div className="mt-1 text-xs font-semibold text-slate-500">{lang === "en" ? "MP4/WebM recommended" : "Khuyến nghị MP4/WebM"}</div>
            </div>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <label className={`inline-flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-xs font-black text-white ${uploading ? "bg-blue-400" : "bg-blue-700 hover:bg-blue-800"}`}>
            <UploadCloud size={14} />
            {uploading ? (lang === "en" ? "Uploading..." : "Đang tải lên...") : (lang === "en" ? "Upload video" : "Tải video lên")}
            <input type="file" accept={accept} className="hidden" disabled={uploading} onChange={handleUpload} />
          </label>

          <button
            type="button"
            onClick={remove}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            <X size={14} />
            {lang === "en" ? "Remove" : "Xóa"}
          </button>
        </div>
      </div>
    </div>
  );
}