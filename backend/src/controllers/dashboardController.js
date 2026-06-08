import { prisma } from "../config/prisma.js";

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isRevenueOrder(order = {}) {
  return !["CANCELLED", "REFUNDED"].includes(String(order.status || "").toUpperCase());
}

function safeNumber(value = 0) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function dayKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function buildDailyTrend(orders = [], days = 14) {
  const today = startOfDay(new Date());
  const keys = Array.from({ length: days }).map((_, index) => {
    return dayKey(addDays(today, index - days + 1));
  });

  const map = new Map(
    keys.map((key) => [
      key,
      {
        date: key,
        orders: 0,
        revenue: 0,
      },
    ])
  );

  for (const order of orders) {
    const key = dayKey(order.createdAt);
    if (!map.has(key)) continue;

    const item = map.get(key);
    item.orders += 1;
    if (isRevenueOrder(order)) item.revenue += safeNumber(order.total);
  }

  return Array.from(map.values());
}

function mapTopProducts(orderItems = []) {
  const map = new Map();

  for (const item of orderItems) {
    const key = item.variantSku || item.sku || item.productId;
    const current = map.get(key) || {
      sku: item.variantSku || item.sku || "",
      name: item.variantName || item.name || "",
      quantity: 0,
      revenue: 0,
    };

    current.quantity += safeNumber(item.quantity);
    current.revenue += safeNumber(item.quantity) * safeNumber(item.price);
    map.set(key, current);
  }

  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);
}

function getProductIssue(product = {}) {
  const issues = [];
  const status = String(product.status || "").toLowerCase();
  const allowNoStock = status.includes("pre") || status.includes("coming");

  if (!product.sku) issues.push("Missing SKU");
  if (!product.nameVi && !product.nameEn) issues.push("Missing name");
  if (!product.categoryId) issues.push("Missing category");
  if (!product.imageUrl) issues.push("Missing image");
  if (safeNumber(product.price) <= 0) issues.push("Missing price");
  if (safeNumber(product.stock) <= 0 && !allowNoStock) issues.push("Missing stock");

  return issues;
}

export async function getAdminDashboardKpis(req, res, next) {
  try {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = addDays(today, 1);
    const last14Start = addDays(today, -13);
    const last30Start = addDays(today, -29);

    const [
      orders30,
      ordersToday,
      products,
      customersCount,
      reviewsPending,
      complaintsOpen,
      fulfillmentOrders,
      orderItems30,
      vouchers,
    ] = await Promise.all([
      prisma.order.findMany({
        where: {
          createdAt: {
            gte: last30Start,
          },
        },
        include: {
          shipments: {
            orderBy: [{ createdAt: "desc" }],
          },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 1000,
      }),
      prisma.order.findMany({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      prisma.product.findMany({
        include: {
          category: true,
          variants: true,
        },
        orderBy: [{ updatedAt: "desc" }],
        take: 1000,
      }),
      prisma.user.count(),
      prisma.productReview.count({
        where: {
          status: "PENDING",
        },
      }),
      prisma.complaintTicket.count({
        where: {
          status: {
            in: ["NEW", "VERIFYING", "WAITING_CUSTOMER", "APPROVED"],
          },
        },
      }),
      prisma.order.findMany({
        where: {
          status: {
            in: ["PLACED", "CONFIRMED", "PACKING", "SHIPPING", "DELIVERED"],
          },
        },
        include: {
          shipments: {
            orderBy: [{ createdAt: "desc" }],
          },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 300,
      }),
      prisma.orderItem.findMany({
        where: {
          order: {
            createdAt: {
              gte: last30Start,
            },
            status: {
              notIn: ["CANCELLED", "REFUNDED"],
            },
          },
        },
        take: 1000,
      }),
      prisma.voucher.findMany({
        where: {
          active: true,
        },
        orderBy: [{ updatedAt: "desc" }],
        take: 50,
      }),
    ]);

    const revenueOrders30 = orders30.filter(isRevenueOrder);
    const revenue30 = revenueOrders30.reduce((sum, order) => sum + safeNumber(order.total), 0);
    const revenueToday = ordersToday.filter(isRevenueOrder).reduce((sum, order) => sum + safeNumber(order.total), 0);

    const productIssues = products
      .map((product) => ({
        id: product.id,
        sku: product.sku,
        name: product.nameVi || product.nameEn || product.sku,
        active: product.active,
        price: product.price,
        stock: product.stock,
        category: product.category?.nameVi || product.category?.nameEn || "",
        issues: getProductIssue(product),
      }))
      .filter((item) => item.issues.length > 0)
      .slice(0, 12);

    const lowStockProducts = products
      .filter((product) => product.active !== false && safeNumber(product.stock) > 0 && safeNumber(product.stock) <= 5)
      .map((product) => ({
        id: product.id,
        sku: product.sku,
        name: product.nameVi || product.nameEn || product.sku,
        stock: product.stock,
      }))
      .slice(0, 12);

    const fulfillmentSummary = {
      placed: fulfillmentOrders.filter((order) => order.status === "PLACED").length,
      confirmed: fulfillmentOrders.filter((order) => order.status === "CONFIRMED").length,
      packing: fulfillmentOrders.filter((order) => order.status === "PACKING").length,
      shipping: fulfillmentOrders.filter((order) => order.status === "SHIPPING").length,
      delivered: fulfillmentOrders.filter((order) => order.status === "DELIVERED").length,
      needsTracking: fulfillmentOrders.filter((order) => {
        const shipment = order.shipments?.[0] || null;
        return order.status === "SHIPPING" && !shipment?.trackingCode;
      }).length,
    };

    const orderStatusSummary = orders30.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    const paymentSummary = orders30.reduce((acc, order) => {
      acc[order.paymentStatus] = (acc[order.paymentStatus] || 0) + 1;
      return acc;
    }, {});

    const activeVoucherSummary = vouchers.map((voucher) => ({
      id: voucher.id,
      code: voucher.code,
      name: voucher.nameVi || voucher.nameEn || voucher.code,
      type: voucher.type,
      value: voucher.value,
      usedCount: voucher.usedCount,
      usageLimit: voucher.usageLimit,
      endDate: voucher.endDate,
    }));

    res.json({
      success: true,
      generatedAt: now,
      kpis: {
        revenueToday,
        revenue30,
        ordersToday: ordersToday.length,
        orders30: orders30.length,
        avgOrderValue30: revenueOrders30.length ? Math.round(revenue30 / revenueOrders30.length) : 0,
        activeProducts: products.filter((product) => product.active !== false).length,
        productIssues: productIssues.length,
        lowStockProducts: lowStockProducts.length,
        customers: customersCount,
        pendingReviews: reviewsPending,
        openComplaints: complaintsOpen,
        fulfillmentNeedsTracking: fulfillmentSummary.needsTracking,
      },
      charts: {
        dailyTrend: buildDailyTrend(orders30.filter((order) => new Date(order.createdAt) >= last14Start), 14),
        orderStatusSummary,
        paymentSummary,
        fulfillmentSummary,
        topProducts: mapTopProducts(orderItems30),
      },
      actionQueues: {
        productIssues,
        lowStockProducts,
        fulfillment: fulfillmentOrders.slice(0, 10).map((order) => ({
          id: order.id,
          orderNo: order.orderNo,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          status: order.status,
          paymentStatus: order.paymentStatus,
          total: order.total,
          createdAt: order.createdAt,
          trackingCode: order.shipments?.[0]?.trackingCode || "",
        })),
        vouchers: activeVoucherSummary,
      },
    });
  } catch (error) {
    next(error);
  }
}
