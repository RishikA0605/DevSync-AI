"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createProjectSchema, CreateProjectValues } from "@/validations/task.schema";

export async function createProject(workspaceId: string, data: CreateProjectValues) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = createProjectSchema.parse(data);

  const project = await prisma.project.create({
    data: {
      name: parsed.name,
      description: parsed.description,
      workspaceId,
    },
  });

  revalidatePath(`/workspace`);
  return project;
}

export async function getWorkspaceProjects(workspaceId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  return await prisma.project.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { tasks: true },
      },
      tasks: {
        select: { status: true },
      },
    },
  });
}

export async function deleteProject(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.project.delete({ where: { id: projectId } });
  revalidatePath(`/workspace`);
}
