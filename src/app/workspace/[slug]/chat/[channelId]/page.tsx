import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getChannelMessages } from "@/features/chat/actions/chat.actions";
import { prisma } from "@/lib/prisma";
import { ChatWindow } from "@/features/chat/components/chat-window";

interface Props {
  params: Promise<{ slug: string; channelId: string }>;
}

export default async function ChannelPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const { channelId } = await params;

  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: { id: true, name: true },
  });

  if (!channel) redirect("/");

  const messages = await getChannelMessages(channelId);

  // Map DB messages to the shape ChatWindow expects
  const formattedMessages = messages.map(msg => ({
    id: msg.id,
    content: msg.content,
    channelId: msg.channelId,
    senderId: msg.senderId,
    senderName: (msg as any).sender?.name ?? "Unknown",
    senderImage: (msg as any).sender?.image ?? null,
    createdAt: msg.createdAt.toISOString(),
    isEdited: (msg as any).isEdited ?? false,
  }));

  return (
    <ChatWindow
      channelId={channel.id}
      channelName={channel.name}
      initialMessages={formattedMessages}
    />
  );
}
