import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ slug: string }>;
}

// /workspace/[slug]/chat → redirect to #general
export default async function ChatIndexPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const { slug } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!workspace) redirect("/");

  const firstChannel = await prisma.channel.findFirst({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "asc" },
  });

  if (firstChannel) {
    redirect(`/workspace/${slug}/chat/${firstChannel.id}`);
  }

  return (
    <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
      No channels found.
    </div>
  );
}
