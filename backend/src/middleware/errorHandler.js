export function errorHandler(err, req, res, next) {
  console.error("[API_ERROR]", err);

  const status = err.statusCode || err.status || 500;

  res.status(status).json({
    success: false,
    message: err.message || "Internal server error",
  });
}
