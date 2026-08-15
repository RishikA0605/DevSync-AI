"use client";

import { useState } from "react";
import { Workspace } from "@prisma/client";
import { createInvite, revokeInvite } from "@/features/workspaces/actions/workspace-invite.actions";

type WorkspaceInvite = {
  id: string;
  token: string;
  expiresAt: Date | null;
  isRevoked: boolean;
  createdAt: Date;
  workspaceId: string;
  createdById: string;
};
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Link as LinkIcon, Trash2, Plus, CheckCheck } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { formatDistanceToNow } from "date-fns";

type InviteWithCreator = WorkspaceInvite & { createdBy: { id: string; name: string | null; email: string | null; image: string | null } };

export function InviteSettings({ workspace, invites }: { workspace: Workspace, invites: InviteWithCreator[] }) {
  const [isCreating, setIsCreating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Expiry config state
  const [expiryDays, setExpiryDays] = useState<string>("7");

  // Revoke confirmation modal
  const [revokeModal, setRevokeModal] = useState<{ open: boolean; inviteId: string }>({
    open: false, inviteId: ""
  });

  const handleCreateInvite = async () => {
    try {
      setIsCreating(true);
      const days = expiryDays === "never" ? null : parseInt(expiryDays);
      await createInvite(workspace.id, days);
    } catch (error: any) {
      alert(error.message || "Failed to create invite");
    } finally {
      setIsCreating(false);
    }
  };

  const confirmRevokeInvite = async () => {
    try {
      setIsRevoking(true);
      await revokeInvite(revokeModal.inviteId, workspace.id);
      setRevokeModal({ open: false, inviteId: "" });
    } catch (error: any) {
      alert(error.message || "Failed to revoke invite");
    } finally {
      setIsRevoking(false);
    }
  };

  const copyToClipboard = (token: string, inviteId: string) => {
    const inviteLink = `${window.location.origin}/invite?token=${token}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedId(inviteId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <Card className="border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl text-white">Invite Links</CardTitle>
          <CardDescription className="text-zinc-400 mt-1">
            Manage active invite links for this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Create New Invite Section */}
          <div className="flex items-center gap-3 bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/60">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-white">Generate new link</h4>
              <p className="text-xs text-zinc-500 mt-0.5">Create a link to share with your team</p>
            </div>

            <Select value={expiryDays} onValueChange={setExpiryDays} disabled={isCreating}>
              <SelectTrigger className="w-[140px] h-9 bg-zinc-900 border-zinc-800 text-xs text-zinc-300">
                <SelectValue placeholder="Expiration" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-300">
                <SelectItem value="1">Expires in 1 day</SelectItem>
                <SelectItem value="7">Expires in 7 days</SelectItem>
                <SelectItem value="30">Expires in 30 days</SelectItem>
                <SelectItem value="never">Never expires</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleCreateInvite}
              disabled={isCreating}
              size="sm"
              className="h-9 bg-violet-600 hover:bg-violet-700 text-white gap-2"
            >
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Generate Link
            </Button>
          </div>

          <div className="w-full h-px bg-zinc-800/60" />

          {/* Active Invites List */}
          <div>
            <h4 className="text-sm font-medium text-white mb-4">Active Links ({invites.length})</h4>

            {invites.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-zinc-800/80 rounded-lg bg-zinc-950/30">
                <LinkIcon className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
                <p className="text-sm text-zinc-400 font-medium">No active invite links</p>
                <p className="text-xs text-zinc-500 mt-1">Generate a link above to invite members.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invites.map((invite) => {
                  const isCopied = copiedId === invite.id;

                  return (
                    <div key={invite.id} className="flex items-center justify-between p-4 rounded-lg border border-zinc-800/60 bg-zinc-950/50">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-8 w-8 border border-zinc-800 mt-1">
                          {invite.createdBy.image ? (
                            <AvatarImage src={invite.createdBy.image} />
                          ) : (
                            <AvatarFallback className="bg-zinc-800 text-xs text-zinc-300">
                              {invite.createdBy.name?.charAt(0)}
                            </AvatarFallback>
                          )}
                        </Avatar>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-white">Created by {invite.createdBy.name}</p>
                            {invite.expiresAt ? (
                              <Badge variant="outline" className="text-[10px] h-5 border-amber-500/30 text-amber-400 bg-amber-500/10 font-normal">
                                Expires {formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true })}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] h-5 border-emerald-500/30 text-emerald-400 bg-emerald-500/10 font-normal">
                                Never expires
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <code className="text-xs bg-zinc-900 px-2 py-1 rounded text-zinc-400 font-mono border border-zinc-800">
                              /invite?token={invite.token.substring(0, 12)}...
                            </code>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all"
                          onClick={() => copyToClipboard(invite.token, invite.id)}
                        >
                          {isCopied ? (
                            <><CheckCheck className="h-3.5 w-3.5 mr-2 text-emerald-400" />Copied!</>
                          ) : (
                            <><Copy className="h-3.5 w-3.5 mr-2" />Copy Link</>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-400/10"
                          onClick={() => setRevokeModal({ open: true, inviteId: invite.id })}
                          title="Revoke Link"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revoke Confirm Modal */}
      <ConfirmModal
        open={revokeModal.open}
        onOpenChange={(open) => setRevokeModal(prev => ({ ...prev, open }))}
        title="Revoke Invite Link"
        description="Are you sure you want to revoke this invite link? Anyone with this link will no longer be able to join the workspace."
        confirmLabel="Revoke Link"
        variant="danger"
        isLoading={isRevoking}
        onConfirm={confirmRevokeInvite}
      />
    </div>
  );
}
