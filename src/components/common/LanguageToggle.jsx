import { useI18n } from "../../i18n";

const OPTIONS = [
  { code: "vi", label: "VI", ariaLabel: "Chuyển sang tiếng Việt" },
  { code: "en", label: "EN", ariaLabel: "Switch to English" }
];

export default function LanguageToggle() {
  const { language, setLanguage } = useI18n();

  return (
    <div
      className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm"
      role="group"
      aria-label="Language switcher"
    >
      {OPTIONS.map((option) => {
        const active = language === option.code;

        return (
          <button
            key={option.code}
            type="button"
            aria-label={option.ariaLabel}
            aria-pressed={active}
            onClick={() => setLanguage(option.code)}
            className={[
              "min-w-12 rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              active
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
