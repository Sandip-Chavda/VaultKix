import { Router } from "express";
import {
  createAuction,
  getAuction,
  placeBid,
  getBidHistory,
  cancelAuction,
  getMyAuctions,
} from "../controllers/bidController";
import { protect, sellerOnly } from "../middleware/auth";
import { bidLimiter } from "../middleware/rateLimiter";

const router = Router();

// Public routes
router.get("/:productId", getAuction);
router.get("/:productId/history", getBidHistory);

// Private routes
router.get("/my-auctions", protect, sellerOnly, getMyAuctions);
router.post("/:productId/auction", protect, sellerOnly, createAuction);
router.post("/:productId", protect, bidLimiter, placeBid);
router.patch("/:productId/cancel", protect, sellerOnly, cancelAuction);

export default router;
