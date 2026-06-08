import { z } from "zod";
import { prisma } from "../config/prisma.js";

const createReviewSchema = z.object({
  productId: z.string().optional().or(z.literal("")),
  sku: z.string().optional().or(z.literal("")),
  slug: z.string().optional().or(z.literal("")),
  orderNo: z.string().max(80).optional().or(z.literal("")),
  customerName: z.string().min(2).max(120),
  customerEmail: z.string().email().optional().or(z.literal("")),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(160).optional().or(z.literal("")),
  content: z.string().min(5).max(1200),
  images: z.array(z.string()).optional().default([]),
});

const updateReviewSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "HIDDEN"]).optional(),
  adminReply: z.string().max(1000).optional().or(z.literal("")),
});

function cleanText(value = "", max = 1200) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizeLookup(value = "") {
  return String(value || "").trim().toLowerCase();
}

function normalizeStatus(value = "") {
  const status = String(value || "ALL").trim().toUpperCase();
  return ["PENDING", "APPROVED", "REJECTED", "HIDDEN"].includes(status) ? status : "ALL";
}

function reviewInclude() {
  return {
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
    user: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
  };
}

async function findProductByKey({ productId = "", sku = "", slug = "" } = {}) {
  const id = String(productId || "").trim();
  const normalizedSku = String(sku || "").trim().toUpperCase();
  const normalizedSlug = String(slug || "").trim();

  return prisma.product.findFirst({
    where: {
      active: true,
      OR: [
        id ? { id } : undefined,
        normalizedSku ? { sku: normalizedSku } : undefined,
        normalizedSlug ? { slug: normalizedSlug } : undefined,
      ].filter(Boolean),
    },
  });
}

async function isVerifiedPurchase({ orderNo = "", productId = "", customerEmail = "", userId = null } = {}) {
  const normalizedOrderNo = String(orderNo || "").trim();
  if (!normalizedOrderNo) return false;

  const order = await prisma.order.findFirst({
    where: {
      orderNo: normalizedOrderNo,
      OR: [
        customerEmail ? { customerEmail } : undefined,
        userId ? { customerId: userId } : undefined,
      ].filter(Boolean),
      items: {
        some: {
          productId,
        },
      },
    },
  });

  return Boolean(order);
}

async function recomputeProductRating(tx, productId) {
  const approved = await tx.productReview.findMany({
    where: {
      productId,
      status: "APPROVED",
    },
    select: {
      rating: true,
    },
  });

  const rating = approved.length
    ? Math.round((approved.reduce((sum, item) => sum + Number(item.rating || 0), 0) / approved.length) * 10) / 10
    : 0;

  await tx.product.update({
    where: { id: productId },
    data: { rating },
  });

  return rating;
}

function publicReview(review) {
  return {
    id: review.id,
    productId: review.productId,
    customerName: review.customerName,
    rating: review.rating,
    title: review.title || "",
    content: review.content,
    images: review.images || [],
    verifiedPurchase: review.verifiedPurchase,
    adminReply: review.adminReply || "",
    createdAt: review.createdAt,
  };
}

export async function listStorefrontProductReviews(req, res, next) {
  try {
    const key = req.params.key || "";
    const product = await prisma.product.findFirst({
      where: {
        active: true,
        OR: [
          { id: key },
          { slug: key },
          { sku: String(key).toUpperCase() },
        ],
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const reviews = await prisma.productReview.findMany({
      where: {
        productId: product.id,
        status: "APPROVED",
      },
      orderBy: [{ verifiedPurchase: "desc" }, { createdAt: "desc" }],
      take: 50,
    });

    res.json({
      success: true,
      productId: product.id,
      reviews: reviews.map(publicReview),
    });
  } catch (error) {
    next(error);
  }
}

export async function createStorefrontReview(req, res, next) {
  try {
    const body = createReviewSchema.parse({
      ...req.body,
      rating: Number(req.body?.rating || 0),
    });

    const product = await findProductByKey(body);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const customerEmail = cleanText(body.customerEmail || "", 160);
    const verifiedPurchase = await isVerifiedPurchase({
      orderNo: body.orderNo,
      productId: product.id,
      customerEmail,
      userId: req.user?.id || null,
    });

    const review = await prisma.productReview.create({
      data: {
        productId: product.id,
        userId: req.user?.id || null,
        orderNo: cleanText(body.orderNo || "", 80) || null,
        customerName: cleanText(body.customerName, 120),
        customerEmail: customerEmail || null,
        rating: body.rating,
        title: cleanText(body.title || "", 160) || null,
        content: cleanText(body.content, 1200),
        images: Array.isArray(body.images) ? body.images.slice(0, 5) : [],
        status: "PENDING",
        verifiedPurchase,
      },
      include: reviewInclude(),
    });

    res.status(201).json({
      success: true,
      message: "Review submitted and waiting for moderation.",
      review,
    });
  } catch (error) {
    next(error);
  }
}

export async function listAdminReviews(req, res, next) {
  try {
    const status = normalizeStatus(req.query.status);
    const q = normalizeLookup(req.query.q || "");

    const reviews = await prisma.productReview.findMany({
      where: {
        ...(status !== "ALL" ? { status } : {}),
        ...(q
          ? {
              OR: [
                { customerName: { contains: q, mode: "insensitive" } },
                { customerEmail: { contains: q, mode: "insensitive" } },
                { content: { contains: q, mode: "insensitive" } },
                { title: { contains: q, mode: "insensitive" } },
                { product: { sku: { contains: q, mode: "insensitive" } } },
                { product: { nameVi: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: reviewInclude(),
      orderBy: [{ createdAt: "desc" }],
      take: 300,
    });

    res.json({
      success: true,
      reviews,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminReview(req, res, next) {
  try {
    const body = updateReviewSchema.parse(req.body || {});
    const id = req.params.id;

    const current = await prisma.productReview.findUnique({
      where: { id },
    });

    if (!current) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    const review = await prisma.$transaction(async (tx) => {
      const updated = await tx.productReview.update({
        where: { id },
        data: {
          ...(body.status ? { status: body.status } : {}),
          ...(body.adminReply !== undefined ? { adminReply: cleanText(body.adminReply, 1000) || null } : {}),
          moderatedById: req.user?.id || null,
          moderatedAt: new Date(),
        },
        include: reviewInclude(),
      });

      if (body.status) {
        await recomputeProductRating(tx, updated.productId);
      }

      return updated;
    });

    res.json({
      success: true,
      review,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAdminReview(req, res, next) {
  try {
    const id = req.params.id;

    const current = await prisma.productReview.findUnique({
      where: { id },
    });

    if (!current) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.productReview.delete({
        where: { id },
      });

      await recomputeProductRating(tx, current.productId);
    });

    res.json({
      success: true,
      id,
    });
  } catch (error) {
    next(error);
  }
}
