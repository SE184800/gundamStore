import {
  Bell,
  CreditCard,
  Eye,
  Heart,
  Lock,
  LogOut,
  MapPin,
  Package,
  Search,
  ShoppingCart,
  Trash2,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../../components/common/PageShell";
import { useCms, useLang } from "../../store/CmsStore";
import {
  clearWishlist,
  getWishlistIds,
  toggleWishlist,
} from "../../services/WishlistService";

const menuItems = [
  { label: "Thông tin cá nhân", href: "/profile", icon: User },
  { label: "Đơn hàng của tôi", href: "/orders", icon: Package },
  { label: "Địa chỉ của tôi", href: "/profile#address", icon: MapPin },
  { label: "Phương thức thanh toán", href: "/profile#payment", icon: CreditCard },
  { label: "Danh sách yêu thích", href: "/favorites", icon: Heart, active: true },
  { label: "Thông báo của tôi", href: "/profile#notification", icon: Bell },
  { label: "Đổi mật khẩu", href: "/profile#password", icon: Lock },
];

function getProductName(product, lang) {
  if (typeof product.name === "string") return product.name;
  return product.name?.[lang] || product.name?.vi || product.name?.en || product.title || "Gundam product";
}

function getProductImage(product) {
  return (
    product.imageUrl ||
    product.images?.[0] ||
    product.media?.card ||
    product.media?.detailMain ||
    "/images/products/hi-nu.jpg"
  );
}

function formatCurrency(value = 0) {
  return new Intl.NumberFormat("vi-VN").format(Number(value) || 0) + " ₫";
}

function AccountSidebar({ user, onLogout }) {
  return (
    <aside className="space-y-4">
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">Tài khoản của tôi</h2>

        <div className="mt-5 flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-white">
            <User size={24} />
          </span>

          <div>
            <div className="font-black text-slate-950">{user?.name || "Admin Demo"}</div>
            <div className="mt-1 text-sm font-semibold text-slate-500">
              {user?.email || "admin@demo.com"}
            </div>
          </div>
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
        <div className="font-black text-slate-950">Bạn cần hỗ trợ?</div>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
          Đội ngũ của chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7.
        </p>

        <Link
          to="/contact"
          className="mt-4 flex min-h-11 items-center justify-center rounded-2xl bg-white text-sm font-black text-blue-700"
        >
          Liên hệ ngay
        </Link>
      </section>
    </aside>
  );
}

function ProductRow({ product, lang, onRemove, onAddToCart }) {
  const name = getProductName(product, lang);
  const image = getProductImage(product);
  const stock = Number(product.stock || 0);

  return (
    <article className="grid gap-4 border-b border-slate-100 py-5 last:border-b-0 md:grid-cols-[180px_1fr_210px] md:items-center">
      <Link to={`/product/${product.slug || product.id}`} className="overflow-hidden rounded-2xl bg-slate-100">
        <img src={image} alt={name} className="h-40 w-full object-cover md:h-28" />
      </Link>

      <div>
        <h3 className="text-lg font-black text-slate-950">{name}</h3>

        <div className="mt-1 text-sm font-bold text-blue-700">
          {product.brand || product.supplier?.nameVi || "Bandai Spirits"}
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

        <div className="mt-3 text-xl font-black text-red-600">
          {formatCurrency(product.price)}
        </div>
      </div>

      <div className="grid gap-2">
        <button
          type="button"
          onClick={onAddToCart}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-black text-white shadow-lg shadow-blue-100 hover:bg-blue-800"
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
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-red-100 bg-white px-4 text-sm font-black text-red-600 hover:bg-red-50"
        >
          <Trash2 size={17} />
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
  const [version, setVersion] = useState(0);

  const user = state.user || {
    name: "Admin Demo",
    email: "admin@demo.com",
  };

  const wishlistIds = useMemo(() => getWishlistIds(), [version]);

  const products = useMemo(() => {
    const q = query.trim().toLowerCase();

    return (state.products || [])
      .filter((product) => wishlistIds.includes(product.id))
      .filter((product) => {
        if (!q) return true;

        return [
          getProductName(product, lang),
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
  }, [state.products, wishlistIds, query, lang]);

  function refresh() {
    setVersion((value) => value + 1);
  }

  function remove(productId) {
    toggleWishlist(productId);
    refresh();
  }

  function clearAll() {
    clearWishlist();
    refresh();
  }

  function addToCart(product) {
    actions.addToCart(product.backendProductId || product.productId || product.id, 1);
  }

  function logout() {
    actions.logout();
    window.location.href = "/";
  }

  return (
    <PageShell>
      <main className="min-h-screen bg-gradient-to-b from-white via-blue-50/40 to-slate-100">
        <div className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <AccountSidebar user={user} onLogout={logout} />

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
                    Các sản phẩm bạn yêu thích và muốn mua sau.
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
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 text-sm font-black text-red-600 hover:bg-red-100"
                    >
                      <Trash2 size={16} />
                      Xóa tất cả
                    </button>
                  </div>
                </div>

                {products.length === 0 ? (
                  <div className="mt-5 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                    <Heart className="mx-auto text-slate-300" size={48} />
                    <div className="mt-4 text-xl font-black text-slate-600">
                      Chưa có sản phẩm yêu thích
                    </div>
                    <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">
                      Hãy bấm biểu tượng trái tim tại sản phẩm bạn thích để lưu lại và mua sau.
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
