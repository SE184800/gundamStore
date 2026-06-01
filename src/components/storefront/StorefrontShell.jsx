import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import HeaderCart from "../layout/HeaderCart";
import { useLang } from "../../store/CmsStore";

function getCopy(lang) {
  return {
    home: lang === "en" ? "Home" : "Trang chủ",
    products: lang === "en" ? "Products" : "Sản phẩm",
    orders: lang === "en" ? "Orders" : "Đơn hàng",
    orderLookup: lang === "en" ? "Order lookup" : "Tra cứu đơn",
    account: lang === "en" ? "Account" : "Tài khoản",
    searchPlaceholder:
      lang === "en" ? "Search Gundam, SKU, grade..." : "Tìm Gundam, SKU, grade...",
    storeDesc:
      lang === "en"
        ? "Gundam / Gunpla ecommerce demo store."
        : "Cửa hàng Gundam / Gunpla demo ecommerce.",
    support: lang === "en" ? "Support" : "Hỗ trợ",
    supportDesc:
      lang === "en"
        ? "Shipping • Returns • Warranty • Customer care"
        : "Giao hàng • Đổi trả • Bảo hành • CSKH",
    payment: lang === "en" ? "Payment" : "Thanh toán",
  };
}

export default function StorefrontShell({ children }) {
  const [lang] = useLang();
  const t = getCopy(lang);
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");

  function submitSearch(event) {
    event.preventDefault();
    const q = keyword.trim().slice(0, 80);
    navigate(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  }

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
            <HeaderCart />
            <Link
              to="/account"
              className="rounded-2xl border px-4 py-3 text-sm font-black"
            >
              {t.account}
            </Link>
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
