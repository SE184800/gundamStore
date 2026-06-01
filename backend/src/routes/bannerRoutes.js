import express from "express";
import {
  createAdminBanner,
  deleteAdminBanner,
  getAdminHeroSettings,
  listAdminBanners,
  listStorefrontHomeBanners,
  updateAdminBanner,
  updateAdminHeroSettings,
} from "../controllers/bannerController.js";

export const publicBannerRouter = express.Router();
export const adminBannerRouter = express.Router();

publicBannerRouter.get("/home", listStorefrontHomeBanners);

adminBannerRouter.get("/", listAdminBanners);
adminBannerRouter.post("/", createAdminBanner);
adminBannerRouter.patch("/:id", updateAdminBanner);
adminBannerRouter.delete("/:id", deleteAdminBanner);

adminBannerRouter.get("/settings/hero", getAdminHeroSettings);
adminBannerRouter.patch("/settings/hero", updateAdminHeroSettings);
