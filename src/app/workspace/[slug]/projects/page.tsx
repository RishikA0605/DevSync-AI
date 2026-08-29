import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ProjectsHeader } from "./projects-header";
import { FolderKanban, CheckSquare, Clock } from "lucide-react";
import { getWorkspaceProjects } from "@/features/tasks/actions/project.actions";

export default async function ProjectsPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");

  const { slug } = await params;
  
  // Parallelize workspace lookup + auth check
  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });

  if (!workspace) redirect("/dashboard");

  const projects = await getWorkspaceProjects(workspace.id);

  return (
    <div className="min-h-full bg-background dark:bg-zinc-950 text-foreground dark:text-zinc-100 p-8 space-y-8">
      <ProjectsHeader workspaceId={workspace.id} />

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border dark:border-zinc-800 rounded-2xl bg-card dark:bg-zinc-900/30">
          <div className="h-16 w-16 rounded-2xl bg-muted dark:bg-zinc-800/80 flex items-center justify-center mb-4 border border-zinc-700/50">
            <FolderKanban className="h-8 w-8 text-muted-foreground dark:text-zinc-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground dark:text-white">No projects yet</h3>
          <p className="text-sm text-muted-foreground dark:text-zinc-400 mt-2 max-w-sm">
            Create a project to start organizing tasks, bugs, and feature requests for your team.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const totalTasks = project._count.tasks;
            const doneTasks = project.tasks.filter(t => t.status === "DONE").length;
            const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

            return (
              <Link 
                key={project.id} 
                href={`/workspace/${slug}/projects/${project.id}`}
                className="group flex flex-col rounded-2xl border border-border dark:border-zinc-800 bg-card dark:bg-zinc-900/50 p-6 hover:border-violet-500/50 hover:bg-card dark:bg-zinc-900 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20 group-hover:bg-violet-500/20 transition-colors">
                    <FolderKanban className="h-5 w-5 text-violet-400" />
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-foreground dark:text-white mb-1 group-hover:text-violet-100 transition-colors">
                  {project.name}
                </h3>
                <p className="text-sm text-muted-foreground dark:text-zinc-400 line-clamp-2 mb-6 min-h-[40px]">
                  {project.description || "No description provided."}
                </p>

                <div className="mt-auto space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-muted-foreground dark:text-zinc-400">Progress</span>
                      <span className="text-foreground dark:text-zinc-300">{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-violet-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Stats Footer */}
                  <div className="flex items-center gap-4 pt-4 border-t border-border dark:border-border dark:border-zinc-800/60">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground dark:text-zinc-400">
                      <CheckSquare size={14} />
                      <span>{doneTasks}/{totalTasks} done</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground dark:text-zinc-400 ml-auto">
                      <Clock size={14} />
                      <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
