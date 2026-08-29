"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { hasPermission } from "@/features/permissions/utils/has-permission";
import { Permission } from "@/features/permissions/types";

// ── Helper: resolve workspace slug → id and check membership ─────────────────

import { cache } from "react";

const getWorkspaceAndMemberBySlug = cache(async (workspaceSlug: string) => {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    include: {
      members: {
        where: { userId: session.user.id },
      },
    },
  });

  if (!workspace) throw new Error("Workspace not found");
  
  const member = workspace.members[0];
  if (!member) throw new Error("Not a member of this workspace");

  return { session, member, workspace };
});

async function checkNotePermission(workspaceSlug: string, permission: Permission) {
  const data = await getWorkspaceAndMemberBySlug(workspaceSlug);
  if (!hasPermission(data.member.role, permission)) {
    throw new Error("Unauthorized: Insufficient permissions");
  }
  return data;
}

// ── Note Actions ──────────────────────────────────────────────────────────────

export async function getNotes(workspaceSlug: string) {
  try {
    const { workspace } = await checkNotePermission(workspaceSlug, "note:view");

    const notes = await prisma.note.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: { name: true, image: true },
        },
      },
    });

    return { success: true, notes };
  } catch (error: any) {
    console.error("Failed to get notes:", error);
    return { success: false, error: error.message || "Internal server error", notes: [] };
  }
}

export async function createNote(workspaceSlug: string, title: string) {
  try {
    const { workspace, session } = await checkNotePermission(workspaceSlug, "note:create");

    const note = await prisma.note.create({
      data: {
        title,
        workspaceId: workspace.id,
        authorId: session.user!.id!,
      },
    });

    revalidatePath(`/workspace/${workspaceSlug}/notes`);
    return { success: true, note };
  } catch (error: any) {
    console.error("Failed to create note:", error);
    return { success: false, error: error.message || "Internal server error" };
  }
}

export async function updateNoteTitle(noteId: string, title: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    // Get note + workspace slug for permission check
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: { workspace: { select: { slug: true } } },
    });
    if (!note) return { success: false, error: "Note not found" };

    await checkNotePermission(note.workspace.slug, "note:update");

    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: { title },
    });

    revalidatePath(`/workspace/${note.workspace.slug}/notes`);
    revalidatePath(`/workspace/${note.workspace.slug}/notes/${noteId}`);
    return { success: true, note: updatedNote };
  } catch (error: any) {
    console.error("Failed to update note title:", error);
    return { success: false, error: error.message || "Internal server error" };
  }
}

export async function deleteNote(noteId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: { workspace: { select: { slug: true } } },
    });
    if (!note) return { success: false, error: "Note not found" };

    await checkNotePermission(note.workspace.slug, "note:delete");

    await prisma.note.delete({ where: { id: noteId } });

    revalidatePath(`/workspace/${note.workspace.slug}/notes`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete note:", error);
    return { success: false, error: error.message || "Internal server error" };
  }
}
