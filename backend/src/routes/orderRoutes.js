import express from "express";
import {
  createOrder,
  listAdminOrders,
  updateOrderStatus,
  updateOrderPayment,
  updateOrderShipping,
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

router.patch(
  "/admin/:id/payment",
  requireAuth,
  requirePermission("orders:update"),
  updateOrderPayment
);

router.patch(
  "/admin/:id/shipping",
  requireAuth,
  requirePermission("orders:update"),
  updateOrderShipping
);

export default router;
