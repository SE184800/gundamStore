import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";

const checks = [];

function addCheck(name, ok, message = "") {
  checks.push({ name, ok, message });
}

function isValidUrl(value = "") {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

const port = Number(process.env.PORT || 4800);
const jwtSecret = process.env.JWT_SECRET || "";
const databaseUrl = process.env.DATABASE_URL || "";
const directUrl = process.env.DIRECT_URL || "";
const frontendOrigin = process.env.FRONTEND_ORIGIN || "";

addCheck("PORT is valid", Number.isInteger(port) && port > 0, `PORT=${process.env.PORT || "4800"}`);
addCheck("DATABASE_URL is set", Boolean(databaseUrl), "DATABASE_URL is required.");
addCheck("DIRECT_URL is set", Boolean(directUrl), "DIRECT_URL is required because Prisma schema uses directUrl.");
addCheck(
  "JWT_SECRET is strong enough",
  !isProduction || jwtSecret.length >= 32,
  "Production JWT_SECRET must be at least 32 characters."
);
addCheck(
  "JWT_SECRET is not placeholder",
  !isProduction || !/change-this|local-dev|secret-change/i.test(jwtSecret),
  "Production JWT_SECRET must not use placeholder value."
);
addCheck(
  "FRONTEND_ORIGIN is set",
  !isProduction || Boolean(frontendOrigin),
  "FRONTEND_ORIGIN is required in production."
);
addCheck(
  "FRONTEND_ORIGIN is valid URL",
  !frontendOrigin || isValidUrl(frontendOrigin),
  `FRONTEND_ORIGIN=${frontendOrigin || "(empty)"}`
);
addCheck(
  "FRONTEND_ORIGIN is not localhost in production",
  !isProduction || !/^http:\/\/localhost/i.test(frontendOrigin),
  "Production FRONTEND_ORIGIN must be your deployed frontend URL."
);

const failed = checks.filter((item) => !item.ok);

console.log("======================================");
console.log("Production Env Check");
console.log("NODE_ENV:", nodeEnv);
console.log("======================================");

for (const item of checks) {
  console.log(`${item.ok ? "✅" : "❌"} ${item.name}${item.message ? ` - ${item.message}` : ""}`);
}

console.log("======================================");

if (failed.length > 0) {
  console.error(`Result: ${checks.length - failed.length}/${checks.length} passed`);
  process.exit(1);
}

console.log(`Result: ${checks.length}/${checks.length} passed`);
