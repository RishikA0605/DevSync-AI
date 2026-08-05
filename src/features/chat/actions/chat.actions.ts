"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createChannelSchema } from "@/features/chat/validations/chat.schema";

// ─── Fetch all channels in a workspace ───────────────────────────────────────
export async function getWorkspaceChannels(workspaceId: string) {
  return prisma.channel.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
  });
}

// ─── Fetch message history for a channel ─────────────────────────────────────
export async function getChannelMessages(channelId: string, cursor?: string) {
  const messages = await prisma.message.findMany({
    where: { channelId },
    include: {
      sender: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    ...(cursor && {
      skip: 1,
      cursor: { id: cursor },
    }),
  });
  // Return in ascending order for display
  return messages.reverse();
}

// ─── Persist a message to the DB ─────────────────────────────────────────────
export async function persistMessage(
  channelId: string,
  senderId: string,
  content: string
) {
  return prisma.message.create({
    data: { channelId, senderId, content },
    include: {
      sender: { select: { id: true, name: true, image: true } },
    },
  });
}

// ─── Create a new channel ─────────────────────────────────────────────────────
export async function createChannel(input: {
  name: string;
  type: "PUBLIC" | "PRIVATE";
  workspaceId: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const validated = createChannelSchema.parse(input);

  const channel = await prisma.channel.create({
    data: {
      name: validated.name,
      type: validated.type,
      workspaceId: validated.workspaceId,
    },
  });

  revalidatePath(`/workspace`);
  return channel;
}

// ─── Mark a channel as read for the current user ─────────────────────────────
export async function markChannelAsRead(channelId: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).channelRead.upsert({
      where: { userId_channelId: { userId: session.user.id, channelId } },
      update: { lastReadAt: new Date() },
      create: { userId: session.user.id, channelId },
    });
  } catch {
    // channelRead table may not exist yet — safe to ignore
  }
}

// ─── Get unread message counts per channel ────────────────────────────────────
export async function getUnreadCounts(workspaceId: string, userId: string) {
  const channels = await prisma.channel.findMany({
    where: { workspaceId },
    select: { id: true },
  });

  // Safe cast until prisma generate runs after db push
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let reads: Array<{ channelId: string; lastReadAt: Date }> = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reads = await (prisma as any).channelRead.findMany({
      where: { userId, channelId: { in: channels.map((c: { id: string }) => c.id) } },
    });
  } catch {
    // channelRead table may not exist yet — return zeros
    return channels.map((c: { id: string }) => ({ channelId: c.id, count: 0 }));
  }

  const readMap = new Map(reads.map(r => [r.channelId, r.lastReadAt]));

  const counts = await Promise.all(
    channels.map(async (channel: { id: string }) => {
      const lastRead = readMap.get(channel.id);
      const count = await prisma.message.count({
        where: {
          channelId: channel.id,
          ...(lastRead ? { createdAt: { gt: lastRead as Date } } : {}),
        },
      });
      return { channelId: channel.id, count };
    })
  );

  return counts;
}
