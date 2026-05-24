import { prisma } from "../config/prisma.js";

export async function listStorefrontProducts(req, res, next) {
  try {
    const products = await prisma.product.findMany({
      where: {
        active: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 200,
    });

    res.json({
      success: true,
      products,
    });
  } catch (err) {
    next(err);
  }
}
