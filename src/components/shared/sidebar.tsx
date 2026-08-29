"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  CheckSquare,
  FileText,
  Files,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Activity,
  UserPlus
} from "lucide-react";
import { UserButton } from "@/components/shared/user-button";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { WorkspaceSwitcher } from "@/features/workspaces/components/workspace-switcher";
import { Workspace } from "@prisma/client";

const sidebarNav = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Chat", href: "/chat", icon: MessageSquare },
  { title: "Projects", href: "/projects", icon: CheckSquare },
  { title: "Notes", href: "/notes", icon: FileText },
  { title: "Files", href: "/files", icon: Files },
  { title: "Activity", href: "/activity", icon: Activity },
  { title: "AI Assistant", href: "/ai", icon: Bot },
];

export function Sidebar({ workspaceSlug, workspaces }: { workspaceSlug: string, workspaces: Workspace[] }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "relative flex flex-col bg-zinc-950 border-r border-zinc-800/60 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[60px]" : "w-[220px]"
      )}
    >
      {/* Logo / Workspace Header */}
      <div className="flex h-14 items-center px-2 border-b border-zinc-800/60 shrink-0">
        <WorkspaceSwitcher workspaces={workspaces} activeSlug={workspaceSlug} isCollapsed={isCollapsed} />

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {sidebarNav.map((item) => {
          const href = `/workspace/${workspaceSlug}${item.href}`;
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={item.href}
              href={href}
              title={isCollapsed ? item.title : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150",
                isCollapsed ? "justify-center" : "",
                isActive
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200"
              )}
            >
              <item.icon className={cn(
                "shrink-0 transition-colors",
                isCollapsed ? "h-5 w-5" : "h-4 w-4",
                isActive ? "text-violet-400" : "text-zinc-500 group-hover:text-zinc-300"
              )} />
              {!isCollapsed && <span>{item.title}</span>}
              {!isCollapsed && isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom: User + Settings + Invite */}
      <div className="p-2 border-t border-zinc-800/60 shrink-0 space-y-2">

        {/* Invite Members */}
        <Link
          href={`/workspace/${workspaceSlug}/settings`}
          className={cn(
            "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150 text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200",
            isCollapsed ? "justify-center" : ""
          )}
          title={isCollapsed ? "Invite Members" : undefined}
        >
          <UserPlus className={cn("shrink-0 text-violet-400", isCollapsed ? "h-5 w-5" : "h-4 w-4")} />
          {!isCollapsed && <span>Invite Members</span>}
        </Link>

        <div className={cn("flex items-center gap-2", isCollapsed ? "justify-center" : "")}>
          <UserButton />
          {!isCollapsed && (
            <div className="flex-1 min-w-0" />
          )}
          {!isCollapsed && (
            <div className="flex items-center gap-1">
              <NotificationBell />
              <Link
                href={`/workspace/${workspaceSlug}/settings`}
                className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <Settings size={15} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
