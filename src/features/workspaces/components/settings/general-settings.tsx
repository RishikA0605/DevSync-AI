"use client";

import { useState } from "react";
import { Workspace, WorkspaceMember } from "@prisma/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { updateWorkspaceSchema } from "@/validations/workspace.schema";
import { updateWorkspaceName, updateWorkspaceSlug, updateWorkspaceLogo } from "@/features/workspaces/actions/workspace-settings.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CldUploadWidget, CloudinaryUploadWidgetResults } from "next-cloudinary";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageIcon, Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function GeneralSettings({ workspace, currentMember }: { workspace: Workspace, currentMember: WorkspaceMember }) {
  const isAdmin = currentMember.role === "OWNER" || currentMember.role === "ADMIN";
  const isOwner = currentMember.role === "OWNER";

  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [slugWarningOpen, setSlugWarningOpen] = useState(false);
  const [pendingSlug, setPendingSlug] = useState("");

  const form = useForm<z.infer<typeof updateWorkspaceSchema>>({
    resolver: zodResolver(updateWorkspaceSchema),
    defaultValues: {
      name: workspace.name,
      slug: workspace.slug,
    },
  });

  async function onSubmit(values: z.infer<typeof updateWorkspaceSchema>) {
    try {
      setIsUpdating(true);
      
      // Update Name if changed
      if (values.name !== workspace.name) {
        await updateWorkspaceName(workspace.id, values.name);
      }

      // Handle Slug change with warning
      if (values.slug !== workspace.slug && isOwner) {
        setPendingSlug(values.slug);
        setSlugWarningOpen(true);
      }
    } catch (error: any) {
      alert(error.message || "Failed to update workspace");
    } finally {
      setIsUpdating(false);
    }
  }

  async function confirmSlugChange() {
    try {
      setIsUpdating(true);
      const res = await updateWorkspaceSlug(workspace.id, pendingSlug);
      setSlugWarningOpen(false);
      // Let the redirect happen (since layout re-renders with new URL)
      if (res.success && res.slug !== workspace.slug) {
        window.location.href = `/workspace/${res.slug}/settings`;
      }
    } catch (error: any) {
      alert(error.message || "Failed to update slug");
    } finally {
      setIsUpdating(false);
    }
  }

  const handleUploadSuccess = async (result: CloudinaryUploadWidgetResults) => {
    if (result.info && typeof result.info !== "string") {
      try {
        setIsUploading(true);
        await updateWorkspaceLogo(workspace.id, result.info.secure_url, result.info.public_id);
      } catch (err: any) {
        alert(err.message || "Failed to save logo");
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border dark:border-border dark:border-zinc-800/60 bg-card dark:bg-zinc-900/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl text-foreground dark:text-white">General Settings</CardTitle>
          <CardDescription className="text-muted-foreground dark:text-zinc-400">
            Update your workspace identity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Logo Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <Avatar className="h-20 w-20 rounded-xl border border-border dark:border-zinc-800 bg-muted dark:bg-zinc-800/50 shadow-md">
              {workspace.logo ? (
                <AvatarImage src={workspace.logo} alt={workspace.name} className="object-cover" />
              ) : (
                <AvatarFallback className="rounded-xl text-2xl font-semibold bg-gradient-to-br from-violet-500/20 to-blue-500/20 text-violet-400">
                  {workspace.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground dark:text-white">Workspace Logo</h3>
              <p className="text-xs text-muted-foreground dark:text-zinc-500 max-w-sm">
                Recommended size is 256x256px. Max 2MB.
              </p>
              {isAdmin && (
                <div className="flex gap-2 pt-1">
                  <CldUploadWidget
                    uploadPreset="DevSync_Upload"
                    options={{ maxFiles: 1, maxFileSize: 2000000, clientAllowedFormats: ["png", "jpeg", "jpg", "webp"] }}
                    onSuccess={handleUploadSuccess}
                  >
                    {({ open }) => (
                      <Button 
                        type="button" 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => open()}
                        disabled={isUploading}
                        className="h-8 bg-muted dark:bg-zinc-800 text-foreground dark:text-zinc-300 hover:bg-zinc-700 hover:text-foreground dark:text-white"
                      >
                        {isUploading ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <ImageIcon className="h-3 w-3 mr-2" />}
                        {workspace.logo ? "Change Logo" : "Upload Logo"}
                      </Button>
                    )}
                  </CldUploadWidget>
                  {workspace.logo && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => updateWorkspaceLogo(workspace.id, null, null)}
                      className="h-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="w-full h-px bg-muted dark:bg-muted dark:bg-zinc-800/60 my-6" />

          {/* Form Section */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground dark:text-zinc-300">Workspace Name</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        disabled={!isAdmin || isUpdating} 
                        className="bg-background dark:bg-zinc-950 border-border dark:border-zinc-800 text-foreground dark:text-white focus-visible:ring-violet-500" 
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground dark:text-zinc-300">Workspace Slug URL</FormLabel>
                    <div className="flex rounded-md shadow-sm">
                      <span className="inline-flex items-center rounded-l-md border border-r-0 border-border dark:border-zinc-800 bg-card dark:bg-zinc-900/50 px-3 text-sm text-muted-foreground dark:text-zinc-500">
                        devsync.app/workspace/
                      </span>
                      <FormControl>
                        <Input 
                          {...field} 
                          disabled={!isOwner || isUpdating} 
                          className="rounded-l-none bg-background dark:bg-zinc-950 border-border dark:border-zinc-800 text-foreground dark:text-white focus-visible:ring-violet-500" 
                        />
                      </FormControl>
                    </div>
                    {!isOwner && (
                      <p className="text-[11px] text-muted-foreground dark:text-zinc-500 mt-1">Only the workspace owner can change the slug.</p>
                    )}
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              {isAdmin && (
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    disabled={isUpdating || (!form.formState.isDirty)}
                    className="bg-violet-600 hover:bg-violet-700 text-foreground dark:text-white"
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Save Changes
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Slug Change Warning Modal */}
      <Dialog open={slugWarningOpen} onOpenChange={setSlugWarningOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background dark:bg-zinc-950 border-red-900/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Change Workspace URL?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground dark:text-zinc-400 pt-3">
              You are about to change the workspace slug from <strong>{workspace.slug}</strong> to <strong>{pendingSlug}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm text-foreground dark:text-zinc-300">
            <p>This action has significant consequences:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground dark:text-zinc-400">
              <li>All existing bookmarks will break.</li>
              <li>Existing invite links might fail if they rely on the URL.</li>
              <li>Your team will need to use the new URL immediately.</li>
            </ul>
          </div>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSlugWarningOpen(false)} disabled={isUpdating} className="border-border dark:border-zinc-800 text-foreground dark:text-zinc-300 hover:bg-muted dark:bg-zinc-800">
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmSlugChange} disabled={isUpdating} className="bg-red-600 hover:bg-red-700">
              {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
