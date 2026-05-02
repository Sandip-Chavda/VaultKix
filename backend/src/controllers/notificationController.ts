import { Response } from "express";
import Notification from "../models/Notification";
import { successResponse, errorResponse } from "../utils/apiResponse";
import { AuthRequest } from "../middleware/auth";
import mongoose from "mongoose";

// ── Helper ────────────────────────────────────────────────────────────────────

const toObjectId = (id: string | string[]): mongoose.Types.ObjectId => {
  const strId = Array.isArray(id) ? id[0] : id;
  return new mongoose.Types.ObjectId(strId);
};

// ── Controllers ───────────────────────────────────────────────────────────────

// @desc    Get all notifications for logged in user
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { unreadOnly } = req.query;

    const query: Record<string, unknown> = {
      userId: toObjectId(req.user?.userId ?? ""),
    };

    if (unreadOnly === "true") {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    // Count total unread
    const unreadCount = await Notification.countDocuments({
      userId: toObjectId(req.user?.userId ?? ""),
      isRead: false,
    });

    successResponse(
      res,
      { notifications, unreadCount },
      "Notifications fetched",
    );
  } catch (error) {
    errorResponse(res, "Failed to fetch notifications", 500, error);
  }
};

// @desc    Mark single notification as read
// @route   PATCH /api/notifications/:notificationId/read
// @access  Private
export const markAsRead = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const notification = await Notification.findById(req.params.notificationId);

    if (!notification) {
      errorResponse(res, "Notification not found", 404);
      return;
    }

    // Only the owner can mark as read
    if (notification.userId.toString() !== req.user?.userId) {
      errorResponse(res, "Not authorized", 403);
      return;
    }

    notification.isRead = true;
    await notification.save();

    successResponse(res, { notification }, "Notification marked as read");
  } catch (error) {
    errorResponse(res, "Failed to mark notification as read", 500, error);
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    await Notification.updateMany(
      {
        userId: toObjectId(req.user?.userId ?? ""),
        isRead: false,
      },
      { isRead: true },
    );

    successResponse(res, null, "All notifications marked as read");
  } catch (error) {
    errorResponse(res, "Failed to mark all as read", 500, error);
  }
};

// @desc    Delete single notification
// @route   DELETE /api/notifications/:notificationId
// @access  Private
export const deleteNotification = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const notification = await Notification.findById(req.params.notificationId);

    if (!notification) {
      errorResponse(res, "Notification not found", 404);
      return;
    }

    if (notification.userId.toString() !== req.user?.userId) {
      errorResponse(res, "Not authorized", 403);
      return;
    }

    await Notification.findByIdAndDelete(req.params.notificationId);

    successResponse(res, null, "Notification deleted");
  } catch (error) {
    errorResponse(res, "Failed to delete notification", 500, error);
  }
};

// @desc    Delete all notifications for user
// @route   DELETE /api/notifications/delete-all
// @access  Private
export const deleteAllNotifications = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    await Notification.deleteMany({
      userId: toObjectId(req.user?.userId ?? ""),
    });

    successResponse(res, null, "All notifications deleted");
  } catch (error) {
    errorResponse(res, "Failed to delete all notifications", 500, error);
  }
};

// @desc    Get unread notifications count only
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const count = await Notification.countDocuments({
      userId: toObjectId(req.user?.userId ?? ""),
      isRead: false,
    });

    successResponse(res, { count }, "Unread count fetched");
  } catch (error) {
    errorResponse(res, "Failed to fetch unread count", 500, error);
  }
};
