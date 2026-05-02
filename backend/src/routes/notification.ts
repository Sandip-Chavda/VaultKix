import { Router } from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount,
} from "../controllers/notificationController";
import { protect } from "../middleware/auth";

const router = Router();

// All notification routes are private
router.get("/", protect, getNotifications);
router.get("/unread-count", protect, getUnreadCount);
router.patch("/read-all", protect, markAllAsRead);
router.patch("/:notificationId/read", protect, markAsRead);
router.delete("/delete-all", protect, deleteAllNotifications);
router.delete("/:notificationId", protect, deleteNotification);

export default router;
