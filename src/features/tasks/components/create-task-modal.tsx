"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTaskSchema, CreateTaskValues } from "@/validations/task.schema";
import { createTask } from "@/features/tasks/actions/task.actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Member {
  id: string;
  name: string | null;
  image: string | null;
}

interface Props {
  projectId: string;
  members: Member[];
  isOpen: boolean;
  onClose: () => void;
  onCreated: (task: { id: string; title: string; status: string; priority: string; assigneeId: string | null; dueDate: Date | null; description: string | null }) => void;
}

const PRIORITIES = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export function CreateTaskModal({ projectId, members, isOpen, onClose, onCreated }: Props) {
  const [loading, setLoading] = useState(false);

  const form = useForm<CreateTaskValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { title: "", description: "", priority: "MEDIUM", dueDate: "", assigneeId: "" },
  });

  async function onSubmit(values: CreateTaskValues) {
    setLoading(true);
    try {
      const task = await createTask(projectId, values);
      onCreated({
        id: task.id, title: task.title, status: task.status,
        priority: task.priority, assigneeId: task.assigneeId,
        dueDate: task.dueDate, description: task.description,
      });
      form.reset();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-700 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-white">Create Task</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-300">Title</FormLabel>
                <FormControl>
                  <Input placeholder="Task title..." disabled={loading}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                    {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300">Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {PRIORITIES.map(p => (
                        <SelectItem key={p.value} value={p.value} className="text-zinc-200">{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="assigneeId" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300">Assignee</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {members.map(m => (
                        <SelectItem key={m.id} value={m.id} className="text-zinc-200">{m.name || "Unknown"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="dueDate" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-300">Due Date <span className="text-zinc-500">(optional)</span></FormLabel>
                <FormControl>
                  <Input type="date" disabled={loading}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                    {...field} />
                </FormControl>
              </FormItem>
            )} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading}
                className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800">Cancel</Button>
              <Button type="submit" disabled={loading}
                className="bg-violet-600 hover:bg-violet-500 text-white">
                {loading ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
