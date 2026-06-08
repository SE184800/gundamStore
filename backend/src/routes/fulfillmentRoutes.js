import express from "express";
import {
  bulkAdminFulfillmentAction,
  listAdminFulfillmentOrders,
  updateAdminFulfillmentAction,
} from "../controllers/fulfillmentController.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const router = express.Router();

const requireFulfillmentRead = [requireAuth, requirePermission("orders:read")];
const requireFulfillmentUpdate = [requireAuth, requirePermission("orders:update")];

router.get("/admin", ...requireFulfillmentRead, listAdminFulfillmentOrders);
router.patch("/admin/:id/action", ...requireFulfillmentUpdate, updateAdminFulfillmentAction);
router.post("/admin/bulk-action", ...requireFulfillmentUpdate, bulkAdminFulfillmentAction);

export default router;
