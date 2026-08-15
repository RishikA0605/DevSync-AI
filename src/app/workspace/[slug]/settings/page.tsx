import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsTabs } from "@/features/workspaces/components/settings/settings-tabs";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");

  const { slug } = await params;

  // Fetch workspace and current member
  const workspace = await prisma.workspace.findUnique({
    where: { slug },
  });

  if (!workspace) redirect("/dashboard");

  const currentMember = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId: workspace.id,
      },
    },
  });

  if (!currentMember) redirect("/dashboard");

  const isAdmin = currentMember.role === "OWNER" || currentMember.role === "ADMIN";

  // Fetch all members
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: workspace.id },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: [
      { role: "asc" },
      { createdAt: "asc" }
    ],
  });

  // Fetch invites (if admin)
  let invites: any[] = [];
  if (isAdmin) {
    invites = await prisma.workspaceInvite.findMany({
      where: { 
        workspaceId: workspace.id,
        isRevoked: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Fetch stats
  const [memberCount, projectCount, taskCount, fileCount] = await Promise.all([
    prisma.workspaceMember.count({ where: { workspaceId: workspace.id } }),
    prisma.project.count({ where: { workspaceId: workspace.id } }),
    prisma.task.count({ where: { project: { workspaceId: workspace.id } } }),
    prisma.file.count({ where: { workspaceId: workspace.id } }),
  ]);

  const workspaceStats = { memberCount, projectCount, taskCount, fileCount };

  return (
    <div className="flex-1 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Workspace Settings</h1>
          <p className="text-zinc-400 mt-1">Manage your workspace preferences, members, and data.</p>
        </div>

        <SettingsTabs 
          workspace={workspace} 
          currentMember={currentMember} 
          members={members} 
          invites={invites}
          workspaceStats={workspaceStats}
        />
      </div>
    </div>
  );
}
