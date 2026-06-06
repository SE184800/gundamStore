import express from "express";
import {
  createStorefrontReview,
  deleteAdminReview,
  listAdminReviews,
  listStorefrontProductReviews,
  updateAdminReview,
} from "../controllers/reviewController.js";

const router = express.Router();

router.get("/product/:key", listStorefrontProductReviews);
router.post("/", createStorefrontReview);

router.get("/admin", listAdminReviews);
router.patch("/admin/:id", updateAdminReview);
router.delete("/admin/:id", deleteAdminReview);

export default router;
