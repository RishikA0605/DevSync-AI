"use client";

import { useEffect, useState } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { withCollaboration } from "@blocknote/core/yjs";

import * as Y from "yjs";
import { Loader2, CheckCircle2, WifiOff, AlertCircle } from "lucide-react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

interface NoteEditorProps {
  noteId: string;
  token: string;
  isReadOnly: boolean;
  currentUser: { name: string; color?: string };
}

import { useNoteCollaboration } from "../hooks/use-note-collaboration";

type SaveStatus = "connecting" | "saved" | "saving" | "offline";

export function NoteEditor({ noteId, token, isReadOnly, currentUser }: NoteEditorProps) {
  const { provider, status: saveStatus } = useNoteCollaboration(noteId, token, currentUser);
  const [isDark, setIsDark] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const editor = useCreateBlockNote(
    provider
      ? (withCollaboration as any)({
          collaboration: {
            provider,
            fragment: provider.document.getXmlFragment("document-store"),
            user: {
              name: currentUser.name,
              color: currentUser.color || "#6366f1",
            },
          },
        })
      : {},
    [provider]
  );

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-[50vh] gap-2 text-slate-500 dark:text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading editor...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Status Bar */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {isReadOnly ? "👁 View only — you don't have edit access" : "Click anywhere to start writing"}
        </span>
        <div className="flex items-center gap-1.5">
          {saveStatus === "connecting" && (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
              <span className="text-xs text-slate-500 dark:text-slate-400">Connecting...</span>
            </>
          )}
          {saveStatus === "saving" && (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Saving...</span>
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Saved</span>
            </>
          )}
          {saveStatus === "offline" && (
            <>
              <WifiOff className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Offline — restart the socket server</span>
            </>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <BlockNoteView
            editor={editor as any}
            theme={isDark ? "dark" : "light"}
            editable={!isReadOnly}
          />
        </div>
      </div>
    </div>
  );
}
