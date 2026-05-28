import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";

function parsePort(value, fallback = 4800) {
  const port = Number(value || fallback);
  return Number.isInteger(port) && port > 0 ? port : fallback;
}

function parseOrigins(value = "") {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const jwtSecret = process.env.JWT_SECRET || "";
const frontendOrigin = process.env.FRONTEND_ORIGIN || (isProduction ? "" : "http://localhost:5173");
const databaseUrl = process.env.DATABASE_URL || "";
const directUrl = process.env.DIRECT_URL || "";

if (isProduction && jwtSecret.length < 32) {
  throw new Error("JWT_SECRET is required and must be at least 32 characters in production.");
}

if (isProduction && !databaseUrl) {
  throw new Error("DATABASE_URL is required in production.");
}

if (isProduction && !directUrl) {
  throw new Error("DIRECT_URL is required in production because Prisma schema uses directUrl.");
}

if (isProduction && !frontendOrigin) {
  throw new Error("FRONTEND_ORIGIN is required in production.");
}

if (isProduction && /^http:\/\/localhost/i.test(frontendOrigin)) {
  throw new Error("FRONTEND_ORIGIN must not be localhost in production.");
}

if (!isProduction && jwtSecret.length < 16) {
  console.warn("⚠️  Using weak/default JWT_SECRET for development only.");
}

const corsOrigins = Array.from(
  new Set([
    frontendOrigin,
    ...parseOrigins(process.env.CORS_ORIGINS || ""),
  ].filter(Boolean))
);

export const env = {
  port: parsePort(process.env.PORT, 4800),
  nodeEnv,
  isProduction,
  databaseUrl,
  directUrl,
  jwtSecret: jwtSecret || "local-dev-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  frontendOrigin,
  corsOrigins,
};
