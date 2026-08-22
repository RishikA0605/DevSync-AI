"use client";

import { FileIcon, ImageIcon, FileTextIcon, ArchiveIcon, Trash2, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { deleteFile } from "@/features/files/actions/file.actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface FileData {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: Date;
  uploader: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface FileCardProps {
  file: FileData;
  currentUserId?: string;
  userRole?: string;
}

export function FileCard({ file, currentUserId, userRole }: FileCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  const canDelete = currentUserId === file.uploader.id || userRole === "ADMIN" || userRole === "OWNER";

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteFile(file.id);
      setDeleteModal(false);
    } catch (error) {
      console.error(error);
      alert("Failed to delete file");
      setIsDeleting(false);
    }
  };

  const isImage = file.type.startsWith("image/");

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <>
      <div className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-colors">
        {/* File Preview */}
        <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-40 bg-zinc-950/50">
          {isImage ? (
            <img
              src={file.url}
              alt={file.name}
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-zinc-500 group-hover:text-violet-400 transition-colors">
              {file.type.includes("pdf") ? <FileTextIcon size={40} /> :
                file.type.includes("zip") || file.type.includes("rar") ? <ArchiveIcon size={40} /> :
                  <FileIcon size={40} />}
            </div>
          )}
        </a>

        {/* File Info */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-medium text-zinc-100 line-clamp-1 group-hover:text-violet-400 transition-colors" title={file.name}>
            {file.name}
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            {formatBytes(file.size)} • {file.type.split("/")[1]?.toUpperCase() || "FILE"}
          </p>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6 border border-zinc-800">
                <AvatarImage src={file.uploader.image || ""} />
                <AvatarFallback className="text-[10px] bg-zinc-800 text-zinc-400">
                  {file.uploader.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-zinc-400">
                {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
              </span>
            </div>

            <div className="flex items-center gap-1 ">
              <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-400 hover:text-black" asChild>
                <a href={file.url} target="_blank" rel="noopener noreferrer" download>
                  <Download size={14} />
                </a>
              </Button>
              {canDelete && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setDeleteModal(true)}
                  disabled={isDeleting}
                  className="h-7 w-7 text-zinc-400 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete File Confirm Modal */}
      <ConfirmModal
        open={deleteModal}
        onOpenChange={setDeleteModal}
        title="Delete File"
        description={`Are you sure you want to delete "${file.name}"? This action cannot be undone.`}
        confirmLabel="Delete File"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </>
  );
}
