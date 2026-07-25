import { Download, RefreshCcw, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useCms, useLang } from "../../store/CmsStore";
import AdminPageHeader from "../../components/admin/AdminPageHeader";

const text = {
  vi: { title: "Cấu hình & Dữ liệu", desc: "Export/import/reset dữ liệu CMS localStorage. Dùng để backup khi test trên GitHub Codespaces/Vercel.", export: "Export JSON", import: "Import JSON", reset: "Reset dữ liệu demo", copied: "Đã export dữ liệu. Copy nội dung bên dưới.", paste: "Dán JSON vào đây rồi Import" },
  en: { title: "Settings & Data", desc: "Export/import/reset CMS localStorage data. Use it for backup in GitHub Codespaces/Vercel testing.", export: "Export JSON", import: "Import JSON", reset: "Reset demo data", copied: "Data exported. Copy the content below.", paste: "Paste JSON here then import" }
};

export default function AdminSettings() {
  const { actions } = useCms();
  const [lang] = useLang();
  const t = text[lang];
  const [json, setJson] = useState("");

  function exportData() {
    const data = actions.exportData();
    setJson(data);
    try {
      navigator.clipboard?.writeText(data);
    } catch {}
  }

  function importData() {
    try {
      actions.importData(json);
      alert("Imported successfully");
    } catch (e) {
      alert("Invalid JSON");
    }
  }

  return (
    <>
      <AdminPageHeader title={t.title} desc={t.desc} />
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <button onClick={exportData} className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-800"><Download className="mr-2 inline" size={16}/>{t.export}</button>
          <button onClick={importData} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800"><Upload className="mr-2 inline" size={16}/>{t.import}</button>
          <button onClick={() => { if(confirm("Reset data?")) actions.resetData(); }} className="rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-black text-red-600 hover:bg-red-100"><RefreshCcw className="mr-2 inline" size={16}/>{t.reset}</button>
        </div>
        <textarea value={json} onChange={(e) => setJson(e.target.value)} placeholder={t.paste} className="mt-5 min-h-[420px] w-full rounded-3xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs outline-none focus:border-blue-300" />
      </section>
    </>
  );
}
