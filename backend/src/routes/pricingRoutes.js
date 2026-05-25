import express from "express";
import {
  createProductSellingPrice,
  deactivateProductSellingPrice,
  listPricingProducts,
  listProductPrices,
  updateProductSellingPrice,
} from "../controllers/pricingController.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const router = express.Router();

const requireProductRead = [requireAuth, requirePermission("products:read")];
const requireProductUpdate = [requireAuth, requirePermission("products:update")];

router.get("/products", ...requireProductRead, listPricingProducts);
router.get("/prices", ...requireProductRead, listProductPrices);
router.post("/products/:productId/prices", ...requireProductUpdate, createProductSellingPrice);
router.patch("/prices/:priceId", ...requireProductUpdate, updateProductSellingPrice);
router.delete("/prices/:priceId", ...requireProductUpdate, deactivateProductSellingPrice);

export default router;
