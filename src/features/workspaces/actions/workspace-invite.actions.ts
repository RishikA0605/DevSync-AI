"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/features/activity/actions/activity.actions";
import { createNotification } from "@/features/notifications/actions/notification.actions";
import { WorkspaceRole } from "@prisma/client";

// ── Helpers ─────────────────────────────────────────────────────────────────

async function getWorkspaceAndMember(workspaceId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: session.user.id, workspaceId } },
    include: { workspace: true },
  });

  if (!member) throw new Error("Not a member of this workspace");
  return { session, member, workspace: member.workspace };
}

function checkAdminRole(role: WorkspaceRole) {
  if (role !== "OWNER" && role !== "ADMIN") {
    throw new Error("Requires ADMIN or OWNER role");
  }
}

// ── Invite Actions ─────────────────────────────────────────────────────────

export async function createInvite(workspaceId: string, expiresInDays: number | null) {
  const { member, workspace, session } = await getWorkspaceAndMember(workspaceId);
  checkAdminRole(member.role);

  // Generate a random secure token
  const token = crypto.randomBytes(32).toString("hex");
  
  // Calculate expiry
  let expiresAt = null;
  if (expiresInDays) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  }

  const invite = await prisma.workspaceInvite.create({
    data: {
      workspaceId,
      createdById: session.user.id,
      token,
      expiresAt,
    },
  });

  revalidatePath(`/workspace/${workspace.slug}/settings`);
  return invite;
}

export async function getWorkspaceInvites(workspaceId: string) {
  const { member } = await getWorkspaceAndMember(workspaceId);
  checkAdminRole(member.role);

  return await prisma.workspaceInvite.findMany({
    where: { 
      workspaceId,
      isRevoked: false,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function revokeInvite(inviteId: string, workspaceId: string) {
  const { member, workspace } = await getWorkspaceAndMember(workspaceId);
  checkAdminRole(member.role);

  const invite = await prisma.workspaceInvite.findUnique({
    where: { id: inviteId },
  });

  if (!invite || invite.workspaceId !== workspaceId) {
    throw new Error("Invite not found");
  }

  await prisma.workspaceInvite.update({
    where: { id: inviteId },
    data: { isRevoked: true },
  });

  revalidatePath(`/workspace/${workspace.slug}/settings`);
  return { success: true };
}

export async function joinWorkspaceByToken(token: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    include: { workspace: true },
  });

  if (!invite) throw new Error("Invalid or expired invite link");
  if (invite.isRevoked) throw new Error("This invite link has been revoked");
  if (invite.expiresAt && invite.expiresAt < new Date()) throw new Error("This invite link has expired");

  const { workspace } = invite;

  // Add user as a member if not already
  const member = await prisma.workspaceMember.upsert({
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

  // Only log if they were just created
  if (member.createdAt.getTime() > Date.now() - 5000) { // recently created
    // Log activity and notify owner
    await logActivity({
      userId: session.user.id,
      workspaceId: workspace.id,
      action: "joined_workspace",
      entityType: "Workspace",
      entityId: workspace.id,
      details: `Joined workspace "${workspace.name}" via invite link`,
    });

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
        link: `/workspace/${workspace.slug}/settings`,
      });
    }
  }

  return workspace.slug;
}
