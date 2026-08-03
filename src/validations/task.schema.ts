import * as z from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters."),
  description: z.string().optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(2, "Task title must be at least 2 characters."),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
  dueDate: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
});

export type CreateProjectValues = z.infer<typeof createProjectSchema>;
export type CreateTaskValues = z.infer<typeof createTaskSchema>;
export type UpdateTaskValues = z.infer<typeof updateTaskSchema>;
