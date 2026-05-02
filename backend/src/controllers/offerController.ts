import { Response } from "express";
import Offer from "../models/Offer";
import Product from "../models/Product";
import User from "../models/User";
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

const makeOfferSchema = z.object({
  amount: z.number().min(1, "Offer amount must be positive"),
  variant: z.object({
    type: z.string().default(""),
    size: z.string().default(""),
    color: z.string().default(""),
  }),
  quantity: z.number().min(1).default(1),
});

const counterOfferSchema = z.object({
  amount: z.number().min(1, "Counter offer amount must be positive"),
});

// ── Controllers ───────────────────────────────────────────────────────────────

// @desc    Make an offer on a product
// @route   POST /api/offers/:productId
// @access  Private (buyer)
export const makeOffer = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const parsed = makeOfferSchema.safeParse(req.body);
    if (!parsed.success) {
      errorResponse(res, "Validation failed", 400, parsed.error.issues);
      return;
    }

    const { amount, variant, quantity } = parsed.data;

    const product = await Product.findById(req.params.productId);
    if (!product) {
      errorResponse(res, "Product not found", 404);
      return;
    }

    // Buyer cannot make offer on their own product
    if (product.sellerId.toString() === req.user?.userId) {
      errorResponse(res, "You cannot make an offer on your own product", 403);
      return;
    }

    // Validate minimum offer amount
    if (amount < product.minimumOfferAmount) {
      errorResponse(
        res,
        `Offer must be at least $${product.minimumOfferAmount}`,
        400,
      );
      return;
    }

    // Check if buyer already has an active offer on this product
    const existingOffer = await Offer.findOne({
      productId: toObjectId(req.params.productId),
      buyerId: toObjectId(req.user?.userId ?? ""),
      currentStatus: "negotiating",
    });

    if (existingOffer) {
      errorResponse(
        res,
        "You already have an active offer on this product",
        409,
      );
      return;
    }

    // Set offer expiry to 48 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    const offer = await Offer.create({
      productId: toObjectId(req.params.productId),
      buyerId: toObjectId(req.user?.userId ?? ""),
      sellerId: product.sellerId,
      variant,
      quantity,
      offersLeft: 3,
      thread: [
        {
          from: "buyer",
          amount,
          timestamp: new Date(),
          status: "pending",
        },
      ],
      currentStatus: "negotiating",
      expiresAt,
    });

    // Update buyer stats
    await User.findByIdAndUpdate(req.user?.userId, {
      $inc: { "stats.offersMade": 1 },
    });

    // Update seller stats
    await User.findByIdAndUpdate(product.sellerId, {
      $inc: { "stats.offersReceived": 1 },
    });

    // Notify seller
    await Notification.create({
      userId: product.sellerId,
      type: "offer_received",
      title: "New offer received",
      body: `You received an offer of $${amount} on ${product.name}`,
      data: {
        offerId: offer._id,
        productId: product._id,
        amount,
      },
    });

    successResponse(res, { offer }, "Offer made successfully", 201);
  } catch (error) {
    errorResponse(res, "Failed to make offer", 500, error);
  }
};

// @desc    Counter offer
// @route   POST /api/offers/:offerId/counter
// @access  Private (seller)
export const counterOffer = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const parsed = counterOfferSchema.safeParse(req.body);
    if (!parsed.success) {
      errorResponse(res, "Validation failed", 400, parsed.error.issues);
      return;
    }

    const { amount } = parsed.data;

    const offer = await Offer.findById(req.params.offerId).populate(
      "productId",
      "name",
    );

    if (!offer) {
      errorResponse(res, "Offer not found", 404);
      return;
    }

    // Only the seller of this offer can counter
    if (offer.sellerId.toString() !== req.user?.userId) {
      errorResponse(res, "Not authorized", 403);
      return;
    }

    if (offer.currentStatus !== "negotiating") {
      errorResponse(
        res,
        `Cannot counter an offer with status: ${offer.currentStatus}`,
        400,
      );
      return;
    }

    // Check offer has not expired
    if (new Date() > new Date(offer.expiresAt)) {
      await Offer.findByIdAndUpdate(offer._id, {
        currentStatus: "expired",
      });
      errorResponse(res, "Offer has expired", 410);
      return;
    }

    // Update last thread entry to countered
    const lastThread = offer.thread[offer.thread.length - 1];
    if (lastThread) {
      lastThread.status = "countered";
    }

    // Add counter offer to thread
    offer.thread.push({
      from: "seller",
      amount,
      timestamp: new Date(),
      status: "pending",
    });

    // Reset expiry to 48 hours from now
    offer.expiresAt = new Date();
    offer.expiresAt.setHours(offer.expiresAt.getHours() + 48);

    await offer.save();

    // Notify buyer
    await Notification.create({
      userId: offer.buyerId,
      type: "offer_received",
      title: "Counter offer received",
      body: `The seller countered your offer with $${amount}`,
      data: {
        offerId: offer._id,
        amount,
      },
    });

    successResponse(res, { offer }, "Counter offer sent");
  } catch (error) {
    errorResponse(res, "Failed to send counter offer", 500, error);
  }
};

// @desc    Accept offer
// @route   POST /api/offers/:offerId/accept
// @access  Private (buyer or seller)
export const acceptOffer = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const offer = await Offer.findById(req.params.offerId).populate(
      "productId",
      "name",
    );

    if (!offer) {
      errorResponse(res, "Offer not found", 404);
      return;
    }

    // Only buyer or seller involved in this offer can accept
    const isBuyer = offer.buyerId.toString() === req.user?.userId;
    const isSeller = offer.sellerId.toString() === req.user?.userId;

    if (!isBuyer && !isSeller) {
      errorResponse(res, "Not authorized", 403);
      return;
    }

    if (offer.currentStatus !== "negotiating") {
      errorResponse(
        res,
        `Cannot accept an offer with status: ${offer.currentStatus}`,
        400,
      );
      return;
    }

    // Check offer has not expired
    if (new Date() > new Date(offer.expiresAt)) {
      await Offer.findByIdAndUpdate(offer._id, { currentStatus: "expired" });
      errorResponse(res, "Offer has expired", 410);
      return;
    }

    // Get the last thread entry amount as the final amount
    const lastThread = offer.thread[offer.thread.length - 1];
    const finalAmount = lastThread?.amount ?? 0;

    // Update last thread entry to accepted
    if (lastThread) {
      lastThread.status = "accepted";
    }

    offer.currentStatus = "accepted";
    offer.finalAmount = finalAmount;
    await offer.save();

    // Notify the other party
    const notifyUserId = isBuyer ? offer.sellerId : offer.buyerId;
    const notifyTitle = isBuyer
      ? "Buyer accepted your offer"
      : "Seller accepted your offer";

    await Notification.create({
      userId: notifyUserId,
      type: "offer_accepted",
      title: notifyTitle,
      body: `The offer of $${finalAmount} has been accepted`,
      data: {
        offerId: offer._id,
        finalAmount,
      },
    });

    successResponse(res, { offer }, "Offer accepted successfully");
  } catch (error) {
    errorResponse(res, "Failed to accept offer", 500, error);
  }
};

// @desc    Reject offer
// @route   POST /api/offers/:offerId/reject
// @access  Private (buyer or seller)
export const rejectOffer = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const offer = await Offer.findById(req.params.offerId).populate(
      "productId",
      "name",
    );

    if (!offer) {
      errorResponse(res, "Offer not found", 404);
      return;
    }

    const isBuyer = offer.buyerId.toString() === req.user?.userId;
    const isSeller = offer.sellerId.toString() === req.user?.userId;

    if (!isBuyer && !isSeller) {
      errorResponse(res, "Not authorized", 403);
      return;
    }

    if (offer.currentStatus !== "negotiating") {
      errorResponse(
        res,
        `Cannot reject an offer with status: ${offer.currentStatus}`,
        400,
      );
      return;
    }

    // Update last thread entry to rejected
    const lastThread = offer.thread[offer.thread.length - 1];
    if (lastThread) {
      lastThread.status = "rejected";
    }

    offer.currentStatus = "rejected";
    await offer.save();

    // Notify the other party
    const notifyUserId = isBuyer ? offer.sellerId : offer.buyerId;

    await Notification.create({
      userId: notifyUserId,
      type: "offer_rejected",
      title: "Offer rejected",
      body: `The offer has been rejected`,
      data: { offerId: offer._id },
    });

    successResponse(res, { offer }, "Offer rejected");
  } catch (error) {
    errorResponse(res, "Failed to reject offer", 500, error);
  }
};

// @desc    Get single offer detail with full thread
// @route   GET /api/offers/:offerId
// @access  Private (buyer or seller)
export const getOffer = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const offer = await Offer.findById(req.params.offerId)
      .populate("productId", "name brand images basePrice minimumOfferAmount")
      .populate("buyerId", "username avatar")
      .populate("sellerId", "username avatar");

    if (!offer) {
      errorResponse(res, "Offer not found", 404);
      return;
    }

    const isBuyer = offer.buyerId._id.toString() === req.user?.userId;
    const isSeller = offer.sellerId._id.toString() === req.user?.userId;

    if (!isBuyer && !isSeller) {
      errorResponse(res, "Not authorized", 403);
      return;
    }

    // Calculate expiry countdown
    const now = new Date();
    const expiresAt = new Date(offer.expiresAt);
    const timeRemainingMs = expiresAt.getTime() - now.getTime();
    const isExpired = timeRemainingMs <= 0;

    const hours = Math.floor(timeRemainingMs / (1000 * 60 * 60));
    const minutes = Math.floor(
      (timeRemainingMs % (1000 * 60 * 60)) / (1000 * 60),
    );
    const seconds = Math.floor((timeRemainingMs % (1000 * 60)) / 1000);

    successResponse(
      res,
      {
        offer,
        expiryCountdown: { hours, minutes, seconds },
        isExpired,
      },
      "Offer fetched",
    );
  } catch (error) {
    errorResponse(res, "Failed to fetch offer", 500, error);
  }
};

// @desc    Get all sent offers (buyer view)
// @route   GET /api/offers/sent
// @access  Private (buyer)
export const getSentOffers = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const offers = await Offer.find({
      buyerId: toObjectId(req.user?.userId ?? ""),
    })
      .populate("productId", "name brand images basePrice")
      .populate("sellerId", "username avatar")
      .sort({ updatedAt: -1 });

    successResponse(res, { offers }, "Sent offers fetched");
  } catch (error) {
    errorResponse(res, "Failed to fetch sent offers", 500, error);
  }
};

// @desc    Get all received offers (seller view)
// @route   GET /api/offers/received
// @access  Private (seller)
export const getReceivedOffers = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { productId, type, size } = req.query;

    const query: Record<string, unknown> = {
      sellerId: toObjectId(req.user?.userId ?? ""),
    };

    if (productId) {
      query.productId = toObjectId(productId as string);
    }

    if (type) {
      query["variant.type"] = type;
    }

    if (size) {
      query["variant.size"] = size;
    }

    const offers = await Offer.find(query)
      .populate("productId", "name brand images basePrice minimumOfferAmount")
      .populate("buyerId", "username avatar")
      .sort({ updatedAt: -1 });

    successResponse(res, { offers }, "Received offers fetched");
  } catch (error) {
    errorResponse(res, "Failed to fetch received offers", 500, error);
  }
};
