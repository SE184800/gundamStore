import { useEffect } from "react";
import { getCart, saveCart } from "../../services/CartService";

const PRICE_MAP = [
  ["action base 5 clear", 180000],
  ["hg 1/144 gundam aerial", 520000],
  ["rg 1/144 hi-v gundam", 1150000],
  ["mg 1/100 freedom gundam ver.2.0", 1250000],
  ["rg 1/144 sazabi", 1200000],
  ["mgex 1/100 strike freedom", 2950000],
];

function normalize(text) {
  return String(text || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function getProduct(button) {
  let card = button;

  for (let i = 0; i < 12; i++) {
    if (!card?.parentElement) break;
    card = card.parentElement;

    const text = normalize(card.innerText);

    if (
      card.querySelector("img") &&
      (text.includes("gundam") || text.includes("action base"))
    ) {
      break;
    }
  }

  const text = card?.innerText || "";
  const clean = normalize(text);
  const img = card?.querySelector("img")?.src || "";

  const lines = text.split("\n").map((x) => x.trim()).filter(Boolean);

  const name =
    lines.find((x) => /gundam|action base/i.test(x)) ||
    "Gundam Product";

  const mapped = PRICE_MAP.find(([key]) => clean.includes(key));
  const price = mapped?.[1] || 0;

  return {
    id: normalize(name).replace(/\s+/g, "-"),
    name,
    image: img,
    price,
    quantity: 1,
    selected: true,
  };
}

function addToCart(product) {
  const cart = getCart();
  const found = cart.find((item) => item.id === product.id);

  if (found) {
    found.quantity = (found.quantity || 1) + 1;
    found.price = product.price || found.price;
    found.selected = true;
  } else {
    cart.push(product);
  }

  saveCart(cart);
}

export default function AddToCartBridge() {
  useEffect(() => {
    function handleClick(e) {
      const button = e.target.closest("button");
      if (!button) return;

      const label = normalize(button.innerText);
      const isAdd = label.includes("thêm giỏ") || label.includes("add to cart");
      const isBuy = label.includes("mua ngay") || label.includes("buy now");

      if (!isAdd && !isBuy) return;

      e.preventDefault();
      e.stopPropagation();

      addToCart(getProduct(button));

      const oldText = button.innerText;
      button.innerText = isBuy ? "Đang mua..." : "Đã thêm";

      setTimeout(() => {
        button.innerText = oldText;
        if (isBuy) window.location.href = "/cart";
      }, 500);
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return null;
}
