import * as z from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/zip"
];

export const fileSchema = z.object({
  name: z.string().min(1, "File name is required"),
  url: z.string().url("Invalid file URL"),
  publicId: z.string().optional(),
  type: z.string().refine((val) => ALLOWED_MIME_TYPES.includes(val), {
    message: "File type not supported",
  }),
  size: z.number().max(MAX_FILE_SIZE, "File size must be less than 10MB"),
  workspaceId: z.string().min(1, "Workspace ID is required"),
  taskId: z.string().optional(),
  messageId: z.string().optional(),
});

export type FileSchemaValues = z.infer<typeof fileSchema>;
