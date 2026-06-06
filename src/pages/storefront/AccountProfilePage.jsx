import {
  AlertCircle,
  Bell,
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
import { useCms, useLang } from "../../store/CmsStore";
import {
  getMyAccount,
  getMyWishlist,
  hasAccountToken,
  updateMyAccount,
} from "../../services/AccountApiService";

function getCopy(lang) {
  return {
    home: lang === "en" ? "Home" : "Trang chủ",
    account: lang === "en" ? "Account" : "Tài khoản",
    personal: lang === "en" ? "Personal information" : "Thông tin cá nhân",
    desc:
      lang === "en"
        ? "Manage your account information and sync it directly to the backend."
        : "Quản lý thông tin tài khoản và lưu trực tiếp vào hệ thống.",
    loginRequired:
      lang === "en"
        ? "Please sign in to view and update your profile."
        : "Bạn cần đăng nhập để xem và cập nhật thông tin cá nhân.",
    loadError:
      lang === "en"
        ? "Unable to load account information."
        : "Không thể tải thông tin tài khoản.",
    saveSuccess:
      lang === "en"
        ? "Profile saved successfully."
        : "Đã lưu thông tin cá nhân thành công.",
    saveError:
      lang === "en"
        ? "Unable to save profile."
        : "Không thể lưu thông tin cá nhân.",
    guestUser: lang === "en" ? "Customer" : "Khách hàng",
    phoneNotUpdated:
      lang === "en" ? "Phone not updated" : "Chưa cập nhật số điện thoại",
    wishlistCount: lang === "en" ? "wishlist items" : "sản phẩm yêu thích",
    logout: lang === "en" ? "Sign out" : "Đăng xuất",

    fullName: lang === "en" ? "Full name" : "Họ và tên",
    phone: lang === "en" ? "Phone" : "Số điện thoại",
    birthday: lang === "en" ? "Birthday" : "Ngày sinh",
    gender: lang === "en" ? "Gender" : "Giới tính",
    notSelected: lang === "en" ? "Not selected" : "Chưa chọn",
    male: lang === "en" ? "Male" : "Nam",
    female: lang === "en" ? "Female" : "Nữ",
    other: lang === "en" ? "Other" : "Khác",
    address: lang === "en" ? "Address" : "Địa chỉ",
    city: lang === "en" ? "Province / City" : "Tỉnh / Thành phố",
    district: lang === "en" ? "District" : "Quận / Huyện",
    ward: lang === "en" ? "Ward" : "Phường / Xã",
    postalCode: lang === "en" ? "Postal code" : "Mã bưu điện",
    note: lang === "en" ? "Optional note" : "Ghi chú tùy chọn",
    notePlaceholder:
      lang === "en" ? "Enter optional note..." : "Nhập ghi chú nếu có...",
    apiInfo:
      lang === "en"
        ? "Information is saved through /api/account/me and synced with the backend."
        : "Thông tin được lưu qua API /api/account/me và đồng bộ với backend.",
    saving: lang === "en" ? "Saving..." : "Đang lưu...",
    save: lang === "en" ? "Save changes" : "Lưu thay đổi",
    orders: lang === "en" ? "Orders" : "Đơn hàng",
    wishlist: lang === "en" ? "Wishlist" : "Yêu thích",
    status: lang === "en" ? "Status" : "Trạng thái",
    signedIn: lang === "en" ? "Signed in" : "Đã đăng nhập",
    signedOut: lang === "en" ? "Not signed in" : "Chưa đăng nhập",
  };
}

function getMenuItems(lang) {
  return [
    {
      label: lang === "en" ? "Personal information" : "Thông tin cá nhân",
      href: "/account/profile",
      icon: User,
      active: true,
    },
    {
      label: lang === "en" ? "My orders" : "Đơn hàng của tôi",
      href: "/orders",
      icon: ShoppingBag,
    },
    {
      label: lang === "en" ? "Wishlist" : "Sản phẩm yêu thích",
      href: "/favorites",
      icon: Heart,
    },
    {
      label: lang === "en" ? "My addresses" : "Địa chỉ của tôi",
      href: "/account/profile#address",
      icon: MapPin,
    },
    {
      label: lang === "en" ? "Payment methods" : "Phương thức thanh toán",
      href: "/account/profile#payment",
      icon: CreditCard,
    },
    {
      label: lang === "en" ? "Change password" : "Đổi mật khẩu",
      href: "/account/profile#password",
      icon: Lock,
    },
    {
      label: lang === "en" ? "Notifications" : "Thông báo",
      href: "/account/profile#notification",
      icon: Bell,
    },
  ];
}

function toDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function normalizeAccount(account, fallbackUser) {
  const profile = account?.profile || {};

  return {
    name: account?.name || fallbackUser?.name || "",
    email: account?.email || fallbackUser?.email || "",
    phone: profile.phone || "",
    birthday: toDateInput(profile.birthday),
    gender: profile.gender || "",
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

function AccountSidebar({ profile, wishlistCount, onLogout, menuItems, t }) {
  return (
    <aside className="space-y-4">
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 text-center shadow-sm">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-700 text-2xl font-black text-white shadow-lg shadow-blue-100">
          {String(profile?.name || "US").slice(0, 2).toUpperCase()}
        </div>

        <h2 className="mt-3 text-lg font-black text-slate-950">
          {profile?.name || t.guestUser}
        </h2>

        <div className="mt-3 space-y-2 text-left text-sm font-semibold text-slate-500">
          <div className="flex items-center gap-2">
            <Mail size={15} />
            {profile?.email || "-"}
          </div>

          <div className="flex items-center gap-2">
            <Phone size={15} />
            {profile?.phone || t.phoneNotUpdated}
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">
          {wishlistCount} {t.wishlistCount}
        </div>
      </section>

      <nav className="rounded-[28px] border border-slate-200 bg-white p-2 shadow-sm">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
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
          {t.logout}
        </button>
      </nav>
    </aside>
  );
}

export default function AccountProfilePage() {
  const { state, actions } = useCms();
  const [lang] = useLang();
  const t = getCopy(lang);
  const fallbackUser = state.user || null;
  const orders = state.orders || [];
  const menuItems = useMemo(() => getMenuItems(lang), [lang]);

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
        setError(t.loginRequired);
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
        setError(err?.message || t.loadError);
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadAccount();

    return () => {
      alive = false;
    };
  }, [fallbackUser, hasToken, t.loadError, t.loginRequired]);

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
      setMessage(t.saveSuccess);
      actions.track?.("profile_saved", { source: "account_profile_api" });
    } catch (err) {
      setError(err?.message || t.saveError);
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    actions.logout?.();
    localStorage.removeItem("gundam_token");
    window.location.href = "/";
  }

  return (
    <PageShell>
      <main className="min-h-screen bg-gradient-to-b from-white via-blue-50/40 to-slate-100">
        <div className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8">
          <div className="text-sm font-bold text-slate-500">
            <Link to="/" className="hover:text-blue-700">
              {t.home}
            </Link>
            <span className="mx-2">›</span>
            <span>{t.account}</span>
            <span className="mx-2">›</span>
            <span className="text-slate-900">{t.personal}</span>
          </div>

          <div className="mt-5">
            <h1 className="text-3xl font-black text-slate-950 md:text-4xl">
              {t.personal}
            </h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">{t.desc}</p>
          </div>

          {loading ? (
            <div className="mt-8 flex min-h-[320px] items-center justify-center rounded-[28px] bg-white shadow-sm">
              <Loader2 className="animate-spin text-blue-700" size={36} />
            </div>
          ) : (
            <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
              <AccountSidebar
                profile={profile}
                wishlistCount={wishlistCount}
                onLogout={logout}
                menuItems={menuItems}
                t={t}
              />

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <User size={20} />
                  </span>
                  <h2 className="text-xl font-black text-slate-950">
                    {t.personal}
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
                  <Input label={t.fullName} value={profile.name} onChange={(value) => patch("name", value)} />
                  <Input label="Email" value={profile.email} onChange={() => {}} />
                  <Input label={t.phone} value={profile.phone} onChange={(value) => patch("phone", value)} />
                  <Input label={t.birthday} type="date" value={profile.birthday} onChange={(value) => patch("birthday", value)} />

                  <Select label={t.gender} value={profile.gender} onChange={(value) => patch("gender", value)}>
                    <option value="">{t.notSelected}</option>
                    <option value="Nam">{t.male}</option>
                    <option value="Nữ">{t.female}</option>
                    <option value="Khác">{t.other}</option>
                  </Select>

                  <Input label={t.address} value={profile.address} onChange={(value) => patch("address", value)} />
                  <Input label={t.city} value={profile.city} onChange={(value) => patch("city", value)} />
                  <Input label={t.district} value={profile.district} onChange={(value) => patch("district", value)} />
                  <Input label={t.ward} value={profile.ward} onChange={(value) => patch("ward", value)} />
                  <Input label={t.postalCode} value={profile.postalCode} onChange={(value) => patch("postalCode", value)} />
                </div>

                <label className="mt-4 block">
                  <span className="text-sm font-black text-slate-700">
                    {t.note}
                  </span>
                  <textarea
                    value={profile.note || ""}
                    onChange={(event) => patch("note", event.target.value)}
                    placeholder={t.notePlaceholder}
                    className="mt-2 min-h-[110px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </label>

                <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
                  {t.apiInfo}
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
                    {saving ? t.saving : t.save}
                  </button>
                </div>

                <AddressBookSection />

                <div className="mt-6 grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-bold text-slate-600 md:grid-cols-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{t.orders}</div>
                    <div className="mt-1 text-2xl font-black text-slate-950">{orders.length || 0}</div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{t.wishlist}</div>
                    <div className="mt-1 text-2xl font-black text-blue-700">{wishlistCount}</div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{t.status}</div>
                    <div className="mt-1 text-base font-black text-emerald-700">
                      {hasToken ? t.signedIn : t.signedOut}
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
