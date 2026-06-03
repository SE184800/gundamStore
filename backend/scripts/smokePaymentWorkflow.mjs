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

  const customer = await prisma.user.upsert({
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

  const admin = await prisma.user.upsert({
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

  return { customer, admin };
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

async function run() {
  console.log("======================================");
  console.log("Payment Workflow Smoke Test");
  console.log("Backend:", BACKEND_URL);
  console.log("======================================");

  await ensureUsers();

  const suffix = Date.now();
  const product = await prisma.product.create({
    data: {
      sku: `SMOKE-PAYMENT-${suffix}`,
      slug: `smoke-payment-${suffix}`,
      nameVi: "Smoke Payment Product",
      nameEn: "Smoke Payment Product",
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

    const create = await api("/api/orders", {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        customerName: "Customer Demo",
        customerPhone: "0908888888",
        customerEmail: "customer@gundam.local",
        customerAddress: "123 Smoke Payment Address, Hồ Chí Minh",
        shippingFee: 0,
        discount: 0,
        paymentMethod: "BANK_TRANSFER",
        paymentReference: "BANK-REF-SMOKE",
        note: "Smoke payment workflow",
        items: [{ productId: product.id, quantity: 1 }],
      }),
    });

    orderId = create.data?.order?.id || "";

    if (create.response.status !== 201 || !orderId) {
      throw new Error(`Create order failed HTTP ${create.response.status}: ${JSON.stringify(create.data)}`);
    }

    const initialPayment = create.data?.order?.payments?.[0];

    if (create.data?.order?.paymentStatus !== "UNPAID" || initialPayment?.method !== "BANK_TRANSFER") {
      throw new Error(`Initial payment not created correctly: ${JSON.stringify(create.data?.order)}`);
    }

    console.log("✅ Order created with initial payment record");

    const paid = await api(`/api/orders/admin/${encodeURIComponent(orderId)}/payment`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        paymentStatus: "PAID",
        method: "BANK_TRANSFER",
        amount: 1000,
        reference: "BANK-CONFIRMED-SMOKE",
        note: "Admin confirmed bank transfer",
      }),
    });

    if (!paid.response.ok || paid.data?.order?.paymentStatus !== "PAID") {
      throw new Error(`Admin payment confirmation failed HTTP ${paid.response.status}: ${JSON.stringify(paid.data)}`);
    }

    console.log("✅ Admin confirmed payment");

    const dbPayments = await prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
    });

    if (dbPayments.length < 2 || dbPayments.at(-1)?.status !== "PAID") {
      throw new Error(`Payment history not recorded correctly: ${JSON.stringify(dbPayments)}`);
    }

    console.log("✅ Payment history recorded");

    const auditCount = await prisma.auditLog.count({
      where: {
        orderId,
        action: "UPDATE_ORDER_PAYMENT",
      },
    });

    if (auditCount < 1) {
      throw new Error("Payment audit log was not created");
    }

    console.log("✅ Payment audit log created");

    const customerDetail = await api(`/api/orders/my/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });

    if (!customerDetail.response.ok || customerDetail.data?.order?.paymentStatus !== "PAID") {
      throw new Error(`Customer cannot see paid status HTTP ${customerDetail.response.status}`);
    }

    console.log("✅ Customer sees updated payment status");

    console.log("======================================");
    console.log("Result: 5/5 passed");
    console.log("======================================");
  } finally {
    await cleanup(product.id, orderId);
    await prisma.$disconnect();
    console.log("✅ Cleaned up payment smoke data");
  }
}

run().catch(async (error) => {
  console.error("❌ Payment workflow smoke failed:", error);
  await prisma.$disconnect();
  process.exit(1);
});
