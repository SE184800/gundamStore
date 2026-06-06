import express from "express";
import {
  exportAdminAuditLogsCsv,
  listAdminAuditLogs,
} from "../controllers/auditController.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const router = express.Router();

const requireAuditRead = [requireAuth, requirePermission("reports:read")];

router.get("/admin/logs", ...requireAuditRead, listAdminAuditLogs);
router.get("/admin/export", ...requireAuditRead, exportAdminAuditLogsCsv);

export default router;
