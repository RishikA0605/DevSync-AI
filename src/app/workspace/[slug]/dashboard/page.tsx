export default async function WorkspaceDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  
  return (
    <div className="p-8 h-full flex flex-col gap-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Welcome to the {resolvedParams.slug} workspace. Here's an overview of your team's activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Placeholder cards to show the layout */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card text-card-foreground shadow-sm p-6">
          <h3 className="tracking-tight text-sm font-medium">Total Messages</h3>
          <div className="text-2xl font-bold mt-2">1,234</div>
          <p className="text-xs text-muted-foreground mt-1">+20% from last month</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card text-card-foreground shadow-sm p-6">
          <h3 className="tracking-tight text-sm font-medium">Active Tasks</h3>
          <div className="text-2xl font-bold mt-2">42</div>
          <p className="text-xs text-muted-foreground mt-1">12 due this week</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card text-card-foreground shadow-sm p-6">
          <h3 className="tracking-tight text-sm font-medium">AI Queries</h3>
          <div className="text-2xl font-bold mt-2">89</div>
          <p className="text-xs text-muted-foreground mt-1">+43 since yesterday</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card text-card-foreground shadow-sm p-6">
          <h3 className="tracking-tight text-sm font-medium">Active Members</h3>
          <div className="text-2xl font-bold mt-2">12</div>
          <p className="text-xs text-muted-foreground mt-1">3 online now</p>
        </div>
      </div>

      <div className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-8 flex items-center justify-center border-dashed">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Activity Feed</h3>
          <p className="text-sm text-zinc-500 mt-2 max-w-sm mx-auto">
            Recent activity will appear here once your team starts communicating and creating tasks.
          </p>
        </div>
      </div>
    </div>
  );
}
