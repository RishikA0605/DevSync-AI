import { redirect } from "next/navigation";
import { getUserWorkspaces } from "@/features/workspaces/actions/workspace.actions";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth");
  }

  const workspaces = await getUserWorkspaces();

  if (workspaces.length === 0) {
    redirect("/onboarding");
  }

  // Redirect to the first workspace dashboard
  redirect(`/workspace/${workspaces[0].slug}/dashboard`);
}
