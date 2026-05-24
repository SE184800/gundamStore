export function healthCheck(req, res) {
  res.json({
    success: true,
    status: "ok",
    service: "gundam-store-backend",
    timestamp: new Date().toISOString(),
  });
}
