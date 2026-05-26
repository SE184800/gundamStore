import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";
const jwtSecret = process.env.JWT_SECRET || "";

if (nodeEnv === "production" && jwtSecret.length < 32) {
  throw new Error("JWT_SECRET is required and must be at least 32 characters in production.");
}

if (nodeEnv !== "production" && jwtSecret.length < 16) {
  console.warn("⚠️  Using weak/default JWT_SECRET for development only.");
}

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: jwtSecret || "change-this-in-real-env",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
};
