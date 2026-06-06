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

function getPeriodStart(period = "30d") {
  const today = startOfDay(new Date());

  if (period === "7d") return addDays(today, -6);
  if (period === "90d") return addDays(today, -89);
  if (period === "ytd") return new Date(today.getFullYear(), 0, 1);

  return addDays(today, -29);
}

function safeNumber(value = 0) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function isRevenueOrder(order = {}) {
  return !["CANCELLED", "REFUNDED"].includes(String(order.status || "").toUpperCase());
}

function dayKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function csvEscape(value = "") {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function toCsv(rows = [], headers = []) {
  const head = headers.map((item) => csvEscape(item.label)).join(",");
  const body = rows.map((row) => headers.map((item) => csvEscape(row[item.key])).join(",")).join("\n");
  return `${head}\n${body}`;
}

function summarizeOrders(orders = []) {
  const revenueOrders = orders.filter(isRevenueOrder);
  const revenue = revenueOrders.reduce((sum, order) => sum + safeNumber(order.total), 0);

  const statusMap = {};
  const paymentMap = {};
  const revenueByDayMap = {};

  for (const order of orders) {
    statusMap[order.status] = (statusMap[order.status] || 0) + 1;
    paymentMap[order.paymentStatus] = (paymentMap[order.paymentStatus] || 0) + 1;

    const key = dayKey(order.createdAt);
    revenueByDayMap[key] = revenueByDayMap[key] || { date: key, orders: 0, revenue: 0 };
    revenueByDayMap[key].orders += 1;
    if (isRevenueOrder(order)) revenueByDayMap[key].revenue += safeNumber(order.total);
  }

  return {
    totalOrders: orders.length,
    revenue,
    avgOrderValue: revenueOrders.length ? Math.round(revenue / revenueOrders.length) : 0,
    statusSummary: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
    paymentSummary: Object.entries(paymentMap).map(([status, count]) => ({ status, count })),
    revenueByDay: Object.values(revenueByDayMap).sort((a, b) => a.date.localeCompare(b.date)),
  };
}

function summarizeOrderItems(items = []) {
  const map = new Map();

  for (const item of items) {
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

  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
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

async function buildReportData(period = "30d") {
  const start = getPeriodStart(period);

  const [
    orders,
    orderItems,
    products,
    customers,
    reviews,
    complaints,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: start } },
      include: {
        items: true,
        payments: true,
        shipments: { orderBy: [{ createdAt: "desc" }] },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 3000,
    }),
    prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: start },
          status: { notIn: ["CANCELLED", "REFUNDED"] },
        },
      },
      take: 5000,
    }),
    prisma.product.findMany({
      include: {
        category: true,
        variants: true,
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 3000,
    }),
    prisma.user.findMany({
      include: {
        profile: true,
        orders: {
          where: { createdAt: { gte: start } },
          orderBy: [{ createdAt: "desc" }],
        },
      },
      take: 3000,
    }),
    prisma.productReview.findMany({
      where: { createdAt: { gte: start } },
      include: {
        product: {
          select: { sku: true, nameVi: true, nameEn: true },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 2000,
    }),
    prisma.complaintTicket.findMany({
      where: { createdAt: { gte: start } },
      include: {
        order: true,
      },
      orderBy: [{ createdAt: "desc" }],
      take: 2000,
    }),
  ]);

  const orderSummary = summarizeOrders(orders);
  const topProducts = summarizeOrderItems(orderItems).slice(0, 20);

  const productRows = products.map((product) => {
    const issues = getProductIssue(product);

    return {
      id: product.id,
      sku: product.sku,
      name: product.nameVi || product.nameEn || product.sku,
      category: product.category?.nameVi || product.category?.nameEn || "",
      active: product.active !== false,
      status: product.status || "",
      price: safeNumber(product.price),
      stock: safeNumber(product.stock),
      variantCount: product.variants?.length || 0,
      issues: issues.join("; "),
    };
  });

  const customerRows = customers.map((customer) => {
    const revenueOrders = (customer.orders || []).filter(isRevenueOrder);
    const spent = revenueOrders.reduce((sum, order) => sum + safeNumber(order.total), 0);
    const lastOrder = (customer.orders || [])[0] || null;

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.profile?.phone || "",
      orderCount: customer.orders?.length || 0,
      totalSpent: spent,
      lastOrderAt: lastOrder?.createdAt || "",
      active: customer.active !== false,
    };
  }).sort((a, b) => b.totalSpent - a.totalSpent);

  const fulfillmentRows = orders.map((order) => {
    const shipment = order.shipments?.[0] || null;

    return {
      id: order.id,
      orderNo: order.orderNo,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      status: order.status,
      paymentStatus: order.paymentStatus,
      carrier: shipment?.carrier || "",
      trackingCode: shipment?.trackingCode || "",
      shipmentStatus: shipment?.status || "",
      total: safeNumber(order.total),
      createdAt: order.createdAt,
    };
  });

  const reviewRows = reviews.map((review) => ({
    id: review.id,
    productSku: review.product?.sku || "",
    productName: review.product?.nameVi || review.product?.nameEn || "",
    customerName: review.customerName,
    rating: review.rating,
    status: review.status,
    verifiedPurchase: review.verifiedPurchase,
    createdAt: review.createdAt,
  }));

  const complaintRows = complaints.map((ticket) => ({
    id: ticket.id,
    ticketNo: ticket.ticketNo,
    orderNo: ticket.order?.orderNo || "",
    customerName: ticket.customerName,
    customerPhone: ticket.customerPhone || "",
    type: ticket.type,
    issue: ticket.issue,
    priority: ticket.priority,
    status: ticket.status,
    refundAmount: safeNumber(ticket.refundAmount),
    refundStatus: ticket.refundStatus,
    createdAt: ticket.createdAt,
  }));

  return {
    period,
    generatedAt: new Date(),
    summary: {
      ...orderSummary,
      products: products.length,
      activeProducts: products.filter((product) => product.active !== false).length,
      productIssues: productRows.filter((item) => item.issues).length,
      lowStock: productRows.filter((item) => item.active && item.stock > 0 && item.stock <= 5).length,
      customers: customers.length,
      pendingReviews: reviewRows.filter((item) => item.status === "PENDING").length,
      openComplaints: complaintRows.filter((item) => !["RESOLVED", "CLOSED", "REJECTED"].includes(item.status)).length,
    },
    reports: {
      orders: orders.map((order) => ({
        id: order.id,
        orderNo: order.orderNo,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        status: order.status,
        paymentStatus: order.paymentStatus,
        subtotal: order.subtotal,
        shippingFee: order.shippingFee,
        discount: order.discount,
        shippingDiscount: order.shippingDiscount,
        voucherCode: order.voucherCode || "",
        total: order.total,
        createdAt: order.createdAt,
      })),
      salesByDay: orderSummary.revenueByDay,
      topProducts,
      products: productRows,
      customers: customerRows,
      fulfillment: fulfillmentRows,
      reviews: reviewRows,
      complaints: complaintRows,
    },
  };
}

const EXPORT_HEADERS = {
  orders: [
    { key: "orderNo", label: "Order No" },
    { key: "customerName", label: "Customer" },
    { key: "customerPhone", label: "Phone" },
    { key: "customerEmail", label: "Email" },
    { key: "status", label: "Status" },
    { key: "paymentStatus", label: "Payment Status" },
    { key: "subtotal", label: "Subtotal" },
    { key: "shippingFee", label: "Shipping Fee" },
    { key: "discount", label: "Discount" },
    { key: "shippingDiscount", label: "Shipping Discount" },
    { key: "voucherCode", label: "Voucher" },
    { key: "total", label: "Total" },
    { key: "createdAt", label: "Created At" },
  ],
  salesByDay: [
    { key: "date", label: "Date" },
    { key: "orders", label: "Orders" },
    { key: "revenue", label: "Revenue" },
  ],
  topProducts: [
    { key: "sku", label: "SKU" },
    { key: "name", label: "Product" },
    { key: "quantity", label: "Quantity" },
    { key: "revenue", label: "Revenue" },
  ],
  products: [
    { key: "sku", label: "SKU" },
    { key: "name", label: "Product" },
    { key: "category", label: "Category" },
    { key: "active", label: "Active" },
    { key: "status", label: "Status" },
    { key: "price", label: "Price" },
    { key: "stock", label: "Stock" },
    { key: "variantCount", label: "Variants" },
    { key: "issues", label: "Data Issues" },
  ],
  customers: [
    { key: "name", label: "Customer" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "orderCount", label: "Orders" },
    { key: "totalSpent", label: "Total Spent" },
    { key: "lastOrderAt", label: "Last Order At" },
    { key: "active", label: "Active" },
  ],
  fulfillment: [
    { key: "orderNo", label: "Order No" },
    { key: "customerName", label: "Customer" },
    { key: "customerPhone", label: "Phone" },
    { key: "status", label: "Order Status" },
    { key: "paymentStatus", label: "Payment Status" },
    { key: "carrier", label: "Carrier" },
    { key: "trackingCode", label: "Tracking" },
    { key: "shipmentStatus", label: "Shipment Status" },
    { key: "total", label: "Total" },
    { key: "createdAt", label: "Created At" },
  ],
  reviews: [
    { key: "productSku", label: "Product SKU" },
    { key: "productName", label: "Product" },
    { key: "customerName", label: "Customer" },
    { key: "rating", label: "Rating" },
    { key: "status", label: "Status" },
    { key: "verifiedPurchase", label: "Verified Purchase" },
    { key: "createdAt", label: "Created At" },
  ],
  complaints: [
    { key: "ticketNo", label: "Ticket No" },
    { key: "orderNo", label: "Order No" },
    { key: "customerName", label: "Customer" },
    { key: "customerPhone", label: "Phone" },
    { key: "type", label: "Type" },
    { key: "issue", label: "Issue" },
    { key: "priority", label: "Priority" },
    { key: "status", label: "Status" },
    { key: "refundAmount", label: "Refund Amount" },
    { key: "refundStatus", label: "Refund Status" },
    { key: "createdAt", label: "Created At" },
  ],
};

export async function getAdminReportCenter(req, res, next) {
  try {
    const period = String(req.query.period || "30d");
    const data = await buildReportData(period);

    res.json({
      success: true,
      ...data,
    });
  } catch (error) {
    next(error);
  }
}

export async function exportAdminReportCsv(req, res, next) {
  try {
    const period = String(req.query.period || "30d");
    const type = String(req.query.type || "orders");

    const data = await buildReportData(period);
    const rows = data.reports[type];

    if (!Array.isArray(rows) || !EXPORT_HEADERS[type]) {
      return res.status(400).json({
        success: false,
        message: "Unsupported report type.",
      });
    }

    const csv = toCsv(rows, EXPORT_HEADERS[type]);
    const filename = `gundam-${type}-${period}-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(`\uFEFF${csv}`);
  } catch (error) {
    next(error);
  }
}
