import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";

export function healthCheck(req, res) {
  res.json({
    success: true,
    status: "ok",
    service: "gundam-store-backend",
    environment: env.nodeEnv,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}

export async function readinessCheck(req, res) {
  try {
    await prisma.$connect();

    const userCount = await prisma.user.count();

    return res.json({
      success: true,
      status: "ready",
      service: "gundam-store-backend",
      database: "connected",
      checks: {
        prisma: "ok",
        userTable: "ok",
        userCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[READINESS_CHECK_FAILED]", {
      message: error?.message,
      code: error?.code,
      name: error?.name,
    });

    return res.status(503).json({
      success: false,
      status: "not_ready",
      service: "gundam-store-backend",
      database: "unavailable",
      error:
        env.isProduction
          ? "Database readiness check failed."
          : error?.message || "Database readiness check failed.",
      timestamp: new Date().toISOString(),
    });
  }
}
