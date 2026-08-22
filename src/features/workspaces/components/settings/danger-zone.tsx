"use client";

import { useState } from "react";
import { Workspace, WorkspaceMember } from "@prisma/client";
import { deleteWorkspace } from "@/features/workspaces/actions/workspace-settings.actions";
import { leaveWorkspace } from "@/features/workspaces/actions/workspace-member.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, AlertTriangle, LogOut, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { deleteAccount } from "@/features/auth/actions/auth.actions";
import { signOut } from "next-auth/react";
import { PermissionGuard } from "@/features/permissions/components/permission-guard";

export function DangerZone({
  workspace,
  currentMember,
  workspaceStats
}: {
  workspace: Workspace,
  currentMember: WorkspaceMember,
  workspaceStats: { memberCount: number; projectCount: number; taskCount: number; fileCount: number }
}) {
  const isOwner = currentMember.role === "OWNER";

  // Leave workspace modal
  const [leaveModal, setLeaveModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Delete workspace modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Delete account modal
  const [accountDeleteModal, setAccountDeleteModal] = useState(false);
  const [accountDeleteLoading, setAccountDeleteLoading] = useState(false);

  const confirmLeaveWorkspace = async () => {
    try {
      setIsLeaving(true);
      await leaveWorkspace(workspace.id);
      window.location.href = "/dashboard";
    } catch (error: any) {
      alert(error.message || "Failed to leave workspace");
      setIsLeaving(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    try {
      setIsDeleting(true);
      await deleteWorkspace(workspace.id);
      window.location.href = "/dashboard";
    } catch (error: any) {
      alert(error.message || "Failed to delete workspace");
      setIsDeleting(false);
    }
  };

  const confirmDeleteAccount = async () => {
    try {
      setAccountDeleteLoading(true);
      await deleteAccount();
      await signOut({ callbackUrl: "/auth" });
    } catch (error) {
      console.error(error);
      alert("Failed to delete account. Please try again.");
      setAccountDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6">

        {/* Leave Workspace */}
        {!isOwner && (
          <Card className="border-orange-900/40 bg-orange-950/10 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <LogOut className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-orange-500">Leave Workspace</CardTitle>
              </div>
              <CardDescription className="text-zinc-400">
                Revoke your own access to this workspace. You will need a new invite link to rejoin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => setLeaveModal(true)}
                disabled={isLeaving}
                className="border-orange-900/50 text-orange-500 hover:bg-orange-500/10 hover:text-orange-400"
              >
                {isLeaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogOut className="h-4 w-4 mr-2" />}
                Leave Workspace
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Delete Workspace */}
        <PermissionGuard role={currentMember.role} permission="workspace:delete">
          <Card className="border-red-900/40 bg-red-950/10 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-500" />
                <CardTitle className="text-red-500">Delete Workspace</CardTitle>
              </div>
              <CardDescription className="text-zinc-400">
                Permanently delete this workspace and all of its contents. This action is not reversible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={() => setDeleteModalOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Workspace
              </Button>
            </CardContent>
          </Card>
        </PermissionGuard>

        {/* Delete Account */}
        <Card className="border-red-900/40 bg-red-950/10 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-red-500">Delete Account</CardTitle>
            </div>
            <CardDescription className="text-zinc-400">
              Permanently remove your account from the DevSync AI platform. Workspaces you own will also be deleted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setAccountDeleteModal(true)}
              disabled={accountDeleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white font-medium"
            >
              {accountDeleteLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete My Account
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Leave Workspace Confirm Modal */}
      <ConfirmModal
        open={leaveModal}
        onOpenChange={setLeaveModal}
        title="Leave Workspace"
        description={`Are you sure you want to leave "${workspace.name}"? You will lose access to all workspace resources and will need a new invite link to rejoin.`}
        confirmLabel="Leave Workspace"
        variant="warning"
        isLoading={isLeaving}
        onConfirm={confirmLeaveWorkspace}
      />

      {/* Delete Account Confirm Modal */}
      <ConfirmModal
        open={accountDeleteModal}
        onOpenChange={setAccountDeleteModal}
        title="Delete Account"
        description="Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data, including all workspaces you own."
        confirmLabel="Delete My Account"
        variant="danger"
        isLoading={accountDeleteLoading}
        onConfirm={confirmDeleteAccount}
      />

      {/* Delete Workspace Modal (custom — needs name confirmation) */}
      <Dialog open={deleteModalOpen} onOpenChange={(open) => {
        if (!open) setConfirmText("");
        setDeleteModalOpen(open);
      }}>
        <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-red-900/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Delete Workspace
            </DialogTitle>
            <DialogDescription className="text-zinc-400 pt-3">
              This action cannot be undone. This will permanently delete the <strong className="text-zinc-200">{workspace.name}</strong> workspace and all of its data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-3 text-sm text-red-200">
              <p className="font-semibold mb-2">You will permanently lose:</p>
              <ul className="list-disc pl-5 space-y-1 opacity-80">
                <li>{workspaceStats.projectCount} Projects</li>
                <li>{workspaceStats.taskCount} Tasks</li>
                <li>{workspaceStats.fileCount} Files</li>
                <li>Access for {workspaceStats.memberCount} members</li>
              </ul>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                Type <strong className="text-white">{workspace.name}</strong> to confirm.
              </label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={isDeleting}
                placeholder={workspace.name}
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
              />
            </div>
          </div>

          <DialogFooter className="mt-2 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setConfirmText("");
              }}
              disabled={isDeleting}
              className="border-zinc-800 text-zinc-300 hover:bg-white-600"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteWorkspace}
              disabled={isDeleting || confirmText !== workspace.name}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
