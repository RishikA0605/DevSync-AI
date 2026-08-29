"use client";

import { useDroppable } from "@dnd-kit/core";
import { TaskCard, TaskCardData } from "./task-card";
import { cn } from "@/lib/utils";

const COLUMN_META: Record<string, { label: string; color: string; dot: string }> = {
  TODO:        { label: "To Do",       color: "text-muted-foreground dark:text-zinc-400",   dot: "bg-zinc-500" },
  IN_PROGRESS: { label: "In Progress", color: "text-blue-400",   dot: "bg-blue-500" },
  IN_REVIEW:   { label: "In Review",   color: "text-amber-400",  dot: "bg-amber-500" },
  DONE:        { label: "Done",        color: "text-emerald-400",dot: "bg-emerald-500" },
};

interface Props {
  status: string;
  tasks: TaskCardData[];
  onTaskClick: (task: TaskCardData) => void;
  onAddTask?: () => void;
}

export function KanbanColumn({ status, tasks, onTaskClick, onAddTask }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = COLUMN_META[status] || { label: status, color: "text-muted-foreground dark:text-zinc-400", dot: "bg-zinc-500" };

  return (
    <div className="flex flex-col min-w-[280px] w-[280px]">
      {/* Column Header */}
      <div className="flex items-center gap-2 px-1 mb-3">
        <div className={cn("h-2 w-2 rounded-full shrink-0", meta.dot)} />
        <span className={cn("text-xs font-semibold tracking-wider uppercase", meta.color)}>
          {meta.label}
        </span>
        <span className="ml-auto text-xs text-zinc-600 bg-muted dark:bg-zinc-800 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 min-h-[400px] rounded-xl p-2 space-y-2 border border-transparent transition-colors duration-150",
          isOver ? "border-violet-500/40 bg-violet-500/5" : "bg-card dark:bg-zinc-900/30"
        )}
      >
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onClick={onTaskClick} />
        ))}

        {tasks.length === 0 && !isOver && (
          <div className="flex items-center justify-center h-20 rounded-lg border border-dashed border-border dark:border-zinc-800">
            <p className="text-xs text-zinc-600">Drop tasks here</p>
          </div>
        )}

        {onAddTask && status === "TODO" && (
          <button
            onClick={onAddTask}
            className="w-full text-left px-3 py-2 rounded-lg text-xs text-zinc-600 hover:text-foreground dark:text-zinc-300 hover:bg-muted dark:bg-zinc-800/50 transition-colors"
          >
            + Add Task
          </button>
        )}
      </div>
    </div>
  );
}
