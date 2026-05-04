import { Router } from "express";
import {
  initiatePayment,
  confirmPayment,
  getPaymentStatus,
} from "../controllers/paymentController";
import { protect } from "../middleware/auth";

const router = Router();

router.post("/initiate", protect, initiatePayment);
router.post("/confirm/:orderId", protect, confirmPayment);
router.get("/status/:orderId", protect, getPaymentStatus);

export default router;
