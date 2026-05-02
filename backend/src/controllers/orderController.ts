import { Response } from "express";
import Order from "../models/Order";
import Offer from "../models/Offer";
import Product from "../models/Product";
import Position from "../models/Position";
import Transaction from "../models/Transaction";
import Notification from "../models/Notification";
import { successResponse, errorResponse } from "../utils/apiResponse";
import { AuthRequest } from "../middleware/auth";
import { z } from "zod";
import mongoose from "mongoose";

// ── Helper ────────────────────────────────────────────────────────────────────

const toObjectId = (id: string | string[]): mongoose.Types.ObjectId => {
  const strId = Array.isArray(id) ? id[0] : id;
  return new mongoose.Types.ObjectId(strId);
};

// ── Validation Schemas ────────────────────────────────────────────────────────

const createOrderSchema = z.object({
  offerId: z.string().min(1, "Offer ID is required"),
  type: z.enum(["delivery", "position"]),
  shippingAddress: z
    .object({
      street: z.string().min(1),
      city: z.string().min(1),
      zip: z.string().min(1),
      country: z.string().min(1),
    })
    .optional(),
});

const updateStatusSchema = z.object({
  status: z.enum([
    "pending_payment",
    "paid",
    "verified",
    "vaulted",
    "shipped",
    "delivered",
    "cancelled",
  ]),
  trackingNumber: z.string().optional(),
});

// ── Controllers ───────────────────────────────────────────────────────────────

// @desc    Create order from accepted offer
// @route   POST /api/orders
// @access  Private (buyer)
export const createOrder = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      errorResponse(res, "Validation failed", 400, parsed.error.issues);
      return;
    }

    const { offerId, type, shippingAddress } = parsed.data;

    // Fetch the accepted offer
    const offer = await Offer.findById(offerId).populate(
      "productId",
      "name brand images",
    );

    if (!offer) {
      errorResponse(res, "Offer not found", 404);
      return;
    }

    // Only the buyer of this offer can create an order
    if (offer.buyerId.toString() !== req.user?.userId) {
      errorResponse(res, "Not authorized", 403);
      return;
    }

    // Offer must be accepted before creating order
    if (offer.currentStatus !== "accepted") {
      errorResponse(
        res,
        "Order can only be created from an accepted offer",
        400,
      );
      return;
    }

    // Delivery orders require shipping address
    if (type === "delivery" && !shippingAddress) {
      errorResponse(
        res,
        "Shipping address is required for delivery orders",
        400,
      );
      return;
    }

    // Check if order already exists for this offer
    const existingOrder = await Order.findOne({
      offerId: toObjectId(offerId),
    });

    if (existingOrder) {
      errorResponse(res, "Order already exists for this offer", 409);
      return;
    }

    const order = await Order.create({
      productId: offer.productId,
      buyerId: toObjectId(req.user?.userId ?? ""),
      sellerId: offer.sellerId,
      offerId: toObjectId(offerId),
      variant: offer.variant,
      finalPrice: offer.finalAmount ?? 0,
      quantity: offer.quantity,
      type,
      status: "pending_payment",
      shippingAddress: type === "delivery" ? shippingAddress : null,
    });

    // Create transaction record
    await Transaction.create({
      userId: toObjectId(req.user?.userId ?? ""),
      type: "order_payment",
      amount: offer.finalAmount ?? 0,
      relatedId: order._id,
      status: "pending",
      note: `Order created for offer ${offerId}`,
    });

    // Notify seller
    await Notification.create({
      userId: offer.sellerId,
      type: "order_status",
      title: "New order received",
      body: `A buyer has placed an order — ${type === "delivery" ? "delivery" : "vault position"}`,
      data: {
        orderId: order._id,
        type,
      },
    });

    successResponse(res, { order }, "Order created successfully", 201);
  } catch (error) {
    errorResponse(res, "Failed to create order", 500, error);
  }
};

// @desc    Get all orders for buyer or seller
// @route   GET /api/orders
// @access  Private
export const getOrders = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { role } = req.query;

    let query: Record<string, unknown> = {};

    // If role=seller show orders where user is seller
    // If role=buyer or no role show orders where user is buyer
    if (role === "seller") {
      query.sellerId = toObjectId(req.user?.userId ?? "");
    } else {
      query.buyerId = toObjectId(req.user?.userId ?? "");
    }

    const orders = await Order.find(query)
      .populate("productId", "name brand images basePrice")
      .populate("buyerId", "username avatar")
      .populate("sellerId", "username avatar")
      .populate("offerId", "thread finalAmount")
      .sort({ createdAt: -1 });

    successResponse(res, { orders }, "Orders fetched");
  } catch (error) {
    errorResponse(res, "Failed to fetch orders", 500, error);
  }
};

// @desc    Get single order detail
// @route   GET /api/orders/:orderId
// @access  Private (buyer or seller of this order)
export const getOrder = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("productId", "name brand images basePrice category")
      .populate("buyerId", "username avatar")
      .populate("sellerId", "username avatar")
      .populate("offerId", "thread finalAmount variant");

    if (!order) {
      errorResponse(res, "Order not found", 404);
      return;
    }

    // Only buyer or seller of this order can view it
    const isBuyer = order.buyerId._id.toString() === req.user?.userId;
    const isSeller = order.sellerId._id.toString() === req.user?.userId;

    if (!isBuyer && !isSeller) {
      errorResponse(res, "Not authorized", 403);
      return;
    }

    successResponse(res, { order }, "Order fetched");
  } catch (error) {
    errorResponse(res, "Failed to fetch order", 500, error);
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:orderId/status
// @access  Private (seller only)
export const updateOrderStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      errorResponse(res, "Validation failed", 400, parsed.error.issues);
      return;
    }

    const { status, trackingNumber } = parsed.data;

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      errorResponse(res, "Order not found", 404);
      return;
    }

    // Only the seller of this order can update status
    if (order.sellerId.toString() !== req.user?.userId) {
      errorResponse(res, "Not authorized", 403);
      return;
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      pending_payment: ["paid", "cancelled"],
      paid: ["verified", "cancelled"],
      verified: ["vaulted", "shipped"],
      vaulted: [],
      shipped: ["delivered"],
      delivered: [],
      cancelled: [],
    };

    const currentStatus = order.status;
    const allowedNext = validTransitions[currentStatus] ?? [];

    if (!allowedNext.includes(status)) {
      errorResponse(
        res,
        `Cannot transition from ${currentStatus} to ${status}`,
        400,
      );
      return;
    }

    // Update order
    order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (status === "delivered" || status === "vaulted") {
      order.settledAt = new Date();
    }
    await order.save();

    // If order goes to vaulted — create a Position automatically
    if (status === "vaulted") {
      await Position.create({
        orderId: order._id,
        productId: order.productId,
        userId: order.buyerId,
        entryPrice: order.finalPrice,
        currentMarketPrice: order.finalPrice,
        unrealizedPnl: 0,
        status: "active",
        acquiredAt: new Date(),
      });

      // Update buyer stats
      const User = (await import("../models/User")).default;
      await User.findByIdAndUpdate(order.buyerId, {
        $inc: { "stats.positionsHeld": 1 },
      });
    }

    // Notify buyer about status update
    await Notification.create({
      userId: order.buyerId,
      type: "order_status",
      title: "Order status updated",
      body: `Your order status has been updated to: ${status}`,
      data: {
        orderId: order._id,
        status,
      },
    });

    successResponse(res, { order }, "Order status updated");
  } catch (error) {
    errorResponse(res, "Failed to update order status", 500, error);
  }
};

// @desc    Confirm delivery choice — buyer confirms delivery or position
// @route   PATCH /api/orders/:orderId/confirm-type
// @access  Private (buyer only)
export const confirmOrderType = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { type } = req.body;

    if (!type || !["delivery", "position"].includes(type)) {
      errorResponse(res, "Type must be delivery or position", 400);
      return;
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      errorResponse(res, "Order not found", 404);
      return;
    }

    if (order.buyerId.toString() !== req.user?.userId) {
      errorResponse(res, "Not authorized", 403);
      return;
    }

    if (order.status !== "pending_payment") {
      errorResponse(res, "Order type can only be changed before payment", 400);
      return;
    }

    order.type = type;
    await order.save();

    successResponse(res, { order }, "Order type confirmed");
  } catch (error) {
    errorResponse(res, "Failed to confirm order type", 500, error);
  }
};

// @desc    Cancel order
// @route   PATCH /api/orders/:orderId/cancel
// @access  Private (buyer or seller)
export const cancelOrder = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      errorResponse(res, "Order not found", 404);
      return;
    }

    const isBuyer = order.buyerId.toString() === req.user?.userId;
    const isSeller = order.sellerId.toString() === req.user?.userId;

    if (!isBuyer && !isSeller) {
      errorResponse(res, "Not authorized", 403);
      return;
    }

    // Can only cancel before shipping
    if (["shipped", "delivered", "vaulted"].includes(order.status)) {
      errorResponse(
        res,
        "Order cannot be cancelled after shipping or vaulting",
        400,
      );
      return;
    }

    // Store old status before changing
    const previousStatus = order.status;

    order.status = "cancelled";
    await order.save();

    // Create refund transaction if payment was already made
    if (previousStatus === "paid") {
      await Transaction.create({
        userId: order.buyerId,
        type: "refund",
        amount: order.finalPrice,
        relatedId: order._id,
        status: "pending",
        note: "Order cancelled — refund initiated",
      });
    }

    // Notify the other party
    const notifyUserId = isBuyer ? order.sellerId : order.buyerId;
    await Notification.create({
      userId: notifyUserId,
      type: "order_status",
      title: "Order cancelled",
      body: "An order has been cancelled",
      data: { orderId: order._id },
    });

    successResponse(res, { order }, "Order cancelled");
  } catch (error) {
    errorResponse(res, "Failed to cancel order", 500, error);
  }
};
