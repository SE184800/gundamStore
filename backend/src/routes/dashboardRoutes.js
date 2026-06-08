import express from "express";
import { getAdminDashboardKpis } from "../controllers/dashboardController.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const router = express.Router();

router.get(
  "/admin/kpis",
  requireAuth,
  requirePermission("reports:read"),
  getAdminDashboardKpis
);

export default router;
