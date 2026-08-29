"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Props {
  conversationId: string | null;
  workspaceId: string;
  initialMessages?: Message[];
  workspaceName: string;
  projectCount: number;
  taskCount: number;
  onFirstMessage?: (title: string) => void;
}

export function ChatWindow({
  conversationId,
  workspaceId,
  initialMessages = [],
  workspaceName,
  projectCount,
  taskCount,
  onFirstMessage,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Reset messages when conversation changes
  useEffect(() => {
    setMessages(initialMessages);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    const isFirstMessage = messages.length === 0;
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    // Notify parent for title update on first message
    if (isFirstMessage && onFirstMessage) {
      onFirstMessage(userMessage.content.slice(0, 50));
    }

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          workspaceId,
          conversationId,
        }),
      });

      if (!res.ok || !res.body) {
        const errBody = await res.text();
        console.error("[API /ai/chat ERROR]", res.status, errBody);
        throw new Error(`API ${res.status}: ${errBody}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      };

      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const text = JSON.parse(line.slice(2));
              assistantContent += text;
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMessage.id ? { ...m, content: assistantContent } : m
                )
              );
            } catch {}
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      let errorMsg = "Sorry, something went wrong. Please try again.";
      // Try to get actual error from response
      try {
        if (error instanceof Error && error.message) {
          errorMsg = `Error: ${error.message}`;
        }
      } catch {}
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: errorMsg,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex flex-col h-full bg-background dark:bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-border dark:border-zinc-800/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
            <Sparkles size={16} className="text-violet-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground dark:text-white">DevSync AI</h2>
            <p className="text-xs text-muted-foreground dark:text-zinc-500">{workspaceName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground dark:text-zinc-500 bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 px-2.5 py-1 rounded-full">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {projectCount} projects · {taskCount} tasks
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center mb-6 shadow-xl shadow-violet-500/20">
              <Bot size={36} className="text-foreground dark:text-white" />
            </div>
            <h3 className="text-xl font-bold text-foreground dark:text-white mb-2">What can I help with?</h3>
            <p className="text-sm text-muted-foreground dark:text-zinc-400 max-w-sm">
              I have full context of your workspace — projects, tasks, and team members. Ask me anything!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 w-full max-w-md">
              {[
                "What tasks are overdue?",
                "Summarize project status",
                "Help me write a bug report",
                "Suggest task priorities",
              ].map(prompt => (
                <button
                  key={prompt}
                  onClick={() => { setInput(prompt); }}
                  className="text-left text-xs text-muted-foreground dark:text-zinc-400 bg-card dark:bg-zinc-900/50 border border-border dark:border-zinc-800 hover:border-violet-500/50 hover:text-foreground dark:text-zinc-200 rounded-xl px-4 py-3 transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-3",
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
                  message.role === "user"
                    ? "bg-violet-600"
                    : "bg-muted dark:bg-zinc-800 border border-zinc-700"
                )}
              >
                {message.role === "user"
                  ? <User size={14} className="text-foreground dark:text-white" />
                  : <Bot size={14} className="text-violet-400" />
                }
              </div>

              {/* Bubble */}
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  message.role === "user"
                    ? "bg-violet-600 text-foreground dark:text-white rounded-tr-sm"
                    : "bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 text-foreground dark:text-zinc-200 rounded-tl-sm"
                )}
              >
                {message.content ? (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                ) : (
                  <div className="flex items-center gap-1.5 py-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:-0.3s]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:-0.15s]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce" />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-6 pb-6 pt-4 border-t border-border dark:border-border dark:border-zinc-800/60">
        <form onSubmit={handleSubmit} className="flex gap-3 items-end">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your workspace..."
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none bg-card dark:bg-zinc-900 border-zinc-700 text-foreground dark:text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-violet-500/50 min-h-[44px] max-h-[200px] rounded-xl"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-violet-600 hover:bg-violet-500 text-foreground dark:text-white h-11 w-11 p-0 rounded-xl shrink-0"
          >
            {isLoading
              ? <Loader2 size={16} className="animate-spin" />
              : <Send size={16} />
            }
          </Button>
        </form>
        <p className="text-[10px] text-zinc-700 text-center mt-2">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
