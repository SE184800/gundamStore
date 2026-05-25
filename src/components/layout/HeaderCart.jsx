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
    className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg transition hover:scale-105 hover:bg-blue-700"
    title="Giỏ hàng"
  >
    <ShoppingCart size={22} />

    {/* 🛠️ CHIẾC HỘP BẢO VỆ: Ép vị trí cố định ở góc trên bên phải nút xanh */}
    <div className="absolute -right-2 -top-2 z-10 flex h-6 min-w-[24px]">
      <span
        id="gundam-floating-cart-badge" // 🛠️ GIỮ NGUYÊN ID GỐC cho hàm updateCartBadgeDom chạy
        className="flex h-full w-full items-center justify-center rounded-full bg-red-500 px-1 text-xs font-black text-white shadow-md"
        style={{ 
          display: count > 0 ? "flex" : "none",
          position: "relative", // Biến nó thành relative để tự hủy thuộc tính fixed của file CSS cũ
          right: "auto",
          top: "auto"
        }}
      >
        {count}
      </span>
    </div>
  </Link>
  );
}
