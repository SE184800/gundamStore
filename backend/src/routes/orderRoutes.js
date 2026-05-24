import express from "express";
import {
  createOrder,
  listAdminOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const router = express.Router();

router.post("/", createOrder);

router.get(
  "/admin",
  requireAuth,
  requirePermission("orders:read"),
  listAdminOrders
);

router.patch(
  "/admin/:id/status",
  requireAuth,
  requirePermission("orders:update"),
  updateOrderStatus
);

export default router;
