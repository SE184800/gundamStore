import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { verifyPassword } from "../utils/password.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

function safeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
      ? {
          code: user.role.code,
          name: user.role.name,
          permissions: user.role.permissions?.map((item) => item.permission.code) || [],
        }
      : null,
  };
}

export async function login(req, res, next) {
  try {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user || !user.active) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const valid = await verifyPassword(body.password, user.passwordHash);

    if (!valid) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role.code,
      },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );

    res.json({
      success: true,
      token,
      user: safeUser(user),
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res) {
  res.json({
    success: true,
    user: safeUser(req.user),
  });
}

export async function logout(req, res) {
  res.json({
    success: true,
    message: "Logged out on client side",
  });
}
