import {
  AlertCircle,
  Bell,
  CalendarDays,
  CreditCard,
  Heart,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Save,
  ShoppingBag,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../../components/common/PageShell";
import AddressBookSection from "../../components/storefront/AddressBookSection";
import { useCms } from "../../store/CmsStore";
import {
  getMyAccount,
  getMyWishlist,
  hasAccountToken,
  updateMyAccount,
} from "../../services/AccountApiService";

const menuItems = [
  { label: "Thông tin cá nhân", href: "/profile", icon: User, active: true },
  { label: "Đơn hàng của tôi", href: "/orders", icon: ShoppingBag },
  { label: "Sản phẩm yêu thích", href: "/favorites", icon: Heart },
  { label: "Địa chỉ của tôi", href: "/profile#address", icon: MapPin },
  { label: "Phương thức thanh toán", href: "/profile#payment", icon: CreditCard },
  { label: "Đổi mật khẩu", href: "/profile#password", icon: Lock },
  { label: "Thông báo", href: "/profile#notification", icon: Bell },
];

function toDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function normalizeAccount(account, fallbackUser) {
  const profile = account?.profile || {};

  return {
    name: account?.name || fallbackUser?.name || "Admin Demo",
    email: account?.email || fallbackUser?.email || "admin@demo.com",
    phone: profile.phone || "",
    birthday: toDateInput(profile.birthday),
    gender: profile.gender || "Nam",
    address: profile.address || "",
    city: profile.city || "",
    district: profile.district || "",
    ward: profile.ward || "",
    postalCode: profile.postalCode || "",
    note: profile.note || "",
  };
}

function Input({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-700">{label}</span>
      <input
        type={type}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function Select({ label, value, onChange, children }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-700">{label}</span>
      <select
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      >
        {children}
      </select>
    </label>
  );
}

function AccountSidebar({ profile, wishlistCount, onLogout }) {
  return (
    <aside className="space-y-4">
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 text-center shadow-sm">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-700 text-2xl font-black text-white shadow-lg shadow-blue-100">
          {String(profile?.name || "AD").slice(0, 2).toUpperCase()}
        </div>

        <h2 className="mt-3 text-lg font-black text-slate-950">
          {profile?.name || "Admin Demo"}
        </h2>

        <div className="mt-3 space-y-2 text-left text-sm font-semibold text-slate-500">
          <div className="flex items-center gap-2">
            <Mail size={15} />
            {profile?.email || "admin@demo.com"}
          </div>

          <div className="flex items-center gap-2">
            <Phone size={15} />
            {profile?.phone || "Chưa cập nhật số điện thoại"}
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">
          {wishlistCount} sản phẩm yêu thích
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
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black text-red-600 hover:bg-red-50"
        >
          <LogOut size={18} />
          Đăng xuất
        </button>
      </nav>
    </aside>
  );
}

export default function AccountProfilePage() {
  const { state, actions } = useCms();
  const fallbackUser = state.user || { name: "Admin Demo", email: "admin@demo.com" };
  const orders = state.orders || [];

  const [profile, setProfile] = useState(() => normalizeAccount(null, fallbackUser));
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const hasToken = useMemo(() => hasAccountToken(), []);

  useEffect(() => {
    let alive = true;

    async function loadAccount() {
      if (!hasToken) {
        setLoading(false);
        setError("Bạn cần đăng nhập để xem và cập nhật thông tin cá nhân.");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [account, wishlistItems] = await Promise.all([
          getMyAccount(),
          getMyWishlist().catch(() => []),
        ]);

        if (!alive) return;

        setProfile(normalizeAccount(account, fallbackUser));
        setWishlistCount(Array.isArray(wishlistItems) ? wishlistItems.length : 0);
      } catch (err) {
        if (!alive) return;
        setError(err?.message || "Không thể tải thông tin tài khoản.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadAccount();

    return () => {
      alive = false;
    };
  }, [fallbackUser, hasToken]);

  function patch(key, value) {
    setProfile((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function saveProfile() {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      const account = await updateMyAccount(profile);

      setProfile(normalizeAccount(account, fallbackUser));
      setMessage("Đã lưu thông tin cá nhân thành công.");
      actions.track?.("profile_saved", { source: "account_profile_api" });
    } catch (err) {
      setError(err?.message || "Không thể lưu thông tin cá nhân.");
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    actions.logout?.();
    localStorage.removeItem("gundam-admin-token");
    localStorage.removeItem("gundam-admin-auth");
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
              Quản lý thông tin tài khoản và lưu trực tiếp vào hệ thống.
            </p>
          </div>

          {loading ? (
            <div className="mt-8 flex min-h-[320px] items-center justify-center rounded-[28px] bg-white shadow-sm">
              <Loader2 className="animate-spin text-blue-700" size={36} />
            </div>
          ) : (
            <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
              <AccountSidebar profile={profile} wishlistCount={wishlistCount} onLogout={logout} />

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <User size={20} />
                  </span>
                  <h2 className="text-xl font-black text-slate-950">
                    Thông tin cá nhân
                  </h2>
                </div>

                {error && (
                  <div className="mt-5 flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm font-black text-red-600">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </div>
                )}

                {message && (
                  <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-black text-emerald-700">
                    {message}
                  </div>
                )}

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Input label="Họ và tên" value={profile.name} onChange={(value) => patch("name", value)} />
                  <Input label="Email" value={profile.email} onChange={() => {}} />
                  <Input label="Số điện thoại" value={profile.phone} onChange={(value) => patch("phone", value)} />
                  <Input label="Ngày sinh" type="date" value={profile.birthday} onChange={(value) => patch("birthday", value)} />

                  <Select label="Giới tính" value={profile.gender} onChange={(value) => patch("gender", value)}>
                    <option value="">Chưa chọn</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </Select>

                  <Input label="Địa chỉ" value={profile.address} onChange={(value) => patch("address", value)} />
                  <Input label="Tỉnh / Thành phố" value={profile.city} onChange={(value) => patch("city", value)} />
                  <Input label="Quận / Huyện" value={profile.district} onChange={(value) => patch("district", value)} />
                  <Input label="Phường / Xã" value={profile.ward} onChange={(value) => patch("ward", value)} />
                  <Input label="Mã bưu điện" value={profile.postalCode} onChange={(value) => patch("postalCode", value)} />
                </div>

                <label className="mt-4 block">
                  <span className="text-sm font-black text-slate-700">
                    Ghi chú tùy chọn
                  </span>
                  <textarea
                    value={profile.note || ""}
                    onChange={(event) => patch("note", event.target.value)}
                    placeholder="Nhập ghi chú nếu có..."
                    className="mt-2 min-h-[110px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </label>

                <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
                  Thông tin được lưu qua API /api/account/me và đồng bộ với backend.
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    disabled={saving || !hasToken}
                    onClick={saveProfile}
                    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black text-white shadow-lg ${
                      saving || !hasToken
                        ? "cursor-not-allowed bg-slate-400"
                        : "bg-blue-700 shadow-blue-100 hover:bg-blue-800"
                    }`}
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>

                <AddressBookSection />

                <div className="mt-6 grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-bold text-slate-600 md:grid-cols-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Đơn hàng</div>
                    <div className="mt-1 text-2xl font-black text-slate-950">{orders.length || 0}</div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Yêu thích</div>
                    <div className="mt-1 text-2xl font-black text-blue-700">{wishlistCount}</div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Trạng thái</div>
                    <div className="mt-1 text-base font-black text-emerald-700">
                      {hasToken ? "Đã đăng nhập" : "Chưa đăng nhập"}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </PageShell>
  );
}
