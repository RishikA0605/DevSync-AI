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
