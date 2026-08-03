"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { TaskCardData } from "./task-card";
import { updateTask, addTaskComment, deleteTask } from "@/features/tasks/actions/task.actions";
import { Calendar, MessageSquare, Trash2, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const PRIORITY_STYLES: Record<string, string> = {
  LOW: "bg-zinc-700 text-zinc-300 border-zinc-600",
  MEDIUM: "bg-blue-950 text-blue-300 border-blue-800",
  HIGH: "bg-amber-950 text-amber-300 border-amber-800",
  URGENT: "bg-red-950 text-red-300 border-red-800",
};

const STATUS_OPTIONS = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "DONE", label: "Done" },
];

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

interface Member { id: string; name: string | null; image: string | null }
interface Comment { id: string; content: string; createdAt?: Date; author: { id: string; name: string | null; image: string | null } }

interface Props {
  task: TaskCardData & { comments: (Comment | { id: string })[] };
  members: Member[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (task: TaskCardData) => void;
  onDelete: (taskId: string) => void;
}

export function TaskDetailSheet({ task, members, isOpen, onClose, onUpdate, onDelete }: Props) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);
  const [comments, setComments] = useState<Comment[]>(
    (task.comments as Comment[]).filter(c => "content" in c)
  );

  async function handleFieldUpdate(field: string, value: string | null) {
    setSaving(true);
    try {
      const updated = await updateTask(task.id, { [field]: value });
      onUpdate({ ...task, ...updated } as TaskCardData);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteTask(task.id);
      onDelete(task.id);
    } finally {
      setDeleting(false);
    }
  }

  async function handleAddComment() {
    if (!newComment.trim()) return;
    setAddingComment(true);
    try {
      const comment = await addTaskComment(task.id, newComment.trim());
      setComments(prev => [...prev, comment as Comment]);
      setNewComment("");
    } finally {
      setAddingComment(false);
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg bg-zinc-950 border-l border-zinc-800 text-zinc-100 overflow-y-auto p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-6 border-b border-zinc-800/60">
            <div className="flex items-start justify-between gap-3">
              <SheetTitle className="text-white text-left text-base font-semibold leading-snug flex-1">
                {task.title}
              </SheetTitle>
              <div className="flex items-center gap-1">
                {saving && <Loader2 size={14} className="text-zinc-500 animate-spin" />}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-950/30"
                >
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </Button>
              </div>
            </div>
            <Badge className={cn("w-fit text-xs border", PRIORITY_STYLES[task.priority])}>
              {task.priority}
            </Badge>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-500 font-medium">Status</label>
              <Select defaultValue={task.status} onValueChange={v => handleFieldUpdate("status", v)}>
                <SelectTrigger className="bg-zinc-800/60 border-zinc-700 text-zinc-100 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s.value} value={s.value} className="text-zinc-200">{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-500 font-medium">Priority</label>
              <Select defaultValue={task.priority} onValueChange={v => handleFieldUpdate("priority", v)}>
                <SelectTrigger className="bg-zinc-800/60 border-zinc-700 text-zinc-100 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {PRIORITY_OPTIONS.map(p => (
                    <SelectItem key={p.value} value={p.value} className="text-zinc-200">{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assignee */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-500 font-medium">Assignee</label>
              <Select defaultValue={task.assigneeId || ""} onValueChange={v => handleFieldUpdate("assigneeId", v || null)}>
                <SelectTrigger className="bg-zinc-800/60 border-zinc-700 text-zinc-100 h-9">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {members.map(m => (
                    <SelectItem key={m.id} value={m.id} className="text-zinc-200">{m.name || "Unknown"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
                <Calendar size={12} />Due Date
              </label>
              <Input
                type="date"
                defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""}
                onBlur={e => handleFieldUpdate("dueDate", e.target.value || null)}
                className="bg-zinc-800/60 border-zinc-700 text-zinc-100 h-9"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-500 font-medium">Description</label>
              <Textarea
                defaultValue={task.description || ""}
                onBlur={e => handleFieldUpdate("description", e.target.value)}
                placeholder="Add a description..."
                className="bg-zinc-800/60 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 resize-none min-h-[80px]"
                rows={3}
              />
            </div>

            {/* Comments */}
            <div className="space-y-3">
              <label className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
                <MessageSquare size={12} />Comments ({comments.length})
              </label>
              <div className="space-y-3">
                {comments.map(c => (
                  <div key={c.id} className="flex gap-2.5">
                    <div className="h-6 w-6 rounded-full bg-violet-800 flex items-center justify-center text-[10px] font-semibold text-violet-200 shrink-0">
                      {c.author?.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 bg-zinc-800/60 rounded-lg px-3 py-2">
                      <p className="text-xs font-medium text-zinc-300">{c.author?.name}</p>
                      <p className="text-sm text-zinc-300 mt-0.5">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Add comment */}
              <div className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="bg-zinc-800/60 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 flex-1"
                  onKeyDown={e => e.key === "Enter" && !addingComment && handleAddComment()}
                />
                <Button
                  size="icon"
                  onClick={handleAddComment}
                  disabled={addingComment || !newComment.trim()}
                  className="bg-violet-600 hover:bg-violet-500 text-white shrink-0"
                >
                  {addingComment ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
