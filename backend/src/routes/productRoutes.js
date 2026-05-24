import express from "express";
import {
  getStorefrontProductByKey,
  listStorefrontProducts,
} from "../controllers/productController.js";

const router = express.Router();

router.get("/", listStorefrontProducts);
router.get("/:key", getStorefrontProductByKey);

export default router;
