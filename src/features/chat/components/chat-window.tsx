"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Hash, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatSocket } from "@/features/chat/hooks/use-chat-socket";
import { ChatMessagePayload, TypingPayload } from "@/features/chat/types/socket-events";
import { markChannelAsRead } from "@/features/chat/actions/chat.actions";
import { ChatInput } from "./chat-input";

interface Message {
  id: string;
  content: string;
  channelId: string;
  senderId: string;
  senderName: string | null;
  senderImage: string | null;
  createdAt: string;
  isEdited: boolean;
}

interface Props {
  channelId: string;
  channelName: string;
  initialMessages: Message[];
}

export function ChatWindow({ channelId, channelName, initialMessages }: Props) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark as read when entering the channel
  useEffect(() => {
    markChannelAsRead(channelId);
  }, [channelId]);

  const onMessage = useCallback((msg: ChatMessagePayload) => {
    setMessages(prev => {
      // Avoid duplicates
      if (prev.find(m => m.id === msg.id)) return prev;
      return [...prev, { ...msg, senderName: msg.senderName, senderImage: msg.senderImage }];
    });
    markChannelAsRead(channelId);
  }, [channelId]);

  const onTyping = useCallback((payload: TypingPayload) => {
    if (payload.userId === session?.user?.id) return;
    setTypingUsers(prev => new Map(prev).set(payload.userId, payload.userName));

    // Auto-clear typing indicator after 3s
    const existing = typingTimers.current.get(payload.userId);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      setTypingUsers(prev => {
        const next = new Map(prev);
        next.delete(payload.userId);
        return next;
      });
    }, 3000);
    typingTimers.current.set(payload.userId, timer);
  }, [session?.user?.id]);

  const onStopTyping = useCallback((payload: TypingPayload) => {
    setTypingUsers(prev => {
      const next = new Map(prev);
      next.delete(payload.userId);
      return next;
    });
  }, []);

  const { isConnected, sendMessage, sendTyping, sendStopTyping } = useChatSocket({
    channelId,
    onMessage,
    onTyping,
    onStopTyping,
    onOnlineUsers: ({ userIds }) => setOnlineUserIds(userIds),
  });

  const typingList = Array.from(typingUsers.values());

  return (
    <div className="flex flex-col h-full bg-background dark:bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <Hash className="w-5 h-5 text-muted-foreground dark:text-zinc-400" />
          <h2 className="text-foreground dark:text-white font-semibold">{channelName}</h2>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <Wifi className="w-3 h-3" />
              Live
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-muted-foreground dark:text-zinc-500">
              <WifiOff className="w-3 h-3" />
              Reconnecting...
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground dark:text-zinc-500">
            <Hash className="w-10 h-10 opacity-20" />
            <p className="text-sm">No messages yet. Say hello!</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isOwn = msg.senderId === session?.user?.id;
          const showAvatar = i === 0 || messages[i - 1].senderId !== msg.senderId;

          return (
            <div
              key={msg.id}
              className={cn(
                "flex items-start gap-3 group",
                isOwn && "flex-row-reverse"
              )}
            >
              {showAvatar ? (
                <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-foreground dark:text-white shrink-0">
                  {(msg.senderName || "?")[0].toUpperCase()}
                </div>
              ) : (
                <div className="w-8 shrink-0" />
              )}
              <div className={cn("max-w-[70%] space-y-1", isOwn && "items-end flex flex-col")}>
                {showAvatar && (
                  <div className={cn("flex items-baseline gap-2", isOwn && "flex-row-reverse")}>
                    <span className="text-xs font-semibold text-foreground dark:text-zinc-300">
                      {isOwn ? "You" : msg.senderName}
                    </span>
                    <span className="text-[10px] text-zinc-600">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )}
                <div
                  className={cn(
                    "px-4 py-2 rounded-2xl text-sm leading-relaxed",
                    isOwn
                      ? "bg-violet-600 text-foreground dark:text-white rounded-tr-sm"
                      : "bg-muted dark:bg-zinc-800 text-foreground dark:text-zinc-100 rounded-tl-sm"
                  )}
                >
                  {msg.content}
                  {msg.isEdited && (
                    <span className="text-[10px] opacity-50 ml-1">(edited)</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {typingList.length > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground dark:text-zinc-500 text-xs pl-11">
            <div className="flex gap-0.5 items-center">
              <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
            <span>
              {typingList.length === 1
                ? `${typingList[0]} is typing...`
                : `${typingList.join(", ")} are typing...`}
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput
        channelName={channelName}
        onSend={sendMessage}
        onTyping={sendTyping}
        onStopTyping={sendStopTyping}
      />
    </div>
  );
}
