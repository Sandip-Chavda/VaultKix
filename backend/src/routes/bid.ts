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

// Correct order — specific routes FIRST
router.get("/my-auctions", protect, sellerOnly, getMyAuctions);
router.get("/:productId/history", getBidHistory);
router.get("/:productId", getAuction);
router.post("/:productId/auction", protect, sellerOnly, createAuction);
router.post("/:productId", protect, bidLimiter, placeBid);
router.patch("/:productId/cancel", protect, sellerOnly, cancelAuction);

export default router;
