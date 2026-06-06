import bcrypt from "bcryptjs/dist/bcrypt.js";
import { z } from "zod";
import { prisma } from "../config/prisma.js";

const DEFAULT_PERMISSIONS = [
  ["products:read", "Read products"],
  ["products:update", "Update products"],
  ["orders:read", "Read orders"],
  ["orders:update", "Update orders"],
  ["reports:read", "Read reports"],
  ["settings:read", "Read settings"],
  ["settings:update", "Update settings"],
  ["users:read", "Read admin users"],
  ["users:update", "Update admin users"],
  ["roles:read", "Read roles"],
  ["roles:update", "Update roles"],
];

function cleanText(value = "", max = 255) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function safeUser(user = {}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    active: user.active,
    roleId: user.roleId,
    role: user.role
      ? {
          id: user.role.id,
          code: user.role.code,
          name: user.role.name,
          permissions: user.role.permissions?.map((item) => item.permission.code) || [],
        }
      : null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function roleInclude() {
  return {
    permissions: {
      include: {
        permission: true,
      },
      orderBy: {
        permission: {
          code: "asc",
        },
      },
    },
    users: {
      select: {
        id: true,
        active: true,
      },
    },
  };
}

function userInclude() {
  return {
    role: {
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    },
  };
}

async function ensureDefaultPermissions() {
  for (const [code, name] of DEFAULT_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code },
      create: { code, name },
      update: { name },
    });
  }
}

async function audit(req, action, entity, entityId, metadata = {}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id || null,
        action,
        entity,
        entityId,
        metadata,
      },
    });
  } catch {
    // Audit log must not block admin operations.
  }
}

export async function listAdminUsers(req, res, next) {
  try {
    await ensureDefaultPermissions();

    const q = cleanText(req.query.q || "", 120).toLowerCase();
    const roleId = cleanText(req.query.roleId || "", 120);
    const active = String(req.query.active || "ALL").toUpperCase();

    let users = await prisma.user.findMany({
      where: {
        ...(roleId ? { roleId } : {}),
        ...(active === "ACTIVE" ? { active: true } : {}),
        ...(active === "INACTIVE" ? { active: false } : {}),
      },
      include: userInclude(),
      orderBy: [{ createdAt: "desc" }],
      take: 500,
    });

    if (q) {
      users = users.filter((user) =>
        [user.name, user.email, user.role?.code, user.role?.name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    res.json({
      success: true,
      users: users.map(safeUser),
      summary: {
        total: users.length,
        active: users.filter((user) => user.active).length,
        inactive: users.filter((user) => !user.active).length,
        admins: users.filter((user) => ["ADMIN", "SUPER_ADMIN"].includes(String(user.role?.code || "").toUpperCase())).length,
      },
    });
  } catch (error) {
    next(error);
  }
}

const createUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  roleId: z.string().min(1),
  active: z.boolean().optional(),
});

export async function createAdminUser(req, res, next) {
  try {
    const body = createUserSchema.parse(req.body || {});
    const normalizedEmail = body.email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Email already exists.",
      });
    }

    const role = await prisma.role.findUnique({
      where: { id: body.roleId },
    });

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role not found.",
      });
    }

    const password = body.password || `Temp@${Math.floor(100000 + Math.random() * 900000)}`;
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: cleanText(body.name, 120),
        email: normalizedEmail,
        passwordHash,
        roleId: body.roleId,
        active: body.active !== false,
      },
      include: userInclude(),
    });

    await audit(req, "CREATE_ADMIN_USER", "User", user.id, {
      email: user.email,
      roleCode: role.code,
    });

    res.status(201).json({
      success: true,
      user: safeUser(user),
      temporaryPassword: body.password ? null : password,
    });
  } catch (error) {
    next(error);
  }
}

const updateUserSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  roleId: z.string().min(1).optional(),
  active: z.boolean().optional(),
  password: z.string().min(8).optional().or(z.literal("")),
});

export async function updateAdminUser(req, res, next) {
  try {
    const body = updateUserSchema.parse(req.body || {});
    const id = req.params.id;

    const current = await prisma.user.findUnique({
      where: { id },
      include: userInclude(),
    });

    if (!current) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const data = {};

    if (body.name !== undefined) data.name = cleanText(body.name, 120);
    if (body.roleId !== undefined) data.roleId = body.roleId;
    if (body.active !== undefined) data.active = body.active;
    if (body.password) data.passwordHash = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.update({
      where: { id },
      data,
      include: userInclude(),
    });

    await audit(req, "UPDATE_ADMIN_USER", "User", id, {
      before: {
        name: current.name,
        roleId: current.roleId,
        active: current.active,
      },
      after: {
        name: user.name,
        roleId: user.roleId,
        active: user.active,
        passwordChanged: Boolean(body.password),
      },
    });

    res.json({
      success: true,
      user: safeUser(user),
    });
  } catch (error) {
    next(error);
  }
}

export async function listAdminRoles(req, res, next) {
  try {
    await ensureDefaultPermissions();

    const [roles, permissions] = await Promise.all([
      prisma.role.findMany({
        include: roleInclude(),
        orderBy: [{ code: "asc" }],
      }),
      prisma.permission.findMany({
        orderBy: [{ code: "asc" }],
      }),
    ]);

    res.json({
      success: true,
      roles: roles.map((role) => ({
        id: role.id,
        code: role.code,
        name: role.name,
        userCount: role.users?.length || 0,
        activeUserCount: role.users?.filter((user) => user.active).length || 0,
        permissions: role.permissions?.map((item) => item.permission.code) || [],
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      })),
      permissions,
    });
  } catch (error) {
    next(error);
  }
}

const roleSchema = z.object({
  code: z.string().min(2).max(80),
  name: z.string().min(2).max(120),
  permissions: z.array(z.string()).optional().default([]),
});

export async function createAdminRole(req, res, next) {
  try {
    await ensureDefaultPermissions();

    const body = roleSchema.parse(req.body || {});
    const code = cleanText(body.code, 80).toUpperCase().replace(/\s+/g, "_");

    const existing = await prisma.role.findUnique({
      where: { code },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Role code already exists.",
      });
    }

    const role = await prisma.$transaction(async (tx) => {
      const created = await tx.role.create({
        data: {
          code,
          name: cleanText(body.name, 120),
        },
      });

      if (body.permissions.length) {
        const permissionRows = await tx.permission.findMany({
          where: {
            code: { in: body.permissions },
          },
        });

        await tx.rolePermission.createMany({
          data: permissionRows.map((permission) => ({
            roleId: created.id,
            permissionId: permission.id,
          })),
          skipDuplicates: true,
        });
      }

      return tx.role.findUnique({
        where: { id: created.id },
        include: roleInclude(),
      });
    });

    await audit(req, "CREATE_ROLE", "Role", role.id, {
      code: role.code,
      permissions: body.permissions,
    });

    res.status(201).json({
      success: true,
      role,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminRole(req, res, next) {
  try {
    await ensureDefaultPermissions();

    const body = roleSchema.partial().parse(req.body || {});
    const id = req.params.id;

    const current = await prisma.role.findUnique({
      where: { id },
      include: roleInclude(),
    });

    if (!current) {
      return res.status(404).json({
        success: false,
        message: "Role not found.",
      });
    }

    const role = await prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id },
        data: {
          ...(body.code ? { code: cleanText(body.code, 80).toUpperCase().replace(/\s+/g, "_") } : {}),
          ...(body.name ? { name: cleanText(body.name, 120) } : {}),
        },
      });

      if (body.permissions) {
        await tx.rolePermission.deleteMany({
          where: { roleId: id },
        });

        const permissionRows = await tx.permission.findMany({
          where: {
            code: { in: body.permissions },
          },
        });

        if (permissionRows.length) {
          await tx.rolePermission.createMany({
            data: permissionRows.map((permission) => ({
              roleId: id,
              permissionId: permission.id,
            })),
            skipDuplicates: true,
          });
        }
      }

      return tx.role.findUnique({
        where: { id },
        include: roleInclude(),
      });
    });

    await audit(req, "UPDATE_ROLE", "Role", id, {
      before: {
        code: current.code,
        name: current.name,
        permissions: current.permissions?.map((item) => item.permission.code) || [],
      },
      after: {
        code: role.code,
        name: role.name,
        permissions: role.permissions?.map((item) => item.permission.code) || [],
      },
    });

    res.json({
      success: true,
      role,
    });
  } catch (error) {
    next(error);
  }
}

export async function listAdminPermissions(req, res, next) {
  try {
    await ensureDefaultPermissions();

    const permissions = await prisma.permission.findMany({
      orderBy: [{ code: "asc" }],
    });

    res.json({
      success: true,
      permissions,
    });
  } catch (error) {
    next(error);
  }
}
