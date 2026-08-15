"use client";

import { useState } from "react";
import { GeneralSettings } from "./general-settings";
import { MembersSettings } from "./members-settings";
import { InviteSettings } from "./invite-settings";
import { DangerZone } from "./danger-zone";
import { Workspace, WorkspaceMember, WorkspaceInvite } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Settings, Users, Link as LinkIcon, AlertTriangle } from "lucide-react";

type MemberWithUser = WorkspaceMember & { user: { id: string; name: string | null; email: string | null; image: string | null } };
type InviteWithCreator = WorkspaceInvite & { createdBy: { id: string; name: string | null; email: string | null; image: string | null } };

interface SettingsTabsProps {
  workspace: Workspace;
  currentMember: WorkspaceMember;
  members: MemberWithUser[];
  invites: InviteWithCreator[];
  workspaceStats: { memberCount: number; projectCount: number; taskCount: number; fileCount: number };
}

export function SettingsTabs({ workspace, currentMember, members, invites, workspaceStats }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState("general");

  const isAdmin = currentMember.role === "OWNER" || currentMember.role === "ADMIN";

  const tabs = [
    { id: "general", label: "General", icon: Settings, show: true },
    { id: "members", label: "Members", icon: Users, show: true },
    { id: "invites", label: "Invites", icon: LinkIcon, show: isAdmin },
    { id: "danger", label: "Danger Zone", icon: AlertTriangle, show: true },
  ].filter(t => t.show);

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar Tabs */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              )}
            >
              <tab.icon className={cn("h-4 w-4", isActive ? "text-violet-400" : "text-zinc-500")} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {activeTab === "general" && <GeneralSettings workspace={workspace} currentMember={currentMember} />}
        {activeTab === "members" && <MembersSettings workspace={workspace} currentMember={currentMember} members={members} />}
        {activeTab === "invites" && isAdmin && <InviteSettings workspace={workspace} invites={invites} />}
        {activeTab === "danger" && <DangerZone workspace={workspace} currentMember={currentMember} workspaceStats={workspaceStats} />}
      </div>
    </div>
  );
}
