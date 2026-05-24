import { createOrder, ORDER_TYPE, PAYMENT_STATUS, PREORDER_STATUS } from "./OrderService";
import { saveCheckoutDraft, saveCart } from "./CartService";
import { calculatePreorderDeposit } from "../constants/orderConfig";

export function clearCommerceDemoData({ keepCms = true } = {}) {
  localStorage.removeItem("gundam-cart-final");
  localStorage.removeItem("gundam-checkout-draft");
  localStorage.removeItem("gundam-inventory-logs");
  localStorage.removeItem("gundam-promotions");

  if (!keepCms) {
    localStorage.removeItem("gundam-cms-state");
  }

  return true;
}

export function seedDemoCart(products = []) {
  const firstProducts = (products || []).slice(0, 2);

  const cart = firstProducts.map((product) => ({
    id: product.id,
    name: typeof product.name === "string" ? product.name : product.name?.vi || product.name?.en || "Gunpla",
    image: product.media?.card || product.imageUrl || product.images?.[0] || "/images/products/hi-nu.jpg",
    price: Number(product.price) || 0,
    quantity: 1,
    selected: true,
  }));

  saveCart(cart);
  return cart;
}

export function seedDemoOrders(products = []) {
  const product = (products || [])[0];

  if (!product) {
    throw new Error("No product available for seed orders.");
  }

  const baseItem = {
    id: product.id,
    name: typeof product.name === "string" ? product.name : product.name?.vi || product.name?.en || "Gunpla",
    image: product.media?.card || product.imageUrl || product.images?.[0] || "/images/products/hi-nu.jpg",
    price: Number(product.price) || 1000000,
    quantity: 1,
    selected: true,
  };

  const normalOrder = createOrder({
    orderType: ORDER_TYPE.NORMAL,
    customer: {
      name: "QA Tester",
      phone: "0906052029",
      address: "123 Nguyen Trai, Quan 1",
      province: "Hồ Chí Minh",
      note: "Seed normal order",
    },
    items: [baseItem],
    subtotal: baseItem.price,
    shippingFee: 30000,
    discount: 0,
    shippingDiscount: 0,
    total: baseItem.price + 30000,
    paymentMethod: "COD",
    shippingMethod: "FAST",
  });

  const deposit = calculatePreorderDeposit(baseItem.price);

  const preorder = createOrder({
    orderType: ORDER_TYPE.PREORDER,
    customer: {
      name: "QA Preorder",
      phone: "0906052029",
      address: "456 Le Loi, Quan 1",
      province: "Hồ Chí Minh",
      note: "Seed preorder order",
    },
    items: [{ ...baseItem, status: "preorder" }],
    subtotal: baseItem.price,
    shippingFee: 0,
    discount: 0,
    shippingDiscount: 0,
    total: deposit.depositAmount,
    paymentMethod: "BANK",
    shippingMethod: "FAST",
    paymentStatus: PAYMENT_STATUS.UNPAID,
    preorder: {
      status: PREORDER_STATUS.DEPOSIT_PENDING,
      eta: "Dự kiến 30-60 ngày",
      fullAmount: deposit.fullAmount,
      depositRate: deposit.depositRate,
      depositAmount: deposit.depositAmount,
      remainingAmount: deposit.remainingAmount,
      depositStatus: PAYMENT_STATUS.UNPAID,
      balanceStatus: PAYMENT_STATUS.UNPAID,
    },
  });

  return [normalOrder, preorder];
}

export function createPreorderCheckoutDraft(product) {
  const price = Number(product.price) || 0;
  const deposit = calculatePreorderDeposit(price);

  const draft = {
    orderType: ORDER_TYPE.PREORDER,
    items: [
      {
        id: product.id,
        name: typeof product.name === "string" ? product.name : product.name?.vi || product.name?.en || "Gunpla",
        image: product.media?.card || product.imageUrl || product.images?.[0] || "/images/products/hi-nu.jpg",
        price,
        quantity: 1,
        selected: true,
        status: "preorder",
      },
    ],
    subtotal: price,
    shippingFee: 0,
    discount: 0,
    shippingDiscount: 0,
    voucherCode: "",
    total: deposit.depositAmount,
    shippingMethod: "FAST",
    preorder: {
      status: PREORDER_STATUS.DEPOSIT_PENDING,
      eta: "Dự kiến 30-60 ngày",
      fullAmount: deposit.fullAmount,
      depositRate: deposit.depositRate,
      depositAmount: deposit.depositAmount,
      remainingAmount: deposit.remainingAmount,
      depositStatus: PAYMENT_STATUS.UNPAID,
      balanceStatus: PAYMENT_STATUS.UNPAID,
    },
  };

  saveCheckoutDraft(draft);
  return draft;
}
