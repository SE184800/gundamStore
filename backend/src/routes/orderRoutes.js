import express from "express";
import {
  createOrder,
  getPublicOrderById,
  listAdminOrders,
  updateOrderStatus,
  updateOrderPayment,
  updateOrderShipping,
} from "../controllers/orderController.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { createRateLimit } from "../middleware/rateLimit.js";

const router = express.Router();

const createOrderRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  keyPrefix: "create-order",
  message: "Bạn tạo đơn quá nhanh. Vui lòng thử lại sau.",
});

const orderLookupRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  keyPrefix: "order-lookup",
  message: "Bạn tra cứu đơn hàng quá nhanh. Vui lòng thử lại sau.",
});

router.post("/", createOrderRateLimit, createOrder);
router.get("/public/:id", orderLookupRateLimit, getPublicOrderById);

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
