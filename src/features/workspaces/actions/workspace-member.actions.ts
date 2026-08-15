"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { WorkspaceRole } from "@prisma/client";
import { logActivity } from "@/features/activity/actions/activity.actions";
import { hasPermission } from "@/features/permissions/utils/has-permission";
import { Permission } from "@/features/permissions/types";

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

export async function verifyWorkspacePermission(workspaceId: string, permission: Permission) {
  const data = await getWorkspaceAndMember(workspaceId);
  if (!hasPermission(data.member.role, permission)) {
    throw new Error("Unauthorized: Insufficient permissions");
  }
  return data;
}

// ── Member Actions ─────────────────────────────────────────────────────────

export async function getWorkspaceMembers(workspaceId: string) {
  const { member } = await getWorkspaceAndMember(workspaceId);

  return await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: [
      { role: "asc" }, // OWNER comes first alphabetically normally, but we might need custom sort. Let's just do created.
      { createdAt: "asc" }
    ],
  });
}

export async function updateMemberRole(workspaceId: string, memberUserId: string, newRole: WorkspaceRole) {
  const { member, workspace, session } = await verifyWorkspacePermission(workspaceId, "member:change_role");

  if (memberUserId === session.user!.id!) throw new Error("Cannot change your own role");
  if (newRole === "OWNER") throw new Error("Use transferOwnership to change owner");

  const targetMember = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: memberUserId, workspaceId } },
    include: { user: { select: { name: true } } }
  });

  if (!targetMember) throw new Error("Member not found");
  if (targetMember.role === "OWNER") throw new Error("Cannot change owner's role");

  await prisma.workspaceMember.update({
    where: { userId_workspaceId: { userId: memberUserId, workspaceId } },
    data: { role: newRole },
  });

  await logActivity({
    userId: session.user!.id!,
    workspaceId,
    action: "updated_member_role",
    entityType: "WorkspaceMember",
    entityId: memberUserId,
    details: `Changed ${targetMember.user.name}'s role to ${newRole}`,
  });

  revalidatePath(`/workspace/${workspace.slug}/settings`);
  return { success: true };
}

export async function removeMember(workspaceId: string, memberUserId: string) {
  const { member, workspace, session } = await verifyWorkspacePermission(workspaceId, "member:manage");

  if (memberUserId === session.user!.id!) throw new Error("Use leaveWorkspace to leave");

  const targetMember = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: memberUserId, workspaceId } },
    include: { user: { select: { name: true } } }
  });

  if (!targetMember) throw new Error("Member not found");
  if (targetMember.role === "OWNER") throw new Error("Cannot remove the owner");

  await prisma.workspaceMember.delete({
    where: { userId_workspaceId: { userId: memberUserId, workspaceId } },
  });

  await logActivity({
    userId: session.user!.id!,
    workspaceId,
    action: "removed_member",
    entityType: "WorkspaceMember",
    entityId: memberUserId,
    details: `Removed ${targetMember.user.name} from the workspace`,
  });

  revalidatePath(`/workspace/${workspace.slug}/settings`);
  return { success: true };
}

export async function leaveWorkspace(workspaceId: string) {
  const { member, workspace, session } = await getWorkspaceAndMember(workspaceId);

  if (member.role === "OWNER") {
    throw new Error("Owner cannot leave the workspace. Transfer ownership first or delete the workspace.");
  }

  await prisma.workspaceMember.delete({
    where: { id: member.id },
  });

  await logActivity({
    userId: session.user!.id!,
    workspaceId,
    action: "left_workspace",
    entityType: "WorkspaceMember",
    entityId: session.user!.id!,
    details: `Left the workspace`,
  });

  revalidatePath(`/dashboard`);
  return { success: true };
}

export async function transferOwnership(workspaceId: string, newOwnerUserId: string) {
  const { member, workspace, session } = await verifyWorkspacePermission(workspaceId, "workspace:transfer");

  if (newOwnerUserId === session.user!.id!) throw new Error("You are already the owner");

  const targetMember = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: newOwnerUserId, workspaceId } },
    include: { user: { select: { name: true } } }
  });

  if (!targetMember) throw new Error("New owner must be a member of the workspace");

  // Transaction to ensure atomicity
  await prisma.$transaction([
    // 1. Update the workspace ownerId
    prisma.workspace.update({
      where: { id: workspaceId },
      data: { ownerId: newOwnerUserId },
    }),
    // 2. Make the target user the OWNER role
    prisma.workspaceMember.update({
      where: { userId_workspaceId: { userId: newOwnerUserId, workspaceId } },
      data: { role: "OWNER" },
    }),
    // 3. Demote current owner to ADMIN
    prisma.workspaceMember.update({
      where: { id: member.id },
      data: { role: "ADMIN" },
    }),
  ]);

  await logActivity({
    userId: session.user!.id!,
    workspaceId,
    action: "transferred_ownership",
    entityType: "Workspace",
    entityId: workspaceId,
    details: `Transferred ownership to ${targetMember.user.name}`,
  });

  revalidatePath(`/workspace/${workspace.slug}/settings`);
  return { success: true };
}
