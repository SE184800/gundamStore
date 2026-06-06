import express from "express";
import {
  addAdminComplaintComment,
  createStorefrontComplaint,
  getAdminComplaintDetail,
  listAdminComplaints,
  updateAdminComplaint,
} from "../controllers/complaintController.js";
import { optionalAuth, requireAuth, requirePermission } from "../middleware/auth.js";
import { createRateLimit } from "../middleware/rateLimit.js";

const router = express.Router();

const createComplaintRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyPrefix: "create-complaint",
  message: "Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau.",
});

const requireComplaintRead = [requireAuth, requirePermission("orders:read")];
const requireComplaintUpdate = [requireAuth, requirePermission("orders:update")];

router.post("/", createComplaintRateLimit, optionalAuth, createStorefrontComplaint);

router.get("/admin", ...requireComplaintRead, listAdminComplaints);
router.get("/admin/:id", ...requireComplaintRead, getAdminComplaintDetail);
router.patch("/admin/:id", ...requireComplaintUpdate, updateAdminComplaint);
router.post("/admin/:id/comments", ...requireComplaintUpdate, addAdminComplaintComment);

export default router;
