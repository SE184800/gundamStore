import { prisma } from "../config/prisma.js";

function intValue(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.round(n));
}

function makeReceiptNo() {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `GRN-${stamp}-${Math.floor(Math.random() * 900 + 100)}`;
}

export async function getInventoryDashboard(req, res, next) {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        supplier: true,
        images: {
          where: { active: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 500,
    });

    const summary = {
      products: products.length,
      totalStock: products.reduce((sum, item) => sum + Number(item.stock || 0), 0),
      inventoryValue: products.reduce(
        (sum, item) => sum + Number(item.stock || 0) * Number(item.avgCost || 0),
        0
      ),
      retailValue: products.reduce(
        (sum, item) => sum + Number(item.stock || 0) * Number(item.price || 0),
        0
      ),
      outOfStock: products.filter((item) => Number(item.stock || 0) <= 0).length,
    };

    res.json({
      success: true,
      summary,
      products,
    });
  } catch (err) {
    next(err);
  }
}

export async function listPurchaseReceipts(req, res, next) {
  try {
    const receipts = await prisma.purchaseReceipt.findMany({
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    res.json({
      success: true,
      receipts,
    });
  } catch (err) {
    next(err);
  }
}

export async function createPurchaseReceipt(req, res, next) {
  try {
    const receiptNo = String(req.body.receiptNo || "").trim() || makeReceiptNo();
    const supplierId = String(req.body.supplierId || "").trim() || null;
    const receiptDate = req.body.receiptDate ? new Date(req.body.receiptDate) : new Date();
    const note = String(req.body.note || "").trim() || null;

    const items = Array.isArray(req.body.items) ? req.body.items : [];

    const normalizedItems = items
      .map((item) => ({
        productId: String(item.productId || "").trim(),
        quantity: intValue(item.quantity, 0),
        unitCost: intValue(item.unitCost, 0),
      }))
      .filter((item) => item.productId && item.quantity > 0 && item.unitCost > 0);

    if (!normalizedItems.length) {
      return res.status(400).json({
        success: false,
        message: "At least one valid receipt item is required.",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const totalAmount = normalizedItems.reduce(
        (sum, item) => sum + item.quantity * item.unitCost,
        0
      );

      const receipt = await tx.purchaseReceipt.create({
        data: {
          receiptNo,
          supplierId,
          receiptDate,
          note,
          status: "POSTED",
          totalAmount,
        },
      });

      const savedItems = [];

      for (const item of normalizedItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          const error = new Error(`Product not found: ${item.productId}`);
          error.status = 404;
          throw error;
        }

        const beforeStock = Number(product.stock || 0);
        const beforeAvgCost = Number(product.avgCost || 0);
        const addedQty = item.quantity;
        const unitCost = item.unitCost;
        const afterStock = beforeStock + addedQty;

        const beforeValue = beforeStock * beforeAvgCost;
        const addedValue = addedQty * unitCost;
        const avgCostAfter = afterStock > 0 ? Math.round((beforeValue + addedValue) / afterStock) : unitCost;

        const savedItem = await tx.purchaseReceiptItem.create({
          data: {
            receiptId: receipt.id,
            productId: product.id,
            quantity: addedQty,
            unitCost,
            lineAmount: addedQty * unitCost,
          },
        });

        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: afterStock,
            avgCost: avgCostAfter,
            lastPurchaseCost: unitCost,
            status: afterStock > 0 && product.status === "outOfStock" ? "inStock" : product.status,
          },
        });

        await tx.inventoryTransaction.create({
          data: {
            productId: product.id,
            type: "PURCHASE_RECEIPT",
            quantity: addedQty,
            unitCost,
            beforeStock,
            afterStock,
            avgCostBefore: beforeAvgCost,
            avgCostAfter,
            refType: "PURCHASE_RECEIPT",
            refId: receipt.id,
            note: note || `Goods receipt ${receiptNo}`,
          },
        });

        await tx.inventoryLog.create({
          data: {
            productId: product.id,
            type: "IMPORT",
            quantity: addedQty,
            beforeStock,
            afterStock,
            reason: note || `Goods receipt ${receiptNo}`,
            refType: "PURCHASE_RECEIPT",
            refId: receipt.id,
          },
        });

        savedItems.push(savedItem);
      }

      const fullReceipt = await tx.purchaseReceipt.findUnique({
        where: { id: receipt.id },
        include: {
          supplier: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      return fullReceipt;
    });

    res.status(201).json({
      success: true,
      receipt: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function listInventoryTransactions(req, res, next) {
  try {
    const productId = String(req.query.productId || "").trim();

    const transactions = await prisma.inventoryTransaction.findMany({
      where: productId ? { productId } : {},
      include: {
        product: true,
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    res.json({
      success: true,
      transactions,
    });
  } catch (err) {
    next(err);
  }
}

function makeStockDocNo(prefix) {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `${prefix}-${stamp}-${Math.floor(Math.random() * 900 + 100)}`;
}

export async function listStockAdjustments(req, res, next) {
  try {
    const adjustments = await prisma.stockAdjustment.findMany({
      include: {
        product: true,
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    res.json({
      success: true,
      adjustments,
    });
  } catch (err) {
    next(err);
  }
}

export async function createStockAdjustment(req, res, next) {
  try {
    const adjustmentNo = String(req.body.adjustmentNo || "").trim() || makeStockDocNo("ADJ");
    const productId = String(req.body.productId || "").trim();
    const quantityDelta = Math.round(Number(req.body.quantityDelta || 0));
    const reason = String(req.body.reason || "").trim();
    const note = String(req.body.note || "").trim() || null;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product is required.",
      });
    }

    if (!Number.isFinite(quantityDelta) || quantityDelta === 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity delta must be a non-zero number.",
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Reason is required.",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        const error = new Error("Product not found.");
        error.status = 404;
        throw error;
      }

      const beforeStock = Number(product.stock || 0);
      const afterStock = beforeStock + quantityDelta;

      if (afterStock < 0) {
        const error = new Error("Stock cannot be negative.");
        error.status = 400;
        throw error;
      }

      const avgCost = Number(product.avgCost || 0);

      const adjustment = await tx.stockAdjustment.create({
        data: {
          adjustmentNo,
          productId,
          quantityDelta,
          beforeStock,
          afterStock,
          reason,
          note,
        },
        include: {
          product: true,
        },
      });

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stock: afterStock,
          status: afterStock > 0 && product.status === "outOfStock" ? "inStock" : product.status,
        },
        include: {
          category: true,
          supplier: true,
          images: {
            where: { active: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      });

      await tx.inventoryTransaction.create({
        data: {
          productId,
          type: "STOCK_ADJUSTMENT",
          quantity: Math.abs(quantityDelta),
          unitCost: avgCost,
          beforeStock,
          afterStock,
          avgCostBefore: avgCost,
          avgCostAfter: avgCost,
          refType: "STOCK_ADJUSTMENT",
          refId: adjustment.id,
          note: `${reason}${note ? ` - ${note}` : ""}`,
        },
      });

      await tx.inventoryLog.create({
        data: {
          productId,
          type: quantityDelta > 0 ? "IMPORT" : "EXPORT",
          quantity: Math.abs(quantityDelta),
          beforeStock,
          afterStock,
          reason,
          refType: "STOCK_ADJUSTMENT",
          refId: adjustment.id,
        },
      });

      return {
        adjustment,
        product: updatedProduct,
      };
    });

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

export async function listStockCounts(req, res, next) {
  try {
    const counts = await prisma.stockCount.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    res.json({
      success: true,
      counts,
    });
  } catch (err) {
    next(err);
  }
}

export async function createStockCount(req, res, next) {
  try {
    const countNo = String(req.body.countNo || "").trim() || makeStockDocNo("COUNT");
    const countDate = req.body.countDate ? new Date(req.body.countDate) : new Date();
    const note = String(req.body.note || "").trim() || null;
    const items = Array.isArray(req.body.items) ? req.body.items : [];

    const normalizedItems = items
      .map((item) => ({
        productId: String(item.productId || "").trim(),
        countedStock: Math.max(0, Math.round(Number(item.countedStock || 0))),
        reason: String(item.reason || "").trim() || null,
      }))
      .filter((item) => item.productId);

    if (!normalizedItems.length) {
      return res.status(400).json({
        success: false,
        message: "At least one stock count item is required.",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const count = await tx.stockCount.create({
        data: {
          countNo,
          countDate,
          status: "POSTED",
          note,
        },
      });

      for (const item of normalizedItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          const error = new Error(`Product not found: ${item.productId}`);
          error.status = 404;
          throw error;
        }

        const systemStock = Number(product.stock || 0);
        const countedStock = item.countedStock;
        const difference = countedStock - systemStock;
        const avgCost = Number(product.avgCost || 0);

        await tx.stockCountItem.create({
          data: {
            countId: count.id,
            productId: product.id,
            systemStock,
            countedStock,
            difference,
            reason: item.reason,
          },
        });

        if (difference !== 0) {
          await tx.product.update({
            where: { id: product.id },
            data: {
              stock: countedStock,
              status: countedStock > 0 && product.status === "outOfStock" ? "inStock" : product.status,
            },
          });

          await tx.inventoryTransaction.create({
            data: {
              productId: product.id,
              type: "STOCK_COUNT",
              quantity: Math.abs(difference),
              unitCost: avgCost,
              beforeStock: systemStock,
              afterStock: countedStock,
              avgCostBefore: avgCost,
              avgCostAfter: avgCost,
              refType: "STOCK_COUNT",
              refId: count.id,
              note: item.reason || note || `Stock count ${countNo}`,
            },
          });

          await tx.inventoryLog.create({
            data: {
              productId: product.id,
              type: difference > 0 ? "IMPORT" : "EXPORT",
              quantity: Math.abs(difference),
              beforeStock: systemStock,
              afterStock: countedStock,
              reason: item.reason || note || `Stock count ${countNo}`,
              refType: "STOCK_COUNT",
              refId: count.id,
            },
          });
        }
      }

      return tx.stockCount.findUnique({
        where: { id: count.id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    res.status(201).json({
      success: true,
      count: result,
    });
  } catch (err) {
    next(err);
  }
}
