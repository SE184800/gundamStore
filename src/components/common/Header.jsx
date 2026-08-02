import {
  ChevronDown,
  Globe,
  Menu,
  Search,
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
import useToast from "../../hooks/useToast";
import { createPortal } from "react-dom";
import { getPublicNavigationApi } from "../../services/ContentApiService";

const FALLBACK_NAV_ITEMS = [{ code: "home", label: "Trang chủ", link: "/" }];

function isNavItemActive(pathname, item) {
  if (item.link === "/") return pathname === "/";
  return pathname === item.link || pathname.startsWith(item.link + "/");
}

export default function Header() {
  const { lang, setLang, t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [displayLang, setDisplayLang] = useState(() => lang || "vi");
  const location = useLocation();
  const navigate = useNavigate();
  const { toast, notify, dismiss } = useToast(3000);
  const { state, actions } = useCms();
  const menuRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [navItems, setNavItems] = useState(FALLBACK_NAV_ITEMS);
  useEffect(() => {
    let alive = true;
    getPublicNavigationApi()
      .then((rows) => {
        if (!alive) return;
        const items = (Array.isArray(rows) ? rows : [])
          .filter((item) => item?.active === true)
          .sort((a, b) => (Number(a?.sortOrder) || 0) - (Number(b?.sortOrder) || 0));
        setNavItems(items.length > 0 ? items : FALLBACK_NAV_ITEMS);
      })
      .catch((error) => {
        console.error("PUBLIC_NAVIGATION_LOAD_ERROR", error);
        if (alive) setNavItems(FALLBACK_NAV_ITEMS);
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  useEffect(() => {
    setDisplayLang(lang);
  }, [lang]);
  function handleLogout() {
    setUserMenuOpen(false);
    notify("success", "Đăng xuất thành công !");
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
      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={dismiss} />
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
                  className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50/60 px-2.5 text-blue-700 shadow-sm transition active:scale-95"
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
                className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm text-slate-950 transition active:scale-95"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>

          {/* THANH SEARCH BAR (BẢN PC) */}
          <form
            onSubmit={submitHeaderSearch}
            className="mx-auto hidden w-full max-w-[620px] items-center rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100 md:flex"
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
            <div className="group relative flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-100 hover:border-slate-300 cursor-pointer">
              <Globe size={16} className="text-slate-500" />
              <ChevronDown size={14} className="text-slate-400 transition-transform duration-300 group-hover:rotate-180" />
              <div className="absolute right-0 top-full z-50 pt-2 hidden w-32 group-hover:block">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
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
                  className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2 text-sm font-black text-blue-700 shadow-sm hover:bg-blue-50 transition active:scale-[0.98]"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                    <User size={14} />
                  </div>
                  <span className="max-w-[120px] truncate">{state.user.name}</span>
                  <ChevronDown size={14} className={`text-blue-500 transition-transform duration-300 ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
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
                <a href="/login" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">{t("header.signIn")}</a>
                <a href="/register" className="rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-black text-white transition hover:bg-blue-800">{t("header.signUp")}</a>
              </div>
            )}
          </div>

          {/* HÀNG 2: THANH SEARCH BAR ĐẨY RA NGOÀI DÀNH RIÊNG CHO MOBILE */}
          <div className="w-full mt-1 pb-1 md:hidden">
            <form
              onSubmit={submitHeaderSearch}
              className="flex w-full items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 shadow-inner"
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

        {/* CẤU TRÚC NAV MENU NGANG CHO PC — nguồn dữ liệu: GET /api/content/navigation, link phẳng, không dropdown */}
        <nav className="border-t border-slate-100 bg-white">
          <div className="mobile-hide-scrollbar mx-auto hidden max-w-[1440px] items-center gap-1.5 overflow-x-auto px-4 py-2 lg:flex lg:px-8 xl:gap-2">
            {navItems.map((item) => {
              const active = isNavItemActive(location.pathname, item);
              return (
                <Link
                  key={item.code || item.link}
                  to={item.link}
                  className={`shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-black transition xl:px-4 ${
                    active ? "bg-blue-700 text-white" : "text-slate-700 hover:bg-blue-700 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* KHỐI PORTAL MENU MOBILE — dùng chung navItems với bản PC, không hardcode riêng */}
        {mobileOpen && createPortal(
          <div className="fixed inset-0 z-[999999] bg-slate-950/60 backdrop-blur-sm lg:hidden">
            <div className="ml-auto h-full w-[86%] max-w-[420px] overflow-y-auto bg-white p-5 shadow-lg flex flex-col">
              <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                <Logo className="h-9 w-auto object-contain" />
                <button type="button" onClick={() => setMobileOpen(false)} className="rounded-xl border border-slate-200 p-2.5 text-slate-500">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-2.5 overflow-y-auto flex-1 pr-1 pb-[calc(20px+env(safe-area-inset-bottom))]">
                {navItems.map((item) => {
                  const active = isNavItemActive(location.pathname, item);
                  return (
                    <Link
                      key={item.code || item.link}
                      to={item.link}
                      onClick={() => setMobileOpen(false)}
                      className={`block rounded-xl border p-3 text-sm font-black transition ${
                        active
                          ? "border-blue-700 bg-blue-700 text-white"
                          : "border-slate-100 bg-slate-50/50 text-slate-900"
                      }`}
                    >
                      {item.label}
                    </Link>
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
