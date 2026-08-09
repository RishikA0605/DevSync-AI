"use server";

import jwt from "jsonwebtoken";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/features/activity/actions/activity.actions";
import { createNotification } from "@/features/notifications/actions/notification.actions";

export async function generateInviteToken(workspaceSlug: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET not configured");

  // Create a token that expires in 7 days
  const token = jwt.sign({ workspaceSlug }, secret, { expiresIn: "7d" });
  return token;
}

export async function joinWorkspace(token: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET not configured");

  try {
    const decoded = jwt.verify(token, secret) as { workspaceSlug: string };
    const { workspaceSlug } = decoded;

    // Find the workspace
    const workspace = await prisma.workspace.findUnique({
      where: { slug: workspaceSlug },
    });

    if (!workspace) throw new Error("Workspace not found");

    // Add user as a member if not already
    await prisma.workspaceMember.upsert({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: workspace.id,
        },
      },
      update: {}, // Already a member, do nothing
      create: {
        userId: session.user.id,
        workspaceId: workspace.id,
        role: "MEMBER",
      },
    });

    // Log activity and notify owner
    await logActivity({
      userId: session.user.id,
      workspaceId: workspace.id,
      action: "joined_workspace",
      entityType: "Workspace",
      entityId: workspace.id,
      details: `Joined workspace "${workspace.name}"`,
    });

    // Notify workspace owner (unless they are the one joining)
    if (workspace.ownerId !== session.user.id) {
      const joiner = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true },
      });
      await createNotification({
        userId: workspace.ownerId,
        actorId: session.user.id,
        type: "WORKSPACE_JOINED",
        content: `${joiner?.name || "Someone"} joined your workspace "${workspace.name}"`,
        link: `/workspace/${workspaceSlug}/settings`,
      });
    }

    return workspaceSlug;
  } catch (error) {
    console.error("Invite link error:", error);
    throw new Error("Invalid or expired invite link");
  }
}
