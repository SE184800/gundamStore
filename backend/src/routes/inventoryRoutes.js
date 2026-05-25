import express from "express";
import {
  createPurchaseReceipt,
  createStockAdjustment,
  createStockCount,
  getInventoryDashboard,
  listInventoryTransactions,
  listPurchaseReceipts,
  listStockAdjustments,
  listStockCounts,
} from "../controllers/inventoryController.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const router = express.Router();

const requireProductRead = [requireAuth, requirePermission("products:read")];
const requireProductUpdate = [requireAuth, requirePermission("products:update")];

router.get("/dashboard", ...requireProductRead, getInventoryDashboard);
router.get("/receipts", ...requireProductRead, listPurchaseReceipts);
router.post("/receipts", ...requireProductUpdate, createPurchaseReceipt);
router.get("/transactions", ...requireProductRead, listInventoryTransactions);

router.get("/adjustments", ...requireProductRead, listStockAdjustments);
router.post("/adjustments", ...requireProductUpdate, createStockAdjustment);
router.get("/stock-counts", ...requireProductRead, listStockCounts);
router.post("/stock-counts", ...requireProductUpdate, createStockCount);


export default router;
