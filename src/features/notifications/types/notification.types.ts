export interface NotificationActor {
  id: string;
  name: string | null;
  image: string | null;
}

export interface AppNotification {
  id: string;
  content: string;
  type: "MENTION" | "TASK_ASSIGNED" | "TASK_STATUS_CHANGED" | "WORKSPACE_JOINED" | "SYSTEM";
  isRead: boolean;
  link: string | null;
  createdAt: string | Date;
  actorId: string | null;
  actor: NotificationActor | null;
}

export interface NotificationListResponse {
  notifications: AppNotification[];
  unreadCount: number;
  hasMore: boolean;
  total: number;
}
