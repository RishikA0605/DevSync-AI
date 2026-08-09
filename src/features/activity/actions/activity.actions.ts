"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ── Internal helper: log an activity event ────────────────────────────────────
export async function logActivity({
  userId,
  workspaceId,
  action,
  entityType,
  entityId,
  details,
}: {
  userId: string;
  workspaceId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: string;
}) {
  try {
    await prisma.activityLog.create({
      data: { userId, workspaceId, action, entityType, entityId, details },
    });
  } catch (err) {
    // Non-critical: don't break user flow if activity logging fails
    console.error("[ActivityLog] Failed to log activity:", err);
  }
}

// ── Get paginated workspace activity feed ─────────────────────────────────────
export async function getWorkspaceActivity({
  workspaceId,
  page = 1,
  pageSize = 30,
}: {
  workspaceId: string;
  page?: number;
  pageSize?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) return { activities: [], hasMore: false, total: 0 };

  // Verify workspace membership
  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId,
      },
    },
  });

  if (!member) return { activities: [], hasMore: false, total: 0 };

  const skip = (page - 1) * pageSize;

  const [activities, total] = await Promise.all([
    prisma.activityLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    }),
    prisma.activityLog.count({ where: { workspaceId } }),
  ]);

  return {
    activities,
    hasMore: skip + activities.length < total,
    total,
  };
}
