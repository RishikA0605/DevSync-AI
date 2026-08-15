import { Sidebar } from "@/components/shared/sidebar";
import { getUserWorkspaces } from "@/features/workspaces/actions/workspace.actions";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const workspaces = await getUserWorkspaces();
  
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <Sidebar workspaceSlug={resolvedParams.slug} workspaces={workspaces} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* We can add a generic Header here later if needed */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
