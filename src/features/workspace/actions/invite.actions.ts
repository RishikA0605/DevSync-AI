"use server";

import jwt from "jsonwebtoken";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    return workspaceSlug;
  } catch (error) {
    console.error("Invite link error:", error);
    throw new Error("Invalid or expired invite link");
  }
}
