import { Save, X } from "lucide-react";
import { useLang } from "../../store/CmsStore";

export default function AdminDrawer({
  open,
  title,
  subtitle,
  children,
  onClose,
  onSave,
  saveLabel,
}) {
  const [lang] = useLang();
  if (!open) return null;

  const resolvedSaveLabel = saveLabel || (lang === "en" ? "Save changes" : "Lưu thay đổi");

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-slate-900/30" onClick={onClose} aria-label={lang === "en" ? "Close drawer" : "Đóng"} />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[920px] flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <div className="text-lg font-black text-slate-950">{title}</div>
            {subtitle && <div className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</div>}
          </div>

          <button
            onClick={onClose}
            className="rounded-md border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">{children}</div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            {lang === "en" ? "Cancel" : "Hủy"}
          </button>

          <button
            onClick={onSave}
            className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-black text-white hover:bg-blue-800"
          >
            <Save size={16} />
            {resolvedSaveLabel}
          </button>
        </div>
      </aside>
    </div>
  );
}
