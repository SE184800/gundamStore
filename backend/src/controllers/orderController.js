import { z } from "zod";
import { prisma } from "../config/prisma.js";

const createOrderSchema = z.object({
  customerName: z.string().min(2).max(120),
  customerPhone: z.string().min(8).max(20),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerAddress: z.string().min(5).max(255),
  shippingFee: z.number().int().min(0).default(0),
  discount: z.number().int().min(0).default(0),
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

export async function createOrder(req, res, next) {
  try {
    const body = createOrderSchema.parse(req.body);

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

    for (const item of resolvedItems) {
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
          customerName: body.customerName,
          customerPhone: body.customerPhone,
          customerEmail: body.customerEmail || null,
          customerAddress: body.customerAddress,
          shippingFee: body.shippingFee,
          discount: body.discount,
          subtotal,
          total,
          note: body.note || null,
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

      for (const item of resolvedItems) {
        const product = item.product;
        const beforeStock = product.stock;
        const afterStock = beforeStock - item.quantity;

        await tx.product.update({
          where: { id: product.id },
          data: { stock: afterStock },
        });

        await tx.inventoryLog.create({
          data: {
            productId: product.id,
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
    });

    const body = schema.parse(req.body);

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: body.status },
      include: includeOrderRelations(),
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        orderId: order.id,
        action: "UPDATE_ORDER_STATUS",
        entity: "Order",
        entityId: order.id,
        metadata: {
          status: body.status,
        },
      },
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

    const order = await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: currentOrder.id },
        data: { paymentStatus: body.paymentStatus },
      });

      await tx.payment.create({
        data: {
          orderId: currentOrder.id,
          method: body.method || "COD",
          status: body.paymentStatus,
          amount: body.amount ?? currentOrder.total,
          reference: body.reference || null,
          note: body.note || null,
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
            method: body.method || "COD",
            amount: body.amount ?? currentOrder.total,
            reference: body.reference || "",
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
