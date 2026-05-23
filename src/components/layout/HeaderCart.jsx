import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const CART_KEY = "gundam-cart-final";

export default function HeaderCart() {
  const [count, setCount] = useState(0);

  function loadCart() {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    setCount(total);
  }

  useEffect(() => {
    loadCart();
    window.addEventListener("gundam-cart-updated", loadCart);
    window.addEventListener("storage", loadCart);

    return () => {
      window.removeEventListener("gundam-cart-updated", loadCart);
      window.removeEventListener("storage", loadCart);
    };
  }, []);

  return (
    <Link
      to="/cart"
      className="fixed right-[230px] top-[72px] z-[9999] flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg transition hover:scale-105 hover:bg-blue-700"
      title="Giỏ hàng"
    >
      <ShoppingCart size={22} />

      {count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-black text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
