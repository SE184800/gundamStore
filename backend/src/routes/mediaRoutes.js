import express from "express";
import {
  uploadBannerImageMiddleware,
  uploadBannerImages,
  uploadCategoryImage,
  uploadCategoryImageMiddleware,
  uploadProductImages,
  uploadProductImagesMiddleware,
} from "../controllers/mediaUploadController.js";

const router = express.Router();

router.post("/products/:productId/images", uploadProductImagesMiddleware, uploadProductImages);
router.post("/banners/:bannerId/images", uploadBannerImageMiddleware, uploadBannerImages);
router.post("/categories/:categoryId/image", uploadCategoryImageMiddleware, uploadCategoryImage);

export default router;
