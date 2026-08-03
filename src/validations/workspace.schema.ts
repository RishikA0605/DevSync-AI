import * as z from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, { message: "Workspace name must be at least 2 characters." }),
});

export type CreateWorkspaceValues = z.infer<typeof createWorkspaceSchema>;
