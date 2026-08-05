"use client";

import { useState } from "react";
import { ConversationList } from "@/features/ai/components/conversation-list";
import { ChatWindow } from "@/features/ai/components/chat-window";
import { getConversationMessages } from "@/features/ai/actions/ai.actions";

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: Date;
  _count: { messages: number };
}

interface Props {
  conversations: Conversation[];
  workspaceId: string;
  workspaceName: string;
  projectCount: number;
  taskCount: number;
}

type DBMessage = { id: string; role: string; content: string; createdAt: Date; conversationId: string };

export function AIPageClient({ conversations, workspaceId, workspaceName, projectCount, taskCount }: Props) {
  const [activeId, setActiveId] = useState<string | null>(
    conversations.length > 0 ? conversations[0].id : null
  );
  const [messages, setMessages] = useState<{ id: string; role: "user" | "assistant"; content: string }[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  async function handleSelectConversation(id: string) {
    if (!id) {
      setActiveId(null);
      setMessages([]);
      return;
    }

    setActiveId(id);
    setLoadingMessages(true);

    try {
      const dbMessages = await getConversationMessages(id) as DBMessage[];
      setMessages(dbMessages.map(m => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
      })));
    } finally {
      setLoadingMessages(false);
    }
  }

  return (
    <div className="flex h-full bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Left: Conversation List */}
      <div className="w-[220px] shrink-0 border-r border-zinc-800/60 flex flex-col">
        <ConversationList
          conversations={conversations}
          workspaceId={workspaceId}
          activeId={activeId}
          onSelect={handleSelectConversation}
        />
      </div>

      {/* Right: Chat Window */}
      <div className="flex-1 overflow-hidden">
        {loadingMessages ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-zinc-500">Loading messages...</p>
            </div>
          </div>
        ) : (
          <ChatWindow
            key={activeId}
            conversationId={activeId}
            workspaceId={workspaceId}
            initialMessages={messages}
            workspaceName={workspaceName}
            projectCount={projectCount}
            taskCount={taskCount}
          />
        )}
      </div>
    </div>
  );
}
