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

async function getStock(productId) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { stock: true },
  });

  return Number(product?.stock || 0);
}

async function countRestoreLogs(orderId) {
  return prisma.inventoryLog.count({
    where: {
      refId: orderId,
      refType: "ORDER_CANCEL",
      type: "RESTORE",
    },
  });
}

async function run() {
  console.log("======================================");
  console.log("Cancel Order Restore Stock Smoke Test");
  console.log("Backend:", BACKEND_URL);
  console.log("======================================");

  await ensureCustomer();

  const suffix = Date.now();
  const product = await prisma.product.create({
    data: {
      sku: `SMOKE-CANCEL-RESTORE-${suffix}`,
      slug: `smoke-cancel-restore-${suffix}`,
      nameVi: "Smoke Cancel Restore Product",
      nameEn: "Smoke Cancel Restore Product",
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

    const create = await api("/orders", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        customerName: "Customer Demo",
        customerPhone: "0908888888",
        customerEmail: "customer@gundam.local",
        customerAddress: "123 Smoke Cancel Address, Hồ Chí Minh",
        shippingFee: 0,
        discount: 0,
        note: "Smoke cancel restore stock",
        items: [
          {
            productId: product.id,
            quantity: 2,
          },
        ],
      }),
    });

    orderId = create.data?.order?.id || "";

    if (create.response.status !== 201 || !orderId) {
      throw new Error(`Create order failed HTTP ${create.response.status}: ${JSON.stringify(create.data)}`);
    }

    console.log("✅ Order created");

    const stockAfterCreate = await getStock(product.id);

    if (stockAfterCreate !== 3) {
      throw new Error(`Expected stock 3 after create, got ${stockAfterCreate}`);
    }

    console.log("✅ Stock decremented after order create");

    const cancel = await api(`/orders/my/${encodeURIComponent(orderId)}/cancel`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        reason: "Smoke test cancellation",
        note: "Customer cancels order before packing",
      }),
    });

    if (!cancel.response.ok || cancel.data?.order?.status !== "CANCELLED") {
      throw new Error(`Cancel order failed HTTP ${cancel.response.status}: ${JSON.stringify(cancel.data)}`);
    }

    const stockAfterCancel = await getStock(product.id);

    if (stockAfterCancel !== 5) {
      throw new Error(`Expected stock 5 after cancel restore, got ${stockAfterCancel}`);
    }

    console.log("✅ Cancel restored stock");

    const restoreLogsAfterFirstCancel = await countRestoreLogs(orderId);

    if (restoreLogsAfterFirstCancel !== 1) {
      throw new Error(`Expected 1 restore log, got ${restoreLogsAfterFirstCancel}`);
    }

    console.log("✅ Restore inventory log created once");

    const secondCancel = await api(`/orders/my/${encodeURIComponent(orderId)}/cancel`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        reason: "Second cancel should not restore again",
      }),
    });

    if (!secondCancel.response.ok) {
      throw new Error(`Second cancel should be idempotent, got HTTP ${secondCancel.response.status}`);
    }

    const stockAfterSecondCancel = await getStock(product.id);
    const restoreLogsAfterSecondCancel = await countRestoreLogs(orderId);

    if (stockAfterSecondCancel !== 5 || restoreLogsAfterSecondCancel !== 1) {
      throw new Error(
        `Double restore detected. stock=${stockAfterSecondCancel}, restoreLogs=${restoreLogsAfterSecondCancel}`
      );
    }

    console.log("✅ Second cancel did not restore stock again");

    console.log("======================================");
    console.log("Result: 6/6 passed");
    console.log("======================================");
  } finally {
    await cleanup(product.id, orderId);
    await prisma.$disconnect();
    console.log("✅ Cleaned up cancel restore smoke data");
  }
}

run().catch(async (error) => {
  console.error("❌ Cancel restore smoke failed:", error);
  await prisma.$disconnect();
  process.exit(1);
});
