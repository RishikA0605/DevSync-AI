"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createProject(workspaceSlug: string, name: string, description?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
  });

  if (!workspace) throw new Error("Workspace not found");

  // Verify membership
  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId: workspace.id,
      },
    },
  });

  if (!member) throw new Error("Not a member of this workspace");

  const project = await prisma.project.create({
    data: {
      name,
      description,
      workspaceId: workspace.id,
    },
  });

  revalidatePath(`/workspace/${workspaceSlug}/projects`);
  return project;
}

export async function getProjects(workspaceSlug: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
  });

  if (!workspace) throw new Error("Workspace not found");

  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId: workspace.id,
      },
    },
  });

  if (!member) throw new Error("Not a member of this workspace");

  const projects = await prisma.project.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { tasks: true },
      },
    },
  });

  return projects;
}

export async function getProjectById(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      workspace: true,
      tasks: {
        include: {
          assignee: {
            select: { id: true, name: true, image: true, email: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!project) throw new Error("Project not found");

  // Verify membership
  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId: project.workspaceId,
      },
    },
  });

  if (!member) throw new Error("Not a member of this workspace");

  return project;
}
