import { z } from "zod";
import { prisma } from "../config/prisma.js";

function includeFulfillmentOrderRelations() {
  return {
    items: true,
    payments: true,
    shipments: {
      orderBy: [{ createdAt: "desc" }],
    },
    auditLogs: {
      orderBy: [{ createdAt: "desc" }],
      take: 20,
    },
  };
}

function latestShipment(order = {}) {
  return Array.isArray(order.shipments) && order.shipments.length
    ? [...order.shipments].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0]
    : null;
}

function normalizeOrder(order = {}) {
  const shipment = latestShipment(order);

  return {
    ...order,
    latestShipment: shipment,
    fulfillmentStage: resolveFulfillmentStage(order, shipment),
    needsTracking: order.status === "SHIPPING" && !shipment?.trackingCode,
    canConfirm: order.status === "PLACED",
    canPack: ["PLACED", "CONFIRMED"].includes(order.status),
    canShip: ["CONFIRMED", "PACKING"].includes(order.status),
    canDeliver: order.status === "SHIPPING",
    canComplete: order.status === "DELIVERED",
  };
}

function resolveFulfillmentStage(order = {}, shipment = null) {
  if (["CANCELLED", "REFUNDED"].includes(order.status)) return order.status;
  if (order.status === "COMPLETED") return "COMPLETED";
  if (order.status === "DELIVERED") return "DELIVERED";
  if (order.status === "SHIPPING") return shipment?.status || "SHIPPING";
  if (shipment?.status === "READY_TO_SHIP") return "READY_TO_SHIP";
  if (order.status === "PACKING") return "PACKING";
  if (order.status === "CONFIRMED") return "CONFIRMED";
  return "PLACED";
}

function cleanText(value = "", max = 500) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

async function upsertShipment(tx, order, payload = {}) {
  const current = await tx.shipment.findFirst({
    where: { orderId: order.id },
    orderBy: { createdAt: "desc" },
  });

  const data = {
    carrier: payload.carrier || current?.carrier || null,
    trackingCode: payload.trackingCode || current?.trackingCode || null,
    shippingMethod: payload.shippingMethod || current?.shippingMethod || "FAST",
    status: payload.status || current?.status || "PENDING",
    fee: Number(payload.fee ?? current?.fee ?? order.shippingFee ?? 0),
  };

  if (current) {
    return tx.shipment.update({
      where: { id: current.id },
      data,
    });
  }

  return tx.shipment.create({
    data: {
      orderId: order.id,
      ...data,
    },
  });
}

async function getOrderForUpdate(orderId) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: includeFulfillmentOrderRelations(),
  });
}

function isTerminalOrder(order = {}) {
  return ["CANCELLED", "REFUNDED", "COMPLETED"].includes(String(order.status || ""));
}

function assertNotTerminal(order = {}) {
  if (isTerminalOrder(order)) {
    const error = new Error("Order is already terminal and cannot be fulfilled.");
    error.status = 409;
    throw error;
  }
}

function getPickListFromOrders(orders = []) {
  const map = new Map();

  for (const order of orders) {
    for (const item of order.items || []) {
      const key = item.variantSku || item.sku || item.productId;
      const current = map.get(key) || {
        sku: item.variantSku || item.sku,
        productId: item.productId,
        variantId: item.variantId || "",
        name: item.variantName || item.name || item.sku,
        quantity: 0,
        orderCount: 0,
        orderNos: [],
      };

      current.quantity += Number(item.quantity || 0);
      current.orderCount += 1;
      current.orderNos.push(order.orderNo);
      map.set(key, current);
    }
  }

  return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);
}

export async function listAdminFulfillmentOrders(req, res, next) {
  try {
    const stage = String(req.query.stage || "ALL").toUpperCase();
    const q = cleanText(req.query.q || "", 120).toLowerCase();

    let orders = await prisma.order.findMany({
      where: {
        status: {
          in: ["PLACED", "CONFIRMED", "PACKING", "SHIPPING", "DELIVERED", "COMPLETED", "CANCELLED", "REFUNDED"],
        },
      },
      include: includeFulfillmentOrderRelations(),
      orderBy: [{ createdAt: "desc" }],
      take: 300,
    });

    orders = orders.map(normalizeOrder);

    if (stage !== "ALL") {
      orders = orders.filter((order) => order.fulfillmentStage === stage || order.status === stage);
    }

    if (q) {
      orders = orders.filter((order) =>
        [
          order.orderNo,
          order.customerName,
          order.customerPhone,
          order.customerEmail,
          order.customerAddress,
          order.status,
          order.fulfillmentStage,
          order.latestShipment?.carrier,
          order.latestShipment?.trackingCode,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    const activeOrders = orders.filter((order) => !["CANCELLED", "REFUNDED"].includes(order.status));

    res.json({
      success: true,
      orders,
      pickList: getPickListFromOrders(activeOrders.filter((order) => ["CONFIRMED", "PACKING"].includes(order.status))),
      summary: {
        total: orders.length,
        placed: orders.filter((order) => order.status === "PLACED").length,
        confirmed: orders.filter((order) => order.status === "CONFIRMED").length,
        packing: orders.filter((order) => order.status === "PACKING").length,
        shipping: orders.filter((order) => order.status === "SHIPPING").length,
        delivered: orders.filter((order) => order.status === "DELIVERED").length,
        needsTracking: orders.filter((order) => order.needsTracking).length,
      },
    });
  } catch (error) {
    next(error);
  }
}

const actionSchema = z.object({
  action: z.enum(["CONFIRM", "PACK", "READY_TO_SHIP", "SHIP", "DELIVER", "COMPLETE"]),
  carrier: z.string().max(120).optional().or(z.literal("")),
  trackingCode: z.string().max(120).optional().or(z.literal("")),
  shippingMethod: z.string().max(80).optional().or(z.literal("")),
  fee: z.number().int().min(0).optional(),
  note: z.string().max(500).optional().or(z.literal("")),
});

export async function updateAdminFulfillmentAction(req, res, next) {
  try {
    const body = actionSchema.parse(req.body || {});
    const orderId = String(req.params.id || "").trim();

    const current = await getOrderForUpdate(orderId);

    if (!current) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    assertNotTerminal(current);

    const note = cleanText(body.note || "", 500);

    const order = await prisma.$transaction(async (tx) => {
      let nextStatus = current.status;
      let shipmentStatus = latestShipment(current)?.status || "PENDING";

      if (body.action === "CONFIRM") {
        if (current.status !== "PLACED") {
          const error = new Error("Only PLACED orders can be confirmed.");
          error.status = 409;
          throw error;
        }
        nextStatus = "CONFIRMED";
      }

      if (body.action === "PACK") {
        if (!["PLACED", "CONFIRMED"].includes(current.status)) {
          const error = new Error("Only PLACED/CONFIRMED orders can move to packing.");
          error.status = 409;
          throw error;
        }
        nextStatus = "PACKING";
        shipmentStatus = "PENDING";
      }

      if (body.action === "READY_TO_SHIP") {
        if (!["CONFIRMED", "PACKING"].includes(current.status)) {
          const error = new Error("Only CONFIRMED/PACKING orders can be ready to ship.");
          error.status = 409;
          throw error;
        }
        nextStatus = "PACKING";
        shipmentStatus = "READY_TO_SHIP";
      }

      if (body.action === "SHIP") {
        if (!["CONFIRMED", "PACKING"].includes(current.status)) {
          const error = new Error("Only CONFIRMED/PACKING orders can be shipped.");
          error.status = 409;
          throw error;
        }
        if (!body.carrier || !body.trackingCode) {
          const error = new Error("Carrier and tracking code are required before shipping.");
          error.status = 400;
          throw error;
        }
        nextStatus = "SHIPPING";
        shipmentStatus = "SHIPPING";
      }

      if (body.action === "DELIVER") {
        if (current.status !== "SHIPPING") {
          const error = new Error("Only SHIPPING orders can be delivered.");
          error.status = 409;
          throw error;
        }
        nextStatus = "DELIVERED";
        shipmentStatus = "DELIVERED";
      }

      if (body.action === "COMPLETE") {
        if (current.status !== "DELIVERED") {
          const error = new Error("Only DELIVERED orders can be completed.");
          error.status = 409;
          throw error;
        }
        nextStatus = "COMPLETED";
        shipmentStatus = latestShipment(current)?.status || "DELIVERED";
      }

      await tx.order.update({
        where: { id: current.id },
        data: { status: nextStatus },
      });

      await upsertShipment(tx, current, {
        carrier: body.carrier,
        trackingCode: body.trackingCode,
        shippingMethod: body.shippingMethod || "FAST",
        fee: body.fee,
        status: shipmentStatus,
      });

      await tx.auditLog.create({
        data: {
          actorId: req.user?.id || null,
          orderId: current.id,
          action: `FULFILLMENT_${body.action}`,
          entity: "Order",
          entityId: current.id,
          metadata: {
            fromStatus: current.status,
            toStatus: nextStatus,
            shipmentStatus,
            carrier: body.carrier || "",
            trackingCode: body.trackingCode || "",
            shippingMethod: body.shippingMethod || "FAST",
            fee: body.fee ?? current.shippingFee ?? 0,
            note,
          },
        },
      });

      return tx.order.findUnique({
        where: { id: current.id },
        include: includeFulfillmentOrderRelations(),
      });
    });

    res.json({
      success: true,
      order: normalizeOrder(order),
    });
  } catch (error) {
    next(error);
  }
}

const bulkActionSchema = z.object({
  orderIds: z.array(z.string()).min(1).max(50),
  action: z.enum(["CONFIRM", "PACK", "READY_TO_SHIP"]),
  note: z.string().max(500).optional().or(z.literal("")),
});

export async function bulkAdminFulfillmentAction(req, res, next) {
  try {
    const body = bulkActionSchema.parse(req.body || {});
    const results = [];

    for (const id of body.orderIds) {
      const current = await prisma.order.findUnique({
        where: { id },
        include: includeFulfillmentOrderRelations(),
      });

      if (!current || isTerminalOrder(current)) {
        results.push({ id, success: false, message: "Skipped." });
        continue;
      }

      try {
        const fakeReq = {
          ...req,
          params: { id },
          body: {
            action: body.action,
            note: body.note || "",
          },
        };

        let captured = null;
        const fakeRes = {
          json(payload) {
            captured = payload;
            return payload;
          },
          status() {
            return this;
          },
        };

        await updateAdminFulfillmentAction(fakeReq, fakeRes, next);
        results.push({ id, success: Boolean(captured?.success), order: captured?.order || null });
      } catch (error) {
        results.push({ id, success: false, message: error.message });
      }
    }

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    next(error);
  }
}
