import { Request, Response } from "express";
import Order from "../models/Order";
import Transaction from "../models/Transaction";
import User from "../models/User";
import Notification from "../models/Notification";
import { successResponse, errorResponse } from "../utils/apiResponse";
import { AuthRequest } from "../middleware/auth";
import { emitOrderUpdate } from "../socket/index";
import { z } from "zod";
import mongoose from "mongoose";

// ── Helper ────────────────────────────────────────────────────────────────────

const toObjectId = (id: string | string[]): mongoose.Types.ObjectId => {
  const strId = Array.isArray(id) ? id[0] : id;
  return new mongoose.Types.ObjectId(strId);
};

// ── Validation ────────────────────────────────────────────────────────────────

const createPaymentSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
});

// ── Controllers ───────────────────────────────────────────────────────────────

// @desc    Initiate payment for an order
// @route   POST /api/payments/initiate
// @access  Private (buyer)
// NOTE: This is a placeholder for Razorpay integration in V2
// For now it returns order details and amount for frontend to display
export const initiatePayment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const parsed = createPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      errorResponse(res, "Validation failed", 400, parsed.error.issues);
      return;
    }

    const { orderId } = parsed.data;

    const order = await Order.findById(orderId)
      .populate("productId", "name brand images")
      .populate("sellerId", "username");

    if (!order) {
      errorResponse(res, "Order not found", 404);
      return;
    }

    if (order.buyerId.toString() !== req.user?.userId) {
      errorResponse(res, "Not authorized", 403);
      return;
    }

    if (order.status !== "pending_payment") {
      errorResponse(res, "Order is not awaiting payment", 400);
      return;
    }

    const platformFee = order.finalPrice * 0.02;
    const sellerPayout = order.finalPrice - platformFee;

    successResponse(
      res,
      {
        orderId: order._id,
        amount: order.finalPrice,
        platformFee: platformFee.toFixed(2),
        sellerPayout: sellerPayout.toFixed(2),
        currency: "INR",
        orderType: order.type,
        // Razorpay order will be created here in V2
        paymentGateway: "manual_v1",
      },
      "Payment initiated — use /confirm to complete",
    );
  } catch (error) {
    errorResponse(res, "Failed to initiate payment", 500, error);
  }
};

// @desc    Confirm payment — simulates successful payment for V1
// @route   POST /api/payments/confirm/:orderId
// @access  Private (buyer)
export const confirmPayment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
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
      errorResponse(res, "Order is not awaiting payment", 400);
      return;
    }

    // Mark order as paid
    order.status = "paid";
    await order.save();

    // Update transaction to completed
    await Transaction.findOneAndUpdate(
      {
        relatedId: order._id,
        type: "order_payment",
      },
      { status: "completed" },
    );

    // Update buyer total spent
    await User.findByIdAndUpdate(order.buyerId, {
      $inc: { "wallet.totalSpent": order.finalPrice },
    });

    // 2% platform fee — seller gets 98%
    const platformFee = order.finalPrice * 0.02;
    const sellerPayout = order.finalPrice - platformFee;

    // Credit seller wallet
    await User.findByIdAndUpdate(order.sellerId, {
      $inc: {
        "wallet.totalEarned": sellerPayout,
        "wallet.balance": sellerPayout,
      },
    });

    // Record payout transaction for seller
    await Transaction.create({
      userId: order.sellerId,
      type: "payout",
      amount: sellerPayout,
      relatedId: order._id,
      status: "completed",
      note: `Payout for order — 2% platform fee deducted`,
    });

    // Record fee transaction
    await Transaction.create({
      userId: order.buyerId,
      type: "fee",
      amount: platformFee,
      relatedId: order._id,
      status: "completed",
      note: "Platform fee 2%",
    });

    // Notify seller
    await Notification.create({
      userId: order.sellerId,
      type: "order_status",
      title: "Payment received",
      body: `Payment of $${order.finalPrice} received. Payout: $${sellerPayout.toFixed(2)}`,
      data: { orderId: order._id },
    });

    // Notify buyer
    await Notification.create({
      userId: order.buyerId,
      type: "order_status",
      title: "Payment successful",
      body: "Your payment was processed successfully",
      data: { orderId: order._id },
    });

    // Emit real-time update to buyer
    emitOrderUpdate(order.buyerId.toString(), {
      orderId: order._id.toString(),
      status: "paid",
    });

    successResponse(
      res,
      {
        order,
        payout: {
          sellerPayout: sellerPayout.toFixed(2),
          platformFee: platformFee.toFixed(2),
        },
      },
      "Payment confirmed successfully",
    );
  } catch (error) {
    errorResponse(res, "Failed to confirm payment", 500, error);
  }
};

// @desc    Get payment status for an order
// @route   GET /api/payments/status/:orderId
// @access  Private
export const getPaymentStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("productId", "name brand images")
      .populate("buyerId", "username avatar")
      .populate("sellerId", "username avatar");

    if (!order) {
      errorResponse(res, "Order not found", 404);
      return;
    }

    const isBuyer = order.buyerId._id.toString() === req.user?.userId;
    const isSeller = order.sellerId._id.toString() === req.user?.userId;

    if (!isBuyer && !isSeller) {
      errorResponse(res, "Not authorized", 403);
      return;
    }

    const platformFee = order.finalPrice * 0.02;
    const sellerPayout = order.finalPrice - platformFee;

    successResponse(
      res,
      {
        orderId: order._id,
        orderStatus: order.status,
        orderType: order.type,
        finalPrice: order.finalPrice,
        platformFee: platformFee.toFixed(2),
        sellerPayout: sellerPayout.toFixed(2),
        paymentGateway: "manual_v1",
      },
      "Payment status fetched",
    );
  } catch (error) {
    errorResponse(res, "Failed to get payment status", 500, error);
  }
};
