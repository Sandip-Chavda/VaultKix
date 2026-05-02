import { Router } from "express";
import {
  makeOffer,
  counterOffer,
  acceptOffer,
  rejectOffer,
  getOffer,
  getSentOffers,
  getReceivedOffers,
} from "../controllers/offerController";
import { protect, sellerOnly } from "../middleware/auth";
import { offerLimiter } from "../middleware/rateLimiter";

const router = Router();

// All offer routes are private
router.get("/sent", protect, getSentOffers);
router.get("/received", protect, sellerOnly, getReceivedOffers);
router.get("/:offerId", protect, getOffer);
router.post("/:productId", protect, offerLimiter, makeOffer);
router.post("/:offerId/counter", protect, sellerOnly, counterOffer);
router.post("/:offerId/accept", protect, acceptOffer);
router.post("/:offerId/reject", protect, rejectOffer);

export default router;
