"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Plus, Search, FileText, Trash2, MoreVertical, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createNote, deleteNote } from "../actions/note.actions";

interface Note {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    name: string | null;
    image: string | null;
  };
}

interface NotesListProps {
  notes: Note[];
  workspaceSlug: string;
}

export function NotesList({ notes, workspaceSlug }: NotesListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNote = async () => {
    if (!newNoteTitle.trim()) {
      alert("Please enter a title");
      return;
    }

    setIsCreating(true);
    const result = await createNote(workspaceSlug, newNoteTitle);
    setIsCreating(false);

    if (result.success && result.note) {
      setIsCreateModalOpen(false);
      setNewNoteTitle("");
      router.push(`/workspace/${workspaceSlug}/notes/${result.note.id}`);
    } else {
      alert(result.error || "Failed to create note");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setDeletingId(noteId);
    const result = await deleteNote(noteId);
    setDeletingId(null);

    if (!result.success) {
      alert(result.error || "Failed to delete note");
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-background dark:bg-zinc-950/50">
      <div className="p-4 md:p-6 pb-4 border-b flex justify-between items-center bg-white dark:bg-card dark:bg-zinc-900 sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Collaborative documents for your workspace
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 shadow-sm rounded-full">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Note</span>
        </Button>
      </div>

      <div className="p-4 md:p-6 flex-1 max-w-7xl mx-auto w-full">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 max-w-md bg-white dark:bg-card dark:bg-zinc-900 border-slate-200 dark:border-border dark:border-zinc-800 focus-visible:ring-indigo-500 rounded-xl"
          />
        </div>

        {filteredNotes.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-white/50 dark:bg-card dark:bg-zinc-900/50">
            <div className="bg-slate-100 dark:bg-muted dark:bg-zinc-800 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-6 w-6 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium">No notes found</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-4">
              Get started by creating a new document.
            </p>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(true)}>
              Create First Note
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredNotes.map((note) => (
              <Link
                key={note.id}
                href={`/workspace/${workspaceSlug}/notes/${note.id}`}
                prefetch={true}
                className="group relative flex flex-col justify-between p-5 rounded-2xl border bg-white dark:bg-card dark:bg-zinc-900 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all cursor-pointer overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-950/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative z-10 flex items-start justify-between">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                      <FileText className="h-5 w-5" />
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button

                        size="icon"
                        className="h-8 w-8 group-hover:opacity-100 transition-opacity -mr-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deletingId === note.id ? "Deleting..." : "Delete Note"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="relative z-10">
                  <h3 className="font-semibold text-lg text-gray-600 line-clamp-1 mb-1">{note.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    Updated {format(new Date(note.updatedAt), "MMM d, yyyy")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Note</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="E.g., Product Requirements, Meeting Notes..."
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateNote();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateNote} disabled={isCreating}>
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
