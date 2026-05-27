import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { errorHandler } from "./middleware/errorHandler.js";

import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import productRoutes from "./routes/productRoutes.js";
// 🟢 Giữ nguyên các tuyến đường mới kéo từ sandbox về
import inventoryRoutes from "./routes/inventoryRoutes.js";
import pricingRoutes from "./routes/pricingRoutes.js";
import promotionRoutes from "./routes/promotionRoutes.js";

const app = express();

app.use(helmet());

// ✅ CHỈNH SỬA 1: Cấu hình CORS mở cửa cho cả cổng 5173 và 5174 của cậu
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "https://expert-giggle-5g4q5vp5xx9wcvjjj-5173.app.github.dev"],
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.use("/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
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
    const REAL_PORT = env.PORT || 4800;

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