import { Sidebar } from "@/components/shared/sidebar";
import { getUserWorkspaces } from "@/features/workspaces/actions/workspace.actions";
import { Suspense } from "react";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const [resolvedParams, workspaces] = await Promise.all([
    params,
    getUserWorkspaces(),
  ]);

  return (
    <div className="flex h-screen overflow-hidden bg-background dark:bg-zinc-950 text-foreground">
      <Sidebar workspaceSlug={resolvedParams.slug} workspaces={workspaces} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
