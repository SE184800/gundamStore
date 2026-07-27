import { lazy, Suspense, useEffect, useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { translateDomTree, useI18n } from "../../i18n";
import { useCms } from "../../store/CmsStore";

const FloatingChat = lazy(() => import("./FloatingChat"));
const ENABLE_LEGACY_DOM_TRANSLATOR = import.meta.env.DEV;

export function LanguageDomTranslator() {
  const { lang } = useI18n();

  useEffect(() => {
    if (!ENABLE_LEGACY_DOM_TRANSLATOR) return undefined;

    translateDomTree(document.body, lang);

    const observer = new MutationObserver(() => {
      translateDomTree(document.body, lang);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "title", "aria-label"],
    });

    return () => observer.disconnect();
  }, [lang]);

  return null;
}

function DeferredFloatingChat() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const pathname = window.location.pathname || "";
    if (pathname.startsWith("/admin")) return undefined;

    let settled = false;
    let timeoutId;
    let idleId;

    const showChat = () => {
      if (settled) return;
      settled = true;
      setReady(true);
    };

    timeoutId = window.setTimeout(showChat, 2000);

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(showChat, { timeout: 2000 });
    }

    return () => {
      settled = true;
      window.clearTimeout(timeoutId);
      if (idleId && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
    };
  }, []);

  if (!ready) return null;

  return (
    <Suspense fallback={null}>
      <FloatingChat />
    </Suspense>
  );
}

export default function PageShell({ children, withFooter = true }) {
  const { state } = useCms();
  const lang = state?.settings?.lang || "vi";
  return (
    <div className="min-h-screen bg-[#f6f9fd] text-slate-900">
      {ENABLE_LEGACY_DOM_TRANSLATOR && <LanguageDomTranslator />}

      <div className="pointer-events-none fixed inset-0 opacity-100">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f7fbff] to-[#eef5fc]" />
        <div className="absolute left-[-10%] top-[-15%] h-96 w-96 rounded-full bg-blue-100/70 blur-xl" />
        <div className="absolute right-[-10%] top-20 h-96 w-96 rounded-full bg-cyan-100/70 blur-xl" />
        <div
          className="absolute inset-0 opacity-80"
          style={{
            backgroundImage:
              "linear-gradient(rgba(37,99,235,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.035) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
      </div>

      <Header user={state?.user} lang={lang} />
      <main className="relative z-10">{children}</main>
      {withFooter && <Footer />}
      <DeferredFloatingChat />
    </div>
  );
}
