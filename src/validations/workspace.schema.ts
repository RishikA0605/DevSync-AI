import * as z from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, { message: "Workspace name must be at least 2 characters." }),
});

export type CreateWorkspaceValues = z.infer<typeof createWorkspaceSchema>;

export const updateWorkspaceSchema = z.object({
  name: z.string().min(2, { message: "Workspace name must be at least 2 characters." }),
  slug: z.string()
    .min(2, { message: "Slug must be at least 2 characters." })
    .regex(/^[a-z0-9-]+$/, { message: "Slug can only contain lowercase letters, numbers, and hyphens." }),
});

export type UpdateWorkspaceValues = z.infer<typeof updateWorkspaceSchema>;
