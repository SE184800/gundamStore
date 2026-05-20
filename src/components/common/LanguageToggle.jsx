export default function LanguageToggle({ lang, setLang }) {
  return (
    <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1 shadow-sm">
      {[
        { value: "vi", label: "VI" },
        { value: "en", label: "EN" },
      ].map((item) => (
        <button
          key={item.value}
          onClick={() => setLang(item.value)}
          className={`rounded-xl px-3 py-2 text-xs font-black transition ${lang === item.value ? "bg-blue-700 text-white shadow-sm" : "text-slate-500 hover:bg-white hover:text-slate-900"}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
