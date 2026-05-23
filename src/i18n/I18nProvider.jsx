import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import { normalizeLanguage, t as translate, translations } from "./translations";

const I18nContext = createContext(null);

function readSavedLanguage() {
  if (typeof window === "undefined") return "vi";

  const saved =
    window.localStorage.getItem("language") ||
    window.localStorage.getItem("locale") ||
    "vi";

  return normalizeLanguage(saved);
}

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(readSavedLanguage);

  const setLanguage = useCallback((nextLanguage) => {
    const lang = normalizeLanguage(nextLanguage);

    window.localStorage.setItem("language", lang);
    window.localStorage.setItem("locale", lang);
    document.documentElement.lang = lang;

    setLanguageState(lang);

    window.dispatchEvent(
      new CustomEvent("gundam-language-change", {
        detail: { language: lang }
      })
    );
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "vi" ? "en" : "vi");
  }, [language, setLanguage]);

  const t = useCallback(
    (key, params) => translate(language, key, params),
    [language]
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t,
      dictionary: translations[language]
    }),
    [language, setLanguage, toggleLanguage, t]
  );

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used inside <I18nProvider>");
  }

  return context;
}

export function T({ k, params, as: Component = "span", ...props }) {
  const { t } = useI18n();

  return <Component {...props}>{t(k, params)}</Component>;
}
