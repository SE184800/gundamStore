import express from "express";
import { login, logout, me, register, forgotPassword, resetPassword, validateResetToken } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { createRateLimit } from "../middleware/rateLimit.js";

const router = express.Router();

const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyPrefix: "auth",
  message: "Bạn thao tác quá nhanh. Vui lòng thử lại sau.",
});
router.post("/register", authRateLimit, register);
router.post("/login", authRateLimit, login);
router.get("/me", requireAuth, me);
router.post("/logout", requireAuth, logout);
router.post("/forgot-password", authRateLimit, forgotPassword);
router.post("/reset-password", authRateLimit, resetPassword);
router.get("/validate-reset-token", validateResetToken);
export default router;
