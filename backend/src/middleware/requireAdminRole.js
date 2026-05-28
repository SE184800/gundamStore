import { prisma } from "../config/prisma.js";

const BLOCKED_FRONTSTORE_ROLES = new Set([
  "CUSTOMER",
  "USER",
  "MEMBER",
]);

function normalizeRole(value = "") {
  return String(value || "").trim().toUpperCase();
}

function getRoleCode(user = {}) {
  return normalizeRole(
    user.roleCode ||
    user.role ||
    user.role?.code ||
    user.role?.name ||
    ""
  );
}

async function resolveRoleFromDb(user = {}) {
  const userId = user.id || user.sub || user.userId;

  if (!userId) return "";

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  return normalizeRole(dbUser?.role?.code || dbUser?.roleCode || dbUser?.role || "");
}

export async function requireAdminRole(req, res, next) {
  try {
    let role = getRoleCode(req.user);

    if (!role) {
      role = await resolveRoleFromDb(req.user);
    }

    if (!role || BLOCKED_FRONTSTORE_ROLES.has(role)) {
      console.warn("[ADMIN_ACCESS_DENIED]", {
        path: req.originalUrl,
        role,
        user: req.user,
      });

      return res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
    }

    return next();
  } catch (error) {
    next(error);
  }
}
