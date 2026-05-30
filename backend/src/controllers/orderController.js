import { z } from "zod";
import { prisma } from "../config/prisma.js";

function normalizeVietnamPhone(value = "") {
  const raw = String(value || "").replace(/[\s.\-()]/g, "").trim();

  if (raw.startsWith("+84")) return `0${raw.slice(3)}`;
  if (raw.startsWith("84")) return `0${raw.slice(2)}`;

  return raw.replace(/[^0-9]/g, "");
}

function isValidVietnamPhone(value = "") {
  const phone = normalizeVietnamPhone(value);

  // Mobile VN: 03/05/07/08/09 + 8 digits. Landline VN: 02 + 9-10 digits.
  return /^0(3|5|7|8|9)\d{8}$/.test(phone) || /^02\d{9,10}$/.test(phone);
}

const createOrderSchema = z.object({
  customerName: z.string().min(2).max(120),
  customerPhone: z
    .string()
    .min(8)
    .max(20)
    .refine(isValidVietnamPhone, "Số điện thoại Việt Nam không hợp lệ."),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerAddress: z.string().min(5).max(255),
  shippingFee: z.number().int().min(0).default(0),
  discount: z.number().int().min(0).default(0),
  paymentMethod: z.enum(["COD", "BANK_TRANSFER", "CARD", "WALLET"]).default("COD"),
  paymentReference: z.string().max(120).optional().or(z.literal("")),
  note: z.string().max(500).optional(),
  items: z.array(
    z.object({
      productId: z.string().optional().or(z.literal("")),
      sku: z.string().optional().or(z.literal("")),
      slug: z.string().optional().or(z.literal("")),
      quantity: z.number().int().min(1).max(99),
    })
  ).min(1),
});

function normalizeLookup(value = "") {
  return String(value || "").trim().toLowerCase();
}

function resolveProductForItem(products = [], item = {}) {
  const productId = normalizeLookup(item.productId);
  const sku = normalizeLookup(item.sku);
  const slug = normalizeLookup(item.slug);

  return products.find((product) => {
    return (
      (productId && normalizeLookup(product.id) === productId) ||
      (sku && normalizeLookup(product.sku) === sku) ||
      (slug && normalizeLookup(product.slug) === slug)
    );
  });
}

function generateOrderNo() {
  return `ORD-${Date.now()}`;
}

function includeOrderRelations() {
  return {
    items: true,
    payments: true,
    shipments: true,
  };
}

function getInitialPaymentStatus(method = "COD") {
  // COD is unpaid until delivery/collection. Other methods wait for admin confirmation.
  return "UNPAID";
}

function cleanPaymentText(value = "", max = 500) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function canUpdatePaymentStatus(order) {
  if (!order) return false;
  return !["CANCELLED", "REFUNDED"].includes(order.status);
}

const CUSTOMER_CANCEL_ALLOWED_STATUSES = new Set(["PLACED", "CONFIRMED"]);
const ADMIN_CANCEL_ALLOWED_STATUSES = new Set(["PLACED", "CONFIRMED", "PACKING"]);

const ADMIN_ALLOWED_STATUS_TRANSITIONS = {
  PLACED: new Set(["CONFIRMED", "CANCELLED"]),
  CONFIRMED: new Set(["PACKING", "CANCELLED"]),
  PACKING: new Set(["SHIPPING", "CANCELLED"]),
  SHIPPING: new Set(["DELIVERED"]),
  DELIVERED: new Set(["COMPLETED", "REFUNDED"]),
  COMPLETED: new Set(["REFUNDED"]),
  CANCELLED: new Set([]),
  REFUNDED: new Set([]),
};

function canAdminTransitionOrderStatus(fromStatus = "", toStatus = "") {
  if (!fromStatus || !toStatus) return false;
  if (fromStatus === toStatus) return true;
  return ADMIN_ALLOWED_STATUS_TRANSITIONS[fromStatus]?.has(toStatus) || false;
}

function getOrderTransitionConflictMessage(fromStatus = "", toStatus = "") {
  if (["CANCELLED", "REFUNDED"].includes(fromStatus)) {
    return "Đơn hàng đã ở trạng thái cuối nên không thể chuyển trạng thái.";
  }

  return `Không thể chuyển trạng thái đơn từ ${fromStatus} sang ${toStatus}.`;
}

function cleanCancelText(value = "", max = 500) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function getCancelConflictMessage(status = "") {
  if (["DELIVERED", "COMPLETED", "REFUNDED"].includes(status)) {
    return "Đơn hàng đã giao/hoàn tất/hoàn tiền nên không thể hủy.";
  }

  if (status === "CANCELLED") {
    return "Đơn hàng đã được hủy.";
  }

  return "Đơn hàng không thể hủy ở trạng thái hiện tại.";
}

async function restoreOrderStockOnce(tx, order, { actorId = null, reason = "", note = "" } = {}) {
  if (!order || order.stockRestoredAt) {
    return false;
  }

  const now = new Date();

  for (const item of order.items || []) {
    const productSnapshot = await tx.product.findUnique({
      where: { id: item.productId },
      select: {
        id: true,
        sku: true,
        stock: true,
      },
    });

    if (!productSnapshot) {
      const error = new Error(`Product ${item.productId} was not found for stock restore`);
      error.statusCode = 409;
      throw error;
    }

    const beforeStock = productSnapshot.stock;
    const afterStock = beforeStock + item.quantity;

    await tx.product.update({
      where: { id: productSnapshot.id },
      data: {
        stock: {
          increment: item.quantity,
        },
      },
    });

    await tx.inventoryLog.create({
      data: {
        productId: productSnapshot.id,
        type: "RESTORE",
        quantity: item.quantity,
        beforeStock,
        afterStock,
        reason: reason || "Order cancellation stock restore",
        refType: "ORDER_CANCEL",
        refId: order.id,
      },
    });
  }

  await tx.order.update({
    where: { id: order.id },
    data: {
      stockRestoredAt: now,
      cancelledAt: order.cancelledAt || now,
      cancelReason: reason || order.cancelReason || null,
      cancelNote: note || order.cancelNote || null,
      cancelledById: actorId || order.cancelledById || null,
    },
  });

  return true;
}

export async function createOrder(req, res, next) {
  try {
    const body = createOrderSchema.parse(req.body);
    const customerPhone = normalizeVietnamPhone(body.customerPhone);

    const products = await prisma.product.findMany({
      where: {
        active: true,
      },
    });

    const resolvedItems = body.items.map((item) => {
      const product = resolveProductForItem(products, item);

      return {
        ...item,
        product,
      };
    });

    const invalidItem = resolvedItems.find((item) => !item.product);

    if (invalidItem) {
      return res.status(400).json({
        success: false,
        message: "Some products are invalid or inactive",
        detail: {
          productId: invalidItem.productId || "",
          sku: invalidItem.sku || "",
          slug: invalidItem.slug || "",
        },
      });
    }

    const reservationMap = new Map();

    for (const item of resolvedItems) {
      const productId = item.product.id;
      const current = reservationMap.get(productId) || {
        product: item.product,
        quantity: 0,
      };

      current.quantity += item.quantity;
      reservationMap.set(productId, current);
    }

    const stockReservations = Array.from(reservationMap.values());

    for (const item of stockReservations) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product ${item.product.sku}`,
        });
      }
    }

    const subtotal = resolvedItems.reduce((sum, item) => {
      return sum + item.product.price * item.quantity;
    }, 0);

    const total = Math.max(0, subtotal + body.shippingFee - body.discount);

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNo: generateOrderNo(),
          customerId: req.user?.id || null,
          customerName: body.customerName,
          customerPhone,
          customerEmail: body.customerEmail || req.user?.email || null,
          customerAddress: body.customerAddress,
          paymentStatus: getInitialPaymentStatus(body.paymentMethod),
          shippingFee: body.shippingFee,
          discount: body.discount,
          subtotal,
          total,
          note: body.note || null,
          payments: {
            create: {
              method: body.paymentMethod,
              status: getInitialPaymentStatus(body.paymentMethod),
              amount: total,
              reference: cleanPaymentText(body.paymentReference || "", 120) || null,
              note:
                body.paymentMethod === "COD"
                  ? "Thanh toán khi nhận hàng."
                  : "Chờ xác nhận thanh toán từ admin.",
            },
          },
          items: {
            create: resolvedItems.map((item) => {
              const product = item.product;

              return {
                productId: product.id,
                sku: product.sku,
                name: product.nameVi,
                price: product.price,
                quantity: item.quantity,
              };
            }),
          },
        },
        include: includeOrderRelations(),
      });

      for (const item of stockReservations) {
        const productSnapshot = await tx.product.findUnique({
          where: { id: item.product.id },
          select: {
            id: true,
            sku: true,
            stock: true,
            active: true,
          },
        });

        if (!productSnapshot || !productSnapshot.active) {
          const error = new Error(`Product ${item.product.sku} is no longer available`);
          error.statusCode = 409;
          throw error;
        }

        if (productSnapshot.stock < item.quantity) {
          const error = new Error(`Insufficient stock for product ${productSnapshot.sku}`);
          error.statusCode = 409;
          throw error;
        }

        const updated = await tx.product.updateMany({
          where: {
            id: productSnapshot.id,
            active: true,
            stock: {
              gte: item.quantity,
            },
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        if (updated.count !== 1) {
          const error = new Error(`Insufficient stock for product ${productSnapshot.sku}`);
          error.statusCode = 409;
          throw error;
        }

        const beforeStock = productSnapshot.stock;
        const afterStock = beforeStock - item.quantity;

        await tx.inventoryLog.create({
          data: {
            productId: productSnapshot.id,
            type: "RESERVE",
            quantity: item.quantity,
            beforeStock,
            afterStock,
            reason: "Order stock reservation",
            refType: "ORDER",
            refId: created.id,
          },
        });
      }

      return created;
    });

    res.status(201).json({
      success: true,
      order,
    });
  } catch (err) {
    next(err);
  }
}


export async function listMyOrders(req, res, next) {
  try {
    const orders = await prisma.order.findMany({
      where: {
        customerId: req.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: includeOrderRelations(),
      take: 100,
    });

    return res.json({
      success: true,
      orders,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyOrderById(req, res, next) {
  try {
    const id = String(req.params.id || "").trim();

    const order = await prisma.order.findFirst({
      where: {
        customerId: req.user.id,
        OR: [
          { id },
          { orderNo: id },
        ],
      },
      include: includeOrderRelations(),
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng.",
      });
    }

    return res.json({
      success: true,
      order,
    });
  } catch (err) {
    next(err);
  }
}

export async function cancelMyOrder(req, res, next) {
  try {
    const schema = z.object({
      reason: z.string().max(300).optional().or(z.literal("")),
      note: z.string().max(500).optional().or(z.literal("")),
    });

    const body = schema.parse(req.body || {});
    const id = String(req.params.id || "").trim();

    const currentOrder = await prisma.order.findFirst({
      where: {
        customerId: req.user.id,
        OR: [
          { id },
          { orderNo: id },
        ],
      },
      include: includeOrderRelations(),
    });

    if (!currentOrder) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng.",
      });
    }

    if (currentOrder.status === "CANCELLED") {
      return res.json({
        success: true,
        order: currentOrder,
        message: "Đơn hàng đã được hủy trước đó.",
      });
    }

    if (!CUSTOMER_CANCEL_ALLOWED_STATUSES.has(currentOrder.status)) {
      return res.status(409).json({
        success: false,
        message: getCancelConflictMessage(currentOrder.status),
      });
    }

    const reason = cleanCancelText(body.reason || "Customer cancelled order", 300);
    const note = cleanCancelText(body.note || "", 500);

    const order = await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: currentOrder.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelReason: reason,
          cancelNote: note || null,
          cancelledById: req.user.id,
        },
      });

      await restoreOrderStockOnce(tx, currentOrder, {
        actorId: req.user.id,
        reason,
        note,
      });

      await tx.auditLog.create({
        data: {
          actorId: req.user.id,
          orderId: currentOrder.id,
          action: "CUSTOMER_CANCEL_ORDER",
          entity: "Order",
          entityId: currentOrder.id,
          metadata: {
            reason,
            note,
          },
        },
      });

      return tx.order.findUnique({
        where: { id: currentOrder.id },
        include: includeOrderRelations(),
      });
    });

    return res.json({
      success: true,
      order,
    });
  } catch (err) {
    next(err);
  }
}

export async function listAdminOrders(req, res, next) {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        payments: true,
        shipments: true,
      },
      take: 100,
    });

    res.json({
      success: true,
      orders,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateOrderStatus(req, res, next) {
  try {
    const schema = z.object({
      status: z.enum([
        "PLACED",
        "CONFIRMED",
        "PACKING",
        "SHIPPING",
        "DELIVERED",
        "COMPLETED",
        "CANCELLED",
        "REFUNDED",
      ]),
      reason: z.string().max(300).optional().or(z.literal("")),
      note: z.string().max(500).optional().or(z.literal("")),
    });

    const body = schema.parse(req.body);

    const currentOrder = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: includeOrderRelations(),
    });

    if (!currentOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!canAdminTransitionOrderStatus(currentOrder.status, body.status)) {
      return res.status(409).json({
        success: false,
        message: getOrderTransitionConflictMessage(currentOrder.status, body.status),
      });
    }

    if (body.status === "CANCELLED" && currentOrder.status !== "CANCELLED") {
      if (!ADMIN_CANCEL_ALLOWED_STATUSES.has(currentOrder.status)) {
        return res.status(409).json({
          success: false,
          message: getCancelConflictMessage(currentOrder.status),
        });
      }
    }

    const reason = cleanCancelText(body.reason || "Admin cancelled order", 300);
    const note = cleanCancelText(body.note || "", 500);

    const order = await prisma.$transaction(async (tx) => {
      if (body.status === "CANCELLED") {
        await tx.order.update({
          where: { id: currentOrder.id },
          data: {
            status: "CANCELLED",
            cancelledAt: currentOrder.cancelledAt || new Date(),
            cancelReason: reason,
            cancelNote: note || null,
            cancelledById: req.user.id,
          },
        });

        await restoreOrderStockOnce(tx, currentOrder, {
          actorId: req.user.id,
          reason,
          note,
        });
      } else {
        await tx.order.update({
          where: { id: currentOrder.id },
          data: { status: body.status },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: req.user.id,
          orderId: currentOrder.id,
          action: "UPDATE_ORDER_STATUS",
          entity: "Order",
          entityId: currentOrder.id,
          metadata: {
            fromStatus: currentOrder.status,
            toStatus: body.status,
            reason: body.reason || "",
            note: body.note || "",
          },
        },
      });

      return tx.order.findUnique({
        where: { id: currentOrder.id },
        include: includeOrderRelations(),
      });
    });

    res.json({
      success: true,
      order,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateOrderPayment(req, res, next) {
  try {
    const schema = z.object({
      paymentStatus: z.enum(["UNPAID", "PARTIAL", "PAID", "REFUNDED"]),
      method: z.enum(["COD", "BANK_TRANSFER", "CARD", "WALLET"]).optional(),
      amount: z.number().int().min(0).optional(),
      reference: z.string().max(120).optional().or(z.literal("")),
      note: z.string().max(500).optional().or(z.literal("")),
    });

    const body = schema.parse(req.body);

    const currentOrder = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: includeOrderRelations(),
    });

    if (!currentOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!canUpdatePaymentStatus(currentOrder)) {
      return res.status(409).json({
        success: false,
        message: "Không thể cập nhật vận chuyển cho đơn đã hủy hoặc đã hoàn tiền.",
      });
    }

    const cleanReference = cleanPaymentText(body.reference || "", 120);
    const cleanNote = cleanPaymentText(body.note || "", 500);
    const paymentAmount = body.amount ?? currentOrder.total;

    if (paymentAmount > currentOrder.total) {
      return res.status(400).json({
        success: false,
        message: "Số tiền thanh toán không được lớn hơn tổng giá trị đơn hàng.",
      });
    }

    const order = await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: currentOrder.id },
        data: { paymentStatus: body.paymentStatus },
      });

      await tx.payment.create({
        data: {
          orderId: currentOrder.id,
          method: body.method || currentOrder.payments?.[0]?.method || "COD",
          status: body.paymentStatus,
          amount: paymentAmount,
          reference: cleanReference || null,
          note: cleanNote || null,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: req.user.id,
          orderId: currentOrder.id,
          action: "UPDATE_ORDER_PAYMENT",
          entity: "Order",
          entityId: currentOrder.id,
          metadata: {
            paymentStatus: body.paymentStatus,
            method: body.method || currentOrder.payments?.[0]?.method || "COD",
            amount: paymentAmount,
            reference: cleanReference,
            note: cleanNote,
          },
        },
      });

      return tx.order.findUnique({
        where: { id: currentOrder.id },
        include: includeOrderRelations(),
      });
    });

    res.json({
      success: true,
      order,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateOrderShipping(req, res, next) {
  try {
    const schema = z.object({
      carrier: z.string().max(120).optional().or(z.literal("")),
      trackingCode: z.string().max(120).optional().or(z.literal("")),
      shippingMethod: z.string().max(80).optional().or(z.literal("")),
      status: z.enum([
        "PENDING",
        "READY_TO_SHIP",
        "SHIPPING",
        "DELIVERED",
        "FAILED",
        "RETURNED",
      ]).optional(),
      fee: z.number().int().min(0).optional(),
      note: z.string().max(500).optional().or(z.literal("")),
    });

    const body = schema.parse(req.body);

    const currentOrder = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: includeOrderRelations(),
    });

    if (!currentOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!canUpdatePaymentStatus(currentOrder)) {
      return res.status(409).json({
        success: false,
        message: "Không thể cập nhật vận chuyển cho đơn đã hủy hoặc đã hoàn tiền.",
      });
    }

    const cleanReference = cleanPaymentText(body.reference || "", 120);
    const cleanNote = cleanPaymentText(body.note || "", 500);
    const paymentAmount = body.amount ?? currentOrder.total;

    if (paymentAmount > currentOrder.total) {
      return res.status(400).json({
        success: false,
        message: "Số tiền thanh toán không được lớn hơn tổng giá trị đơn hàng.",
      });
    }

    const order = await prisma.$transaction(async (tx) => {
      const existingShipment = await tx.shipment.findFirst({
        where: { orderId: currentOrder.id },
        orderBy: { createdAt: "desc" },
      });

      const shipmentData = {
        carrier: body.carrier || null,
        trackingCode: body.trackingCode || null,
        shippingMethod: body.shippingMethod || existingShipment?.shippingMethod || "FAST",
        status: body.status || existingShipment?.status || "PENDING",
        fee: body.fee ?? existingShipment?.fee ?? currentOrder.shippingFee ?? 0,
      };

      if (existingShipment) {
        await tx.shipment.update({
          where: { id: existingShipment.id },
          data: shipmentData,
        });
      } else {
        await tx.shipment.create({
          data: {
            orderId: currentOrder.id,
            ...shipmentData,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: req.user.id,
          orderId: currentOrder.id,
          action: "UPDATE_ORDER_SHIPPING",
          entity: "Order",
          entityId: currentOrder.id,
          metadata: {
            ...shipmentData,
            note: body.note || "",
          },
        },
      });

      return tx.order.findUnique({
        where: { id: currentOrder.id },
        include: includeOrderRelations(),
      });
    });

    res.json({
      success: true,
      order,
    });
  } catch (err) {
    next(err);
  }
}

export async function getPublicOrderById(req, res, next) {
  try {
    const id = String(req.params.id || "").trim();
    const phone = String(req.query.phone || "").trim();
    const email = String(req.query.email || "").trim().toLowerCase();

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập mã đơn hàng.",
      });
    }

    if (!phone && !email) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập số điện thoại hoặc email để tra cứu đơn hàng.",
      });
    }

    function normalizePhone(value = "") {
      return String(value || "").replace(/[^0-9]/g, "");
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id },
          { orderNo: id },
        ],
      },
      include: includeOrderRelations(),
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng phù hợp.",
      });
    }

    const phoneMatches =
      phone && normalizePhone(order.customerPhone) === normalizePhone(phone);

    const emailMatches =
      email && String(order.customerEmail || "").toLowerCase() === email;

    if (!phoneMatches && !emailMatches) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng phù hợp.",
      });
    }

    return res.json({
      success: true,
      order,
    });
  } catch (err) {
    console.error("Public order lookup failed:", err);
    return res.status(500).json({
      success: false,
      message: "Không thể tra cứu đơn hàng lúc này. Vui lòng thử lại sau.",
    });
  }
}
