import { useState, useEffect } from "react";
import { ImagePlus, Info, UploadCloud, X } from "lucide-react";

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
  return (
    <div className="mb-1.5">
      <div className="flex items-center gap-2 text-sm font-black text-slate-800">
        <span>{label}</span>
        {required && (
          <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-black text-red-600">
            Required
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

export function AdminImageUploader({
  label,
  tip,
  required,
  value,
  onChange,
  recommended = "1200 x 630 px",
}) {
  const [preview, setPreview] = useState("");

  // Đồng bộ preview nếu ban đầu form cha truyền vào một link URL ảnh cũ từ Database
  useEffect(() => {
    if (typeof value === "string") {
      setPreview(value);
    } else if (!value) {
      setPreview("");
    }
  }, [value]);

  function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    onChange?.(file);
    event.target.value = "";
  }

  function remove() {
    setPreview("");
    onChange?.(null);
  }

  return (
    <div>
      <AdminFieldLabel label={label} tip={tip} required={required} />
      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
        <div className="flex min-h-36 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white">
          {preview ? (
            <img src={preview} alt="" className="h-full max-h-56 w-full object-cover" />
          ) : (
            <div className="text-center">
              <ImagePlus className="mx-auto text-slate-300" size={32} />
              <div className="mt-2 text-sm font-black text-slate-800">No image selected</div>
              <div className="mt-1 text-xs font-semibold text-slate-500">Recommended: {recommended}</div>
            </div>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">
            <UploadCloud size={14} />
            Upload image
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </label>
          <button type="button" onClick={remove} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
            <X size={14} /> Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// 🌟 ĐÃ FIX TRIỆT ĐỂ LỖI LOGIC MULTI UPLOADER TẠI ĐÂY
export function AdminMultiImageUploader({
  label,
  tip,
  required,
  value = [],
  onChange,
  recommended = "1200 x 1200 px",
}) {
  const images = Array.isArray(value) ? value.filter(Boolean) : [];

  function getPreviewSrc(item) {
    if (typeof item === "string") return item;
    if (item instanceof File) return URL.createObjectURL(item);
    return "";
  }

  function handleUpload(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    // Sửa lỗi: Ghép mảng images hiện tại với các File mới chọn chuẩn xác
    const next = [...images, ...files];
    onChange?.(next);
    event.target.value = "";
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
            {images.map((item, index) => (
              <div key={index} className="overflow-hidden rounded-md border border-slate-200 bg-white">
                <div className="h-36 bg-slate-100">
                  <img src={getPreviewSrc(item)} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="flex items-center justify-between gap-2 p-2">
                  <span className="text-[11px] font-black text-slate-500">
                    {index === 0 ? "Primary" : `Gallery ${index + 1}`}
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
              <div className="mt-2 text-sm font-black text-slate-800">No gallery images selected</div>
              <div className="mt-1 text-xs font-semibold text-slate-500">Recommended: {recommended}</div>
            </div>
          </div>
        )}

        <div className="mt-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">
            <UploadCloud size={14} />
            Upload multiple images
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
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
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (typeof value === "string") {
      setPreview(value);
    } else if (!value) {
      setPreview("");
    }
  }, [value]);

  function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    onChange?.(file);
    event.target.value = "";
  }

  function remove() {
    setPreview("");
    onChange?.(null);
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
              <div className="mt-2 text-sm font-black text-slate-800">No video selected</div>
              <div className="mt-1 text-xs font-semibold text-slate-500">MP4/WebM recommended</div>
            </div>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">
            <UploadCloud size={14} />
            Upload video
            <input type="file" accept={accept} className="hidden" onChange={handleUpload} />
          </label>
          <button type="button" onClick={remove} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
            <X size={14} /> Remove
          </button>
        </div>
      </div>
    </div>
  );
}