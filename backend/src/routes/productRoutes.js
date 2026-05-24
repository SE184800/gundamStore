import express from "express";
import { listStorefrontProducts } from "../controllers/productController.js";

const router = express.Router();

router.get("/", listStorefrontProducts);

export default router;
