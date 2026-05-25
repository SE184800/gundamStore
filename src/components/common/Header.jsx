import {
  CalendarDays,
  ChevronDown,
  Gift,
  Home,
  Menu,
  Newspaper,
  Package,
  Phone,
  Search,
  ShieldCheck,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useI18n } from "../../i18n";
import Logo from "./Logo";
import { useCms } from "../../store/CmsStore";


function isActive(pathname, item) {
  if (item.href === "/") return pathname === "/";
  if (item.href === "/news") return pathname === "/news";
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

export default function Header() {
  const { lang, setLang, t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { state, actions } = useCms();

  const navItems = [
    {
      label: t("common.home"),
      href: "/",
      icon: Home,
    },
    {
      label: t("common.products"),
      href: "/shop",
      icon: Package,
      children: [
        { label: t("header.allProducts"), href: "/shop", desc: t("header.allProductsDesc") },
        { label: t("header.grades"), href: "/shop", desc: t("header.gradesDesc"), badge: "HOT" },
        { label: t("header.tools"), href: "/shop?category=tools", desc: t("header.toolsDesc") },
        { label: t("header.newProducts"), href: "/shop?group=new", desc: t("header.newProductsDesc"), badge: "NEW" },
      ],
    },
    {
      label: t("common.orders"),
      href: "/pre-order",
      icon: ShoppingBag,
      children: [
        { label: t("header.preorder"), href: "/pre-order", desc: t("header.preorderDesc"), badge: "HOT" },
        { label: t("header.orderItems"), href: "/pre-order", desc: t("header.orderItemsDesc") },
        { label: t("header.arrivalCalendar"), href: "/news", desc: t("header.arrivalCalendarDesc") },
        { label: t("header.preorderPolicy"), href: "/pre-order", desc: t("header.preorderPolicyDesc") },
      ],
    },
    {
      label: t("common.deals"),
      href: "/promotions",
      icon: Gift,
      children: [
        { label: t("header.promotions"), href: "/promotions", desc: t("header.promotionsDesc") },
        { label: t("header.flashSale"), href: "/promotions#flash-sale", desc: t("header.flashSaleDesc"), badge: "SALE" },
        { label: t("header.voucher"), href: "/promotions", desc: t("header.voucherDesc") },
        { label: t("header.combo"), href: "/promotions", desc: t("header.comboDesc") },
      ],
    },
    {
      label: t("common.community"),
      href: "/news",
      icon: Newspaper,
      children: [
        { label: t("header.news"), href: "/news", desc: t("header.newsDesc") },
        { label: t("header.events"), href: "/news/events", desc: t("header.eventsDesc"), badge: "NEW" },
        { label: t("header.contest"), href: "/news/events", desc: t("header.contestDesc") },
        { label: t("header.buildGuide"), href: "/build-guide", desc: t("header.buildGuideDesc") },
        { label: t("header.livestream"), href: "/news/events", desc: t("header.livestreamDesc") },
      ],
    },
    {
      label: t("common.support"),
      href: "/order-lookup",
      icon: ShieldCheck,
      children: [
        { label: t("header.orderLookup"), href: "/order-lookup", desc: t("header.orderLookupDesc") },
        { label: t("common.contact"), href: "/contact", desc: t("header.contactDesc") },
        { label: t("common.faq"), href: "/faq", desc: t("header.faqDesc") },
        { label: t("header.returnPolicy"), href: "/return-policy", desc: t("header.returnPolicyDesc") },
      ],
    },
    {
      label: t("common.admin"),
      href: "/admin",
      icon: User,
    },
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-[64px] max-w-[1440px] items-center gap-3 px-4 lg:px-8">
        <a href="/" className="flex shrink-0 items-center">
          <Logo className="h-12 w-auto object-contain" />
        </a>

        <div className="mx-auto hidden w-full max-w-[620px] items-center rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100 md:flex">
          <Search size={21} className="text-blue-600" />
          <input
            className="w-full bg-transparent px-3 text-sm font-semibold outline-none placeholder:text-slate-400"
            placeholder={t("common.searchPlaceholder")}
          />
        </div>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1 shadow-sm">
            {["vi", "en"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setLang(item)}
                className={`rounded-xl px-4 py-2 text-xs font-black uppercase transition ${lang === item
                    ? "bg-blue-700 text-white shadow-md"
                    : "text-slate-500 hover:bg-white hover:text-slate-900"
                  }`}
              >
                {item.toUpperCase()}
              </button>
            ))}
          </div>

          {state.user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-2 text-xs font-black text-blue-700 shadow-sm">
                <User size={15} />
                <span>{state.user.username}</span>
              </div>
              <button
                onClick={() => actions.logout()}
                className="rounded-2xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 shadow-sm hover:bg-red-50 transition"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <a
                href="/login"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                Sign In
              </a>
              <a
                href="/register"
                className="rounded-2xl bg-blue-700 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-blue-100 transition hover:bg-blue-800"
              >
                Sign Up
              </a>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="ml-auto rounded-2xl border border-slate-200 p-3 md:hidden"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
      </div>

      <nav className="border-t border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50">
        <div className="mx-auto hidden max-w-[1440px] items-center gap-2 px-4 py-2 lg:flex lg:px-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              isActive(location.pathname, item) ||
              item.children?.some((child) => isActive(location.pathname, child));

            return (
              <div key={item.label} className="group relative">
                <a
                  href={item.href}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2.5 text-sm font-black transition ${active
                      ? "bg-blue-700 text-white shadow-lg shadow-blue-100"
                      : "text-slate-700 hover:bg-blue-700 hover:text-white hover:shadow-lg hover:shadow-blue-100"
                    }`}
                >
                  <Icon size={17} className={active ? "text-white" : "text-blue-600 group-hover:text-white"} />
                  {item.label}
                  {item.children && <ChevronDown size={15} />}
                </a>

                {item.children && (
                  <div className="invisible absolute left-0 top-full z-50 mt-3 w-[360px] translate-y-2 rounded-[26px] border border-slate-200 bg-white p-3 opacity-0 shadow-[0_30px_90px_rgba(15,23,42,0.16)] transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    <div className="mb-2 rounded-2xl bg-gradient-to-br from-blue-50 to-slate-50 p-4">
                      <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
                        {item.label}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-500">
                        {t("common.quickSelect")}
                      </div>
                    </div>

                    <div className="space-y-1">
                      {item.children.map((child) => (
                        <a
                          key={child.label}
                          href={child.href}
                          className="group/item flex items-start justify-between gap-3 rounded-2xl px-4 py-3 transition hover:bg-blue-50"
                        >
                          <div>
                            <div className="text-sm font-black text-slate-900 group-hover/item:text-blue-700">
                              {child.label}
                            </div>
                            <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                              {child.desc}
                            </div>
                          </div>

                          {child.badge && (
                            <span className="rounded-full bg-blue-700 px-2 py-1 text-[10px] font-black text-white">
                              {child.badge}
                            </span>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-[999999] bg-slate-950/60 backdrop-blur-sm lg:hidden">
          <div className="ml-auto h-full w-[86%] max-w-[420px] overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <Logo className="h-11 w-auto object-contain" />
              <button type="button" onClick={() => setMobileOpen(false)} className="rounded-2xl border border-slate-200 p-3">
                <X size={20} />
              </button>
            </div>

            <div className="mb-5 flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
              {["vi", "en"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setLang(item)}
                  className={`flex-1 rounded-xl px-4 py-2 text-xs font-black uppercase ${lang === item ? "bg-blue-700 text-white" : "text-slate-500"
                    }`}
                >
                  {item.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-2xl border border-slate-200 p-3">
                    <a href={item.href} className="flex items-center gap-2 text-base font-black text-slate-950">
                      <Icon size={18} className="text-blue-700" />
                      {item.label}
                    </a>

                    {item.children && (
                      <div className="mt-3 grid gap-2">
                        {item.children.map((child) => (
                          <a
                            key={child.label}
                            href={child.href}
                            className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600"
                          >
                            {child.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
