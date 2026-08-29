"use client";

import { useRef, useState, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  channelName: string;
  onSend: (content: string) => void;
  onTyping: () => void;
  onStopTyping: () => void;
}

export function ChatInput({ channelName, onSend, onTyping, onStopTyping }: Props) {
  const [value, setValue] = useState("");
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTyping = useRef(false);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);

    // Typing indicator logic
    if (!isTyping.current) {
      isTyping.current = true;
      onTyping();
    }

    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      isTyping.current = false;
      onStopTyping();
    }, 2000);
  };

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
    if (typingTimer.current) clearTimeout(typingTimer.current);
    isTyping.current = false;
    onStopTyping();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 pb-4 pt-2 shrink-0">
      <div className="flex items-end gap-2 bg-muted dark:bg-zinc-800 border border-white/10 rounded-xl p-2 focus-within:border-violet-500 transition-colors">
        <textarea
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={`Message #${channelName}`}
          className="flex-1 bg-transparent text-sm text-foreground dark:text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none max-h-32 py-1.5 px-2 leading-relaxed"
          style={{ height: "auto" }}
          onInput={e => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = `${target.scrollHeight}px`;
          }}
        />
        <button
          onClick={handleSend}
          disabled={!value.trim()}
          className={cn(
            "p-2 rounded-lg transition-all shrink-0",
            value.trim()
              ? "bg-violet-600 hover:bg-violet-500 text-foreground dark:text-white"
              : "text-zinc-600 cursor-not-allowed"
          )}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[10px] text-zinc-600 mt-1.5 px-2">
        Press <kbd className="bg-zinc-700 px-1 rounded text-muted-foreground dark:text-zinc-400">Enter</kbd> to send,{" "}
        <kbd className="bg-zinc-700 px-1 rounded text-muted-foreground dark:text-zinc-400">Shift+Enter</kbd> for new line
      </p>
    </div>
  );
}
