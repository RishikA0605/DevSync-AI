import { z } from "zod";

export const sendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(4000, "Message too long"),
  channelId: z.string().cuid(),
});

export const createChannelSchema = z.object({
  name: z
    .string()
    .min(2, "Channel name must be at least 2 characters")
    .max(50, "Channel name too long")
    .regex(/^[a-z0-9-_]+$/, "Channel name can only contain lowercase letters, numbers, hyphens, and underscores"),
  type: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
  workspaceId: z.string().cuid(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateChannelInput = z.infer<typeof createChannelSchema>;
