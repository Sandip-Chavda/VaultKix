"use client";

import { useEffect } from "react";
import { getSocket } from "@/lib/socket";
import { useAuthStore } from "@/stores/auth.store";
import { useNotificationStore } from "@/stores/notification.store";
import type { INotification } from "@vaultkix/types";

export function useNotificationRealtime() {
  const { isAuthenticated } = useAuthStore();
  const { addNotification, fetchUnreadCount } = useNotificationStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();

    const handleNewNotification = (data: {
      title: string;
      body: string;
      type: INotification["type"];
      data: Record<string, unknown>;
    }) => {
      // Build a local notification object to show immediately
      const notification: INotification = {
        _id: Date.now().toString(), // temp id until fetch
        userId: "",
        type: data.type,
        title: data.title,
        body: data.body,
        data: data.data,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      addNotification(notification);
    };

    socket.on("notification:new", handleNewNotification);

    // Fetch unread count on mount
    fetchUnreadCount();

    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, [isAuthenticated, addNotification, fetchUnreadCount]);
}
