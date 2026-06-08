import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import HeaderCart from "../layout/HeaderCart";
import { useCms } from "../../store/CmsStore";
import { useI18n } from "../../i18n";
import { User, ChevronDown, Settings, Heart, LogOut, Globe } from "lucide-react";
export default function StorefrontShell({ children }) {
  const { state, actions } = useCms();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate(); // 🟢 ĐÃ THÊM: Khởi tạo hook useNavigate để phục vụ chuyển trang tìm kiếm

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // 🟢 ĐÃ THÊM: State quản lý từ khóa tìm kiếm để ô input hoạt động không bị crash
  const [keyword, setKeyword] = useState("");

  // 🟢 ĐÃ THÊM: Hàm xử lý submit form tìm kiếm Gundam sang trang cửa hàng
  const submitSearch = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/shop?search=${encodeURIComponent(keyword.trim())}`);
    } else {
      navigate("/shop");
    }
  };

  // Đồng bộ hóa ngôn ngữ hệ thống khi có sự kiện thay đổi toàn cục
  useEffect(() => {
    const handleLangChange = (e) => {
      if (e.detail?.language) {
        setLang(e.detail.language);
      }
    };

    window.addEventListener("gundam-language-change", handleLangChange);
    return () => window.removeEventListener("gundam-language-change", handleLangChange);
  }, [setLang]);

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      <header className="sticky top-0 z-[999] border-b bg-white/95 backdrop-blur">
        {/* 🟢 ĐÃ SỬA: Thêm h-20 (hoặc h-16) cố định, items-center để ép toàn bộ Header nằm chết trên 1 dòng dọc phẳng */}
        <div className="mx-auto flex h-20 max-w-full items-center justify-between gap-4 px-4 md:px-6">

          {/* LOGO TRÁI */}
          <Link to="/" className="shrink-0 text-xl font-black text-slate-900">
            Gundam Store VN
          </Link>

          {/* Ô TÌM KIẾM TRUNG TÂM */}
          <form
            onSubmit={submitSearch}
            className="hidden flex-1 items-center rounded-2xl border bg-slate-50 px-4 py-2 md:flex md:max-w-xs lg:max-w-sm"
          >
            <input
              type="text"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={t.searchPlaceholder || "Tìm sản phẩm..."}
              className="w-full bg-transparent text-sm font-semibold outline-none"
            />
          </form>

          {/* THANH MENU ĐIỀU HƯỚNG */}
          <nav className="hidden items-center gap-6 text-sm font-black text-slate-600 lg:flex">
            <Link to="/" className="hover:text-blue-700 transition">{t.home || "Trang chủ"}</Link>
            <Link to="/shop" className="hover:text-blue-700 transition">{t.products || "Sản phẩm"}</Link>
            <Link to="/orders" className="hover:text-blue-700 transition">{t.orders || "Đơn hàng"}</Link>
            <Link to="/order-lookup" className="hover:text-blue-700 transition">{t.orderLookup || "Tra cứu đơn hàng"}</Link>
          </nav>

          {/* 🟢 CỤM ĐIỀU KHIỂN PHẢI: Bọc tất cả vào một khối flex items-center để chúng không bao giờ bị rách hàng */}
          <div className="flex shrink-0 items-center gap-3">

            {/* Dropdown Ngôn ngữ */}
            <div className="group relative flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-100 hover:border-slate-300 cursor-pointer">
              <Globe size={16} className="text-slate-500" />
              <ChevronDown size={14} className="text-slate-400 transition-transform duration-300 group-hover:rotate-180" />

              <div className="absolute right-0 top-full z-[99] pt-2 hidden w-32 group-hover:block">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl animate-in fade-in slide-in-from-top-1 duration-200">
                  <button
                    type="button"
                    onClick={() => setLang("vi")}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-all ${lang === "vi" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                  >
                    <span>🇻🇳</span> Tiếng Việt
                  </button>

                  <button
                    type="button"
                    onClick={() => setLang("en")}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-all mt-0.5 ${lang === "en" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                  >
                    <span>🇺🇸</span> English
                  </button>
                </div>
              </div>
            </div>
            <HeaderCart />
            {/* CỤM USER ACCOUNT ĐỒNG BỘ */}
            {state?.user && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex h-11 items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/60 px-3.5 py-2 text-sm font-black text-blue-700 shadow-sm hover:bg-blue-50 transition active:scale-[0.98]"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                    <User size={14} />
                  </div>
                  <span className="max-w-[120px] truncate text-left">{state.user.name}</span>
                  <ChevronDown
                    size={14}
                    className={`text-blue-500 transition-transform duration-300 ${userMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full z-[99] mt-2 w-52 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-[0_20px_50px_rgba(15,23,42,0.12)] animate-in fade-in slide-in-from-top-2 duration-200">
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600 group"
                    >
                      <Settings size={15} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                      {t("header.userProfile") || "Hồ sơ cá nhân"}
                    </Link>

                    <Link
                      to="/favorites"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600 group"
                    >
                      <Heart size={15} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                      {t("header.favoriteList") || "Danh sách yêu thích"}
                    </Link>

                    <div className="my-1 border-t border-dashed border-slate-100"></div>

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
            <p className="mt-2 text-sm text-slate-500">{t.storeDesc || "Cửa hàng mô hình Gundam chính hãng"}</p>
          </div>

          <div>
            <h3 className="font-black">{t.support || "Hỗ trợ"}</h3>
            <p className="mt-2 text-sm text-slate-500">{t.supportDesc || "Tư vấn và giải đáp thắc mắc 24/7"}</p>
          </div>

          <div>
            <h3 className="font-black">{t.payment || "Thanh toán"}</h3>
            <p className="mt-2 text-sm text-slate-500">COD • Banking • Momo</p>
            <div className="mt-3 grid gap-2 text-sm font-bold text-blue-700">
              <Link to="/payment-guide">{t.paymentGuide}</Link>
              <Link to="/order-lookup">{t.orderLookup}</Link>
              <Link to="/account">{t.account}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}