"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from "cloudinary";
import { hasPermission } from "@/features/permissions/utils/has-permission";
import { Permission } from "@/features/permissions/types";

if (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

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

async function verifyWorkspacePermission(workspaceId: string, permission: Permission) {
  const data = await getWorkspaceAndMember(workspaceId);
  if (!hasPermission(data.member.role, permission)) {
    throw new Error("Unauthorized: Insufficient permissions");
  }
  return data;
}

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

// ── Workspace Settings ─────────────────────────────────────────────────────

export async function updateWorkspaceName(workspaceId: string, name: string) {
  const { member, workspace } = await verifyWorkspacePermission(workspaceId, "workspace:update");

  if (name.trim().length < 2) throw new Error("Name must be at least 2 characters");

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { name: name.trim() },
  });

  revalidatePath(`/workspace/${workspace.slug}`);
  revalidatePath(`/dashboard`);
  return { success: true };
}

export async function updateWorkspaceSlug(workspaceId: string, newSlugInput: string) {
  const { member, workspace } = await verifyWorkspacePermission(workspaceId, "workspace:update");

  const newSlug = slugify(newSlugInput);
  if (newSlug.length < 2) throw new Error("Slug must be at least 2 characters");
  if (newSlug === workspace.slug) return { success: true, slug: workspace.slug };

  // Check uniqueness
  const existing = await prisma.workspace.findUnique({ where: { slug: newSlug } });
  if (existing) throw new Error("This slug is already taken");

  const updated = await prisma.workspace.update({
    where: { id: workspaceId },
    data: { slug: newSlug },
  });

  revalidatePath(`/workspace/${workspace.slug}`); // invalidate old
  revalidatePath(`/dashboard`);
  return { success: true, slug: updated.slug };
}

export async function updateWorkspaceLogo(workspaceId: string, logoUrl: string | null, logoPublicId: string | null) {
  const { member, workspace } = await verifyWorkspacePermission(workspaceId, "workspace:update");

  // If replacing an existing logo, clean up from Cloudinary
  if (workspace.logoPublicId && workspace.logoPublicId !== logoPublicId) {
    try {
      await cloudinary.uploader.destroy(workspace.logoPublicId);
    } catch (err) {
      console.error("Failed to delete old logo from Cloudinary:", err);
    }
  }

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { logo: logoUrl, logoPublicId },
  });

  revalidatePath(`/workspace/${workspace.slug}`);
  revalidatePath(`/dashboard`);
  return { success: true };
}

export async function getWorkspaceStats(workspaceId: string) {
  const { member } = await verifyWorkspacePermission(workspaceId, "workspace:delete");

  const [memberCount, projectCount, taskCount, fileCount] = await Promise.all([
    prisma.workspaceMember.count({ where: { workspaceId } }),
    prisma.project.count({ where: { workspaceId } }),
    prisma.task.count({ where: { project: { workspaceId } } }),
    prisma.file.count({ where: { workspaceId } }),
  ]);

  return { memberCount, projectCount, taskCount, fileCount };
}

export async function deleteWorkspace(workspaceId: string) {
  const { member, workspace } = await verifyWorkspacePermission(workspaceId, "workspace:delete");

  // Clean up all Cloudinary files related to this workspace
  const files = await prisma.file.findMany({
    where: { workspaceId, publicId: { not: null } },
  });

  const publicIds = files.map(f => f.publicId).filter(Boolean) as string[];
  if (workspace.logoPublicId) publicIds.push(workspace.logoPublicId);

  // Batch delete from Cloudinary
  if (publicIds.length > 0) {
    try {
      // Cloudinary API handles batch deletes up to 100 at a time
      for (let i = 0; i < publicIds.length; i += 100) {
        await cloudinary.api.delete_resources(publicIds.slice(i, i + 100));
      }
    } catch (err) {
      console.error("Failed to clean up workspace files from Cloudinary:", err);
    }
  }

  await prisma.workspace.delete({ where: { id: workspaceId } });

  revalidatePath(`/dashboard`);
  return { success: true };
}
