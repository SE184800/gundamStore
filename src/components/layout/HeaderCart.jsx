import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { forceCartBadgeSync, getCartCount } from "../../services/CartService";

export default function HeaderCart() {
  const [count, setCount] = useState(() => getCartCount());

  function sync(event) {
    const next =
      typeof event?.detail?.totalQty === "number"
        ? event.detail.totalQty
        : getCartCount();

    setCount(next);
    forceCartBadgeSync();
  }

  useEffect(() => {
    sync();

    window.addEventListener("gundam-cart-updated", sync);
    window.addEventListener("cart:updated", sync);
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);

    const timer = window.setInterval(sync, 200);

    return () => {
      window.removeEventListener("gundam-cart-updated", sync);
      window.removeEventListener("cart:updated", sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
      window.clearInterval(timer);
    };
  }, []);

  return (
    <Link
      to="/cart"
      className="fixed right-[230px] top-[72px] z-[9999] flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg transition hover:scale-105 hover:bg-blue-700"
      title="Giỏ hàng"
    >
      <ShoppingCart size={22} />

      <span
        id="gundam-floating-cart-badge"
        className="absolute -right-2 -top-2 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-black text-white"
        style={{ display: count > 0 ? "flex" : "none" }}
      >
        {count}
      </span>
    </Link>
  );
}
