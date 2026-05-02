import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "http";
import { ENV } from "./config/env";
import connectDB from "./config/db";
import { errorHandler } from "./middleware/errorHandler";

import authRoutes from "./routes/auth";
import productRoutes from "./routes/product";
import bidRoutes from "./routes/bid";
import offerRoutes from "./routes/offer";
import orderRoutes from "./routes/order";

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(helmet());
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

// Health check
app.get("/health", (req, res) => {
  res.json({ success: true, message: "VaultKix API is running 🚀" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/orders", orderRoutes);

// Error handler
app.use(errorHandler);

// Start server
const start = async () => {
  await connectDB();
  httpServer.listen(ENV.PORT, () => {
    console.log(`🚀 Server running on port ${ENV.PORT}`);
  });
};

start();
