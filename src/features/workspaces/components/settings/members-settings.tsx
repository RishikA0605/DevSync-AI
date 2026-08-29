"use client";

import { useState } from "react";
import { Workspace, WorkspaceMember, WorkspaceRole } from "@prisma/client";
import { updateMemberRole, removeMember, transferOwnership } from "@/features/workspaces/actions/workspace-member.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldAlert, UserX, Crown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { usePermissions } from "@/features/permissions/hooks/use-permissions";
import { PermissionGuard } from "@/features/permissions/components/permission-guard";

type MemberWithUser = WorkspaceMember & { user: { id: string; name: string | null; email: string | null; image: string | null } };

export function MembersSettings({ workspace, currentMember, members }: { workspace: Workspace, currentMember: WorkspaceMember, members: MemberWithUser[] }) {
  const { hasPermission } = usePermissions(currentMember.role);

  const [isLoading, setIsLoading] = useState<string | null>(null);

  // Remove member modal
  const [removeMemberModal, setRemoveMemberModal] = useState<{ open: boolean; memberId: string; memberName: string }>({
    open: false, memberId: "", memberName: ""
  });
  const [isRemoving, setIsRemoving] = useState(false);

  // Transfer Ownership Modal State
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState<string>("");
  const [isTransferring, setIsTransferring] = useState(false);

  const handleRoleChange = async (memberUserId: string, newRole: WorkspaceRole) => {
    try {
      setIsLoading(`role-${memberUserId}`);
      await updateMemberRole(workspace.id, memberUserId, newRole);
    } catch (error: any) {
      alert(error.message || "Failed to update role");
    } finally {
      setIsLoading(null);
    }
  };

  const confirmRemoveMember = async () => {
    try {
      setIsRemoving(true);
      await removeMember(workspace.id, removeMemberModal.memberId);
      setRemoveMemberModal({ open: false, memberId: "", memberName: "" });
    } catch (error: any) {
      alert(error.message || "Failed to remove member");
    } finally {
      setIsRemoving(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!selectedNewOwner) return;
    try {
      setIsTransferring(true);
      await transferOwnership(workspace.id, selectedNewOwner);
      setTransferModalOpen(false);
    } catch (error: any) {
      alert(error.message || "Failed to transfer ownership");
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border dark:border-border dark:border-zinc-800/60 bg-card dark:bg-zinc-900/40 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-xl text-foreground dark:text-white">Workspace Members</CardTitle>
            <CardDescription className="text-muted-foreground dark:text-zinc-400 mt-1">
              Manage who has access to this workspace and their roles.
            </CardDescription>
          </div>
          <PermissionGuard role={currentMember.role} permission="workspace:transfer">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTransferModalOpen(true)}
              className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
            >
              <Crown className="h-4 w-4 mr-2" />
              Transfer Ownership
            </Button>
          </PermissionGuard>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border dark:border-border dark:border-zinc-800/60 overflow-hidden">
            <div className="divide-y divide-zinc-800/60">
              {members.map((m) => {
                const isYou = m.userId === currentMember.userId;
                const isTargetOwner = m.role === "OWNER";
                const isRoleUpdating = isLoading === `role-${m.userId}`;
                const isRemovingThis = isLoading === `remove-${m.userId}`;

                return (
                  <div key={m.id} className="flex items-center justify-between p-4 bg-background dark:bg-zinc-950/50 hover:bg-card dark:bg-zinc-900/50 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <Avatar className="h-10 w-10 border border-border dark:border-zinc-800">
                        {m.user.image ? (
                          <AvatarImage src={m.user.image} alt={m.user.name || ""} />
                        ) : (
                          <AvatarFallback className="bg-muted dark:bg-zinc-800 text-foreground dark:text-zinc-300">
                            {m.user.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground dark:text-white truncate">{m.user.name}</p>
                          {isYou && <Badge variant="outline" className="text-[10px] h-5 border-violet-500/30 text-violet-400 bg-violet-500/10">You</Badge>}
                          {isTargetOwner && <Badge variant="outline" className="text-[10px] h-5 border-amber-500/30 text-amber-400 bg-amber-500/10">Owner</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground dark:text-zinc-500 truncate">{m.user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      {hasPermission("member:change_role") && !isYou && !isTargetOwner ? (
                        <div className="flex items-center gap-2">
                          {isRoleUpdating && <Loader2 className="h-4 w-4 text-muted-foreground dark:text-zinc-500 animate-spin" />}
                          <Select
                            disabled={isRoleUpdating || isRemovingThis}
                            value={m.role}
                            onValueChange={(val) => handleRoleChange(m.userId, val as WorkspaceRole)}
                          >
                            <SelectTrigger className="w-[110px] h-8 bg-card dark:bg-zinc-900 border-border dark:border-zinc-800 text-xs text-foreground dark:text-zinc-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-background dark:bg-zinc-950 border-border dark:border-zinc-800 text-foreground dark:text-zinc-300">
                              <SelectItem value="ADMIN">Admin</SelectItem>
                              <SelectItem value="MEMBER">Member</SelectItem>
                              <SelectItem value="GUEST">Guest</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="w-[110px] text-right">
                          <span className="text-xs font-medium text-muted-foreground dark:text-zinc-500 capitalize">{m.role.toLowerCase()}</span>
                        </div>
                      )}

                      {hasPermission("member:manage") && !isYou && !isTargetOwner ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground dark:text-zinc-500 hover:text-red-400 hover:bg-red-400/10"
                          disabled={isRoleUpdating || isRemovingThis}
                          onClick={() => setRemoveMemberModal({ open: true, memberId: m.userId, memberName: m.user.name || "this member" })}
                          title="Remove member"
                        >
                          {isRemovingThis ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
                        </Button>
                      ) : (
                        <div className="w-8" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Remove Member Confirm Modal */}
      <ConfirmModal
        open={removeMemberModal.open}
        onOpenChange={(open) => setRemoveMemberModal(prev => ({ ...prev, open }))}
        title="Remove Member"
        description={`Are you sure you want to remove ${removeMemberModal.memberName} from this workspace? They will lose access to all workspace resources.`}
        confirmLabel="Remove"
        variant="danger"
        isLoading={isRemoving}
        onConfirm={confirmRemoveMember}
      />

      {/* Transfer Ownership Modal */}
      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background dark:bg-zinc-950 border-amber-900/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-500">
              <ShieldAlert className="h-5 w-5" />
              Transfer Ownership
            </DialogTitle>
            <DialogDescription className="text-muted-foreground dark:text-zinc-400 pt-3">
              Transferring ownership will make you an Admin, and the selected member the new Owner. You cannot undo this action yourself.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedNewOwner} onValueChange={setSelectedNewOwner} disabled={isTransferring}>
              <SelectTrigger className="w-full bg-card dark:bg-zinc-900 border-border dark:border-zinc-800 text-foreground dark:text-zinc-200">
                <SelectValue placeholder="Select a new owner..." />
              </SelectTrigger>
              <SelectContent className="bg-background dark:bg-zinc-950 border-border dark:border-zinc-800 text-foreground dark:text-zinc-200 max-h-[200px]">
                {members.filter(m => m.userId !== currentMember.userId).map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5 rounded-sm">
                        {m.user.image ? <AvatarImage src={m.user.image} /> : <AvatarFallback className="text-[10px] bg-muted dark:bg-zinc-800">{m.user.name?.charAt(0)}</AvatarFallback>}
                      </Avatar>
                      {m.user.name} <span className="text-muted-foreground dark:text-zinc-500 ml-1">({m.user.email})</span>
                    </div>
                  </SelectItem>
                ))}
                {members.length === 1 && (
                  <div className="p-2 text-sm text-muted-foreground dark:text-zinc-500 text-center">No other members available.</div>
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setTransferModalOpen(false)} disabled={isTransferring} className="border-border dark:border-zinc-800 text-foreground dark:text-zinc-300 hover:bg-muted dark:bg-zinc-800">
              Cancel
            </Button>
            <Button
              onClick={handleTransferOwnership}
              disabled={isTransferring || !selectedNewOwner}
              className="bg-amber-600 hover:bg-amber-700 text-foreground dark:text-white"
            >
              {isTransferring && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
