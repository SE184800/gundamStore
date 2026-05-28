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

async function run() {
  console.log("======================================");
  console.log("Address Book Smoke Test");
  console.log("Backend:", BACKEND_URL);
  console.log("======================================");

  const customer = await ensureCustomer();

  await prisma.userAddress.deleteMany({
    where: {
      userId: customer.id,
      label: {
        startsWith: "Smoke Address",
      },
    },
  });

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

  const createFirst = await api("/api/account/addresses", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      label: "Smoke Address Home",
      receiver: "Customer Home",
      phone: "0908888888",
      address: "123 Smoke Home Street",
      city: "Hồ Chí Minh",
      district: "Quận 1",
      ward: "Phường Bến Nghé",
      isDefault: true,
    }),
  });

  const firstId = createFirst.data?.address?.id || "";

  if (createFirst.response.status !== 201 || !firstId || !createFirst.data?.address?.isDefault) {
    throw new Error(`Create first default address failed HTTP ${createFirst.response.status}`);
  }

  console.log("✅ Created default address");

  const createSecond = await api("/api/account/addresses", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      label: "Smoke Address Office",
      receiver: "Customer Office",
      phone: "0909999999",
      address: "456 Smoke Office Street",
      city: "Hà Nội",
      district: "Ba Đình",
      ward: "Phường Điện Biên",
      isDefault: false,
    }),
  });

  const secondId = createSecond.data?.address?.id || "";

  if (createSecond.response.status !== 201 || !secondId) {
    throw new Error(`Create second address failed HTTP ${createSecond.response.status}`);
  }

  console.log("✅ Created second address");

  const setDefault = await api(`/api/account/addresses/${encodeURIComponent(secondId)}/default`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!setDefault.response.ok || setDefault.data?.address?.isDefault !== true) {
    throw new Error(`Set default failed HTTP ${setDefault.response.status}`);
  }

  const list = await api("/api/account/addresses", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const addresses = list.data?.addresses || [];
  const defaultCount = addresses.filter((item) => item.isDefault).length;
  const secondIsDefault = addresses.find((item) => item.id === secondId)?.isDefault === true;

  if (!list.response.ok || defaultCount !== 1 || !secondIsDefault) {
    throw new Error(`Default uniqueness failed. defaultCount=${defaultCount}, secondIsDefault=${secondIsDefault}`);
  }

  console.log("✅ Default address uniqueness works");

  const update = await api(`/api/account/addresses/${encodeURIComponent(secondId)}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      receiver: "Updated Office Receiver",
      phone: "0907777777",
    }),
  });

  if (!update.response.ok || update.data?.address?.receiver !== "Updated Office Receiver") {
    throw new Error(`Update address failed HTTP ${update.response.status}`);
  }

  console.log("✅ Updated address");

  const remove = await api(`/api/account/addresses/${encodeURIComponent(firstId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!remove.response.ok) {
    throw new Error(`Delete address failed HTTP ${remove.response.status}`);
  }

  console.log("✅ Deleted address");

  await prisma.userAddress.deleteMany({
    where: {
      userId: customer.id,
      label: {
        startsWith: "Smoke Address",
      },
    },
  });

  console.log("======================================");
  console.log("Result: 6/6 passed");
  console.log("======================================");
}

run()
  .catch(async (error) => {
    console.error("❌ Address book smoke failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("✅ Cleaned up address book smoke data");
  });
