import { joinWorkspaceByToken } from "@/features/workspaces/actions/workspace-invite.actions";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="text-center p-8 rounded-xl bg-zinc-900 border border-zinc-800">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Invalid Invite Link</h1>
          <p className="text-zinc-400">This invite link is missing or malformed.</p>
        </div>
      </div>
    );
  }

  const session = await auth();

  // If user is not logged in, force them to login first and return here
  if (!session?.user) {
    redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(`/invite?token=${token}`)}`);
  }

  let workspaceSlug: string;
  try {
    workspaceSlug = await joinWorkspaceByToken(token);
  } catch (error: any) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="text-center p-8 rounded-xl bg-zinc-900 border border-zinc-800">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Invite Failed</h1>
          <p className="text-zinc-400">{error.message || "This invite link is invalid or has expired."}</p>
        </div>
      </div>
    );
  }

  // Redirect outside the try-catch block because Next.js redirect() throws an error internally
  redirect(`/workspace/${workspaceSlug}/chat`);
}
