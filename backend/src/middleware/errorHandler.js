import { ZodError } from "zod";

function getVietnameseValidationMessage(issue) {
  const field = issue?.path?.join(".") || "dữ liệu";

  const fieldMap = {
    label: "Tên địa chỉ",
    receiver: "Người nhận",
    phone: "Số điện thoại",
    address: "Địa chỉ chi tiết",
    city: "Tỉnh / Thành phố",
    district: "Quận / Huyện",
    ward: "Phường / Xã",
    postalCode: "Mã bưu điện",
    name: "Họ tên",
    email: "Email",
    password: "Mật khẩu",
  };

  const label = fieldMap[field] || field;

  if (issue?.code === "too_small") {
    return `${label} chưa đủ độ dài tối thiểu.`;
  }

  if (issue?.code === "too_big") {
    return `${label} vượt quá độ dài cho phép.`;
  }

  if (issue?.code === "invalid_type") {
    return `${label} không đúng định dạng.`;
  }

  if (issue?.code === "invalid_string" || issue?.validation === "email") {
    return `${label} không hợp lệ.`;
  }

  return `${label} không hợp lệ.`;
}

export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    const firstIssue = err.issues?.[0];

    return res.status(400).json({
      success: false,
      message: getVietnameseValidationMessage(firstIssue),
      errors: err.issues?.map((issue) => ({
        path: issue.path,
        message: getVietnameseValidationMessage(issue),
      })),
    });
  }

  console.error("[API_ERROR]", err);

  const status = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === "production";

  res.status(status).json({
    success: false,
    message:
      isProduction && status >= 500
        ? "Internal server error"
        : err.message || "Internal server error",
  });
}
