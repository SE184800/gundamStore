import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import HeaderCart from "../layout/HeaderCart";
import { useCms } from "../../store/CmsStore"; // 🟢 1. IMPORT THÊM USECMS
import { useI18n } from "../../i18n"; // 🟢 2. IMPORT THÊM I18N ĐỂ ĐỒNG BỘ CHỮ TRÊN CẢ TRANG
import { User, ChevronDown, Settings, Heart, LogOut, Globe } from "lucide-react";
import { useState, useEffect } from "react";
export default function StorefrontShell({ children }) {
  const { state, actions } = useCms(); // 🟢 3. LẤY DỮ LIỆU USER RA
  const { t, lang, setLang } = useI18n();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const user = state?.user; // Avatar và thông tin tài khoản người dùng
  const [localLang, setLocalLang] = useState(lang);

  useEffect(() => {
    const handleLangChange = (e) => {
      // Khi nhận được tín hiệu "gundam-language-change", cập nhật state để ép render lại toàn bộ trang con
      setLocalLang(e.detail.language);
    };

    window.addEventListener("gundam-language-change", handleLangChange);
    return () => window.removeEventListener("gundam-language-change", handleLangChange);
  }, []);
  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      <header className="sticky top-0 z-[999] border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-6">
          <Link to="/" className="text-xl font-black text-slate-900">
            Gundam Store VN
          </Link>

          <form
            onSubmit={submitSearch}
            className="order-3 flex w-full items-center rounded-2xl border bg-slate-50 px-3 py-2 md:order-none md:max-w-sm"
          >
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={t.searchPlaceholder}
              aria-label={t.searchPlaceholder}
              className="w-full bg-transparent text-sm font-semibold outline-none"
            />
          </form>

          <nav className="hidden items-center gap-6 text-sm font-black text-slate-600 lg:flex">
            <Link to="/">{t.home}</Link>
            <Link to="/shop">{t.products}</Link>
            <Link to="/orders">{t.orders}</Link>
            <Link to="/order-lookup">{t.orderLookup}</Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* Biểu tượng Giỏ hàng */}
            <HeaderCart />
            <div className="group relative flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-100 hover:border-slate-300 cursor-pointer">
              <Globe size={16} className="text-slate-500" />
              <ChevronDown size={14} className="text-slate-400 transition-transform duration-300 group-hover:rotate-180" />

              {/* VÙNG ĐỆM AN TOÀN VÀ DROPDOWN BÊN DƯỚI */}
              <div className="absolute right-0 top-full z-[99] pt-2 hidden w-32 group-hover:block">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl animate-in fade-in slide-in-from-top-1 duration-200">

                  {/* NÚT TIẾNG VIỆT */}
                  <button
                    type="button"
                    onClick={() => {
                      setLang("vi"); // 1. Đổi ngôn ngữ ở bộ dịch
                    }}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-all ${lang === "vi"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                  >
                    <span>🇻🇳</span> Tiếng Việt
                  </button>

                  {/* NÚT ENGLISH */}
                  <button
                    type="button"
                    onClick={() => {
                      setLang("en");
                    }}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-all mt-0.5 ${lang === "en"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                  >
                    <span>🇺🇸</span> English
                  </button>
                </div>
              </div>
            </div>
            {/* 🟢 CỤM USER ACCOUNT ĐỒNG BỘ 100% GIAO DIỆN TRANG CHỦ */}
            {state.user && (
              <div className="relative">

                {/* NÚT CLICK CHỨA BIỂU TƯỢNG VÀ TÊN USER THẬT (Đã ép chiều cao h-11 chống lệch trục giỏ hàng) */}
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex h-11 items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/60 px-3.5 py-2 text-sm font-black text-blue-700 shadow-sm hover:bg-blue-50 transition active:scale-[0.98]"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                    <User size={14} />
                  </div>

                  {/* Tên người dùng sạch từ hệ thống */}
                  <span className="max-w-[120px] truncate text-left">{state.user.name}</span>

                  <ChevronDown
                    size={14}
                    className={`text-blue-500 transition-transform duration-300 ${userMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* DROPLIST TRỔ XUỐNG KHI CLICK */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full z-[99] mt-2 w-52 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-[0_20px_50px_rgba(15,23,42,0.12)] animate-in fade-in slide-in-from-top-2 duration-200">

                    {/* OPTION 1: USER PROFILE */}
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600 group"
                    >
                      <Settings size={15} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                      {t("header.userProfile") || "Hồ sơ cá nhân"}
                    </Link>

                    {/* OPTION 2: FAVORITE LIST */}
                    <Link
                      to="/favorites"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600 group"
                    >
                      <Heart size={15} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                      {t("header.favoriteList") || "Danh sách yêu thích"}
                    </Link>

                    {/* VẠCH PHÂN CÁCH NÉT ĐỨT TINH TẾ */}
                    <div className="my-1 border-t border-dashed border-slate-100"></div>

                    {/* OPTION 3: LOGOUT */}
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        actions?.logout?.();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-black text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut size={15} className="text-red-500" />
                      {t("header.logout") || "Đăng xuất"}
                    </button>

                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {children}

      <footer className="mt-10 border-t bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 md:grid-cols-3">
          <div>
            <h3 className="font-black">Gundam Store VN</h3>
            <p className="mt-2 text-sm text-slate-500">{t.storeDesc}</p>
          </div>

          <div>
            <h3 className="font-black">{t.support}</h3>
            <p className="mt-2 text-sm text-slate-500">{t.supportDesc}</p>
          </div>

          <div>
            <h3 className="font-black">{t.payment}</h3>
            <p className="mt-2 text-sm text-slate-500">COD • Banking • Momo</p>
          </div>
        </div>
      </footer>
    </div>
  );
}