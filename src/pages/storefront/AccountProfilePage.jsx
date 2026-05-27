import {
  Bell,
  CreditCard,
  Heart,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Save,
  ShoppingBag,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";
import PageShell from "../../components/common/PageShell";
import { useCms } from "../../store/CmsStore";

const menuItems = [
  { label: "Thông tin cá nhân", href: "/profile", icon: User, active: true },
  { label: "Đơn hàng của tôi", href: "/orders", icon: ShoppingBag },
  { label: "Sản phẩm yêu thích", href: "/favorites", icon: Heart },
  { label: "Địa chỉ của tôi", href: "/profile#address", icon: MapPin },
  { label: "Phương thức thanh toán", href: "/profile#payment", icon: CreditCard },
  { label: "Đổi mật khẩu", href: "/profile#password", icon: Lock },
  { label: "Thông báo", href: "/profile#notification", icon: Bell },
];

function Input({ label, defaultValue, type = "text" }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-700">{label}</span>
      <input
        type={type}
        defaultValue={defaultValue}
        className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

export default function AccountProfilePage() {
  const { state, actions } = useCms();
  const user = state.user || {
    name: "Admin Demo",
    email: "admin@demo.com",
  };

  function logout() {
    actions.logout();
    window.location.href = "/";
  }

  return (
    <PageShell>
      <main className="min-h-screen bg-gradient-to-b from-white via-blue-50/40 to-slate-100">
        <div className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8">
          <div className="text-sm font-bold text-slate-500">
            <Link to="/" className="hover:text-blue-700">Trang chủ</Link>
            <span className="mx-2">›</span>
            <span>Tài khoản</span>
            <span className="mx-2">›</span>
            <span className="text-slate-900">Thông tin cá nhân</span>
          </div>

          <div className="mt-5">
            <h1 className="text-3xl font-black text-slate-950 md:text-4xl">
              Thông tin cá nhân
            </h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Quản lý thông tin tài khoản và bảo mật để bảo vệ tài khoản của bạn.
            </p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
            <aside className="space-y-4">
              <section className="rounded-[28px] border border-slate-200 bg-white p-5 text-center shadow-sm">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-700 text-2xl font-black text-white shadow-lg shadow-blue-100">
                  AD
                </div>

                <h2 className="mt-3 text-lg font-black text-slate-950">
                  {user.name || "Admin Demo"}
                </h2>

                <div className="mt-3 space-y-2 text-left text-sm font-semibold text-slate-500">
                  <div className="flex items-center gap-2">
                    <Mail size={15} />
                    {user.email || "admin@demo.com"}
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone size={15} />
                    0901 234 567
                  </div>
                </div>
              </section>

              <nav className="rounded-[28px] border border-slate-200 bg-white p-2 shadow-sm">
                {menuItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.label}
                      to={item.href}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black ${
                        item.active
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-blue-700"
                      }`}
                    >
                      <Icon size={18} />
                      {item.label}
                    </Link>
                  );
                })}

                <div className="my-2 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black text-red-600 hover:bg-red-50"
                >
                  <LogOut size={18} />
                  Đăng xuất
                </button>
              </nav>
            </aside>

            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <User size={20} />
                </span>
                <h2 className="text-xl font-black text-slate-950">
                  Thông tin cá nhân
                </h2>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Input label="Họ và tên" defaultValue={user.name || "Admin Demo"} />
                <Input label="Email" defaultValue={user.email || "admin@demo.com"} />
                <Input label="Số điện thoại" defaultValue="0901 234 567" />
                <Input label="Ngày sinh" type="date" defaultValue="1990-05-15" />
                <Input label="Giới tính" defaultValue="Nam" />
                <Input label="Địa chỉ" defaultValue="123 Đường Lê Lợi, Quận 1" />
                <Input label="Tỉnh / Thành phố" defaultValue="Hồ Chí Minh" />
                <Input label="Quận / Huyện" defaultValue="Quận 1" />
              </div>

              <label className="mt-4 block">
                <span className="text-sm font-black text-slate-700">
                  Ghi chú tùy chọn
                </span>
                <textarea
                  placeholder="Nhập ghi chú nếu có..."
                  className="mt-2 min-h-[110px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
                Thông tin của bạn được bảo mật và chỉ sử dụng để phục vụ quá trình mua sắm.
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 text-sm font-black text-white shadow-lg shadow-blue-100 hover:bg-blue-800"
                >
                  <Save size={16} />
                  Lưu thay đổi
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
