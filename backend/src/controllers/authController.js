import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { verifyPassword } from "../utils/password.js";
import bcrypt from "bcryptjs/dist/bcrypt.js";
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Tên hiển thị phải từ 2 ký tự trở lên")
    .regex(/^[\p{L}\s]+$/u, "Họ và tên chỉ được chứa chữ cái và khoảng trắng"), // Đồng bộ 100% với Regex Front-end
  email: z.string().trim().email("Định dạng Email không hợp lệ"),
  password: z
    .string()
    .min(8, "Mật khẩu phải từ 8 ký tự trở lên")
    .regex(/[A-Z]/, "Mật khẩu phải chứa ít nhất 1 chữ cái viết hoa")
    .regex(/[0-9]/, "Mật khẩu phải chứa ít nhất 1 chữ số")
    .regex(/[^A-Za-z0-9]/, "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt"),
});
async function writeAuthAudit({ actorId = null, action = "AUTH_EVENT", email = "", success = false, reason = "", req = null }) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        entity: "Auth",
        entityId: actorId || email || null,
        metadata: {
          email,
          success,
          reason,
          ip: req?.ip || "",
          userAgent: req?.headers?.["user-agent"] || "",
        },
      },
    });
  } catch {
    // Auth audit should not block login/logout.
  }
}

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
      await writeAuthAudit({
        action: "ADMIN_LOGIN_FAILED",
        email: body.email.toLowerCase(),
        success: false,
        reason: "USER_NOT_FOUND_OR_INACTIVE",
        req,
      });

      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const valid = await verifyPassword(body.password, user.passwordHash);

    if (!valid) {
      await writeAuthAudit({
        actorId: user.id,
        action: "ADMIN_LOGIN_FAILED",
        email: user.email,
        success: false,
        reason: "INVALID_PASSWORD",
        req,
      });

      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role.code,
      },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn || "1d" }
    );

    await writeAuthAudit({
      actorId: user.id,
      action: "ADMIN_LOGIN_SUCCESS",
      email: user.email,
      success: true,
      req,
    });

    res.json({
      success: true,
      token,
      user: safeUser(user),
    });
  } catch (err) {
    next(err);
  }
}
export async function register(req, res, next) {
  try {
    // 1. Dùng Zod để quét và bóc tách dữ liệu gửi lên
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.errors[0].message,
      });
    }

    const { name, email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase();

    // 2. Chốt chặn trùng lặp: Kiểm tra xem email đã có ai đăng ký chưa
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Địa chỉ Email này đã được đăng ký trên hệ thống!",
      });
    }

    // 3. Tìm kiếm ID của nhóm quyền 'USER' mà cậu vừa chỉnh sửa dưới Neon DB
    const defaultRole = await prisma.role.findFirst({
      where: {
        code: "USER" // Quét theo code USER viết hoa cực kỳ chính xác
      },
    });

    if (!defaultRole) {
      return res.status(500).json({
        success: false,
        message: "Hệ thống lỗi: Chưa tìm thấy cấu hình quyền 'USER' dưới database. Vui lòng liên hệ Admin!",
      });
    }

    // 4. Tiến hành mã hóa (băm) mật khẩu bảo mật bằng bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 5. Ghi bản ghi mới xuống Neon DB bằng Prisma
    // (id, active, createdAt, updatedAt hệ thống tự lo hoàn toàn)
    const newUser = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        roleId: defaultRole.id, // 🌟 Gán ID xịn vừa quét được từ DB vào đây
      },
      include: {
        role: true, // Nhúng kèm thông tin role để trả về cho Client
      },
    });
    const token = jwt.sign(
      {
        sub: newUser.id,
        role: defaultRole.code,
      },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn || "1d" }
    );

    // Trả kết quả xanh mượt về cho Front-end nhận diện
    return res.status(201).json({
      success: true,
      message: "Đăng ký tài khoản Gundam Store thành công!",
      token,
      user: safeUser(newUser),
    });

  } catch (err) {
    console.error("🔥 Lỗi phát sinh tại Register Controller:", err);
    return next(err); // Đẩy qua middleware xử lý lỗi tập trung của Back-end
  }
}
export async function me(req, res) {
  res.json({
    success: true,
    user: safeUser(req.user),
  });
}

export async function logout(req, res) {
  await writeAuthAudit({
    actorId: req.user?.id || null,
    action: "ADMIN_LOGOUT",
    email: req.user?.email || "",
    success: true,
    req,
  });

  res.json({
    success: true,
    message: "Logged out on client side",
  });
}
