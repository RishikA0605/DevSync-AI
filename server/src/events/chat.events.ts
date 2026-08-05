import { Server } from "socket.io";
import { AuthenticatedSocket } from "../middleware/auth.middleware";
import { addOnlineUser, removeOnlineUser, getOnlineUsers } from "../redis/redis-client";

// These must match the frontend constants in socket-events.ts
const EVENTS = {
  CHAT_MESSAGE: "CHAT_MESSAGE",
  USER_TYPING: "USER_TYPING",
  USER_STOP_TYPING: "USER_STOP_TYPING",
  USER_ONLINE: "USER_ONLINE",
  USER_OFFLINE: "USER_OFFLINE",
  ONLINE_USERS: "ONLINE_USERS",
  JOIN_CHANNEL: "JOIN_CHANNEL",
  LEAVE_CHANNEL: "LEAVE_CHANNEL",
  CHANNEL_CREATED: "CHANNEL_CREATED",
} as const;

export function registerChatHandlers(io: Server, socket: AuthenticatedSocket) {
  const { userId, userName, userImage } = socket.data;

  // ── JOIN CHANNEL ──────────────────────────────────────────────────────────
  socket.on(EVENTS.JOIN_CHANNEL, async ({ channelId }: { channelId: string }) => {
    await socket.join(channelId);
    console.log(`[WS] ${userName} joined channel: ${channelId}`);

    // Also join a personal room for direct messages
    await socket.join(`user:${userId}`);
  });

  // ── LEAVE CHANNEL ─────────────────────────────────────────────────────────
  socket.on(EVENTS.LEAVE_CHANNEL, async ({ channelId }: { channelId: string }) => {
    await socket.leave(channelId);
    console.log(`[WS] ${userName} left channel: ${channelId}`);
  });

  // ── CHAT MESSAGE ──────────────────────────────────────────────────────────
  socket.on(EVENTS.CHAT_MESSAGE, (payload: {
    channelId: string;
    content: string;
  }) => {
    const message = {
      id: `tmp_${Date.now()}`, // Replaced by DB id after persistence
      content: payload.content,
      channelId: payload.channelId,
      senderId: userId,
      senderName: userName,
      senderImage: userImage,
      createdAt: new Date().toISOString(),
      isEdited: false,
    };

    // Broadcast to all clients in the channel room (including sender)
    io.to(payload.channelId).emit(EVENTS.CHAT_MESSAGE, message);
    console.log(`[WS] Message in ${payload.channelId} from ${userName}`);
  });

  // ── TYPING INDICATORS ─────────────────────────────────────────────────────
  socket.on(EVENTS.USER_TYPING, ({ channelId }: { channelId: string }) => {
    socket.to(channelId).emit(EVENTS.USER_TYPING, {
      channelId,
      userId,
      userName,
    });
  });

  socket.on(EVENTS.USER_STOP_TYPING, ({ channelId }: { channelId: string }) => {
    socket.to(channelId).emit(EVENTS.USER_STOP_TYPING, {
      channelId,
      userId,
      userName,
    });
  });

  // ── PRESENCE ──────────────────────────────────────────────────────────────
  socket.on(EVENTS.USER_ONLINE, async ({ workspaceId }: { workspaceId: string }) => {
    await addOnlineUser(workspaceId, userId);
    const onlineUserIds = await getOnlineUsers(workspaceId);

    // Broadcast updated online list to the workspace room
    io.to(`workspace:${workspaceId}`).emit(EVENTS.ONLINE_USERS, {
      userIds: onlineUserIds,
    });
    socket.join(`workspace:${workspaceId}`);
  });

  // ── DISCONNECT ────────────────────────────────────────────────────────────
  socket.on("disconnect", async () => {
    console.log(`[WS] ${userName} disconnected`);
    // We don't know which workspaces they were in, so we clean up via TTL in Redis
    // In a more advanced setup, store workspaceId in socket.data and clean here
  });
}
