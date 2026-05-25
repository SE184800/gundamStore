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

  const allowDemoSeed =
    process.env.NODE_ENV !== "production" || process.env.ALLOW_DEMO_SEED === "true";

  const seedAdminEmail = process.env.SEED_ADMIN_EMAIL || "admin@gundam.local";
  const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD || "";

  if (allowDemoSeed) {
    if (!seedAdminPassword && process.env.NODE_ENV === "production") {
      throw new Error("SEED_ADMIN_PASSWORD is required when ALLOW_DEMO_SEED=true in production.");
    }

    await prisma.user.upsert({
      where: { email: seedAdminEmail },
      update: {},
      create: {
        name: process.env.SEED_ADMIN_NAME || "Admin Demo",
        email: seedAdminEmail,
        passwordHash: await hashPassword(seedAdminPassword || "admin123"),
        roleId: adminRole.id,
      },
    });

    console.log(`Seed admin ensured: ${seedAdminEmail}`);
  } else {
    console.log("Demo admin seed skipped. Set ALLOW_DEMO_SEED=true to enable explicitly.");
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
