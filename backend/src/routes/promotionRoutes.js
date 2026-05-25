import express from "express";
import {
  createAdminPromotion,
  deactivateAdminPromotion,
  listAdminPromotions,
  listPublicActivePromotions,
  updateAdminPromotion,
} from "../controllers/promotionController.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const router = express.Router();

const requireProductRead = [requireAuth, requirePermission("products:read")];
const requireProductUpdate = [requireAuth, requirePermission("products:update")];

router.get("/public/active", listPublicActivePromotions);

router.get("/admin", ...requireProductRead, listAdminPromotions);
router.post("/admin", ...requireProductUpdate, createAdminPromotion);
router.patch("/admin/:id", ...requireProductUpdate, updateAdminPromotion);
router.delete("/admin/:id", ...requireProductUpdate, deactivateAdminPromotion);

export default router;
