import { Sidebar } from "@/components/shared/sidebar";
import { getUserWorkspaces } from "@/features/workspaces/actions/workspace.actions";
import { Suspense } from "react";

import { MobileHeader } from "@/components/shared/mobile-header";

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
    <div className="flex h-[100dvh] overflow-hidden bg-background dark:bg-zinc-950 text-foreground">
      <div className="hidden md:flex">
        <Sidebar workspaceSlug={resolvedParams.slug} workspaces={workspaces} />
      </div>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MobileHeader workspaceSlug={resolvedParams.slug} workspaces={workspaces} />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
