"use client";

import { useState } from "react";
import { Hash, Plus, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createChannel } from "@/features/chat/actions/chat.actions";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Channel {
  id: string;
  name: string;
  type: string;
}

interface Props {
  channels: Channel[];
  activeChannelId?: string;
  workspaceId: string;
  workspaceSlug: string;
  unreadCounts: Record<string, number>;
  onlineUserIds: string[];
}

export function ChatSidebar({
  channels,
  activeChannelId,
  workspaceId,
  workspaceSlug,
  unreadCounts,
}: Props) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const channel = await createChannel({
        name: newName.toLowerCase().replace(/\s+/g, "-"),
        type: "PUBLIC",
        workspaceId,
      });
      setCreating(false);
      setNewName("");
      router.push(`/workspace/${workspaceSlug}/chat/${channel.id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="w-64 flex flex-col bg-card dark:bg-zinc-900 border-r border-white/5 shrink-0 h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground dark:text-zinc-300 flex items-center gap-1">
            <ChevronDown className="w-3 h-3" />
            Channels
          </span>
          <button
            onClick={() => setCreating(true)}
            className="text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:text-white transition-colors"
            title="Create Channel"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
        {channels.map(channel => (
          <Link
            key={channel.id}
            href={`/workspace/${workspaceSlug}/chat/${channel.id}`}
            prefetch={true}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
              activeChannelId === channel.id
                ? "bg-violet-600/30 text-foreground dark:text-white"
                : "text-muted-foreground dark:text-zinc-400 hover:bg-white/5 hover:text-foreground dark:text-zinc-100"
            )}
          >
            <Hash className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{channel.name}</span>
            {unreadCounts[channel.id] > 0 && (
              <span className="ml-auto bg-violet-500 text-foreground dark:text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {unreadCounts[channel.id] > 99 ? "99+" : unreadCounts[channel.id]}
              </span>
            )}
          </Link>
        ))}

        {channels.length === 0 && (
          <p className="text-xs text-muted-foreground dark:text-zinc-500 px-3 py-2">No channels yet</p>
        )}
      </div>

      {/* Create Channel Form */}
      {creating && (
        <div className="p-3 border-t border-white/5">
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") setCreating(false);
            }}
            placeholder="channel-name"
            className="w-full bg-muted dark:bg-zinc-800 text-sm text-foreground dark:text-white placeholder-zinc-500 rounded-md px-3 py-1.5 border border-white/10 focus:outline-none focus:border-violet-500"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleCreate}
              disabled={loading || !newName.trim()}
              className="flex-1 flex items-center justify-center gap-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-foreground dark:text-white text-xs py-1.5 rounded-md transition-colors"
            >
              {loading && <Loader2 className="w-3 h-3 animate-spin" />}
              Create
            </button>
            <button
              onClick={() => { setCreating(false); setNewName(""); }}
              className="flex-1 text-xs text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:text-white py-1.5 rounded-md hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
