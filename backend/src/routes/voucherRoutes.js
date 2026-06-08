import express from "express";
import {
  createAdminVoucher,
  deleteAdminVoucher,
  listAdminVouchers,
  updateAdminVoucher,
  validateStorefrontVoucher,
} from "../controllers/voucherController.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const router = express.Router();

const requireVoucherRead = [requireAuth, requirePermission("promotions:read")];
const requireVoucherUpdate = [requireAuth, requirePermission("promotions:update")];

router.post("/validate", validateStorefrontVoucher);

router.get("/admin", ...requireVoucherRead, listAdminVouchers);
router.post("/admin", ...requireVoucherUpdate, createAdminVoucher);
router.patch("/admin/:id", ...requireVoucherUpdate, updateAdminVoucher);
router.delete("/admin/:id", ...requireVoucherUpdate, deleteAdminVoucher);

export default router;
