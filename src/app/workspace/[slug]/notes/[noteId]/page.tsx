import { auth } from "@/lib/auth";
import { hasPermission } from "@/features/permissions/utils/has-permission";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { NoteEditorWrapper } from "@/features/notes/components/note-editor-wrapper";

export default async function NoteEditorPage({
  params,
}: {
  params: Promise<{ slug: string; noteId: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const { slug, noteId } = await params;

  // Fetch note + workspace membership in parallel
  const [note, workspace] = await Promise.all([
    prisma.note.findUnique({
      where: { id: noteId },
      select: { title: true, workspaceId: true },
    }),
    prisma.workspace.findUnique({
      where: { slug },
      select: { id: true },
    }),
  ]);

  if (!note) {
    redirect(`/workspace/${slug}/notes`);
  }

  // Check membership
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id!,
        workspaceId: note.workspaceId,
      },
    },
  });

  if (!membership || !hasPermission(membership.role, "note:view")) {
    redirect(`/workspace/${slug}/notes`);
  }

  const isReadOnly = !hasPermission(membership.role, "note:update");

  // 3. Generate WebSocket Auth Token (same pattern as /api/chat/auth)
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET missing");

  const token = jwt.sign(
    {
      userId: session.user.id,
      name: session.user.name,
      image: session.user.image,
    },
    secret,
    { expiresIn: "4h" }
  );

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-background dark:bg-zinc-950/50 overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b bg-white dark:bg-card dark:bg-zinc-900 shadow-sm z-10 shrink-0">
        <FileText className="h-5 w-5 text-black-500" />
        <h1 className="text-xl text-black font-semibold">{note.title}</h1>
        {isReadOnly && (
          <span className="ml-2 text-xs font-medium bg-slate-100 dark:bg-muted dark:bg-zinc-800 text-black px-2 py-1 rounded-md">
            Read Only
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto w-full">
        <NoteEditorWrapper
          noteId={noteId}
          token={token}
          isReadOnly={isReadOnly}
          currentUser={{ name: session.user.name || "Anonymous" }}
        />
      </div>
    </div>
  );
}
