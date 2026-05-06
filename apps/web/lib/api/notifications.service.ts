import { api } from "@/lib/axios";
import type { ApiResponse, INotification } from "@vaultkix/types";

type NotificationsData = {
  notifications: INotification[];
  unreadCount: number;
};

type NotificationData = { notification: INotification };
type UnreadCountData = { count: number };

export const notificationsService = {
  async getNotifications(unreadOnly?: boolean): Promise<NotificationsData> {
    const { data } = await api.get<ApiResponse<NotificationsData>>(
      "/notifications",
      { params: unreadOnly ? { unreadOnly: "true" } : undefined },
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data;
  },

  async getUnreadCount(): Promise<number> {
    const { data } = await api.get<ApiResponse<UnreadCountData>>(
      "/notifications/unread-count",
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data.count;
  },

  async markAsRead(notificationId: string): Promise<INotification> {
    const { data } = await api.patch<ApiResponse<NotificationData>>(
      `/notifications/${notificationId}/read`,
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data.notification;
  },

  async markAllAsRead(): Promise<void> {
    await api.patch("/notifications/read-all");
  },

  async deleteNotification(notificationId: string): Promise<void> {
    await api.delete(`/notifications/${notificationId}`);
  },

  async deleteAllNotifications(): Promise<void> {
    await api.delete("/notifications/delete-all");
  },
};
