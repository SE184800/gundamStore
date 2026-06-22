import {
  AlertCircle,
  Bell,
  CreditCard,
  Eye,
  Heart,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  Package,
  Search,
  ShoppingCart,
  Trash2,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../../components/common/PageShell";
import { useCms, useLang } from "../../store/CmsStore";
import {
  clearMyWishlistApi,
  getMyAccount,
  getMyWishlist,
  hasAccountToken,
  removeMyWishlistItem,
} from "../../services/AccountApiService";

function getCopy(lang) {
  return {
    title: lang === "en" ? "My wishlist" : "Danh sách yêu thích",
    subtitle:
      lang === "en"
        ? "Manage the products you saved for later."
        : "Quản lý các sản phẩm bạn đã lưu để xem lại sau.",
    accountTitle: lang === "en" ? "My account" : "Tài khoản của tôi",
    customer: lang === "en" ? "Customer" : "Khách hàng",
    noEmail: lang === "en" ? "Email not updated" : "Chưa cập nhật email",
    savedCount: lang === "en" ? "saved products" : "sản phẩm yêu thích",
    loginTitle: lang === "en" ? "Please sign in" : "Vui lòng đăng nhập",
    loginDesc:
      lang === "en"
        ? "Sign in to view and sync your wishlist."
        : "Đăng nhập để xem và đồng bộ danh sách yêu thích.",
    login: lang === "en" ? "Sign in" : "Đăng nhập",
    search: lang === "en" ? "Search wishlist..." : "Tìm sản phẩm yêu thích...",
    empty: lang === "en" ? "No wishlist items yet." : "Chưa có sản phẩm yêu thích.",
    loadError:
      lang === "en"
        ? "Unable to load wishlist."
        : "Không thể tải danh sách yêu thích.",
    removeSuccess:
      lang === "en"
        ? "Removed from wishlist."
        : "Đã xóa sản phẩm khỏi danh sách yêu thích.",
    removeError:
      lang === "en"
        ? "Unable to remove wishlist item."
        : "Không thể xóa sản phẩm yêu thích.",
    clearSuccess:
      lang === "en"
        ? "Wishlist cleared."
        : "Đã xóa toàn bộ danh sách yêu thích.",
    clearError:
      lang === "en"
        ? "Unable to clear wishlist."
        : "Không thể xóa danh sách yêu thích.",
    addCart:
      lang === "en" ? "Added to cart." : "Đã thêm sản phẩm vào giỏ hàng.",
    inStock: lang === "en" ? "In stock" : "Còn hàng",
    outOfStock: lang === "en" ? "Out of stock" : "Hết hàng",
    addToCart: lang === "en" ? "Add to cart" : "Thêm vào giỏ",
    viewDetail: lang === "en" ? "View detail" : "Xem chi tiết",
    remove: lang === "en" ? "Remove" : "Xóa khỏi yêu thích",
    clearAll: lang === "en" ? "Clear all" : "Xóa tất cả",
    logout: lang === "en" ? "Sign out" : "Đăng xuất",
    syncNoteTitle: lang === "en" ? "Wishlist sync" : "Đồng bộ yêu thích",
    syncNote:
      lang === "en"
        ? "Your wishlist is saved to your account and available after signing in."
        : "Danh sách yêu thích được lưu theo tài khoản và có thể xem lại sau khi đăng nhập.",
    profile: lang === "en" ? "Personal information" : "Thông tin cá nhân",
    orders: lang === "en" ? "My orders" : "Đơn hàng của tôi",
    addresses: lang === "en" ? "My addresses" : "Địa chỉ của tôi",
    payments: lang === "en" ? "Payment methods" : "Phương thức thanh toán",
    wishlist: lang === "en" ? "Wishlist" : "Danh sách yêu thích",
    notifications: lang === "en" ? "Notifications" : "Thông báo của tôi",
    password: lang === "en" ? "Change password" : "Đổi mật khẩu",
  };
}

function getMenuItems(t) {
  return [
    { label: t.profile, href: "/profile", icon: User },
    { label: t.orders, href: "/orders", icon: Package },
    { label: t.addresses, href: "/profile#address", icon: MapPin },
    { label: t.payments, href: "/profile#payment", icon: CreditCard },
    { label: t.wishlist, href: "/favorites", icon: Heart, active: true },
    { label: t.notifications, href: "/profile#notification", icon: Bell },
    { label: t.password, href: "/profile#password", icon: Lock },
  ];
}

function formatCurrency(value = 0) {
  return new Intl.NumberFormat("vi-VN").format(Number(value) || 0) + " ₫";
}

function mapWishlistProduct(item = {}) {
  const product = item.product || item;

  return {
    wishlistItemId: item.id,
    id: product.id || item.productId,
    backendProductId: product.id || item.productId,
    productId: product.id || item.productId,
    sku: product.sku || "",
    slug: product.slug || product.id || item.productId,
    nameVi: product.nameVi || product.name?.vi || product.name || "Sản phẩm Gundam",
    nameEn: product.nameEn || product.name?.en || product.nameVi || product.name || "Gundam Product",
    price: Number(product.price || 0),
    oldPrice: Number(product.oldPrice || 0),
    stock: Number(product.stock || 0),
    status: product.status || "inStock",
    imageUrl: product.imageUrl || product.images?.[0] || "/images/products/hi-nu.jpg",
    brand: product.brand || "Bandai Spirits",
    grade: product.grade || "",
    scale: product.scale || "",
    active: product.active !== false,
    createdAt: item.createdAt,
  };
}

function getProductName(product, lang) {
  return lang === "en"
    ? product.nameEn || product.nameVi || "Gundam Product"
    : product.nameVi || product.nameEn || "Sản phẩm Gundam";
}

function AccountSidebar({ user, wishlistCount, onLogout, t }) {
  const menuItems = getMenuItems(t);

  return (
    <aside className="space-y-4">
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">{t.accountTitle}</h2>

        <div className="mt-5 flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-white">
            <User size={24} />
          </span>

          <div className="min-w-0">
            <div className="truncate font-black text-slate-950">{user?.name || t.customer}</div>
            <div className="mt-1 truncate text-sm font-semibold text-slate-500">
              {user?.email || t.noEmail}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">
          {wishlistCount} {t.savedCount}
        </div>

        <div className="mt-5 border-t border-slate-100 pt-3">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                to={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black ${item.active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-blue-700"
                  }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={onLogout}
            className="mt-2 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} />
            {t.logout}
          </button>
        </div>
      </section>

      <section className="rounded-[28px] border border-blue-100 bg-blue-50 p-5 shadow-sm">
        <div className="font-black text-slate-950">{t.syncNoteTitle}</div>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
          {t.syncNote}
        </p>
      </section>
    </aside>
  );
}

function ProductRow({ product, lang, t, removing, onRemove, onAddToCart }) {
  const name = getProductName(product, lang);
  const stock = Number(product.stock || 0);

  return (
    <article className="grid gap-4 border-b border-slate-100 py-5 last:border-b-0 md:grid-cols-[180px_1fr_210px] md:items-center">
      <Link to={`/product/${product.slug || product.id}`} className="overflow-hidden rounded-2xl bg-slate-100">
        <img src={product.imageUrl} alt={name} className="h-40 w-full object-cover md:h-28" />
      </Link>

      <div>
        <h3 className="text-lg font-black text-slate-950">{name}</h3>

        <div className="mt-1 text-sm font-bold text-blue-700">
          {product.brand || "Bandai Spirits"}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {product.grade && (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
              {product.grade}
            </span>
          )}

          {product.scale && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
              {product.scale}
            </span>
          )}

          <span
            className={`rounded-full px-3 py-1 text-xs font-black ${stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
              }`}
          >
            {stock > 0 ? t.inStock : t.outOfStock}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="text-xl font-black text-red-600">
            {formatCurrency(product.price)}
          </div>

          {product.oldPrice > product.price && (
            <div className="text-sm font-bold text-slate-400 line-through">
              {formatCurrency(product.oldPrice)}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-2">
        <button
          type="button"
          onClick={onAddToCart}
          disabled={stock <= 0}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black text-white shadow-lg ${stock <= 0
            ? "cursor-not-allowed bg-slate-400"
            : "bg-blue-700 shadow-blue-100 hover:bg-blue-800"
            }`}
        >
          <ShoppingCart size={17} />
          {t.addToCart}
        </button>

        <Link
          to={`/product/${product.slug || product.id}`}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:border-blue-200 hover:text-blue-700"
        >
          <Eye size={17} />
          {t.viewDetail}
        </Link>

        <button
          type="button"
          onClick={onRemove}
          disabled={removing}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-black ${removing
            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
            : "border-red-100 bg-white text-red-600 hover:bg-red-50"
            }`}
        >
          {removing ? <Loader2 size={17} className="animate-spin" /> : <Trash2 size={17} />}
          {t.remove}
        </button>
      </div>
    </article>
  );
}

export default function WishlistPage() {
  const { actions } = useCms();
  const [lang] = useLang();
  const t = getCopy(lang);

  const [query, setQuery] = useState("");
  const [wishlistItems, setWishlistItems] = useState([]);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState("");
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const hasToken = useMemo(() => hasAccountToken(), []);

  const products = useMemo(() => {
    const q = query.trim().toLowerCase();

    return wishlistItems
      .map(mapWishlistProduct)
      .filter((product) => product.active)
      .filter((product) => {
        if (!q) return true;

        return [
          product.nameVi,
          product.nameEn,
          product.sku,
          product.grade,
          product.scale,
          product.brand,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      });
  }, [wishlistItems, query]);

  async function loadWishlist() {
    if (!hasToken) {
      setLoading(false);
      setError(t.loginDesc);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const [accountData, items] = await Promise.all([
        getMyAccount().catch(() => null),
        getMyWishlist(),
      ]);

      setAccount(accountData);
      setWishlistItems(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err?.message || t.loadError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasToken, lang]);

  async function remove(productId) {
    try {
      setRemovingId(productId);
      setMessage("");
      setError("");

      await removeMyWishlistItem(productId);

      setWishlistItems((prev) =>
        prev.filter((item) => {
          const product = mapWishlistProduct(item);
          return product.id !== productId;
        })
      );

      setMessage(t.removeSuccess);
    } catch (err) {
      setError(err?.message || t.removeError);
    } finally {
      setRemovingId("");
    }
  }

  async function clearAll() {
    try {
      setClearing(true);
      setMessage("");
      setError("");

      await clearMyWishlistApi();

      setWishlistItems([]);
      setMessage(t.clearSuccess);
    } catch (err) {
      setError(err?.message || t.clearError);
    } finally {
      setClearing(false);
    }
  }

  function addToCart(product) {
    actions.addToCart(product.backendProductId || product.productId || product.id, 1);
    setMessage(t.addCart);
  }

  function logout() {
    actions.logout?.();
    window.location.href = "/";
  }

  return (
    <PageShell>
      <main className="min-h-screen bg-gradient-to-b from-white via-blue-50/40 to-slate-100">
        <div className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8">
          {!hasToken ? (
            <section className="mx-auto max-w-xl rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
              <Heart className="mx-auto text-blue-700" size={42} />
              <h1 className="mt-4 text-2xl font-black text-slate-950">{t.loginTitle}</h1>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{t.loginDesc}</p>
              <Link
                to="/login"
                className="mt-5 inline-flex rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-800"
              >
                {t.login}
              </Link>
            </section>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
              <AccountSidebar user={account} wishlistCount={wishlistItems.length} onLogout={logout} t={t} />

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-2xl font-black text-slate-950">{t.title}</h1>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{t.subtitle}</p>
                  </div>

                  <button
                    type="button"
                    onClick={clearAll}
                    disabled={clearing || wishlistItems.length === 0}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-red-100 bg-white px-4 text-sm font-black text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {clearing ? <Loader2 size={17} className="animate-spin" /> : <Trash2 size={17} />}
                    {t.clearAll}
                  </button>
                </div>

                <div className="mt-5 flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <Search size={18} className="text-slate-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t.search}
                    className="ml-3 w-full bg-transparent text-sm font-bold outline-none"
                  />
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

                {loading ? (
                  <div className="flex min-h-[260px] items-center justify-center">
                    <Loader2 className="animate-spin text-blue-700" size={36} />
                  </div>
                ) : products.length === 0 ? (
                  <div className="py-16 text-center">
                    <Heart className="mx-auto text-slate-300" size={48} />
                    <div className="mt-4 text-lg font-black text-slate-600">{t.empty}</div>
                  </div>
                ) : (
                  <div className="mt-2">
                    {products.map((product) => (
                      <ProductRow
                        key={product.id}
                        product={product}
                        lang={lang}
                        t={t}
                        removing={removingId === product.id}
                        onRemove={() => remove(product.id)}
                        onAddToCart={() => addToCart(product)}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
    </PageShell>
  );
}
