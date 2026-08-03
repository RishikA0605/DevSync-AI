import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { 
  MessageSquare, 
  CheckSquare, 
  Bot, 
  Users,
  TrendingUp,
  Clock,
  Zap,
  ChevronRight,
  Circle
} from "lucide-react";

async function getWorkspaceStats(workspaceId: string, userId: string) {
  const [memberCount, taskCount, tasksDone, aiConversations, recentActivity] = await Promise.all([
    prisma.workspaceMember.count({ where: { workspaceId } }),
    prisma.task.count({ where: { project: { workspaceId } } }),
    prisma.task.count({ where: { project: { workspaceId }, status: "DONE" } }),
    prisma.aIConversation.count({ where: { workspaceId } }),
    prisma.activityLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { user: { select: { name: true, image: true } } },
    }),
  ]);
  return { memberCount, taskCount, tasksDone, aiConversations, recentActivity };
}

export default async function WorkspaceDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");

  const { slug } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    include: { members: { include: { user: { select: { id: true, name: true, image: true } } } } },
  });

  if (!workspace) redirect("/dashboard");

  const stats = await getWorkspaceStats(workspace.id, session.user.id);
  const taskCompletionRate = stats.taskCount > 0
    ? Math.round((stats.tasksDone / stats.taskCount) * 100)
    : 0;

  const statCards = [
    { label: "Team Members", value: stats.memberCount, icon: Users, color: "from-blue-500 to-blue-600", bg: "bg-blue-500/10", textColor: "text-blue-400", desc: "in this workspace" },
    { label: "Total Tasks", value: stats.taskCount, icon: CheckSquare, color: "from-violet-500 to-violet-600", bg: "bg-violet-500/10", textColor: "text-violet-400", desc: `${taskCompletionRate}% completed` },
    { label: "AI Sessions", value: stats.aiConversations, icon: Bot, color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-500/10", textColor: "text-emerald-400", desc: "conversations started" },
    { label: "Completion Rate", value: `${taskCompletionRate}%`, icon: TrendingUp, color: "from-amber-500 to-amber-600", bg: "bg-amber-500/10", textColor: "text-amber-400", desc: `${stats.tasksDone} tasks done` },
  ];

  const quickActions = [
    { label: "Start a Chat", href: `/workspace/${slug}/chat`, icon: MessageSquare, desc: "Message your team" },
    { label: "Create a Task", href: `/workspace/${slug}/tasks`, icon: CheckSquare, desc: "Track your work" },
    { label: "Ask AI", href: `/workspace/${slug}/ai`, icon: Bot, desc: "Get instant help" },
    { label: "Invite Members", href: `/workspace/${slug}/settings`, icon: Users, desc: "Grow your team" },
  ];

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-zinc-800/60">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/40 via-zinc-950 to-blue-950/30 pointer-events-none" />
        <div className="relative px-8 py-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-zinc-400 font-medium tracking-wider uppercase">Live Workspace</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                {workspace.name}
              </h1>
              <p className="text-zinc-400 mt-2 text-sm">
                Welcome back, {session.user.name?.split(" ")[0]} 👋 — Here's what's happening today.
              </p>
            </div>
            <div className="flex -space-x-2">
              {workspace.members.slice(0, 5).map((m) => (
                <div
                  key={m.id}
                  className="h-9 w-9 rounded-full border-2 border-zinc-800 bg-zinc-700 flex items-center justify-center text-xs font-semibold overflow-hidden"
                  title={m.user.name || ""}
                >
                  {m.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.user.image} alt={m.user.name || ""} className="h-full w-full object-cover" />
                  ) : (
                    m.user.name?.charAt(0).toUpperCase()
                  )}
                </div>
              ))}
              {workspace.members.length > 5 && (
                <div className="h-9 w-9 rounded-full border-2 border-zinc-800 bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-400">
                  +{workspace.members.length - 5}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 space-y-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="group relative rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 hover:border-zinc-700 transition-all duration-200 backdrop-blur-sm overflow-hidden"
            >
              <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 bg-gradient-to-br ${stat.color} opacity-[0.04] group-hover:opacity-[0.09]`} />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase">{stat.label}</p>
                  <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                  <p className={`text-xs mt-1 ${stat.textColor}`}>{stat.desc}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.textColor}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 overflow-hidden backdrop-blur-sm">
              <div className="px-6 py-4 border-b border-zinc-800/60">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <h2 className="text-sm font-semibold text-white">Quick Actions</h2>
                </div>
              </div>
              <div className="p-3 space-y-1">
                {quickActions.map((action) => (
                  <a
                    key={action.label}
                    href={action.href}
                    className="group flex items-center gap-4 rounded-xl px-3 py-3 hover:bg-zinc-800/60 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-lg bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center transition-colors shrink-0">
                      <action.icon className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 group-hover:text-white">{action.label}</p>
                      <p className="text-xs text-zinc-500">{action.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 shrink-0 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 overflow-hidden backdrop-blur-sm h-full">
              <div className="px-6 py-4 border-b border-zinc-800/60">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
                </div>
              </div>
              <div className="p-6">
                {stats.recentActivity.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-14 w-14 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                      <Clock className="h-6 w-6 text-zinc-600" />
                    </div>
                    <p className="text-sm font-medium text-zinc-400">No activity yet</p>
                    <p className="text-xs text-zinc-600 mt-1 max-w-xs">
                      Activity from your team will appear here as you start collaborating.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {stats.recentActivity.map((log) => (
                      <div key={log.id} className="flex items-start gap-3">
                        <div className="h-7 w-7 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
                          {log.user?.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-300">
                            <span className="font-medium text-white">{log.user?.name}</span>{" "}
                            {log.action.toLowerCase()} a {log.entityType.toLowerCase()}
                          </p>
                          <p className="text-xs text-zinc-600 mt-0.5">
                            {new Date(log.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <Circle className="h-2 w-2 text-zinc-700 fill-zinc-700 shrink-0 mt-2" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Getting Started Checklist */}
        {stats.taskCount === 0 && stats.memberCount < 2 && (
          <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 to-blue-950/20 p-6 backdrop-blur-sm">
            <h2 className="text-base font-semibold text-white mb-1">🚀 Get started with DevSync AI</h2>
            <p className="text-sm text-zinc-400 mb-5">Complete these steps to set up your workspace</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { done: true, label: "Create a workspace", desc: "You're here! ✅" },
                { done: false, label: "Invite a teammate", desc: "Collaborate together" },
                { done: false, label: "Create your first task", desc: "Start tracking work" },
              ].map((step) => (
                <div key={step.label} className={`flex items-start gap-3 p-4 rounded-xl border ${step.done ? "border-emerald-500/30 bg-emerald-500/5" : "border-zinc-700/50 bg-zinc-800/30"}`}>
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${step.done ? "bg-emerald-500" : "border-2 border-zinc-600"}`}>
                    {step.done && <span className="text-white text-[10px]">✓</span>}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${step.done ? "text-emerald-400" : "text-zinc-300"}`}>{step.label}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
