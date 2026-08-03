"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createTaskSchema, updateTaskSchema, CreateTaskValues, UpdateTaskValues } from "@/validations/task.schema";

export async function createTask(projectId: string, data: CreateTaskValues) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = createTaskSchema.parse(data);

  const task = await prisma.task.create({
    data: {
      title: parsed.title,
      description: parsed.description,
      priority: parsed.priority,
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
      assigneeId: parsed.assigneeId || null,
      projectId,
      status: "TODO",
    },
    include: {
      assignee: { select: { id: true, name: true, image: true } },
      comments: {
        include: { author: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  revalidatePath(`/workspace`);
  return task;
}

export async function getProjectTasks(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  return await prisma.task.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    include: {
      assignee: { select: { id: true, name: true, image: true } },
      comments: {
        include: { author: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function updateTaskStatus(taskId: string, status: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { status: status as "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" },
    include: {
      assignee: { select: { id: true, name: true, image: true } },
      comments: {
        include: { author: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  revalidatePath(`/workspace`);
  return task;
}

export async function updateTask(taskId: string, data: UpdateTaskValues) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = updateTaskSchema.parse(data);

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...parsed,
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : parsed.dueDate === null ? null : undefined,
      assigneeId: parsed.assigneeId === null ? null : parsed.assigneeId,
      status: parsed.status as "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | undefined,
      priority: parsed.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined,
    },
    include: {
      assignee: { select: { id: true, name: true, image: true } },
      comments: {
        include: { author: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  revalidatePath(`/workspace`);
  return task;
}

export async function addTaskComment(taskId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const comment = await prisma.taskComment.create({
    data: { taskId, content, authorId: session.user.id },
    include: { author: { select: { id: true, name: true, image: true } } },
  });
  revalidatePath(`/workspace`);
  return comment;
}

export async function deleteTask(taskId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath(`/workspace`);
}
