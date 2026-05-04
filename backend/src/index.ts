import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "http";
import { ENV } from "./config/env";
import connectDB from "./config/db";
import { errorHandler } from "./middleware/errorHandler";
import { initSocket } from "./socket/index";
import { runCleanup } from "./utils/cleanup";

// ── Route Imports
import authRoutes from "./routes/auth";
import productRoutes from "./routes/product";
import bidRoutes from "./routes/bid";
import offerRoutes from "./routes/offer";
import orderRoutes from "./routes/order";
import notificationRoutes from "./routes/notification";
import uploadRoutes from "./routes/upload";
import paymentRoutes from "./routes/payment";

const app = express();
const httpServer = createServer(app);

// ── Middleware
app.use(helmet());
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/payments", paymentRoutes);

// ── Health Check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "VaultKix API is running 🚀",
    environment: ENV.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ── Global Error Handler
app.use(errorHandler);

// ── Start Server
const start = async () => {
  await connectDB();
  initSocket(httpServer);

  // Run cleanup immediately on startup
  await runCleanup();

  // Run cleanup every 5 minutes
  setInterval(runCleanup, 5 * 60 * 1000);

  httpServer.listen(ENV.PORT, () => {
    console.log(`🚀 Server running on port ${ENV.PORT}`);
    console.log(`📡 Environment: ${ENV.NODE_ENV}`);
    console.log(`🌐 Client URL: ${ENV.CLIENT_URL}`);
  });
};

start();
