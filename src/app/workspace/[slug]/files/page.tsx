import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getWorkspaceFiles } from "@/features/files/actions/file.actions";
import { FileCard } from "@/features/files/components/file-card";
import { FileUploadButton } from "@/features/files/components/file-upload-button";
import { FileX } from "lucide-react";

export default async function FilesPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");
  const userId = session.user.id as string;

  const { slug } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { slug },
  });

  if (!workspace) redirect("/dashboard");

  // Get member role for permission checks
  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId: workspace.id,
      },
    },
  });

  if (!member) redirect("/dashboard");

  const files = await getWorkspaceFiles(workspace.id);

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-zinc-800/60 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Files</h1>
          <p className="text-zinc-400 mt-1">
            Shared files for the <span className="text-zinc-200 capitalize">{slug}</span> workspace.
          </p>
        </div>
        <FileUploadButton workspaceId={workspace.id} />
      </div>

      {/* File Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto">
            <div className="h-16 w-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-zinc-800">
              <FileX className="h-8 w-8 text-zinc-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No files yet</h2>
            <p className="text-zinc-400 mb-6">
              Upload files to share with your team. Supports images, PDFs, documents, and more (up to 10MB).
            </p>
            <FileUploadButton workspaceId={workspace.id} />
          </div>
        ) : (
          <>
            <p className="text-xs text-zinc-500 mb-4">{files.length} file{files.length !== 1 ? "s" : ""}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {files.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  currentUserId={userId}
                  userRole={member.role}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
