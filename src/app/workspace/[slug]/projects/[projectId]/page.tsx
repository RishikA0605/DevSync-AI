import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { KanbanBoard } from "@/features/tasks/components/kanban-board";
import { getProjectTasks } from "@/features/tasks/actions/task.actions";
import { TaskCardData } from "@/features/tasks/components/task-card";

export default async function ProjectKanbanPage({
  params,
}: {
  params: Promise<{ slug: string; projectId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");

  const { slug, projectId } = await params;

  // Verify workspace access and fetch project details
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      workspace: {
        slug,
        members: { some: { userId: session.user.id } },
      },
    },
    include: {
      workspace: {
        include: {
          members: {
            include: { user: { select: { id: true, name: true, image: true } } },
          },
        },
      },
    },
  });

  if (!project) redirect(`/workspace/${slug}/projects`);

  const rawTasks = await getProjectTasks(projectId);

  // Map tasks to TaskCardData
  const tasks: TaskCardData[] = rawTasks.map(t => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate,
    assigneeId: t.assigneeId,
    assignee: t.assignee,
    comments: t.comments,
  }));

  const members = project.workspace.members.map(m => m.user);

  return (
    <div className="h-full flex flex-col bg-background dark:bg-zinc-950 text-foreground dark:text-zinc-100 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-2 p-6 border-b border-border dark:border-border dark:border-zinc-800/60 shrink-0">
        <Link 
          href={`/workspace/${slug}/projects`}
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground dark:text-zinc-500 hover:text-foreground dark:text-zinc-300 w-fit transition-colors"
        >
          <ChevronLeft size={14} /> Back to Projects
        </Link>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground dark:text-white">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-muted-foreground dark:text-zinc-400 mt-1 max-w-xl line-clamp-1">{project.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board Area */}
      <div className="flex-1 overflow-hidden p-6 pt-0 mt-4">
        <KanbanBoard projectId={projectId} initialTasks={tasks} members={members} />
      </div>
    </div>
  );
}
