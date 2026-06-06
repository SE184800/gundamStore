import express from "express";
import {
  createAdminRole,
  createAdminUser,
  listAdminPermissions,
  listAdminRoles,
  listAdminUsers,
  updateAdminRole,
  updateAdminUser,
} from "../controllers/adminUserController.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const router = express.Router();

const requireUserRead = [requireAuth, requirePermission("users:read")];
const requireUserUpdate = [requireAuth, requirePermission("users:update")];
const requireRoleRead = [requireAuth, requirePermission("roles:read")];
const requireRoleUpdate = [requireAuth, requirePermission("roles:update")];

router.get("/users", ...requireUserRead, listAdminUsers);
router.post("/users", ...requireUserUpdate, createAdminUser);
router.patch("/users/:id", ...requireUserUpdate, updateAdminUser);

router.get("/roles", ...requireRoleRead, listAdminRoles);
router.post("/roles", ...requireRoleUpdate, createAdminRole);
router.patch("/roles/:id", ...requireRoleUpdate, updateAdminRole);

router.get("/permissions", ...requireRoleRead, listAdminPermissions);

export default router;
