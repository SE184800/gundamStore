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
      productId: z.string().min(1),
      quantity: z.number().int().min(1).max(99),
    })
  ).min(1),
});

function generateOrderNo() {
  return `ORD-${Date.now()}`;
}

export async function createOrder(req, res, next) {
  try {
    const body = createOrderSchema.parse(req.body);

    const productIds = body.items.map((item) => item.productId);

    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        active: true,
      },
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: "Some products are invalid or inactive",
      });
    }

    const productMap = new Map(products.map((product) => [product.id, product]));

    for (const item of body.items) {
      const product = productMap.get(item.productId);

      if (!product || product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product ${product?.sku || item.productId}`,
        });
      }
    }

    const subtotal = body.items.reduce((sum, item) => {
      const product = productMap.get(item.productId);
      return sum + product.price * item.quantity;
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
            create: body.items.map((item) => {
              const product = productMap.get(item.productId);

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
        include: { items: true },
      });

      for (const item of body.items) {
        const product = productMap.get(item.productId);
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
      include: { items: true },
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
