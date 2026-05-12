"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  Trash2,
  X,
  ShoppingBag,
  TrendingUp,
  Tag,
  Package,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotificationStore } from "@/stores/notification.store";
import { formatRelativeTime } from "@/lib/utils";
import type { INotification, NotificationType } from "@vaultkix/types";

// ── Notification icon by type ─────────────────────────────────────────────────

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  bid_update: <TrendingUp className="w-4 h-4 text-primary" />,
  offer_received: <Tag className="w-4 h-4 text-yellow-600" />,
  offer_accepted: <Check className="w-4 h-4 text-success" />,
  offer_rejected: <X className="w-4 h-4 text-destructive" />,
  order_status: <ShoppingBag className="w-4 h-4 text-blue-600" />,
  position_price_change: <Package className="w-4 h-4 text-purple-600" />,
  general: <Info className="w-4 h-4 text-muted-foreground" />,
};

const TYPE_BG: Record<NotificationType, string> = {
  bid_update: "bg-primary-light",
  offer_received: "bg-yellow-50",
  offer_accepted: "bg-green-50",
  offer_rejected: "bg-red-50",
  order_status: "bg-blue-50",
  position_price_change: "bg-purple-50",
  general: "bg-section",
};

// ── Single notification item ──────────────────────────────────────────────────

function NotificationItem({ notification }: { notification: INotification }) {
  const { markAsRead, deleteNotification } = useNotificationStore();

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-section/60 ${
        !notification.isRead ? "bg-primary-light/30" : ""
      }`}
      onClick={() => !notification.isRead && markAsRead(notification._id)}
    >
      {/* Icon */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
          TYPE_BG[notification.type]
        }`}
      >
        {TYPE_ICON[notification.type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-snug ${
            !notification.isRead
              ? "font-semibold text-dark"
              : "font-medium text-dark"
          }`}
        >
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {notification.body}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {!notification.isRead && (
          <div className="w-2 h-2 rounded-full bg-primary" />
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteNotification(notification._id);
          }}
          className="w-6 h-6 rounded flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

interface NotificationPanelProps {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAllAsRead,
    fetchNotifications,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <div className="flex flex-col h-full max-h-120">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-dark">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-primary text-white text-xs rounded-full px-1.5 py-0.5 font-medium">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-primary hover:underline font-medium"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-section transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-12 h-12 bg-section rounded-full flex items-center justify-center mb-3">
              <Bell className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <p className="font-semibold text-dark text-sm">All caught up</p>
            <p className="text-xs text-muted-foreground mt-1">
              No notifications yet
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification) => (
              <div key={notification._id} className="group">
                <NotificationItem notification={notification} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Bell trigger button — used in navbar ──────────────────────────────────────

export function NotificationBell() {
  const { unreadCount } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-section transition-colors"
      >
        <Bell className="w-5 h-5 text-dark" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-11 w-80 bg-background border border-border rounded-2xl shadow-xl overflow-hidden z-50"
        >
          <NotificationPanel onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
