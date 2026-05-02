import { Router } from "express";
import {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  confirmOrderType,
  cancelOrder,
} from "../controllers/orderController";
import { protect, sellerOnly } from "../middleware/auth";

const router = Router();

router.get("/", protect, getOrders);
router.get("/:orderId", protect, getOrder);
router.post("/", protect, createOrder);
router.patch("/:orderId/status", protect, sellerOnly, updateOrderStatus);
router.patch("/:orderId/confirm-type", protect, confirmOrderType);
router.patch("/:orderId/cancel", protect, cancelOrder);

export default router;
