import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getWorkspaceActivity } from "@/features/activity/actions/activity.actions";
import { ActivityFeed } from "@/features/activity/components/activity-feed";
import { Activity } from "lucide-react";

export default async function ActivityPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");

  const { slug } = await params;

  const workspace = await prisma.workspace.findUnique({ where: { slug } });
  if (!workspace) redirect("/dashboard");

  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId: workspace.id,
      },
    },
  });
  if (!member) redirect("/dashboard");

  const { activities } = await getWorkspaceActivity({
    workspaceId: workspace.id,
    page: 1,
    pageSize: 50,
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-background dark:bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-6 border-b border-border dark:border-border dark:border-zinc-800/60 shrink-0">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20 flex items-center justify-center">
          <Activity size={18} className="text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground dark:text-white tracking-tight">Activity Feed</h1>
          <p className="text-muted-foreground dark:text-zinc-400 text-sm mt-0.5 capitalize">
            Recent events in <span className="text-foreground dark:text-zinc-200">{slug}</span> workspace
          </p>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto p-6">
        <ActivityFeed activities={activities as Parameters<typeof ActivityFeed>[0]["activities"]} />
      </div>
    </div>
  );
}
