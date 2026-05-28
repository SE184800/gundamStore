import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  addMyWishlistItem,
  clearMyWishlist,
  getMyProfile,
  listMyWishlist,
  removeMyWishlistItem,
  updateMyProfile,
} from "../controllers/accountController.js";

const router = express.Router();

router.get("/me", requireAuth, getMyProfile);
router.patch("/me", requireAuth, updateMyProfile);

router.get("/wishlist", requireAuth, listMyWishlist);
router.post("/wishlist", requireAuth, addMyWishlistItem);
router.delete("/wishlist", requireAuth, clearMyWishlist);
router.delete("/wishlist/:productId", requireAuth, removeMyWishlistItem);

export default router;
