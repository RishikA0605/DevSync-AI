"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
const INTERNAL_SECRET = process.env.INTERNAL_SOCKET_SECRET || "devsync-internal-secret";

// ── Internal helper: create a notification in DB and emit via socket ──────────
export async function createNotification({
  userId,
  actorId,
  type,
  content,
  link,
}: {
  userId: string;
  actorId?: string;
  type: "MENTION" | "TASK_ASSIGNED" | "TASK_STATUS_CHANGED" | "WORKSPACE_JOINED" | "SYSTEM";
  content: string;
  link?: string;
}) {
  // Don't notify yourself
  if (actorId && actorId === userId) return null;

  const notification = await prisma.notification.create({
    data: { userId, actorId, type, content, link },
    include: {
      actor: { select: { id: true, name: true, image: true } },
    },
  });

  // Emit real-time notification to recipient via Socket.io server
  try {
    await fetch(`${SOCKET_SERVER_URL}/emit-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": INTERNAL_SECRET,
      },
      body: JSON.stringify({
        userId,
        event: "NOTIFICATION_NEW",
        payload: {
          id: notification.id,
          content: notification.content,
          type: notification.type,
          isRead: notification.isRead,
          link: notification.link,
          createdAt: notification.createdAt.toISOString(),
          actorId: notification.actorId,
          actor: notification.actor,
        },
      }),
    });
  } catch (err) {
    // Non-critical: notification is in DB even if socket fails
    console.error("[Notification] Failed to emit socket event:", err);
  }

  return notification;
}

// ── Get paginated notifications for current user ──────────────────────────────
export async function getUserNotifications({
  page = 1,
  pageSize = 20,
}: { page?: number; pageSize?: number } = {}) {
  const session = await auth();
  if (!session?.user?.id) return { notifications: [], unreadCount: 0, hasMore: false };

  const userId = session.user.id;
  const skip = (page - 1) * pageSize;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        actor: { select: { id: true, name: true, image: true } },
      },
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return {
    notifications,
    unreadCount,
    hasMore: skip + notifications.length < total,
    total,
  };
}

// ── Mark a single notification as read ───────────────────────────────────────
export async function markNotificationRead(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.notification.updateMany({
    where: { id: notificationId, userId: session.user.id },
    data: { isRead: true },
  });

  return { success: true };
}

// ── Mark all notifications as read ───────────────────────────────────────────
export async function markAllNotificationsRead() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  return { success: true };
}

// ── Delete a notification ─────────────────────────────────────────────────────
export async function deleteNotification(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.notification.deleteMany({
    where: { id: notificationId, userId: session.user.id },
  });

  return { success: true };
}
