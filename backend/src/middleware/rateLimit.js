const buckets = new Map();

function getClientKey(req, keyPrefix) {
  const forwardedFor = String(req.headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim();

  const ip = forwardedFor || req.ip || req.socket?.remoteAddress || "unknown";

  return `${keyPrefix}:${ip}`;
}

export function createRateLimit({
  windowMs = 60_000,
  max = 60,
  keyPrefix = "global",
  message = "Too many requests. Please try again later.",
} = {}) {
  return function rateLimit(req, res, next) {
    const now = Date.now();
    const key = getClientKey(req, keyPrefix);
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });

      return next();
    }

    current.count += 1;

    if (current.count > max) {
      const retryAfter = Math.ceil((current.resetAt - now) / 1000);

      res.setHeader("Retry-After", String(retryAfter));

      return res.status(429).json({
        success: false,
        message,
      });
    }

    return next();
  };
}
