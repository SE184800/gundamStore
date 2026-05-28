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
  getMyWishlist,
  hasAccountToken,
  removeMyWishlistItem,
} from "../../services/AccountApiService";

const menuItems = [
  { label: "Thông tin cá nhân", href: "/profile", icon: User },
  { label: "Đơn hàng của tôi", href: "/orders", icon: Package },
  { label: "Địa chỉ của tôi", href: "/profile#address", icon: MapPin },
  { label: "Phương thức thanh toán", href: "/profile#payment", icon: CreditCard },
  { label: "Danh sách yêu thích", href: "/favorites", icon: Heart, active: true },
  { label: "Thông báo của tôi", href: "/profile#notification", icon: Bell },
  { label: "Đổi mật khẩu", href: "/profile#password", icon: Lock },
];

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

function AccountSidebar({ user, wishlistCount, onLogout }) {
  return (
    <aside className="space-y-4">
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">Tài khoản của tôi</h2>

        <div className="mt-5 flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-white">
            <User size={24} />
          </span>

          <div className="min-w-0">
            <div className="truncate font-black text-slate-950">{user?.name || "Admin Demo"}</div>
            <div className="mt-1 truncate text-sm font-semibold text-slate-500">
              {user?.email || "admin@demo.com"}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">
          {wishlistCount} sản phẩm yêu thích
        </div>

        <div className="mt-5 border-t border-slate-100 pt-3">
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

          <button
            type="button"
            onClick={onLogout}
            className="mt-2 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </section>

      <section className="rounded-[28px] border border-blue-100 bg-blue-50 p-5 shadow-sm">
        <div className="font-black text-slate-950">Wishlist lưu trên backend</div>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
          Danh sách yêu thích hiện đã đồng bộ qua API /api/account/wishlist.
        </p>
      </section>
    </aside>
  );
}

function ProductRow({ product, lang, removing, onRemove, onAddToCart }) {
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
            className={`rounded-full px-3 py-1 text-xs font-black ${
              stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
            }`}
          >
            {stock > 0 ? "Còn hàng" : "Hết hàng"}
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
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black text-white shadow-lg ${
            stock <= 0
              ? "cursor-not-allowed bg-slate-400"
              : "bg-blue-700 shadow-blue-100 hover:bg-blue-800"
          }`}
        >
          <ShoppingCart size={17} />
          Thêm vào giỏ
        </button>

        <Link
          to={`/product/${product.slug || product.id}`}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:border-blue-200 hover:text-blue-700"
        >
          <Eye size={17} />
          Xem chi tiết
        </Link>

        <button
          type="button"
          onClick={onRemove}
          disabled={removing}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-black ${
            removing
              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
              : "border-red-100 bg-white text-red-600 hover:bg-red-50"
          }`}
        >
          {removing ? <Loader2 size={17} className="animate-spin" /> : <Trash2 size={17} />}
          Xóa khỏi yêu thích
        </button>
      </div>
    </article>
  );
}

export default function WishlistPage() {
  const { state, actions } = useCms();
  const [lang] = useLang();

  const [query, setQuery] = useState("");
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState("");
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const user = state.user || {
    name: "Admin Demo",
    email: "admin@demo.com",
  };

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
      setError("Bạn cần đăng nhập để xem danh sách yêu thích.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const items = await getMyWishlist();
      setWishlistItems(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err?.message || "Không thể tải danh sách yêu thích.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      setMessage("Đã xóa sản phẩm khỏi danh sách yêu thích.");
    } catch (err) {
      setError(err?.message || "Không thể xóa sản phẩm yêu thích.");
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
      setMessage("Đã xóa toàn bộ danh sách yêu thích.");
    } catch (err) {
      setError(err?.message || "Không thể xóa danh sách yêu thích.");
    } finally {
      setClearing(false);
    }
  }

  function addToCart(product) {
    actions.addToCart(product.backendProductId || product.productId || product.id, 1);
    setMessage("Đã thêm sản phẩm vào giỏ hàng.");
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
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <AccountSidebar user={user} wishlistCount={wishlistItems.length} onLogout={logout} />

            <section>
              <div className="text-sm font-bold text-slate-500">
                <Link to="/" className="hover:text-blue-700">Trang chủ</Link>
                <span className="mx-2">›</span>
                <span className="text-slate-900">Danh sách yêu thích</span>
              </div>

              <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-lg shadow-blue-100">
                      <Heart size={24} fill="currentColor" />
                    </span>

                    <h1 className="text-3xl font-black text-slate-950 md:text-4xl">
                      Danh sách yêu thích
                    </h1>
                  </div>

                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    Danh sách này được lưu trên backend theo tài khoản đăng nhập.
                  </p>
                </div>

                <Link
                  to="/shop"
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-blue-100 bg-white px-5 text-sm font-black text-blue-700 shadow-sm hover:bg-blue-700 hover:text-white"
                >
                  Tiếp tục mua sắm
                </Link>
              </div>

              <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="text-lg font-black text-slate-950">
                    Tất cả sản phẩm ({products.length})
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="flex min-h-11 min-w-[260px] items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
                      <Search size={18} className="text-blue-700" />
                      <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Tìm trong danh sách yêu thích..."
                        className="w-full bg-transparent px-3 text-sm font-bold outline-none placeholder:text-slate-400"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={clearAll}
                      disabled={clearing || wishlistItems.length === 0}
                      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-black ${
                        clearing || wishlistItems.length === 0
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                          : "border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
                      }`}
                    >
                      {clearing ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      Xóa tất cả
                    </button>
                  </div>
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
                  <div className="mt-5 flex min-h-[260px] items-center justify-center rounded-[24px] bg-slate-50">
                    <Loader2 className="animate-spin text-blue-700" size={34} />
                  </div>
                ) : products.length === 0 ? (
                  <div className="mt-5 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                    <Heart className="mx-auto text-slate-300" size={48} />
                    <div className="mt-4 text-xl font-black text-slate-600">
                      Chưa có sản phẩm yêu thích
                    </div>
                    <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">
                      Hãy thêm sản phẩm vào wishlist để hệ thống lưu theo tài khoản.
                    </p>

                    <Link
                      to="/shop"
                      className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-blue-700 px-5 text-sm font-black text-white"
                    >
                      Khám phá sản phẩm
                    </Link>
                  </div>
                ) : (
                  <div className="mt-3">
                    {products.map((product) => (
                      <ProductRow
                        key={product.id}
                        product={product}
                        lang={lang}
                        removing={removingId === product.id}
                        onRemove={() => remove(product.id)}
                        onAddToCart={() => addToCart(product)}
                      />
                    ))}
                  </div>
                )}
              </section>
            </section>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
