import { Request, Response } from "express";
import Bid from "../models/Bid";
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

const createAuctionSchema = z.object({
  startingPrice: z.number().min(0, "Starting price must be positive"),
  bidIncrement: z.number().min(1, "Bid increment must be at least 1"),
  auctionEndsAt: z.string().refine((val) => {
    const date = new Date(val);
    return date > new Date();
  }, "Auction end date must be in the future"),
});

const placeBidSchema = z.object({
  amount: z.number().min(0, "Bid amount must be positive"),
});

// ── Controllers ───────────────────────────────────────────────────────────────

// @desc    Create auction for a product
// @route   POST /api/bids/:productId/auction
// @access  Private (seller only)
export const createAuction = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const parsed = createAuctionSchema.safeParse(req.body);
    if (!parsed.success) {
      errorResponse(res, "Validation failed", 400, parsed.error.issues);
      return;
    }

    const product = await Product.findById(req.params.productId);
    if (!product) {
      errorResponse(res, "Product not found", 404);
      return;
    }

    if (product.sellerId.toString() !== req.user?.userId) {
      errorResponse(res, "Not authorized", 403);
      return;
    }

    const existingAuction = await Bid.findOne({
      productId: toObjectId(req.params.productId),
      status: "active",
    });

    if (existingAuction) {
      errorResponse(
        res,
        "An active auction already exists for this product",
        409,
      );
      return;
    }

    const { startingPrice, bidIncrement, auctionEndsAt } = parsed.data;

    const auction = await Bid.create({
      productId: toObjectId(req.params.productId),
      userId: toObjectId(req.user?.userId ?? ""),
      amount: startingPrice,
      bidIncrement,
      auctionEndsAt: new Date(auctionEndsAt),
      currentHighestBid: startingPrice,
      totalBidsCount: 0,
      status: "active",
    });

    successResponse(res, { auction }, "Auction created", 201);
  } catch (error) {
    errorResponse(res, "Failed to create auction", 500, error);
  }
};

// @desc    Get auction details for a product
// @route   GET /api/bids/:productId
// @access  Public
export const getAuction = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const auction = await Bid.findOne({
      productId: toObjectId(req.params.productId),
      status: "active",
    })
      .populate("productId", "name brand images basePrice")
      .populate("winnerId", "username avatar");

    if (!auction) {
      errorResponse(res, "No active auction found for this product", 404);
      return;
    }

    const now = new Date();
    const endsAt = new Date(auction.auctionEndsAt);
    const timeRemainingMs = endsAt.getTime() - now.getTime();
    const isExpired = timeRemainingMs <= 0;

    if (isExpired) {
      await Bid.findByIdAndUpdate(auction._id, { status: "expired" });
      errorResponse(res, "Auction has ended", 410);
      return;
    }

    const days = Math.floor(timeRemainingMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeRemainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor(
      (timeRemainingMs % (1000 * 60 * 60)) / (1000 * 60),
    );

    successResponse(
      res,
      {
        auction,
        timeRemaining: { days, hours, minutes },
        isExpired,
      },
      "Auction fetched",
    );
  } catch (error) {
    errorResponse(res, "Failed to fetch auction", 500, error);
  }
};

// @desc    Place a bid
// @route   POST /api/bids/:productId
// @access  Private (buyer)
export const placeBid = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const parsed = placeBidSchema.safeParse(req.body);
    if (!parsed.success) {
      errorResponse(res, "Validation failed", 400, parsed.error.issues);
      return;
    }

    const { amount } = parsed.data;

    const auction = await Bid.findOne({
      productId: toObjectId(req.params.productId),
      status: "active",
    });

    if (!auction) {
      errorResponse(res, "No active auction found", 404);
      return;
    }

    if (new Date() > new Date(auction.auctionEndsAt)) {
      await Bid.findByIdAndUpdate(auction._id, { status: "expired" });
      errorResponse(res, "Auction has ended", 410);
      return;
    }

    const product = await Product.findById(req.params.productId);
    if (product?.sellerId.toString() === req.user?.userId) {
      errorResponse(res, "Sellers cannot bid on their own products", 403);
      return;
    }

    const minimumBid = auction.currentHighestBid + auction.bidIncrement;
    if (amount < minimumBid) {
      errorResponse(
        res,
        `Bid must be at least $${minimumBid} (current bid $${auction.currentHighestBid} + increment $${auction.bidIncrement})`,
        400,
      );
      return;
    }

    auction.bidsHistory.push({
      bidderId: toObjectId(req.user?.userId ?? ""),
      amount,
      createdAt: new Date(),
    });
    auction.currentHighestBid = amount;
    auction.totalBidsCount += 1;
    auction.amount = amount;
    await auction.save();

    await User.findByIdAndUpdate(req.user?.userId, {
      $inc: { "stats.bidsPlaced": 1 },
    });

    const sellerProduct = await Product.findById(req.params.productId);
    if (sellerProduct) {
      await Notification.create({
        userId: sellerProduct.sellerId,
        type: "bid_update",
        title: "New bid placed",
        body: `A new bid of $${amount} was placed on your product`,
        data: {
          productId: req.params.productId,
          auctionId: auction._id,
          amount,
        },
      });
    }

    successResponse(
      res,
      {
        auction: {
          _id: auction._id,
          currentHighestBid: auction.currentHighestBid,
          totalBidsCount: auction.totalBidsCount,
          bidIncrement: auction.bidIncrement,
          auctionEndsAt: auction.auctionEndsAt,
          bidsHistory: auction.bidsHistory,
        },
      },
      "Bid placed successfully",
    );
  } catch (error) {
    errorResponse(res, "Failed to place bid", 500, error);
  }
};

// @desc    Get all bids history for a product auction
// @route   GET /api/bids/:productId/history
// @access  Public
export const getBidHistory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const auction = await Bid.findOne({
      productId: toObjectId(req.params.productId),
    }).sort({ createdAt: -1 });

    if (!auction) {
      errorResponse(res, "No auction found for this product", 404);
      return;
    }

    const sortedHistory = [...auction.bidsHistory].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    successResponse(
      res,
      {
        auctionId: auction._id,
        productId: auction.productId,
        currentHighestBid: auction.currentHighestBid,
        totalBidsCount: auction.totalBidsCount,
        status: auction.status,
        bidsHistory: sortedHistory,
      },
      "Bid history fetched",
    );
  } catch (error) {
    errorResponse(res, "Failed to fetch bid history", 500, error);
  }
};

// @desc    Cancel auction (seller only)
// @route   PATCH /api/bids/:productId/cancel
// @access  Private (seller only)
export const cancelAuction = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const auction = await Bid.findOne({
      productId: toObjectId(req.params.productId),
      status: "active",
    });

    if (!auction) {
      errorResponse(res, "No active auction found", 404);
      return;
    }

    const product = await Product.findById(req.params.productId);
    if (product?.sellerId.toString() !== req.user?.userId) {
      errorResponse(res, "Not authorized", 403);
      return;
    }

    await Bid.findByIdAndUpdate(auction._id, { status: "cancelled" });

    successResponse(res, null, "Auction cancelled successfully");
  } catch (error) {
    errorResponse(res, "Failed to cancel auction", 500, error);
  }
};

// @desc    Get seller's all auctions
// @route   GET /api/bids/my-auctions
// @access  Private (seller only)
export const getMyAuctions = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const sellerProducts = await Product.find({
      sellerId: req.user?.userId,
    }).select("_id");

    const productIds = sellerProducts.map(
      (p) => new mongoose.Types.ObjectId(p._id.toString()),
    );

    const auctions = await Bid.find({
      productId: { $in: productIds },
    })
      .populate("productId", "name brand images basePrice")
      .sort({ createdAt: -1 });

    successResponse(res, { auctions }, "My auctions fetched");
  } catch (error) {
    errorResponse(res, "Failed to fetch auctions", 500, error);
  }
};
