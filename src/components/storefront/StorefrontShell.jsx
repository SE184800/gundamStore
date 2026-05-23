import { Link } from "react-router-dom";
import HeaderCart from "../layout/HeaderCart";

export default function StorefrontShell({ children }) {
  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      <header className="sticky top-0 z-[999] border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-xl font-black text-slate-900">
            Gundam Store VN
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-black text-slate-600 md:flex">
            <Link to="/">Trang chủ</Link>
            <Link to="/shop">Sản phẩm</Link>
            <Link to="/orders">Đơn hàng</Link>
            <Link to="/order-lookup">Tra cứu đơn</Link>
            <Link to="/admin">Admin</Link>
          </nav>

          <div className="flex items-center gap-3">
            <HeaderCart />
            <Link
              to="/#account"
              className="rounded-2xl border px-4 py-3 text-sm font-black"
            >
              Tài khoản
            </Link>
          </div>
        </div>
      </header>

      {children}

      <footer className="mt-10 border-t bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 md:grid-cols-3">
          <div>
            <h3 className="font-black">Gundam Store VN</h3>
            <p className="mt-2 text-sm text-slate-500">
              Cửa hàng Gundam / Gunpla demo ecommerce.
            </p>
          </div>

          <div>
            <h3 className="font-black">Hỗ trợ</h3>
            <p className="mt-2 text-sm text-slate-500">
              Giao hàng • Đổi trả • Bảo hành • CSKH
            </p>
          </div>

          <div>
            <h3 className="font-black">Thanh toán</h3>
            <p className="mt-2 text-sm text-slate-500">
              COD • Banking • Momo
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
