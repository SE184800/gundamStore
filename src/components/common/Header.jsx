import {
  CalendarDays,
  ChevronDown,
  Globe,
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
  Heart,
  LogOut,
  Settings
} from "lucide-react";
import HeaderCart from "../layout/HeaderCart";
import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useI18n } from "../../i18n";
import Logo from "./Logo";
import { useCms } from "../../store/CmsStore";
import { Link } from "react-router-dom";
import Toast from "../../utils/Toast";
import { createPortal } from "react-dom";
function isActive(pathname, item) {
  if (item.href === "/") return pathname === "/";
  if (item.href === "/news") return pathname === "/news";
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

export default function Header() {
  const { lang, setLang, t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [displayLang, setDisplayLang] = useState(() => lang || "vi");
  const location = useLocation();
  const navigate = useNavigate();
  const [toast, setToast] = useState({ show: false, type: "", message: "" });
  const { state, actions } = useCms();
  const menuRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const isAdminUser = ["admin", "owner", "staff"].includes(String(state.user?.role || "").toLowerCase());
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
    ...(isAdminUser
      ? [
        {
          label: t("common.admin"),
          href: "/admin",
          icon: User
        }
      ]
      : [])
  ];
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  function triggerToast(type, message) {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: "", message: "" }), 3000);
  }
  useEffect(() => {
    setDisplayLang(lang);
  }, [lang]);
  function handleLogout() {
    setUserMenuOpen(false);
    triggerToast("success", "Đăng xuất thành công !");
    actions.logout();
  }
  function submitHeaderSearch(event) {
    event.preventDefault();
    const keyword = searchTerm.trim().slice(0, 80);
    if (!keyword) {
      navigate("/shop");
      return;
    }
    navigate(`/shop?q=${encodeURIComponent(keyword)}`);
    setMobileOpen(false);
  }

  return (
    <>
      <Toast show={toast.show} type={toast.type} message={toast.message} />
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        {/* Khung chính của Header: Chuyển sang min-h để ôm được 2 hàng trên Mobile */}
        <div className="mx-auto flex min-h-[64px] py-2 max-w-[1440px] flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 px-4 lg:px-8">

          {/* HÀNG 1: LOGO VÀ CỤM NÚT ĐIỀU HƯỚNG */}
          <div className="flex h-[48px] md:h-auto items-center justify-between w-full md:w-auto">
            <a href="/" className="flex shrink-0 items-center">
              <Logo className="h-10 md:h-12 w-auto object-contain" />
            </a>

            {/* CỤM NÚT MOBILE (Gom gọn về bên phải, bỏ sạch các ký tự rác ở giữa) */}
            <div className="flex items-center gap-2 md:hidden">
              {state.user ? (
                <a
                  href="/profile"
                  className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-blue-100 bg-blue-50/60 px-2.5 text-blue-700 shadow-sm transition active:scale-95"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <User size={13} />
                  </div>
                  <span className="max-w-[70px] truncate text-[11px] font-black">{state.user.name}</span>
                </a>
              ) : (
                <a
                  href="/login"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-700 shadow-sm transition active:scale-95"
                >
                  {t("header.signIn")}
                </a>
              )}
              <HeaderCart />
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm text-slate-950 transition active:scale-95"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>

          {/* THANH SEARCH BAR (BẢN PC) */}
          <form
            onSubmit={submitHeaderSearch}
            className="mx-auto hidden w-full max-w-[620px] items-center rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100 md:flex"
          >
            <Search size={21} className="text-blue-600" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full bg-transparent px-3 text-sm font-semibold outline-none placeholder:text-slate-400"
              placeholder={t("common.searchPlaceholder")}
              aria-label={t("common.searchPlaceholder")}
            />
          </form>

          {/* CỤM ĐIỀU HƯỚNG TÀI KHOẢN BẢN PC */}
          <div className="ml-auto hidden items-center gap-1.5 md:flex">
            <div className="group relative flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-100 hover:border-slate-300 cursor-pointer">
              <Globe size={16} className="text-slate-500" />
              <ChevronDown size={14} className="text-slate-400 transition-transform duration-300 group-hover:rotate-180" />
              <div className="absolute right-0 top-full z-[99] pt-2 hidden w-32 group-hover:block">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl animate-in fade-in slide-in-from-top-1 duration-200">
                  <button
                    type="button"
                    onClick={() => setLang("vi")}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-all ${displayLang?.toLowerCase().includes("vi") ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                  >
                    <span>🇻🇳</span> Tiếng Việt
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang("en")}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-all mt-0.5 ${!displayLang?.toLowerCase().includes("vi") ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                  >
                    <span>🇺🇸</span> English
                  </button>
                </div>
              </div>
            </div>

            <HeaderCart />

            {state.user ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/60 px-3.5 py-2 text-sm font-black text-blue-700 shadow-sm hover:bg-blue-50 transition active:scale-[0.98]"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                    <User size={14} />
                  </div>
                  <span className="max-w-[120px] truncate">{state.user.name}</span>
                  <ChevronDown size={14} className={`text-blue-500 transition-transform duration-300 ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full z-[99] mt-2 w-52 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-[0_20px_50px_rgba(15,23,42,0.12)] animate-in fade-in slide-in-from-top-2 duration-200">
                    <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600">
                      <Settings size={15} className="text-slate-400 group-hover:text-blue-600" />
                      {t("header.userProfile")}
                    </Link>
                    <Link to="/favorites" onClick={() => setUserMenuOpen(false)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600">
                      <Heart size={15} className="text-slate-400 group-hover:text-blue-600" />
                      {t("header.favoriteList")}
                    </Link>
                    <div className="my-1 border-t border-dashed border-slate-100"></div>
                    <button type="button" onClick={() => handleLogout()} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-black text-red-600 transition hover:bg-red-50">
                      <LogOut size={15} className="text-red-500" />
                      {t("header.logout")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2" key={lang}>
                <a href="/login" className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">{t("header.signIn")}</a>
                <a href="/register" className="rounded-2xl bg-blue-700 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-blue-100 transition hover:bg-blue-800">{t("header.signUp")}</a>
              </div>
            )}
          </div>

          {/* HÀNG 2: THANH SEARCH BAR ĐẨY RA NGOÀI DÀNH RIÊNG CHO MOBILE */}
          <div className="w-full mt-1 pb-1 md:hidden">
            <form
              onSubmit={submitHeaderSearch}
              className="flex w-full items-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 shadow-inner"
            >
              <Search size={18} className="text-blue-600" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full bg-transparent px-3 text-sm font-semibold outline-none placeholder:text-slate-400 text-slate-950"
                placeholder={t("common.searchPlaceholder")}
                aria-label={t("common.searchPlaceholder")}
              />
            </form>
          </div>
        </div>

        {/* CẤU TRÚC NAV MENU NGANG CHO PC */}
        <nav className="border-t border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50">
          <div className="mx-auto hidden max-w-[1440px] items-center gap-2 px-4 py-2 lg:flex lg:px-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(location.pathname, item) || item.children?.some((child) => isActive(location.pathname, child));
              return (
                <div key={item.label} className="group relative">
                  <a href={item.href} className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2.5 text-sm font-black transition ${active ? "bg-blue-700 text-white shadow-lg shadow-blue-100" : "text-slate-700 hover:bg-blue-700 hover:text-white hover:shadow-lg hover:shadow-blue-100"}`}>
                    <Icon size={17} className={active ? "text-white" : "text-blue-600 group-hover:text-white"} />
                    {item.label}
                    {item.children && <ChevronDown size={15} />}
                  </a>
                  {item.children && (
                    <div className="invisible absolute left-0 top-full z-50 mt-3 w-[360px] translate-y-2 rounded-[26px] border border-slate-200 bg-white p-3 opacity-0 shadow-[0_30px_90px_rgba(15,23,42,0.16)] transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                      <div className="mb-2 rounded-2xl bg-gradient-to-br from-blue-50 to-slate-50 p-4">
                        <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">{item.label}</div>
                        <div className="mt-1 text-sm font-semibold text-slate-500">{t("common.quickSelect")}</div>
                      </div>
                      <div className="space-y-1">
                        {item.children.map((child) => (
                          <a key={child.label} href={child.href} className="group/item flex items-start justify-between gap-3 rounded-2xl px-4 py-3 transition hover:bg-blue-50">
                            <div>
                              <div className="text-sm font-black text-slate-900 group-hover/item:text-blue-700">{child.label}</div>
                              <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">{child.desc}</div>
                            </div>
                            {child.badge && <span className="rounded-full bg-blue-700 px-2 py-1 text-[10px] font-black text-white">{child.badge}</span>}
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

        {/* KHỐI PORTAL MENU MOBILE (Đã tích hợp dọn dẹp) */}
        {mobileOpen && createPortal(
          <div className="fixed inset-0 z-[999999] bg-slate-950/60 backdrop-blur-sm lg:hidden">
            <div className="ml-auto h-full w-[86%] max-w-[420px] overflow-y-auto bg-white p-5 shadow-2xl flex flex-col">
              <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                <Logo className="h-9 w-auto object-contain" />
                <button type="button" onClick={() => setMobileOpen(false)} className="rounded-2xl border border-slate-200 p-2.5 text-slate-500">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                      <a href={item.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 text-sm font-black text-slate-900">
                        <Icon size={16} className="text-blue-600" />
                        <span>{item.label}</span>
                      </a>
                      {item.children && (
                        <div className="mt-2.5 grid grid-cols-2 gap-1.5 border-t border-slate-100/70 pt-2.5">
                          {item.children.map((child) => (
                            <a key={child.label} href={child.href} onClick={() => setMobileOpen(false)} className="rounded-xl bg-white border border-slate-100 px-3 py-2 text-xs font-bold text-slate-600 shadow-sm active:bg-blue-50 transition">
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
          </div>,
          document.body
        )}
      </header>
    </>
  );
}
