import { create } from "zustand";
import { notificationsService } from "@/lib/api/notifications.service";
import { getErrorMessage } from "@/lib/utils";
import type { INotification } from "@vaultkix/types";

interface NotificationState {
  notifications: INotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

interface NotificationActions {
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>; // ← add this
  addNotification: (notification: INotification) => void;
  clearError: () => void;
}

export const useNotificationStore = create<
  NotificationState & NotificationActions
>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const { notifications, unreadCount } =
        await notificationsService.getNotifications();
      set({ notifications, unreadCount, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: getErrorMessage(err) });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const count = await notificationsService.getUnreadCount();
      set({ unreadCount: count });
    } catch {}
  },

  markAsRead: async (id) => {
    try {
      await notificationsService.markAsRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === id ? { ...n, isRead: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (err) {
      set({ error: getErrorMessage(err) });
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationsService.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          isRead: true,
        })),
        unreadCount: 0,
      }));
    } catch (err) {
      set({ error: getErrorMessage(err) });
    }
  },

  deleteNotification: async (id) => {
    try {
      await notificationsService.deleteNotification(id);
      set((state) => ({
        notifications: state.notifications.filter((n) => n._id !== id),
        unreadCount: state.notifications.find((n) => n._id === id && !n.isRead)
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      }));
    } catch (err) {
      set({ error: getErrorMessage(err) });
    }
  },

  // Called from socket hook — prepends new notification
  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  deleteAllNotifications: async () => {
    try {
      await notificationsService.deleteAllNotifications();
      set({ notifications: [], unreadCount: 0 });
    } catch (err) {
      set({ error: getErrorMessage(err) });
    }
  },

  clearError: () => set({ error: null }),
}));
