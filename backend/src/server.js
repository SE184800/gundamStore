import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requireAdminRole } from "./middleware/requireAdminRole.js";
import { requireAuth } from "./middleware/auth.js";

import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import productRoutes from "./routes/productRoutes.js";
// 🟢 Giữ nguyên các tuyến đường mới kéo từ sandbox về
import inventoryRoutes from "./routes/inventoryRoutes.js";
import pricingRoutes from "./routes/pricingRoutes.js";
import promotionRoutes from "./routes/promotionRoutes.js";

const app = express();

app.use(helmet());

const allowedCorsOrigins = [
  env.frontendOrigin,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
].filter(Boolean);

function isAllowedCodespacesOrigin(origin = "") {
  return /^https:\/\/[a-z0-9-]+-(5173|5174)\.app\.github\.dev$/i.test(origin);
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedCorsOrigins.includes(origin) || isAllowedCodespacesOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.use("/health", healthRoutes);

app.use([
  "/api/admin",
  "/api/products/admin",
  "/api/orders/admin",
  "/api/inventory",
  "/api/purchase-receipts",
], requireAuth, requireAdminRole);

app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/products", productRoutes);
// 🟢 Kích hoạt các tuyến đường mới
app.use("/api/inventory", inventoryRoutes);
app.use("/api/pricing", pricingRoutes);
app.use("/api/promotions", promotionRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

app.use(errorHandler);

async function start() {
  try {
    await prisma.$connect();
    console.log("💾 Kết nối Neon PostgreSQL Database thành công!");

    // ✅ CHỈNH SỬA 2: Ép cứng cổng 4800 hoặc lấy từ env nếu có, không lo bị undefined
    const REAL_PORT = env.port || 4800;

    app.listen(REAL_PORT, "0.0.0.0", () => {
      console.log("======================================================");
      console.log(`🚀 GUNDAM STORE BE RUNNING AT: http://localhost:${REAL_PORT}`);
      console.log(`👉 Test API Đăng nhập tại: http://localhost:${REAL_PORT}/api/auth/login`);
      console.log("======================================================");
    });
  } catch (err) {
    console.error("Failed to start backend", err);
    process.exit(1);
  }
}

start();