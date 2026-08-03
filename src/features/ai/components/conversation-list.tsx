"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createConversation, deleteConversation } from "@/features/ai/actions/ai.actions";
import { Button } from "@/components/ui/button";

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: Date;
  _count: { messages: number };
}

interface Props {
  conversations: Conversation[];
  workspaceId: string;
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({ conversations, workspaceId, activeId, onSelect }: Props) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [list, setList] = useState(conversations);

  async function handleNew() {
    setCreating(true);
    try {
      const conv = await createConversation(workspaceId, "New Chat");
      setList(prev => [{ ...conv, _count: { messages: 0 } }, ...prev]);
      onSelect(conv.id);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setList(prev => prev.filter(c => c.id !== id));
    if (activeId === id) onSelect("");
    await deleteConversation(id);
    router.refresh();
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60">
        <span className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">Conversations</span>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleNew}
          disabled={creating}
          className="h-7 w-7 text-zinc-500 hover:text-violet-400 hover:bg-zinc-800"
          title="New Chat"
        >
          <Plus size={15} />
        </Button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <MessageSquare size={24} className="text-zinc-700 mb-2" />
            <p className="text-xs text-zinc-600">No conversations yet</p>
          </div>
        ) : (
          list.map(conv => (
            <div
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={cn(
                "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                activeId === conv.id
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              )}
            >
              <MessageSquare size={13} className="shrink-0" />
              <span className="text-xs flex-1 truncate">{conv.title || "New Chat"}</span>
              <button
                onClick={(e) => handleDelete(e, conv.id)}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all shrink-0"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
