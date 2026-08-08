"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function deleteAccount() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    // Delete all workspaces owned by the user
    // (Workspace model doesn't have an explicit cascade relation to User via ownerId)
    await prisma.workspace.deleteMany({
      where: { ownerId: session.user.id },
    });

    // Delete the user
    // This will cascade and delete their WorkspaceMember records, messages, accounts, etc.
    await prisma.user.delete({
      where: { id: session.user.id },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting account:", error);
    throw new Error("Failed to delete account");
  }
}
