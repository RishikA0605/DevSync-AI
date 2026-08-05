import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getWorkspaceChannels,
  getUnreadCounts,
} from "@/features/chat/actions/chat.actions";
import { prisma } from "@/lib/prisma";
import { ChatSidebar } from "@/features/chat/components/chat-sidebar";

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function ChatLayout({ children, params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const { slug } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });

  if (!workspace) redirect("/");

  const [channels, unreadCounts] = await Promise.all([
    getWorkspaceChannels(workspace.id),
    getUnreadCounts(workspace.id, session.user.id),
  ]);

  // Seed a #general channel automatically if none exist
  if (channels.length === 0) {
    const general = await prisma.channel.create({
      data: { name: "general", type: "PUBLIC", workspaceId: workspace.id },
    });
    return redirect(`/workspace/${slug}/chat/${general.id}`);
  }

  const unreadMap = Object.fromEntries(
    unreadCounts.map(u => [u.channelId, u.count])
  );

  return (
    <div className="flex h-full">
      <ChatSidebar
        channels={channels}
        workspaceId={workspace.id}
        workspaceSlug={workspace.slug}
        unreadCounts={unreadMap}
        onlineUserIds={[]}
      />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
