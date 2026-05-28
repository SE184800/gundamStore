export function errorHandler(err, req, res, next) {
  console.error("[API_ERROR]", err);

  const status = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === "production";

  res.status(status).json({
    success: false,
    message: isProduction && status >= 500
      ? "Internal server error"
      : err.message || "Internal server error",
  });
}
