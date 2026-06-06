import express from "express";
import {
  exportAdminReportCsv,
  getAdminReportCenter,
} from "../controllers/reportController.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const router = express.Router();

const requireReportRead = [requireAuth, requirePermission("reports:read")];

router.get("/admin/summary", ...requireReportRead, getAdminReportCenter);
router.get("/admin/export", ...requireReportRead, exportAdminReportCsv);

export default router;
