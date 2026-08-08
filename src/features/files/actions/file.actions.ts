"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { fileSchema, FileSchemaValues } from "@/validations/file.schema";
import { v2 as cloudinary } from "cloudinary";

// Configure cloudinary with environment variables if they exist
if (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function saveFileRecord(data: FileSchemaValues) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Validate file metadata
  const parsed = fileSchema.parse(data);

  // Verify workspace membership
  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId: parsed.workspaceId,
      },
    },
  });

  if (!member) throw new Error("Not a member of this workspace");

  const file = await prisma.file.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      name: parsed.name,
      url: parsed.url,
      publicId: parsed.publicId,
      type: parsed.type,
      size: parsed.size,
      workspaceId: parsed.workspaceId,
      uploaderId: session.user.id,
      taskId: parsed.taskId,
      messageId: parsed.messageId,
    } as any, // publicId/taskId/messageId added via migration
    include: {
      uploader: { select: { id: true, name: true, image: true } }
    }
  });

  // Revalidate relevant paths
  const workspace = await prisma.workspace.findUnique({ where: { id: parsed.workspaceId } });
  if (workspace) {
    revalidatePath(`/workspace/${workspace.slug}/files`);
    if (parsed.taskId) {
      // Find the project ID for this task to revalidate the kanban board
      const task = await prisma.task.findUnique({ where: { id: parsed.taskId } });
      if (task) {
        revalidatePath(`/workspace/${workspace.slug}/projects/${task.projectId}`);
      }
    }
  }

  return file;
}

export async function getWorkspaceFiles(workspaceId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  // Verify membership
  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId,
      },
    },
  });

  if (!member) return [];

  return await prisma.file.findMany({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    where: { workspaceId, taskId: null, messageId: null } as any, // taskId/messageId added via migration
    orderBy: { createdAt: "desc" },
    include: {
      uploader: { select: { id: true, name: true, image: true } },
    },
  });
}

export async function deleteFile(fileId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const file = await prisma.file.findUnique({
    where: { id: fileId },
    include: { workspace: true },
  });

  if (!file) throw new Error("File not found");

  // Verify membership and permissions (only uploader or workspace owner/admin can delete)
  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId: file.workspaceId,
      },
    },
  });

  if (!member) throw new Error("Unauthorized");

  const isUploader = file.uploaderId === session.user.id;
  const isAdmin = member.role === "ADMIN" || member.role === "OWNER";
  
  if (!isUploader && !isAdmin) {
    throw new Error("You don't have permission to delete this file");
  }

  // Delete from Cloudinary if publicId exists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fileAny = file as any;
  if (fileAny.publicId) {
    try {
      await cloudinary.uploader.destroy(fileAny.publicId);
    } catch (error) {
      console.error("Failed to delete from Cloudinary:", error);
      // We continue to delete the DB record even if Cloudinary fails, to not leave orphans
    }
  }

  // Delete from DB
  await prisma.file.delete({
    where: { id: fileId },
  });

  revalidatePath(`/workspace/${file.workspace.slug}/files`);
  if (fileAny.taskId) {
    const task = await prisma.task.findUnique({ where: { id: fileAny.taskId } });
    if (task) {
      revalidatePath(`/workspace/${file.workspace.slug}/projects/${task.projectId}`);
    }
  }

  return { success: true };
}
