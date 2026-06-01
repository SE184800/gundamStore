import express from "express";
import {
  createRestockAlert,
  deleteRestockAlert,
  listAdminRestockAlerts,
  markRestockAlertNotified,
} from "../controllers/restockAlertController.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdminRole } from "../middleware/requireAdminRole.js";
import { createRateLimit } from "../middleware/rateLimit.js";

const router = express.Router();

const createAlertRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyPrefix: "restock-alert",
  message: "Bạn gửi yêu cầu báo hàng quá nhanh. Vui lòng thử lại sau.",
});

router.post("/", createAlertRateLimit, createRestockAlert);

router.get("/admin", requireAuth, requireAdminRole, listAdminRestockAlerts);
router.patch("/admin/:id/notified", requireAuth, requireAdminRole, markRestockAlertNotified);
router.delete("/admin/:id", requireAuth, requireAdminRole, deleteRestockAlert);

export default router;
