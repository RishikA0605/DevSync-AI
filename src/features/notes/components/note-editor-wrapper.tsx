"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const NoteEditor = dynamic(
  () => import("./note-editor").then((m) => m.NoteEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[50vh] text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <p>Loading editor...</p>
      </div>
    ),
  }
);

interface NoteEditorWrapperProps {
  noteId: string;
  token: string;
  isReadOnly: boolean;
  currentUser: { name: string; color?: string };
}

export function NoteEditorWrapper(props: NoteEditorWrapperProps) {
  return <NoteEditor {...props} />;
}
