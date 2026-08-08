"use client";

import { CldUploadWidget, CloudinaryUploadWidgetResults } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";
import { saveFileRecord } from "@/features/files/actions/file.actions";
import { useState } from "react";

interface FileUploadButtonProps {
  workspaceId: string;
  taskId?: string;
  messageId?: string;
  onUploadSuccess?: () => void;
  className?: string;
}

export function FileUploadButton({
  workspaceId,
  taskId,
  messageId,
  onUploadSuccess,
  className
}: FileUploadButtonProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleUploadSuccess = async (result: CloudinaryUploadWidgetResults) => {
    if (result.event !== "success" || !result.info || typeof result.info === "string") return;

    try {
      setIsSaving(true);
      
      const { 
        secure_url, 
        public_id, 
        bytes, 
        format, 
        original_filename,
        resource_type
      } = result.info;

      // Construct mime type (Cloudinary doesn't always return standard mime types in the widget)
      let mimeType = `${resource_type}/${format}`;
      if (format === 'pdf') mimeType = 'application/pdf';
      if (['zip', 'rar'].includes(format || '')) mimeType = 'application/zip';

      await saveFileRecord({
        name: original_filename || "Untitled File",
        url: secure_url,
        publicId: public_id,
        type: mimeType,
        size: bytes,
        workspaceId,
        taskId,
        messageId,
      });

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error("Failed to save file record:", error);
      alert("File uploaded but failed to save record to database.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <CldUploadWidget 
      uploadPreset="DevSync_Upload"
      options={{
        maxFileSize: 10485760, // 10MB
        sources: ['local', 'url', 'camera', 'google_drive'],
      }}
      onSuccess={handleUploadSuccess}
    >
      {({ open }) => {
        return (
          <Button 
            onClick={() => open()} 
            disabled={isSaving}
            className={`bg-violet-600 hover:bg-violet-700 text-white ${className || ""}`}
          >
            <UploadCloud className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Upload File"}
          </Button>
        );
      }}
    </CldUploadWidget>
  );
}
