import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:4800";

async function readJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function api(path, options = {}) {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  return {
    response,
    data: await readJson(response),
  };
}

async function ensureCustomer() {
  const role = await prisma.role.upsert({
    where: { code: "CUSTOMER" },
    update: { name: "Customer" },
    create: { code: "CUSTOMER", name: "Customer" },
  });

  const passwordHash = await bcrypt.hash("customer123", 10);

  return prisma.user.upsert({
    where: { email: "customer@gundam.local" },
    update: {
      name: "Customer Demo",
      active: true,
      roleId: role.id,
      passwordHash,
    },
    create: {
      name: "Customer Demo",
      email: "customer@gundam.local",
      active: true,
      roleId: role.id,
      passwordHash,
    },
  });
}

async function cleanup(productId, orderId) {
  if (orderId) {
    await prisma.inventoryLog.deleteMany({ where: { refId: orderId } });
    await prisma.payment.deleteMany({ where: { orderId } });
    await prisma.shipment.deleteMany({ where: { orderId } });
    await prisma.auditLog.deleteMany({ where: { orderId } });
    await prisma.orderItem.deleteMany({ where: { orderId } });
    await prisma.order.deleteMany({ where: { id: orderId } });
  }

  if (productId) {
    await prisma.inventoryLog.deleteMany({ where: { productId } });
    await prisma.product.deleteMany({ where: { id: productId } });
  }
}

async function run() {
  console.log("======================================");
  console.log("Customer Order Flow Smoke Test");
  console.log("Backend:", BACKEND_URL);
  console.log("======================================");

  const customer = await ensureCustomer();
  const suffix = Date.now();

  const product = await prisma.product.create({
    data: {
      sku: `SMOKE-CUSTOMER-ORDER-${suffix}`,
      slug: `smoke-customer-order-${suffix}`,
      nameVi: "Smoke Customer Order Product",
      nameEn: "Smoke Customer Order Product",
      price: 1000,
      oldPrice: 0,
      stock: 5,
      active: true,
      status: "inStock",
      brand: "Smoke Test",
      imageUrl: "/images/products/hi-nu.jpg",
    },
  });

  let orderId = "";

  try {
    const login = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "customer@gundam.local",
        password: "customer123",
      }),
    });

    const token = login.data?.token || "";

    if (!login.response.ok || !token) {
      throw new Error(`Customer login failed HTTP ${login.response.status}`);
    }

    console.log("✅ Customer login works");

    const unauthList = await api("/orders/my");

    if (unauthList.response.status !== 401) {
      throw new Error(`Expected /orders/my without token to be 401, got ${unauthList.response.status}`);
    }

    console.log("✅ My orders requires authentication");

    const create = await api("/orders", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        customerName: "Customer Demo",
        customerPhone: "0908888888",
        customerEmail: "customer@gundam.local",
        customerAddress: "123 Smoke Customer Address, Hồ Chí Minh",
        shippingFee: 0,
        discount: 0,
        note: "Smoke customer order flow",
        items: [
          {
            productId: product.id,
            quantity: 1,
          },
        ],
      }),
    });

    orderId = create.data?.order?.id || "";

    if (create.response.status !== 201 || !orderId) {
      throw new Error(`Create customer order failed HTTP ${create.response.status}: ${JSON.stringify(create.data)}`);
    }

    console.log("✅ Customer order created and linked");

    const dbOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        customerId: true,
      },
    });

    if (dbOrder?.customerId !== customer.id) {
      throw new Error(`Order customerId mismatch. expected=${customer.id}, actual=${dbOrder?.customerId}`);
    }

    console.log("✅ Order customerId is correct");

    const list = await api("/orders/my", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const foundInList = (list.data?.orders || []).some((item) => item.id === orderId);

    if (!list.response.ok || !foundInList) {
      throw new Error(`Created order not found in /orders/my`);
    }

    console.log("✅ My orders list includes created order");

    const detail = await api(`/orders/my/${encodeURIComponent(orderId)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!detail.response.ok || detail.data?.order?.id !== orderId) {
      throw new Error(`My order detail failed HTTP ${detail.response.status}`);
    }

    console.log("✅ My order detail works");
    console.log("======================================");
    console.log("Result: 5/5 passed");
    console.log("======================================");
  } finally {
    await cleanup(product.id, orderId);
    await prisma.$disconnect();
    console.log("✅ Cleaned up customer order flow smoke data");
  }
}

run().catch(async (error) => {
  console.error("❌ Customer order flow smoke failed:", error);
  await prisma.$disconnect();
  process.exit(1);
});
