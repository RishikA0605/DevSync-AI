import { Sidebar } from "@/components/shared/sidebar";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const resolvedParams = await params;
  
  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-zinc-950">
      <Sidebar workspaceSlug={resolvedParams.slug} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* We can add a generic Header here later if needed */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
