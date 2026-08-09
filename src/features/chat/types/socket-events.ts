// All Socket.io event names as constants — no hardcoded strings anywhere!
export const SOCKET_EVENTS = {
  // Connection lifecycle
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  ERROR: "error",

  // Message events
  CHAT_MESSAGE: "CHAT_MESSAGE",
  MESSAGE_EDITED: "MESSAGE_EDITED",
  MESSAGE_DELETED: "MESSAGE_DELETED",

  // Typing events
  USER_TYPING: "USER_TYPING",
  USER_STOP_TYPING: "USER_STOP_TYPING",

  // Presence events
  USER_ONLINE: "USER_ONLINE",
  USER_OFFLINE: "USER_OFFLINE",
  ONLINE_USERS: "ONLINE_USERS",

  // Channel events
  CHANNEL_CREATED: "CHANNEL_CREATED",
  JOIN_CHANNEL: "JOIN_CHANNEL",
  LEAVE_CHANNEL: "LEAVE_CHANNEL",

  // Notification events
  NOTIFICATION_NEW: "NOTIFICATION_NEW",
  NOTIFICATION_READ: "NOTIFICATION_READ",
  NOTIFICATION_READ_ALL: "NOTIFICATION_READ_ALL",

  // Activity events
  ACTIVITY_NEW: "ACTIVITY_NEW",
} as const;

// Derive the union type from the constants
export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

// ---- Payload Interfaces ----

export interface ChatMessagePayload {
  id: string;
  content: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderImage: string | null;
  createdAt: string;
  isEdited: boolean;
}

export interface TypingPayload {
  channelId: string;
  userId: string;
  userName: string;
}

export interface PresencePayload {
  userId: string;
  userName: string;
  userImage: string | null;
}

export interface OnlineUsersPayload {
  userIds: string[];
}

export interface ChannelCreatedPayload {
  id: string;
  name: string;
  type: "PUBLIC" | "PRIVATE" | "DIRECT";
  workspaceId: string;
}

export interface NotificationPayload {
  id: string;
  content: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
  actorId: string | null;
  actor: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
}

export interface ActivityPayload {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string | null;
  createdAt: string;
  workspaceId: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}
