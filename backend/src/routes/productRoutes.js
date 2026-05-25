import express from "express";
import {
  createAdminProduct,
  deleteAdminProduct,
  getStorefrontProductByKey,
  listAdminProducts,
  listStorefrontProducts,
  updateAdminProduct,
} from "../controllers/productController.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const router = express.Router();

router.get(
  "/admin",
  requireAuth,
  requirePermission("products:read"),
  listAdminProducts
);

router.post(
  "/admin",
  requireAuth,
  requirePermission("products:update"),
  createAdminProduct
);

router.patch(
  "/admin/:id",
  requireAuth,
  requirePermission("products:update"),
  updateAdminProduct
);

router.delete(
  "/admin/:id",
  requireAuth,
  requirePermission("products:update"),
  deleteAdminProduct
);

router.get("/", listStorefrontProducts);
router.get("/:key", getStorefrontProductByKey);

export default router;
