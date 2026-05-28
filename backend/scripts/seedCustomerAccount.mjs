import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const customerRole = await prisma.role.upsert({
    where: {
      code: "CUSTOMER",
    },
    update: {
      name: "Customer",
    },
    create: {
      code: "CUSTOMER",
      name: "Customer",
    },
  });

  const passwordHash = await bcrypt.hash("customer123", 10);

  const customer = await prisma.user.upsert({
    where: {
      email: "customer@gundam.local",
    },
    update: {
      name: "Customer Demo",
      active: true,
      roleId: customerRole.id,
      passwordHash,
    },
    create: {
      name: "Customer Demo",
      email: "customer@gundam.local",
      active: true,
      roleId: customerRole.id,
      passwordHash,
    },
    include: {
      role: true,
    },
  });

  await prisma.userProfile.upsert({
    where: {
      userId: customer.id,
    },
    update: {
      phone: "0908888888",
      city: "Hồ Chí Minh",
      district: "Quận 1",
      ward: "Phường Bến Nghé",
      address: "123 Demo Customer Street",
      postalCode: "700000",
    },
    create: {
      userId: customer.id,
      phone: "0908888888",
      city: "Hồ Chí Minh",
      district: "Quận 1",
      ward: "Phường Bến Nghé",
      address: "123 Demo Customer Street",
      postalCode: "700000",
    },
  });

  console.log("✅ Customer account ready");
  console.log({
    email: customer.email,
    password: "customer123",
    role: customer.role.code,
  });
}

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
