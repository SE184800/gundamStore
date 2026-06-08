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

async function ensureRole(code, name, permissions = []) {
  const role = await prisma.role.upsert({
    where: { code },
    update: { name },
    create: { code, name },
  });

  for (const permissionCode of permissions) {
    const permission = await prisma.permission.upsert({
      where: { code: permissionCode },
      update: { name: permissionCode },
      create: { code: permissionCode, name: permissionCode },
    });

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: role.id,
        permissionId: permission.id,
      },
    });
  }

  return role;
}

async function ensureUsers() {
  const customerRole = await ensureRole("CUSTOMER", "Customer");
  const adminRole = await ensureRole("ADMIN", "Admin", ["orders:read", "orders:update"]);

  const customerPassword = await bcrypt.hash("customer123", 10);
  const adminPassword = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "customer@gundam.local" },
    update: {
      name: "Customer Demo",
      active: true,
      roleId: customerRole.id,
      passwordHash: customerPassword,
    },
    create: {
      name: "Customer Demo",
      email: "customer@gundam.local",
      active: true,
      roleId: customerRole.id,
      passwordHash: customerPassword,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@gundam.local" },
    update: {
      name: "Admin Demo",
      active: true,
      roleId: adminRole.id,
      passwordHash: adminPassword,
    },
    create: {
      name: "Admin Demo",
      email: "admin@gundam.local",
      active: true,
      roleId: adminRole.id,
      passwordHash: adminPassword,
    },
  });
}

async function login(email, password) {
  const result = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const token = result.data?.token || "";

  if (!result.response.ok || !token) {
    throw new Error(`Login failed for ${email} HTTP ${result.response.status}`);
  }

  return token;
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
  console.log("Admin Order Operation Smoke Test");
  console.log("Backend:", BACKEND_URL);
  console.log("======================================");

  await ensureUsers();

  const suffix = Date.now();
  const product = await prisma.product.create({
    data: {
      sku: `SMOKE-ADMIN-ORDER-${suffix}`,
      slug: `smoke-admin-order-${suffix}`,
      nameVi: "Smoke Admin Order Product",
      nameEn: "Smoke Admin Order Product",
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
    const customerToken = await login("customer@gundam.local", "customer123");
    const adminToken = await login("admin@gundam.local", "admin123");

    console.log("✅ Customer/admin login works");

    const create = await api("/orders", {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        customerName: "Customer Demo",
        customerPhone: "0908888888",
        customerEmail: "customer@gundam.local",
        customerAddress: "123 Smoke Admin Operation, Hồ Chí Minh",
        shippingFee: 0,
        discount: 0,
        paymentMethod: "BANK_TRANSFER",
        paymentReference: "ADMIN-OPS-INIT",
        note: "Smoke admin order operation",
        items: [{ productId: product.id, quantity: 1 }],
      }),
    });

    orderId = create.data?.order?.id || "";

    if (create.response.status !== 201 || !orderId) {
      throw new Error(`Create order failed HTTP ${create.response.status}: ${JSON.stringify(create.data)}`);
    }

    console.log("✅ Order created");

    const adminList = await api("/orders/admin", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const found = (adminList.data?.orders || []).some((item) => item.id === orderId);

    if (!adminList.response.ok || !found) {
      throw new Error("Admin list does not include created order");
    }

    console.log("✅ Admin can list backend orders");

    const confirmed = await api(`/orders/admin/${encodeURIComponent(orderId)}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        status: "CONFIRMED",
        note: "Smoke admin confirms order",
      }),
    });

    if (!confirmed.response.ok || confirmed.data?.order?.status !== "CONFIRMED") {
      throw new Error(`Admin confirm failed HTTP ${confirmed.response.status}: ${JSON.stringify(confirmed.data)}`);
    }

    console.log("✅ Admin can update order status");

    const paid = await api(`/orders/admin/${encodeURIComponent(orderId)}/payment`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        paymentStatus: "PAID",
        method: "BANK_TRANSFER",
        amount: 1000,
        reference: "ADMIN-OPS-PAID",
        note: "Smoke admin confirms payment",
      }),
    });

    if (!paid.response.ok || paid.data?.order?.paymentStatus !== "PAID") {
      throw new Error(`Admin payment failed HTTP ${paid.response.status}: ${JSON.stringify(paid.data)}`);
    }

    console.log("✅ Admin can update payment");

    const shipping = await api(`/orders/admin/${encodeURIComponent(orderId)}/shipping`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        carrier: "GHN",
        trackingCode: `TRACK-${suffix}`,
        shippingMethod: "FAST",
        status: "SHIPPING",
        fee: 0,
        note: "Smoke admin shipping update",
      }),
    });

    const latestShipment = shipping.data?.order?.shipments?.at(-1);

    if (!shipping.response.ok || !latestShipment?.trackingCode) {
      throw new Error(`Admin shipping failed HTTP ${shipping.response.status}: ${JSON.stringify(shipping.data)}`);
    }

    console.log("✅ Admin can update shipping");

    const auditCount = await prisma.auditLog.count({
      where: {
        orderId,
        action: {
          in: ["UPDATE_ORDER_STATUS", "UPDATE_ORDER_PAYMENT", "UPDATE_ORDER_SHIPPING"],
        },
      },
    });

    if (auditCount < 3) {
      throw new Error(`Expected at least 3 audit logs, got ${auditCount}`);
    }

    console.log("✅ Admin operations create audit logs");

    console.log("======================================");
    console.log("Result: 6/6 passed");
    console.log("======================================");
  } finally {
    await cleanup(product.id, orderId);
    await prisma.$disconnect();
    console.log("✅ Cleaned up admin order operation smoke data");
  }
}

run().catch(async (error) => {
  console.error("❌ Admin order operation smoke failed:", error);
  await prisma.$disconnect();
  process.exit(1);
});
