import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { verifyPassword } from "../utils/password.js";
import bcrypt from "bcryptjs/dist/bcrypt.js";
import crypto from "crypto";
import { hashPassword } from "../utils/password.js";
import nodemailer from 'nodemailer';
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
export async function validateResetToken(req, res, next) {
  try {
    const { token } = req.query; // Lấy token từ query params của GET request
    if (!token) return res.status(400).json({ valid: false });

    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.json({ valid: false, message: "Token không hợp lệ hoặc đã hết hạn!" });
    }

    res.json({ valid: true });
  } catch (err) {
    next(err);
  }
}
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const FRONTEND = process.env.FRONTEND_ORIGIN;
    // 1. Tìm user theo Email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "Email không tồn tại trên hệ thống!" });
    }

    // 2. Tạo Token khôi phục ngẫu nhiên và đặt hạn hết hạn (Ví dụ: 5 phút)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const resetPasswordExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 phút sau

    // 3. Cập nhật Token tạm thời vào bảng User bằng Prisma
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken, // Đảm bảo cậu đã tạo trường String này trong Schema Prisma
        resetPasswordExpires, // Đảm bảo cậu đã tạo trường DateTime này trong Schema Prisma
      },
    });

    // 4. Tạo đường link Reset gửi về Email
    const resetUrl = `${FRONTEND}/reset-password?token=${resetToken}`;

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: 465, // Sử dụng cổng bảo mật SSL
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    // 🟢 2. THIẾT KẾ NỘI DUNG EMAIL GỬI ĐI (CÓ SẴN BUTTON ĐẸP MẮT)
    const mailOptions = {
      from: `"Gundam Store VN" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "🔒 Khôi phục mật khẩu tài khoản của bạn",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 16px;">
          <h2 style="color: #1e3a8a; text-align: center;">Yêu Cầu Đặt Lại Mật Khẩu</h2>
          <p>Xin chào <strong>${user.name || "Bbuilder"}</strong>,</p>
          <p>Hệ thống nhận được yêu cầu khôi phục mật khẩu từ tài khoản của bạn. Vui lòng bấm vào nút bấm bên dưới để tiến hành đặt lại mật khẩu mới. Liên kết này sẽ <strong>hết hạn sau 15 phút</strong>.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #1d4ed8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">
              Đặt lại mật khẩu ngay
            </a>
          </div>
          
          <p style="font-size: 12px; color: #64748b;">Nếu nút bấm phía trên không hoạt động, bạn có thể sao chép và dán đường dẫn này vào trình duyệt: <br> ${resetUrl}</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="font-size: 11px; color: #94a3b8; text-align: center;">Nếu bạn không yêu cầu hành động này, vui lòng bỏ qua email này để giữ an toàn cho tài khoản.</p>
        </div>
      `,
    };

    // 🟢 3. TIẾN HÀNH KÍCH NỔ LỆNH GỬI MAIL CHẠY NGẦM
    await transporter.sendMail(mailOptions);
    res.json({
      success: true,
      message: "Yêu cầu khôi phục mật khẩu đã được xử lý thành công!",
    });
  } catch (err) {
    next(err);
  }
}
export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập đầy đủ thông tin!" });
    }

    // 1. Mã hóa ngược lại chuỗi token nhận từ FE để so khớp với DB
    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");

    // 2. Tìm User có Token trùng khớp và Token đó PHẢI CÒN HẠN (resetPasswordExpires > Giờ hiện tại)
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken,
        resetPasswordExpires: {
          gt: new Date(), // Viết theo chuẩn Prisma: Greater Than (Lớn hơn thời gian hiện tại)
        },
      },
    });
    if (!user) {
      return res.status(400).json({ success: false, message: "Liên kết khôi phục đã hết hạn hoặc không hợp lệ!" });
    }
    const isSameAsOld = await verifyPassword(password, user.passwordHash);
    if (isSameAsOld) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: null,   // Xóa token
          resetPasswordExpires: null, // Xóa thời gian hết hạn
        },
      });
      return res.status(400).json({
        success: false,
        code: "PASSWORD_ALREADY_USED", // Gửi thêm mã code định danh để Front-end dễ bắt bài
        message: "Mật khẩu mới không được trùng với mật khẩu cũ hiện tại của tài khoản!"
      });
    }
    // 3. Mã hóa mật khẩu mới (Cậu dùng hàm băm password sẵn có của dự án cậu nhé, ví dụ: hashPassword)
    const hashedPassword = await hashPassword(password); // Hoặc bcrypt.hash(password, 10)

    // 4. Cập nhật mật khẩu mới và XÓA SẠCH Token tạm đi để không cho xài lại lần 2
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetPasswordToken: null,   // Reset về null
        resetPasswordExpires: null, // Reset về null
      },
    });

    res.json({
      success: true,
      message: "Mật khẩu của bạn đã được cập nhật thành công!",
    });
  } catch (err) {
    next(err);
  }
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
      user: {
        ...safeUser(user),
        roleId: user.roleId || user.role?.id,
      }
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
    message: "Đăng xuất thành công !",
  });
}
