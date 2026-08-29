"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageSquare, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export type TaskCardData = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  description: string | null;
  assigneeId: string | null;
  assignee: { id: string; name: string | null; image: string | null } | null;
  comments: { id: string }[];
};

const PRIORITY_STYLES: Record<string, { badge: string; dot: string }> = {
  LOW:    { badge: "bg-zinc-700 text-foreground dark:text-zinc-300 border-zinc-600", dot: "bg-zinc-400" },
  MEDIUM: { badge: "bg-blue-950 text-blue-300 border-blue-800", dot: "bg-blue-400" },
  HIGH:   { badge: "bg-amber-950 text-amber-300 border-amber-800", dot: "bg-amber-400" },
  URGENT: { badge: "bg-red-950 text-red-300 border-red-800", dot: "bg-red-400" },
};

interface Props {
  task: TaskCardData;
  onClick: (task: TaskCardData) => void;
}

export function TaskCard({ task, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });

  const style = { transform: CSS.Translate.toString(transform) };
  const priorityStyle = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.MEDIUM;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-xl border bg-card dark:bg-zinc-900/80 border-border dark:border-zinc-800 p-3.5 cursor-pointer hover:border-zinc-600 transition-all duration-150 space-y-3",
        isDragging && "opacity-40 scale-95 border-violet-500/50 shadow-lg shadow-violet-500/10"
      )}
      onClick={() => onClick(task)}
    >
      {/* Drag Handle + Priority */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            {...attributes}
            {...listeners}
            onClick={e => e.stopPropagation()}
            className="text-zinc-600 hover:text-muted-foreground dark:text-zinc-400 cursor-grab active:cursor-grabbing shrink-0 -ml-1"
          >
            <GripVertical size={15} />
          </div>
          <p className="text-sm font-medium text-foreground dark:text-zinc-100 leading-snug line-clamp-2">{task.title}</p>
        </div>
        <Badge className={cn("text-[10px] px-1.5 py-0.5 border shrink-0 font-medium", priorityStyle.badge)}>
          {task.priority}
        </Badge>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Due date */}
          {task.dueDate && (
            <div className={cn("flex items-center gap-1 text-[11px]", isOverdue ? "text-red-400" : "text-muted-foreground dark:text-zinc-500")}>
              <Calendar size={11} />
              <span>{new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            </div>
          )}
          {/* Comments */}
          {task.comments.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground dark:text-zinc-500">
              <MessageSquare size={11} />
              <span>{task.comments.length}</span>
            </div>
          )}
        </div>
        {/* Assignee */}
        {task.assignee && (
          <div
            className="h-6 w-6 rounded-full bg-violet-800 flex items-center justify-center text-[10px] font-semibold text-violet-200 overflow-hidden border border-zinc-700"
            title={task.assignee.name || ""}
          >
            {task.assignee.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={task.assignee.image} alt={task.assignee.name || ""} className="h-full w-full object-cover" />
            ) : (
              task.assignee.name?.charAt(0).toUpperCase()
            )}
          </div>
        )}
      </div>
    </div>
  );
}
