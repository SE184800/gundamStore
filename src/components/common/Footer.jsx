import { Facebook, Mail, MapPin, MessageCircle, Youtube,Phone } from "lucide-react";
import { useI18n } from "../../i18n";
import Logo from "./Logo";
export default function Footer() {
  const { t } = useI18n();

  const groups = [
    {
      title: t("footer.productGroup"),
      links: [
        [t("header.allProducts"), "/shop"],
        [t("header.preorder"), "/pre-order"],
        [t("header.promotions"), "/promotions"],
        [t("header.tools"), "/shop?category=tools"],
      ],
    },
    {
      title: t("footer.communityGroup"),
      links: [
        [t("header.news"), "/news"],
        [t("header.events"), "/news/events"],
        [t("header.buildGuide"), "/build-guide"],
        [t("header.livestream"), "/news/events"],
      ],
    },
    {
      title: t("footer.supportGroup"),
      links: [
        [t("common.faq"), "/faq"],
        [t("header.orderLookup"), "/order-lookup"],
        [t("header.returnPolicy"), "/return-policy"],
        [t("common.contact"), "/contact"],
      ],
    },
  ];

  return (
    <footer className="relative z-10 mt-12 bg-slate-950 text-white">
      <div className="mx-auto max-w-[1440px] px-4 py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_2fr_1.1fr]">
          <div>
            <Logo className="h-16 w-auto object-contain" />
            <p className="mt-4 max-w-sm text-sm font-semibold leading-7 text-white/60">
              {t("footer.intro")}
            </p>

            <div className="mt-5 space-y-3 text-sm font-bold text-white/70">
              <div className="flex items-center gap-2">
                <MapPin size={17} /> {t("footer.location")}
              </div>
              <div className="flex items-center gap-2">
                <Mail size={17} /> support@gundamstore.vn
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {groups.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-blue-300">
                  {group.title}
                </h3>

                <div className="mt-4 space-y-3">
                  {group.links.map(([label, href]) => (
                    <a
                      key={label}
                      href={href}
                      className="block text-sm font-bold text-white/65 transition hover:text-white"
                    >
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* <div className="rounded-4xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-xl font-black">{t("footer.newsletterTitle")}</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/60">
              {t("footer.newsletterDesc")}
            </p> */}

            {/* <div className="mt-4 flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-white/35"
                placeholder={t("footer.emailPlaceholder")}
              />
              <button className="rounded-2xl bg-blue-700 px-4 py-3 text-sm font-black text-white hover:bg-blue-600">
                {t("common.send")}
              </button>
            </div> */}

            {/* <div className="mt-5 flex gap-2">
              {[
                [Facebook, "Facebook"],
                [Youtube, "YouTube"],
                [MessageCircle, "Chat"],
              ].map(([Icon, label]) => (
                <a
                  key={label}
                  href="/contact"
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white/70 transition hover:bg-blue-700 hover:text-white"
                  title={label}
                >
                  <Icon size={19} />
                </a>
              ))}
            </div> */}
          {/* </div> */}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-xs font-bold text-white/45 md:pr-24">
          <div>{t("footer.rights")}</div>

          <div className="flex gap-4">
            <a href="/return-policy" className="hover:text-white">{t("common.policy")}</a>
            <a href="/faq" className="hover:text-white">{t("common.faq")}</a>
            <a href="/contact" className="hover:text-white">{t("common.contact")}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
