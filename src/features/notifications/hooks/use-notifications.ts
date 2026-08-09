"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getSocket, connectSocket } from "@/features/chat/socket/socket-client";
import { SOCKET_EVENTS, NotificationPayload } from "@/features/chat/types/socket-events";
import { getUserNotifications, markNotificationRead, markAllNotificationsRead } from "@/features/notifications/actions/notification.actions";
import { AppNotification } from "@/features/notifications/types/notification.types";

const PAGE_SIZE = 20;

export function useNotifications() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const socketRef = useRef(getSocket());

  // ── Initial Fetch ────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
    setIsLoading(true);
    try {
      const res = await getUserNotifications({ page: pageNum, pageSize: PAGE_SIZE });
      const mapped = res.notifications.map((n) => ({
        ...n,
        createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt,
      })) as AppNotification[];

      setNotifications((prev) => (append ? [...prev, ...mapped] : mapped));
      setUnreadCount(res.unreadCount);
      setHasMore(res.hasMore);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Load more (pagination) ────────────────────────────────────────────────────
  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
  }, [page, fetchNotifications]);

  // ── Real-time listener ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!session?.user) return;

    fetchNotifications(1, false);

    const initSocket = async () => {
      try {
        const res = await fetch("/api/chat/auth");
        if (!res.ok) return;
        const { token } = await res.json();
        const socket = connectSocket(token);
        socketRef.current = socket;

        const handleNewNotification = (payload: NotificationPayload) => {
          setNotifications((prev) => [payload as AppNotification, ...prev]);
          setUnreadCount((c) => c + 1);
        };

        socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, handleNewNotification);

        return () => {
          socket.off(SOCKET_EVENTS.NOTIFICATION_NEW, handleNewNotification);
        };
      } catch (err) {
        console.error("[useNotifications] Socket init error:", err);
      }
    };

    initSocket();
  }, [session, fetchNotifications]);

  // ── Mark single as read ──────────────────────────────────────────────────────
  const markRead = useCallback(async (notificationId: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    await markNotificationRead(notificationId);
  }, []);

  // ── Mark all as read ─────────────────────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    await markAllNotificationsRead();
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    markRead,
    markAllRead,
    loadMore,
    refresh: () => fetchNotifications(1, false),
  };
}
