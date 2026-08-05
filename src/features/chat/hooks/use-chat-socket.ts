"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { connectSocket, disconnectSocket, getSocket } from "@/features/chat/socket/socket-client";
import {
  SOCKET_EVENTS,
  ChatMessagePayload,
  TypingPayload,
  OnlineUsersPayload,
} from "@/features/chat/types/socket-events";

interface UseChatSocketOptions {
  channelId: string;
  onMessage: (msg: ChatMessagePayload) => void;
  onTyping: (payload: TypingPayload) => void;
  onStopTyping: (payload: TypingPayload) => void;
  onOnlineUsers?: (payload: OnlineUsersPayload) => void;
}

export function useChatSocket({
  channelId,
  onMessage,
  onTyping,
  onStopTyping,
  onOnlineUsers,
}: UseChatSocketOptions) {
  const { data: session } = useSession();
  const socketRef = useRef(getSocket());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!session?.user) return;

    // Connect with session token for auth
    const initSocket = async () => {
      try {
        const res = await fetch("/api/chat/auth");
        if (!res.ok) throw new Error("Failed to get socket token");
        const { token } = await res.json();

        const socket = connectSocket(token);
        socketRef.current = socket;

        const onConnect = () => {
          setIsConnected(true);
          // Join the specific channel room
          socket.emit(SOCKET_EVENTS.JOIN_CHANNEL, { channelId });
        };

        const onDisconnect = () => setIsConnected(false);

        socket.on(SOCKET_EVENTS.CONNECT, onConnect);
        socket.on(SOCKET_EVENTS.DISCONNECT, onDisconnect);
        socket.on(SOCKET_EVENTS.CHAT_MESSAGE, onMessage);
        socket.on(SOCKET_EVENTS.USER_TYPING, onTyping);
        socket.on(SOCKET_EVENTS.USER_STOP_TYPING, onStopTyping);
        if (onOnlineUsers) {
          socket.on(SOCKET_EVENTS.ONLINE_USERS, onOnlineUsers);
        }

        // If already connected, join the channel immediately
        if (socket.connected) {
          socket.emit(SOCKET_EVENTS.JOIN_CHANNEL, { channelId });
          setIsConnected(true);
        }
      } catch (err) {
        console.error("Socket auth error:", err);
      }
    };

    initSocket();

    return () => {
      const s = socketRef.current;
      if (!s) return;
      s.emit(SOCKET_EVENTS.LEAVE_CHANNEL, { channelId });
      s.off(SOCKET_EVENTS.CHAT_MESSAGE, onMessage);
      s.off(SOCKET_EVENTS.USER_TYPING, onTyping);
      s.off(SOCKET_EVENTS.USER_STOP_TYPING, onStopTyping);
      if (onOnlineUsers) {
        s.off(SOCKET_EVENTS.ONLINE_USERS, onOnlineUsers);
      }
    };
  }, [channelId, session]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!session?.user) return;
      socketRef.current.emit(SOCKET_EVENTS.CHAT_MESSAGE, {
        channelId,
        content,
        senderId: session.user.id,
        senderName: session.user.name,
        senderImage: session.user.image,
      });
    },
    [channelId, session]
  );

  const sendTyping = useCallback(() => {
    if (!session?.user) return;
    socketRef.current.emit(SOCKET_EVENTS.USER_TYPING, {
      channelId,
      userId: session.user.id,
      userName: session.user.name,
    });
  }, [channelId, session]);

  const sendStopTyping = useCallback(() => {
    if (!session?.user) return;
    socketRef.current.emit(SOCKET_EVENTS.USER_STOP_TYPING, {
      channelId,
      userId: session.user.id,
      userName: session.user.name,
    });
  }, [channelId, session]);

  return { isConnected, sendMessage, sendTyping, sendStopTyping };
}
