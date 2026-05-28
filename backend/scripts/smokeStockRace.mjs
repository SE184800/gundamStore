import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:4800";

function logPass(message) {
  console.log(`✅ ${message}`);
}

function logFail(message) {
  console.error(`❌ ${message}`);
}

async function readJson(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function createOrder(product) {
  const payload = {
    customerName: "Smoke Stock Race Test",
    customerPhone: "0900000000",
    customerEmail: "smoke-stock-race@example.com",
    customerAddress: "Smoke stock race test address",
    shippingFee: 0,
    discount: 0,
    items: [
      {
        productId: product.id,
        sku: product.sku,
        slug: product.slug,
        quantity: 1,
      },
    ],
  };

  const response = await fetch(`${BACKEND_URL}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await readJson(response);

  return {
    status: response.status,
    ok: response.ok,
    data,
  };
}

async function cleanup(productId, orderIds = []) {
  try {
    await prisma.inventoryLog.deleteMany({
      where: {
        productId,
      },
    });

    if (orderIds.length > 0) {
      await prisma.payment.deleteMany({
        where: {
          orderId: {
            in: orderIds,
          },
        },
      });

      await prisma.shipment.deleteMany({
        where: {
          orderId: {
            in: orderIds,
          },
        },
      });

      await prisma.auditLog.deleteMany({
        where: {
          orderId: {
            in: orderIds,
          },
        },
      });

      await prisma.orderItem.deleteMany({
        where: {
          orderId: {
            in: orderIds,
          },
        },
      });

      await prisma.order.deleteMany({
        where: {
          id: {
            in: orderIds,
          },
        },
      });
    }

    await prisma.product.deleteMany({
      where: {
        id: productId,
      },
    });
  } catch (error) {
    console.warn("⚠️ Cleanup warning:", error.message);
  }
}

async function run() {
  console.log("======================================");
  console.log("Stock Race Smoke Test");
  console.log("Backend:", BACKEND_URL);
  console.log("======================================");

  const suffix = Date.now();

  const product = await prisma.product.create({
    data: {
      sku: `SMOKE-RACE-${suffix}`,
      slug: `smoke-race-${suffix}`,
      nameVi: "Smoke Race Test Product",
      nameEn: "Smoke Race Test Product",
      price: 1000,
      oldPrice: 0,
      stock: 1,
      active: true,
      status: "inStock",
      brand: "Smoke Test",
      imageUrl: "/images/products/hi-nu.jpg",
    },
  });

  const createdOrderIds = [];

  try {
    logPass(`Created test product ${product.sku} with stock=1`);

    const [first, second] = await Promise.all([
      createOrder(product),
      createOrder(product),
    ]);

    for (const result of [first, second]) {
      if (result.data?.order?.id) {
        createdOrderIds.push(result.data.order.id);
      }
    }

    console.log("Request results:", [
      {
        status: first.status,
        success: first.data?.success,
        orderId: first.data?.order?.id || "",
        message: first.data?.message || "",
      },
      {
        status: second.status,
        success: second.data?.success,
        orderId: second.data?.order?.id || "",
        message: second.data?.message || "",
      },
    ]);

    const successCount = [first, second].filter((item) => item.status === 201 && item.data?.success === true).length;
    const rejectedCount = [first, second].filter((item) => [400, 409].includes(item.status) && item.data?.success === false).length;
    const serverErrorCount = [first, second].filter((item) => item.status >= 500).length;

    if (serverErrorCount > 0) {
      logFail("Race test returned server error 500.");
      process.exitCode = 1;
      return;
    }

    if (successCount === 1 && rejectedCount === 1) {
      logPass("Race condition protected: only 1 order succeeded, the other was rejected.");
      return;
    }

    logFail(`Unexpected result. successCount=${successCount}, rejectedCount=${rejectedCount}`);
    process.exitCode = 1;
  } finally {
    await cleanup(product.id, createdOrderIds);
    await prisma.$disconnect();
    logPass("Cleaned up stock race test data");
  }
}

run().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
