"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProjectSchema, CreateProjectValues } from "@/validations/task.schema";
import { createProject } from "@/features/tasks/actions/project.actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: (project: { id: string; name: string; description: string | null }) => void;
}

export function CreateProjectModal({ workspaceId, isOpen, onClose, onCreated }: Props) {
  const [loading, setLoading] = useState(false);

  const form = useForm<CreateProjectValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: "", description: "" },
  });

  async function onSubmit(values: CreateProjectValues) {
    setLoading(true);
    try {
      const project = await createProject(workspaceId, values);
      onCreated({ id: project.id, name: project.name, description: project.description });
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
          <DialogTitle className="text-white">Create Project</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-300">Project Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Website Redesign" disabled={loading}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                    {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-300">Description <span className="text-zinc-500">(optional)</span></FormLabel>
                <FormControl>
                  <Textarea placeholder="What is this project about?" disabled={loading}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 resize-none"
                    rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading}
                className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800">
                Cancel
              </Button>
              <Button type="submit" disabled={loading}
                className="bg-violet-600 hover:bg-violet-500 text-white">
                {loading ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
