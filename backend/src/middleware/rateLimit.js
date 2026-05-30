const buckets = new Map();

function getClientKey(req, keyPrefix) {
  // Express req.ip respects app.set("trust proxy", ...).
  // Do not parse x-forwarded-for manually unless the app explicitly trusts proxy hops.
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  return `${keyPrefix}:${ip}`;
}

function cleanupExpiredBuckets(now = Date.now()) {
  if (buckets.size < 5000) return;

  for (const [key, value] of buckets.entries()) {
    if (!value || value.resetAt <= now) {
      buckets.delete(key);
    }
  }
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

    cleanupExpiredBuckets(now);

    if (!current || current.resetAt <= now) {
      buckets.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });

      return next();
    }

    current.count += 1;

    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - current.count)));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(current.resetAt / 1000)));

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
