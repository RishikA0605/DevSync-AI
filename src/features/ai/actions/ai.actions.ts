"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getConversations(workspaceId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  return await prisma.aIConversation.findMany({
    where: { workspaceId, userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { messages: true } },
    },
  });
}

export async function createConversation(workspaceId: string, title: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const conversation = await prisma.aIConversation.create({
    data: {
      title,
      workspaceId,
      userId: session.user.id,
    },
  });

  revalidatePath(`/workspace`);
  return conversation;
}

export async function getConversationMessages(conversationId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  return await prisma.aIMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });
}

export async function saveMessage(conversationId: string, role: string, content: string) {
  await prisma.aIMessage.create({
    data: { conversationId, role, content },
  });

  // Update conversation updatedAt
  await prisma.aIConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
}

export async function deleteConversation(conversationId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.aIConversation.delete({ where: { id: conversationId } });
  revalidatePath(`/workspace`);
}
