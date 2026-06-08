import { z } from "zod";
import { prisma } from "../config/prisma.js";

function cleanText(value = "", max = 1000) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function ticketNo() {
  return `TCK-${Date.now()}`;
}

function normalizeStatus(value = "") {
  const status = String(value || "ALL").trim().toUpperCase();
  return ["NEW", "VERIFYING", "WAITING_CUSTOMER", "APPROVED", "REJECTED", "RESOLVED", "CLOSED"].includes(status)
    ? status
    : "ALL";
}

function normalizePriority(value = "") {
  const priority = String(value || "MEDIUM").trim().toUpperCase();
  return ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priority) ? priority : "MEDIUM";
}

function includeTicketRelations() {
  return {
    order: {
      include: {
        items: true,
      },
    },
    customer: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
    comments: {
      orderBy: [{ createdAt: "desc" }],
      take: 50,
    },
  };
}

function publicTicket(ticket = {}) {
  return {
    id: ticket.id,
    ticketNo: ticket.ticketNo,
    orderId: ticket.orderId,
    customerName: ticket.customerName,
    customerPhone: ticket.customerPhone,
    customerEmail: ticket.customerEmail,
    type: ticket.type,
    issue: ticket.issue,
    description: ticket.description,
    priority: ticket.priority,
    status: ticket.status,
    resolution: ticket.resolution,
    refundAmount: ticket.refundAmount,
    refundStatus: ticket.refundStatus,
    returnTracking: ticket.returnTracking,
    images: ticket.images || [],
    order: ticket.order || null,
    customer: ticket.customer || null,
    comments: ticket.comments || [],
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    closedAt: ticket.closedAt,
  };
}

async function findOrderByKey(key = "") {
  const id = cleanText(key, 120);
  if (!id) return null;

  return prisma.order.findFirst({
    where: {
      OR: [
        { id },
        { orderNo: id },
      ],
    },
    include: {
      items: true,
    },
  });
}

const createTicketSchema = z.object({
  orderNo: z.string().max(120).optional().or(z.literal("")),
  orderId: z.string().max(120).optional().or(z.literal("")),
  customerName: z.string().min(2).max(120),
  customerPhone: z.string().max(30).optional().or(z.literal("")),
  customerEmail: z.string().email().optional().or(z.literal("")),
  type: z.enum(["COMPLAINT", "RETURN", "REFUND", "DAMAGED_BOX", "MISSING_PART", "WRONG_ITEM"]).default("COMPLAINT"),
  issue: z.string().min(3).max(200),
  description: z.string().min(5).max(1200),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  images: z.array(z.string()).optional().default([]),
});

export async function createStorefrontComplaint(req, res, next) {
  try {
    const body = createTicketSchema.parse(req.body || {});
    const order = await findOrderByKey(body.orderId || body.orderNo);

    const ticket = await prisma.complaintTicket.create({
      data: {
        ticketNo: ticketNo(),
        orderId: order?.id || null,
        customerId: order?.customerId || req.user?.id || null,
        customerName: cleanText(body.customerName, 120),
        customerPhone: cleanText(body.customerPhone || order?.customerPhone || "", 30) || null,
        customerEmail: cleanText(body.customerEmail || order?.customerEmail || "", 160) || null,
        type: body.type,
        issue: cleanText(body.issue, 200),
        description: cleanText(body.description, 1200),
        priority: normalizePriority(body.priority),
        status: "NEW",
        images: Array.isArray(body.images) ? body.images.slice(0, 8) : [],
        comments: {
          create: {
            actorId: req.user?.id || null,
            actorName: cleanText(body.customerName, 120),
            type: "CUSTOMER_MESSAGE",
            content: cleanText(body.description, 1200),
          },
        },
      },
      include: includeTicketRelations(),
    });

    res.status(201).json({
      success: true,
      ticket: publicTicket(ticket),
    });
  } catch (error) {
    next(error);
  }
}

export async function listAdminComplaints(req, res, next) {
  try {
    const status = normalizeStatus(req.query.status);
    const q = cleanText(req.query.q || "", 120).toLowerCase();

    let tickets = await prisma.complaintTicket.findMany({
      where: {
        ...(status !== "ALL" ? { status } : {}),
      },
      include: includeTicketRelations(),
      orderBy: [{ createdAt: "desc" }],
      take: 300,
    });

    if (q) {
      tickets = tickets.filter((ticket) =>
        [
          ticket.ticketNo,
          ticket.order?.orderNo,
          ticket.customerName,
          ticket.customerPhone,
          ticket.customerEmail,
          ticket.type,
          ticket.issue,
          ticket.description,
          ticket.priority,
          ticket.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    res.json({
      success: true,
      tickets: tickets.map(publicTicket),
      summary: {
        total: tickets.length,
        new: tickets.filter((item) => item.status === "NEW").length,
        verifying: tickets.filter((item) => item.status === "VERIFYING").length,
        waiting: tickets.filter((item) => item.status === "WAITING_CUSTOMER").length,
        refund: tickets.filter((item) => item.type === "REFUND" || Number(item.refundAmount || 0) > 0).length,
        urgent: tickets.filter((item) => item.priority === "URGENT" || item.priority === "HIGH").length,
        resolved: tickets.filter((item) => ["RESOLVED", "CLOSED"].includes(item.status)).length,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminComplaintDetail(req, res, next) {
  try {
    const ticket = await prisma.complaintTicket.findFirst({
      where: {
        OR: [
          { id: req.params.id },
          { ticketNo: req.params.id },
        ],
      },
      include: includeTicketRelations(),
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    res.json({
      success: true,
      ticket: publicTicket(ticket),
    });
  } catch (error) {
    next(error);
  }
}

const updateTicketSchema = z.object({
  status: z.enum(["NEW", "VERIFYING", "WAITING_CUSTOMER", "APPROVED", "REJECTED", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  resolution: z.string().max(1000).optional().or(z.literal("")),
  refundAmount: z.number().int().min(0).optional(),
  refundStatus: z.enum(["NONE", "REQUESTED", "APPROVED", "PAID", "REJECTED"]).optional(),
  returnTracking: z.string().max(120).optional().or(z.literal("")),
  comment: z.string().max(1000).optional().or(z.literal("")),
});

export async function updateAdminComplaint(req, res, next) {
  try {
    const body = updateTicketSchema.parse(req.body || {});
    const current = await prisma.complaintTicket.findUnique({
      where: { id: req.params.id },
      include: includeTicketRelations(),
    });

    if (!current) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    const nextStatus = body.status || current.status;
    const closeStatuses = ["RESOLVED", "CLOSED", "REJECTED"];

    const ticket = await prisma.$transaction(async (tx) => {
      const updated = await tx.complaintTicket.update({
        where: { id: current.id },
        data: {
          ...(body.status ? { status: body.status } : {}),
          ...(body.priority ? { priority: body.priority } : {}),
          ...(body.resolution !== undefined ? { resolution: cleanText(body.resolution, 1000) || null } : {}),
          ...(body.refundAmount !== undefined ? { refundAmount: Number(body.refundAmount || 0) } : {}),
          ...(body.refundStatus ? { refundStatus: body.refundStatus } : {}),
          ...(body.returnTracking !== undefined ? { returnTracking: cleanText(body.returnTracking, 120) || null } : {}),
          closedAt: closeStatuses.includes(nextStatus) ? new Date() : null,
        },
      });

      if (body.comment) {
        await tx.complaintTicketComment.create({
          data: {
            ticketId: current.id,
            actorId: req.user?.id || null,
            actorName: req.user?.name || req.user?.email || "Admin",
            type: "ADMIN_COMMENT",
            content: cleanText(body.comment, 1000),
          },
        });
      }

      if (body.status || body.refundStatus || body.refundAmount !== undefined) {
        await tx.auditLog.create({
          data: {
            actorId: req.user?.id || null,
            orderId: current.orderId || null,
            action: "UPDATE_COMPLAINT_TICKET",
            entity: "ComplaintTicket",
            entityId: current.id,
            metadata: {
              fromStatus: current.status,
              toStatus: body.status || current.status,
              refundStatus: body.refundStatus || current.refundStatus,
              refundAmount: body.refundAmount ?? current.refundAmount,
            },
          },
        });
      }

      return tx.complaintTicket.findUnique({
        where: { id: updated.id },
        include: includeTicketRelations(),
      });
    });

    res.json({
      success: true,
      ticket: publicTicket(ticket),
    });
  } catch (error) {
    next(error);
  }
}

export async function addAdminComplaintComment(req, res, next) {
  try {
    const schema = z.object({
      content: z.string().min(2).max(1000),
      type: z.string().max(60).optional().or(z.literal("")),
    });

    const body = schema.parse(req.body || {});
    const current = await prisma.complaintTicket.findUnique({
      where: { id: req.params.id },
    });

    if (!current) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    const comment = await prisma.complaintTicketComment.create({
      data: {
        ticketId: current.id,
        actorId: req.user?.id || null,
        actorName: req.user?.name || req.user?.email || "Admin",
        type: cleanText(body.type || "ADMIN_COMMENT", 60),
        content: cleanText(body.content, 1000),
      },
    });

    res.status(201).json({
      success: true,
      comment,
    });
  } catch (error) {
    next(error);
  }
}
