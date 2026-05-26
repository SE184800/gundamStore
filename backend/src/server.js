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
import inventoryRoutes from "./routes/inventoryRoutes.js";
import pricingRoutes from "./routes/pricingRoutes.js";
import promotionRoutes from "./routes/promotionRoutes.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.use("/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
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

    app.listen(env.PORT, "0.0.0.0", () => {
      console.log(`Gundam Store backend running on http://localhost:${env.PORT}`);
    });
  } catch (err) {
    console.error("Failed to start backend", err);
    process.exit(1);
  }
}

start();
