import { z } from "zod";
import { prisma } from "../config/prisma.js";

function cleanText(value = "", max = 500) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizePhone(value = "") {
  return String(value || "").replace(/[^\d+]/g, "").trim();
}

function customerKeyFromOrder(order = {}) {
  const phone = normalizePhone(order.customerPhone);
  const email = String(order.customerEmail || "").trim().toLowerCase();

  if (phone) return `guest:phone:${phone}`;
  if (email) return `guest:email:${email}`;
  return `guest:order:${order.id}`;
}

function registeredCustomerKey(userId = "") {
  return `user:${userId}`;
}

function isRevenueOrder(order = {}) {
  return !["CANCELLED", "REFUNDED"].includes(String(order.status || "").toUpperCase());
}

function getTier(totalSpent = 0, totalOrders = 0) {
  if (totalSpent >= 20000000 || totalOrders >= 20) return "VIP";
  if (totalSpent >= 8000000 || totalOrders >= 8) return "Loyal";
  if (totalSpent > 0) return "New buyer";
  return "Lead";
}

function getSegment(customer = {}) {
  if (customer.totalOrders <= 0) return "Lead";
  if (customer.daysSinceLastOrder > 90) return "At risk";
  if (customer.totalSpent >= 20000000 || customer.totalOrders >= 20) return "High value";
  if (customer.totalOrders >= 2) return "Repeat buyer";
  return "First-time buyer";
}

function daysSince(date) {
  if (!date) return null;
  const time = new Date(date).getTime();
  if (!Number.isFinite(time)) return null;
  return Math.floor((Date.now() - time) / 86400000);
}

function summarizeOrders(orders = []) {
  const revenueOrders = orders.filter(isRevenueOrder);
  const totalOrders = orders.length;
  const revenueOrdersCount = revenueOrders.length;
  const totalSpent = revenueOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const lastOrder = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
  const firstOrder = [...orders].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0] || null;

  return {
    totalOrders,
    revenueOrders: revenueOrdersCount,
    totalSpent,
    avgOrderValue: revenueOrdersCount ? Math.round(totalSpent / revenueOrdersCount) : 0,
    lastOrderAt: lastOrder?.createdAt || null,
    firstOrderAt: firstOrder?.createdAt || null,
    daysSinceLastOrder: daysSince(lastOrder?.createdAt),
  };
}

function mapOrder(order = {}) {
  return {
    id: order.id,
    orderNo: order.orderNo,
    status: order.status,
    paymentStatus: order.paymentStatus,
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    discount: order.discount,
    shippingDiscount: order.shippingDiscount,
    total: order.total,
    voucherCode: order.voucherCode || "",
    createdAt: order.createdAt,
    items: order.items || [],
  };
}

function mapRegisteredCustomer(user = {}, noteCount = 0) {
  const orders = user.orders || [];
  const metrics = summarizeOrders(orders);
  const phone = user.profile?.phone || user.addresses?.[0]?.phone || orders[0]?.customerPhone || "";
  const city = user.profile?.city || user.addresses?.[0]?.city || "";

  const base = {
    id: user.id,
    customerKey: registeredCustomerKey(user.id),
    type: "REGISTERED",
    name: user.name,
    email: user.email,
    phone,
    city,
    active: user.active !== false,
    createdAt: user.createdAt,
    note: user.profile?.note || "",
    address: user.profile?.address || user.addresses?.[0]?.address || "",
    addresses: user.addresses || [],
    wishlistCount: user.wishlistItems?.length || 0,
    reviewCount: user.productReviews?.length || 0,
    voucherRedemptionCount: user.voucherRedemptions?.length || 0,
    noteCount,
    recentOrders: orders.slice(0, 5).map(mapOrder),
    ...metrics,
  };

  return {
    ...base,
    tier: getTier(base.totalSpent, base.totalOrders),
    segment: getSegment(base),
  };
}

function mapGuestCustomer(customerKey = "", orders = [], noteCount = 0) {
  const first = orders[0] || {};
  const metrics = summarizeOrders(orders);

  const base = {
    id: customerKey,
    customerKey,
    type: "GUEST",
    name: first.customerName || "Guest customer",
    email: first.customerEmail || "",
    phone: first.customerPhone || "",
    city: "",
    active: true,
    createdAt: metrics.firstOrderAt,
    note: "",
    address: first.customerAddress || "",
    addresses: [],
    wishlistCount: 0,
    reviewCount: 0,
    voucherRedemptionCount: 0,
    noteCount,
    recentOrders: orders.slice(0, 5).map(mapOrder),
    ...metrics,
  };

  return {
    ...base,
    tier: getTier(base.totalSpent, base.totalOrders),
    segment: getSegment(base),
  };
}

async function getNoteCounts(keys = []) {
  if (!keys.length) return new Map();

  const notes = await prisma.customerNote.groupBy({
    by: ["customerKey"],
    where: {
      customerKey: { in: keys },
    },
    _count: {
      id: true,
    },
  });

  return new Map(notes.map((item) => [item.customerKey, item._count.id]));
}

export async function listAdminCustomers(req, res, next) {
  try {
    const q = cleanText(req.query.q || "", 120).toLowerCase();
    const type = String(req.query.type || "ALL").toUpperCase();
    const segment = String(req.query.segment || "ALL");

    const [users, guestOrders] = await Promise.all([
      prisma.user.findMany({
        include: {
          profile: true,
          addresses: {
            orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
          },
          wishlistItems: true,
          productReviews: true,
          voucherRedemptions: true,
          orders: {
            include: {
              items: true,
            },
            orderBy: [{ createdAt: "desc" }],
          },
        },
        orderBy: [{ createdAt: "desc" }],
      }),
      prisma.order.findMany({
        where: {
          customerId: null,
        },
        include: {
          items: true,
        },
        orderBy: [{ createdAt: "desc" }],
      }),
    ]);

    const guestGroups = new Map();

    for (const order of guestOrders) {
      const key = customerKeyFromOrder(order);
      if (!guestGroups.has(key)) guestGroups.set(key, []);
      guestGroups.get(key).push(order);
    }

    const keys = [
      ...users.map((user) => registeredCustomerKey(user.id)),
      ...guestGroups.keys(),
    ];

    const noteCounts = await getNoteCounts(keys);

    let customers = [
      ...users.map((user) => mapRegisteredCustomer(user, noteCounts.get(registeredCustomerKey(user.id)) || 0)),
      ...Array.from(guestGroups.entries()).map(([key, orders]) => mapGuestCustomer(key, orders, noteCounts.get(key) || 0)),
    ];

    if (type !== "ALL") {
      customers = customers.filter((item) => item.type === type);
    }

    if (segment !== "ALL") {
      customers = customers.filter((item) => item.segment === segment || item.tier === segment);
    }

    if (q) {
      customers = customers.filter((item) =>
        [
          item.name,
          item.email,
          item.phone,
          item.city,
          item.customerKey,
          item.segment,
          item.tier,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    customers.sort((a, b) => {
      const spendDiff = Number(b.totalSpent || 0) - Number(a.totalSpent || 0);
      if (spendDiff !== 0) return spendDiff;
      return new Date(b.lastOrderAt || b.createdAt || 0) - new Date(a.lastOrderAt || a.createdAt || 0);
    });

    res.json({
      success: true,
      customers,
      summary: {
        total: customers.length,
        registered: customers.filter((item) => item.type === "REGISTERED").length,
        guest: customers.filter((item) => item.type === "GUEST").length,
        highValue: customers.filter((item) => item.segment === "High value" || item.tier === "VIP").length,
        atRisk: customers.filter((item) => item.segment === "At risk").length,
        totalSpent: customers.reduce((sum, item) => sum + Number(item.totalSpent || 0), 0),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminCustomerDetail(req, res, next) {
  try {
    const key = decodeURIComponent(req.params.key || "");

    let customer = null;
    let orders = [];

    if (key.startsWith("user:")) {
      const userId = key.replace(/^user:/, "");
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          addresses: {
            orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
          },
          wishlistItems: {
            include: {
              product: true,
            },
            orderBy: [{ createdAt: "desc" }],
          },
          productReviews: {
            include: {
              product: true,
            },
            orderBy: [{ createdAt: "desc" }],
          },
          voucherRedemptions: {
            include: {
              voucher: true,
            },
            orderBy: [{ createdAt: "desc" }],
          },
          orders: {
            include: {
              items: true,
              payments: true,
              shipments: true,
            },
            orderBy: [{ createdAt: "desc" }],
          },
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Customer not found.",
        });
      }

      orders = user.orders || [];
      customer = mapRegisteredCustomer(user, 0);
    } else {
      const guestOrders = await prisma.order.findMany({
        where: {
          customerId: null,
        },
        include: {
          items: true,
          payments: true,
          shipments: true,
        },
        orderBy: [{ createdAt: "desc" }],
      });

      orders = guestOrders.filter((order) => customerKeyFromOrder(order) === key);

      if (!orders.length) {
        return res.status(404).json({
          success: false,
          message: "Guest customer not found.",
        });
      }

      customer = mapGuestCustomer(key, orders, 0);
    }

    const notes = await prisma.customerNote.findMany({
      where: {
        customerKey: key,
      },
      orderBy: [{ createdAt: "desc" }],
    });

    res.json({
      success: true,
      customer: {
        ...customer,
        noteCount: notes.length,
        orders: orders.map(mapOrder),
        notes,
      },
    });
  } catch (error) {
    next(error);
  }
}

const noteSchema = z.object({
  customerId: z.string().optional().or(z.literal("")),
  customerKey: z.string().min(2).max(180),
  type: z.string().max(40).optional().or(z.literal("")),
  content: z.string().min(2).max(1000),
});

export async function createAdminCustomerNote(req, res, next) {
  try {
    const body = noteSchema.parse(req.body || {});
    const customerKey = cleanText(body.customerKey, 180);
    const customerId = body.customerId && !customerKey.startsWith("guest:") ? body.customerId : null;

    const note = await prisma.customerNote.create({
      data: {
        customerId,
        customerKey,
        type: cleanText(body.type || "NOTE", 40) || "NOTE",
        content: cleanText(body.content, 1000),
        createdById: req.user?.id || null,
      },
    });

    res.status(201).json({
      success: true,
      note,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminCustomerProfile(req, res, next) {
  try {
    const schema = z.object({
      name: z.string().min(2).max(120).optional(),
      phone: z.string().max(30).optional().or(z.literal("")),
      city: z.string().max(120).optional().or(z.literal("")),
      district: z.string().max(120).optional().or(z.literal("")),
      ward: z.string().max(120).optional().or(z.literal("")),
      address: z.string().max(255).optional().or(z.literal("")),
      note: z.string().max(500).optional().or(z.literal("")),
      active: z.boolean().optional(),
    });

    const userId = req.params.id;
    const body = schema.parse(req.body || {});

    const user = await prisma.$transaction(async (tx) => {
      if (body.name || body.active !== undefined) {
        await tx.user.update({
          where: { id: userId },
          data: {
            ...(body.name ? { name: cleanText(body.name, 120) } : {}),
            ...(body.active !== undefined ? { active: body.active } : {}),
          },
        });
      }

      await tx.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          phone: cleanText(body.phone || "", 30) || null,
          city: cleanText(body.city || "", 120) || null,
          district: cleanText(body.district || "", 120) || null,
          ward: cleanText(body.ward || "", 120) || null,
          address: cleanText(body.address || "", 255) || null,
          note: cleanText(body.note || "", 500) || null,
        },
        update: {
          phone: cleanText(body.phone || "", 30) || null,
          city: cleanText(body.city || "", 120) || null,
          district: cleanText(body.district || "", 120) || null,
          ward: cleanText(body.ward || "", 120) || null,
          address: cleanText(body.address || "", 255) || null,
          note: cleanText(body.note || "", 500) || null,
        },
      });

      return tx.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          addresses: true,
          orders: true,
        },
      });
    });

    res.json({
      success: true,
      customer: user,
    });
  } catch (error) {
    next(error);
  }
}
