import { z } from "zod";
import { prisma } from "../config/prisma.js";

function safeProfile(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    profile: user.profile || null,
    addresses: user.addresses || [],
  };
}

function mapWishlistItem(item) {
  const product = item.product;

  return {
    id: item.id,
    productId: item.productId,
    createdAt: item.createdAt,
    product: product
      ? {
          id: product.id,
          sku: product.sku,
          slug: product.slug,
          nameVi: product.nameVi,
          nameEn: product.nameEn,
          price: product.price,
          oldPrice: product.oldPrice,
          stock: product.stock,
          status: product.status,
          imageUrl: product.imageUrl,
          brand: product.brand,
          grade: product.grade,
          scale: product.scale,
          active: product.active,
        }
      : null,
  };
}

function mapAccountOrder(order = {}) {
  const latestShipment = Array.isArray(order.shipments) && order.shipments.length
    ? [...order.shipments].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0]
    : null;

  return {
    id: order.id,
    orderNo: order.orderNo,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    discount: order.discount,
    shippingDiscount: order.shippingDiscount,
    voucherCode: order.voucherCode || "",
    total: order.total,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    customerAddress: order.customerAddress,
    items: order.items || [],
    latestShipment,
    shipments: order.shipments || [],
    complaintTickets: order.complaintTickets || [],
  };
}

function isActiveOrder(order = {}) {
  return !["COMPLETED", "CANCELLED", "REFUNDED"].includes(String(order.status || "").toUpperCase());
}

function isOpenTicket(ticket = {}) {
  return !["RESOLVED", "CLOSED", "REJECTED"].includes(String(ticket.status || "").toUpperCase());
}

export async function getMyAccountDashboard(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        profile: true,
        addresses: {
          orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
        },
        wishlistItems: {
          orderBy: [{ createdAt: "desc" }],
          take: 8,
          include: { product: true },
        },
        orders: {
          orderBy: [{ createdAt: "desc" }],
          take: 12,
          include: {
            items: true,
            payments: true,
            shipments: {
              orderBy: [{ createdAt: "desc" }],
            },
            complaintTickets: {
              orderBy: [{ createdAt: "desc" }],
              select: {
                id: true,
                ticketNo: true,
                type: true,
                issue: true,
                status: true,
                priority: true,
                refundAmount: true,
                refundStatus: true,
                returnTracking: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
        productReviews: {
          orderBy: [{ createdAt: "desc" }],
          take: 8,
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                slug: true,
                nameVi: true,
                nameEn: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const orders = (user.orders || []).map(mapAccountOrder);
    const tickets = orders.flatMap((order) =>
      (order.complaintTickets || []).map((ticket) => ({
        ...ticket,
        orderId: order.id,
        orderNo: order.orderNo,
      }))
    );

    const totalSpent = orders
      .filter((order) => !["CANCELLED", "REFUNDED"].includes(String(order.status || "").toUpperCase()))
      .reduce((sum, order) => sum + Number(order.total || 0), 0);

    return res.json({
      success: true,
      dashboard: {
        account: safeProfile(user),
        defaultAddress: mapAddress((user.addresses || [])[0]),
        summary: {
          totalOrders: orders.length,
          activeOrders: orders.filter(isActiveOrder).length,
          completedOrders: orders.filter((order) => order.status === "COMPLETED").length,
          openTickets: tickets.filter(isOpenTicket).length,
          wishlistCount: user.wishlistItems?.length || 0,
          reviewCount: user.productReviews?.length || 0,
          totalSpent,
        },
        recentOrders: orders.slice(0, 6),
        activeOrders: orders.filter(isActiveOrder).slice(0, 6),
        supportTickets: tickets.slice(0, 8),
        wishlist: (user.wishlistItems || []).map(mapWishlistItem),
        reviews: user.productReviews || [],
      },
    });
  } catch (err) {
    next(err);
  }
}


function cleanText(value = "", max = 255) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function mapAddress(address) {
  if (!address) return null;

  return {
    id: address.id,
    label: address.label,
    receiver: address.receiver,
    phone: address.phone,
    address: address.address,
    city: address.city || "",
    district: address.district || "",
    ward: address.ward || "",
    postalCode: address.postalCode || "",
    isDefault: Boolean(address.isDefault),
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
  };
}

const createAddressSchema = z.object({
  label: z.string().trim().min(1).max(80).default("Nhà riêng"),
  receiver: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(30),
  address: z.string().trim().min(5).max(255),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  district: z.string().trim().max(120).optional().or(z.literal("")),
  ward: z.string().trim().max(120).optional().or(z.literal("")),
  postalCode: z.string().trim().max(30).optional().or(z.literal("")),
  isDefault: z.boolean().optional(),
});

const updateAddressSchema = createAddressSchema.partial();

async function normalizeDefaultAddress(tx, userId, addressId) {
  await tx.userAddress.updateMany({
    where: {
      userId,
      id: {
        not: addressId,
      },
    },
    data: {
      isDefault: false,
    },
  });

  await tx.userAddress.update({
    where: {
      id: addressId,
    },
    data: {
      isDefault: true,
    },
  });
}

export async function getMyProfile(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        profile: true,
        addresses: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      account: safeProfile(user),
    });
  } catch (err) {
    next(err);
  }
}

export async function updateMyProfile(req, res, next) {
  try {
    const schema = z.object({
      name: z.string().trim().min(2).max(120).optional(),
      phone: z.string().trim().max(30).optional().or(z.literal("")),
      birthday: z.string().optional().or(z.literal("")),
      gender: z.string().trim().max(30).optional().or(z.literal("")),
      avatarUrl: z.string().trim().max(500).optional().or(z.literal("")),
      note: z.string().trim().max(500).optional().or(z.literal("")),
      city: z.string().trim().max(120).optional().or(z.literal("")),
      district: z.string().trim().max(120).optional().or(z.literal("")),
      ward: z.string().trim().max(120).optional().or(z.literal("")),
      address: z.string().trim().max(255).optional().or(z.literal("")),
      postalCode: z.string().trim().max(30).optional().or(z.literal("")),
    });

    const body = schema.parse(req.body);

    const birthday =
      body.birthday && !Number.isNaN(new Date(body.birthday).getTime())
        ? new Date(body.birthday)
        : null;

    const user = await prisma.$transaction(async (tx) => {
      if (body.name) {
        await tx.user.update({
          where: { id: req.user.id },
          data: { name: body.name },
        });
      }

      await tx.userProfile.upsert({
        where: { userId: req.user.id },
        create: {
          userId: req.user.id,
          phone: body.phone || null,
          birthday,
          gender: body.gender || null,
          avatarUrl: body.avatarUrl || null,
          note: body.note || null,
          city: body.city || null,
          district: body.district || null,
          ward: body.ward || null,
          address: body.address || null,
          postalCode: body.postalCode || null,
        },
        update: {
          phone: body.phone || null,
          birthday,
          gender: body.gender || null,
          avatarUrl: body.avatarUrl || null,
          note: body.note || null,
          city: body.city || null,
          district: body.district || null,
          ward: body.ward || null,
          address: body.address || null,
          postalCode: body.postalCode || null,
        },
      });

      return tx.user.findUnique({
        where: { id: req.user.id },
        include: {
          profile: true,
          addresses: {
            orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
          },
        },
      });
    });

    return res.json({
      success: true,
      account: safeProfile(user),
    });
  } catch (err) {
    next(err);
  }
}


export async function listMyAddresses(req, res, next) {
  try {
    const addresses = await prisma.userAddress.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: [
        { isDefault: "desc" },
        { updatedAt: "desc" },
      ],
    });

    return res.json({
      success: true,
      addresses: addresses.map(mapAddress),
    });
  } catch (err) {
    next(err);
  }
}

export async function createMyAddress(req, res, next) {
  try {
    const body = createAddressSchema.parse(req.body);

    const address = await prisma.$transaction(async (tx) => {
      const count = await tx.userAddress.count({
        where: {
          userId: req.user.id,
        },
      });

      if (count >= 20) {
        const error = new Error("Bạn đã lưu tối đa 20 địa chỉ.");
        error.statusCode = 409;
        throw error;
      }

      const shouldDefault = body.isDefault === true || count === 0;

      if (shouldDefault) {
        await tx.userAddress.updateMany({
          where: {
            userId: req.user.id,
          },
          data: {
            isDefault: false,
          },
        });
      }

      return tx.userAddress.create({
        data: {
          userId: req.user.id,
          label: cleanText(body.label || "Nhà riêng", 80),
          receiver: cleanText(body.receiver, 120),
          phone: cleanText(body.phone, 30),
          address: cleanText(body.address, 255),
          city: cleanText(body.city || "", 120) || null,
          district: cleanText(body.district || "", 120) || null,
          ward: cleanText(body.ward || "", 120) || null,
          postalCode: cleanText(body.postalCode || "", 30) || null,
          isDefault: shouldDefault,
        },
      });
    });

    return res.status(201).json({
      success: true,
      address: mapAddress(address),
    });
  } catch (err) {
    next(err);
  }
}

export async function updateMyAddress(req, res, next) {
  try {
    const id = String(req.params.id || "").trim();
    const body = updateAddressSchema.parse(req.body);

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.userAddress.findFirst({
        where: {
          id,
          userId: req.user.id,
        },
      });

      if (!existing) {
        return null;
      }

      const address = await tx.userAddress.update({
        where: {
          id,
        },
        data: {
          ...(body.label !== undefined ? { label: cleanText(body.label || "Nhà riêng", 80) } : {}),
          ...(body.receiver !== undefined ? { receiver: cleanText(body.receiver, 120) } : {}),
          ...(body.phone !== undefined ? { phone: cleanText(body.phone, 30) } : {}),
          ...(body.address !== undefined ? { address: cleanText(body.address, 255) } : {}),
          ...(body.city !== undefined ? { city: cleanText(body.city || "", 120) || null } : {}),
          ...(body.district !== undefined ? { district: cleanText(body.district || "", 120) || null } : {}),
          ...(body.ward !== undefined ? { ward: cleanText(body.ward || "", 120) || null } : {}),
          ...(body.postalCode !== undefined ? { postalCode: cleanText(body.postalCode || "", 30) || null } : {}),
        },
      });

      if (body.isDefault === true) {
        await normalizeDefaultAddress(tx, req.user.id, id);

        return tx.userAddress.findUnique({
          where: {
            id,
          },
        });
      }

      return address;
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy địa chỉ.",
      });
    }

    return res.json({
      success: true,
      address: mapAddress(updated),
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteMyAddress(req, res, next) {
  try {
    const id = String(req.params.id || "").trim();

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.userAddress.findFirst({
        where: {
          id,
          userId: req.user.id,
        },
      });

      if (!existing) {
        return null;
      }

      await tx.userAddress.delete({
        where: {
          id,
        },
      });

      if (existing.isDefault) {
        const nextDefault = await tx.userAddress.findFirst({
          where: {
            userId: req.user.id,
          },
          orderBy: {
            updatedAt: "desc",
          },
        });

        if (nextDefault) {
          await tx.userAddress.update({
            where: {
              id: nextDefault.id,
            },
            data: {
              isDefault: true,
            },
          });
        }
      }

      return existing;
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy địa chỉ.",
      });
    }

    return res.json({
      success: true,
    });
  } catch (err) {
    next(err);
  }
}

export async function setDefaultMyAddress(req, res, next) {
  try {
    const id = String(req.params.id || "").trim();

    const address = await prisma.$transaction(async (tx) => {
      const existing = await tx.userAddress.findFirst({
        where: {
          id,
          userId: req.user.id,
        },
      });

      if (!existing) {
        return null;
      }

      await normalizeDefaultAddress(tx, req.user.id, id);

      return tx.userAddress.findUnique({
        where: {
          id,
        },
      });
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy địa chỉ.",
      });
    }

    return res.json({
      success: true,
      address: mapAddress(address),
    });
  } catch (err) {
    next(err);
  }
}

export async function listMyWishlist(req, res, next) {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: { product: true },
    });

    return res.json({
      success: true,
      items: items.map(mapWishlistItem),
    });
  } catch (err) {
    next(err);
  }
}

export async function addMyWishlistItem(req, res, next) {
  try {
    const schema = z.object({
      productId: z.string().min(1).optional(),
      sku: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
    });

    const body = schema.parse(req.body);

    if (!body.productId && !body.sku && !body.slug) {
      return res.status(400).json({
        success: false,
        message: "Product id, sku or slug is required.",
      });
    }

    const product = await prisma.product.findFirst({
      where: {
        active: true,
        OR: [
          body.productId ? { id: body.productId } : undefined,
          body.sku ? { sku: body.sku } : undefined,
          body.slug ? { slug: body.slug } : undefined,
        ].filter(Boolean),
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const item = await prisma.wishlistItem.upsert({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId: product.id,
        },
      },
      create: {
        userId: req.user.id,
        productId: product.id,
      },
      update: {},
      include: { product: true },
    });

    return res.status(201).json({
      success: true,
      item: mapWishlistItem(item),
    });
  } catch (err) {
    next(err);
  }
}

export async function removeMyWishlistItem(req, res, next) {
  try {
    const productId = String(req.params.productId || "").trim();

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product id is required.",
      });
    }

    await prisma.wishlistItem.deleteMany({
      where: {
        userId: req.user.id,
        productId,
      },
    });

    return res.json({
      success: true,
    });
  } catch (err) {
    next(err);
  }
}

export async function clearMyWishlist(req, res, next) {
  try {
    await prisma.wishlistItem.deleteMany({
      where: {
        userId: req.user.id,
      },
    });

    return res.json({
      success: true,
    });
  } catch (err) {
    next(err);
  }
}
