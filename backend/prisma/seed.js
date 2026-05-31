import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/password.js";

const prisma = new PrismaClient();

const permissions = [
  ["orders:read", "Read orders"],
  ["orders:update", "Update orders"],
  ["products:read", "Read products"],
  ["products:update", "Update products"],
  ["inventory:update", "Update inventory"],
  ["settings:update", "Update settings"],
];

async function main() {
  for (const [code, name] of permissions) {
    await prisma.permission.upsert({
      where: { code },
      update: { name },
      create: { code, name },
    });
  }

  const adminRole = await prisma.role.upsert({
    where: { code: "ADMIN" },
    update: { name: "Admin" },
    create: { code: "ADMIN", name: "Admin" },
  });

  const allPermissions = await prisma.permission.findMany();

  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  const seedMode =
    process.env.SEED_MODE || (process.env.NODE_ENV === "production" ? "production" : "demo");
  const isProductionSeed = seedMode === "production";
  const allowDemoSeed =
    seedMode === "demo" &&
    (process.env.NODE_ENV !== "production" || process.env.ALLOW_DEMO_SEED === "true");

  const requiredProductionAdminFields = [
    ["SEED_ADMIN_EMAIL", process.env.SEED_ADMIN_EMAIL],
    ["SEED_ADMIN_PASSWORD", process.env.SEED_ADMIN_PASSWORD],
    ["SEED_ADMIN_NAME", process.env.SEED_ADMIN_NAME],
  ];

  if (isProductionSeed) {
    const missing = requiredProductionAdminFields
      .filter(([, value]) => !String(value || "").trim())
      .map(([key]) => key);

    if (missing.length) {
      throw new Error(
        `Production seed requires explicit admin values: ${missing.join(", ")}. Do not use demo defaults in production.`
      );
    }

    await prisma.user.upsert({
      where: { email: process.env.SEED_ADMIN_EMAIL },
      update: {
        name: process.env.SEED_ADMIN_NAME,
        roleId: adminRole.id,
      },
      create: {
        name: process.env.SEED_ADMIN_NAME,
        email: process.env.SEED_ADMIN_EMAIL,
        passwordHash: await hashPassword(process.env.SEED_ADMIN_PASSWORD),
        roleId: adminRole.id,
      },
    });

    console.log(`Production admin ensured: ${process.env.SEED_ADMIN_EMAIL}`);
  } else if (allowDemoSeed) {
    const seedAdminEmail = process.env.SEED_ADMIN_EMAIL || "admin@gundam.local";
    const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD || "change-me-dev-password";
    const seedAdminName = process.env.SEED_ADMIN_NAME || "Admin Preview";

    await prisma.user.upsert({
      where: { email: seedAdminEmail },
      update: {},
      create: {
        name: seedAdminName,
        email: seedAdminEmail,
        passwordHash: await hashPassword(seedAdminPassword),
        roleId: adminRole.id,
      },
    });

    console.log(`Development admin ensured: ${seedAdminEmail}`);
  } else {
    console.log("Admin seed skipped. Use SEED_MODE=production with explicit admin env values for production.");
  }

  const products = [
    {
      sku: "RG-HINU-144-BD",
      slug: "rg-1-144-hi-nu-gundam",
      nameVi: "RG 1/144 Hi-ν Gundam",
      nameEn: "RG 1/144 Hi-ν Gundam",
      price: 1150000,
      stock: 65,
    },
    {
      sku: "HG-AERIAL-144-BD",
      slug: "hg-1-144-gundam-aerial",
      nameVi: "HG 1/144 Gundam Aerial",
      nameEn: "HG 1/144 Gundam Aerial",
      price: 520000,
      stock: 64,
    },
    {
      sku: "MG-FREEDOM-100-VER20",
      slug: "mg-1-100-freedom-gundam-ver-2-0",
      nameVi: "MG 1/100 Freedom Gundam Ver.2.0",
      nameEn: "MG 1/100 Freedom Gundam Ver.2.0",
      price: 1250000,
      stock: 30,
    },
    {
      sku: "ACTION-BASE-5-CLEAR",
      slug: "action-base-5-clear",
      nameVi: "Action Base 5 Clear",
      nameEn: "Action Base 5 Clear",
      price: 180000,
      stock: 19,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: product,
      create: product,
    });
  }

  console.log("Seed completed");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
