"use client";

import { useEffect } from "react";
import { useNotificationStore } from "@/stores/notification.store";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  Check,
  Trash2,
  X,
  TrendingUp,
  Tag,
  ShoppingBag,
  Package,
  Info,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import type { INotification, NotificationType } from "@vaultkix/types";

// ── Icon map ──────────────────────────────────────────────────────────────────

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

const TYPE_LABEL: Record<NotificationType, string> = {
  bid_update: "Bid",
  offer_received: "Offer",
  offer_accepted: "Accepted",
  offer_rejected: "Rejected",
  order_status: "Order",
  position_price_change: "Position",
  general: "General",
};

// ── Notification row ──────────────────────────────────────────────────────────

function NotificationRow({ notification }: { notification: INotification }) {
  const { markAsRead, deleteNotification } = useNotificationStore();

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-xl border transition-colors cursor-pointer group ${
        !notification.isRead
          ? "bg-primary-light/40 border-primary/20 hover:bg-primary-light/60"
          : "bg-background border-border hover:bg-section"
      }`}
      onClick={() => !notification.isRead && markAsRead(notification._id)}
    >
      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          TYPE_BG[notification.type]
        }`}
      >
        {TYPE_ICON[notification.type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <p
            className={`text-sm leading-snug ${
              !notification.isRead
                ? "font-bold text-dark"
                : "font-semibold text-dark"
            }`}
          >
            {notification.title}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge
              label={TYPE_LABEL[notification.type]}
              variant="default"
              className="text-[10px]"
            />
            {!notification.isRead && (
              <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {notification.body}
        </p>
        <p className="text-xs text-muted-foreground mt-1.5">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>

      {/* Delete */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          deleteNotification(notification._id);
        }}
        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-border">
      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAllAsRead,
    deleteAllNotifications,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unread = notifications.filter((n) => !n.isRead);
  const read = notifications.filter((n) => n.isRead);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="bg-primary text-white text-sm rounded-full px-2 py-0.5">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your activity and updates
          </p>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={markAllAsRead}
              >
                <Check className="w-3.5 h-3.5" />
                Mark all read
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-destructive text-destructive hover:bg-red-50"
              onClick={deleteAllNotifications}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <NotificationSkeleton key={i} />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        /* Empty state */
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-section rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <p className="font-semibold text-dark">All caught up</p>
          <p className="text-sm text-muted-foreground mt-1">
            No notifications yet. Start trading to see activity here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Unread section */}
          {unread.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Unread · {unread.length}
              </p>
              <div className="space-y-2">
                {unread.map((n) => (
                  <NotificationRow key={n._id} notification={n} />
                ))}
              </div>
            </section>
          )}

          {/* Read section */}
          {read.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Earlier · {read.length}
              </p>
              <div className="space-y-2">
                {read.map((n) => (
                  <NotificationRow key={n._id} notification={n} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
