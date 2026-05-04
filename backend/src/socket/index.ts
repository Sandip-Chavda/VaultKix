import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthenticatedSocket extends Socket {
  userId?: string;
  role?: string;
}

// ── Socket Server Setup ───────────────────────────────────────────────────────

let io: SocketServer;

export const initSocket = (httpServer: HttpServer): SocketServer => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: ENV.CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // ── Auth Middleware ─────────────────────────────────────────────────────────
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as {
        userId: string;
        role: string;
      };
      socket.userId = decoded.userId;
      socket.role = decoded.role;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  // ── Connection Handler ──────────────────────────────────────────────────────
  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`✅ Socket connected: ${socket.userId}`);

    // Join personal room — for direct notifications
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
      console.log(`👤 User ${socket.userId} joined personal room`);
    }

    // ── Join product room for live bid updates ──────────────────────────────
    socket.on("join:product", (productId: string) => {
      socket.join(`product:${productId}`);
      console.log(`📦 User ${socket.userId} joined product room: ${productId}`);
    });

    // ── Leave product room ──────────────────────────────────────────────────
    socket.on("leave:product", (productId: string) => {
      socket.leave(`product:${productId}`);
      console.log(`📦 User ${socket.userId} left product room: ${productId}`);
    });

    // ── Join offer room for live negotiation ────────────────────────────────
    socket.on("join:offer", (offerId: string) => {
      socket.join(`offer:${offerId}`);
      console.log(`💬 User ${socket.userId} joined offer room: ${offerId}`);
    });

    // ── Leave offer room ────────────────────────────────────────────────────
    socket.on("leave:offer", (offerId: string) => {
      socket.leave(`offer:${offerId}`);
      console.log(`💬 User ${socket.userId} left offer room: ${offerId}`);
    });

    // ── Disconnect ──────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`❌ Socket disconnected: ${socket.userId}`);
    });
  });

  return io;
};

// ── Emit Helpers ──────────────────────────────────────────────────────────────
// These are called from controllers to push real-time events

// Emit to all users watching a product — live bid updates
export const emitBidUpdate = (
  productId: string,
  data: {
    currentHighestBid: number;
    totalBidsCount: number;
    bidIncrement: number;
    auctionEndsAt: Date;
    latestBid: {
      amount: number;
      createdAt: Date;
    };
  },
) => {
  if (!io) return;
  io.to(`product:${productId}`).emit("bid:updated", data);
  console.log(`📡 Emitted bid:updated to product:${productId}`);
};

// Emit to specific user — offer received or countered
export const emitOfferUpdate = (
  userId: string,
  data: {
    offerId: string;
    type:
      | "offer:received"
      | "offer:countered"
      | "offer:accepted"
      | "offer:rejected";
    amount: number;
    from: "buyer" | "seller";
  },
) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(data.type, data);
  console.log(`📡 Emitted ${data.type} to user:${userId}`);
};

// Emit to specific user — order status changed
export const emitOrderUpdate = (
  userId: string,
  data: {
    orderId: string;
    status: string;
    trackingNumber?: string;
  },
) => {
  if (!io) return;
  io.to(`user:${userId}`).emit("order:updated", data);
  console.log(`📡 Emitted order:updated to user:${userId}`);
};

// Emit to specific user — new notification
export const emitNotification = (
  userId: string,
  data: {
    title: string;
    body: string;
    type: string;
    data: Record<string, unknown>;
  },
) => {
  if (!io) return;
  io.to(`user:${userId}`).emit("notification:new", data);
  console.log(`📡 Emitted notification:new to user:${userId}`);
};

export const getIO = (): SocketServer => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
