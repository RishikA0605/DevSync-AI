import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getConversations } from "@/features/ai/actions/ai.actions";
import { AIPageClient } from "./ai-page-client";

export default async function AIPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");

  const { slug } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });

  if (!workspace) redirect("/dashboard");

  const [conversations, projectCount, taskCount] = await Promise.all([
    getConversations(workspace.id),
    prisma.project.count({ where: { workspaceId: workspace.id } }),
    prisma.task.count({ where: { project: { workspaceId: workspace.id }, status: { not: "DONE" } } }),
  ]);

  return (
    <div className="h-full overflow-hidden">
      <AIPageClient
        conversations={conversations}
        workspaceId={workspace.id}
        workspaceName={workspace.name}
        projectCount={projectCount}
        taskCount={taskCount}
      />
    </div>
  );
}
