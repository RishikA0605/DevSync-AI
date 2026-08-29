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
import { ThemeToggle } from "@/components/shared/theme-toggle";
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

export function Sidebar({ 
  workspaceSlug, 
  workspaces,
  isMobile,
  onNavigate
}: { 
  workspaceSlug: string, 
  workspaces: Workspace[],
  isMobile?: boolean,
  onNavigate?: () => void
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Force expanded state on mobile
  const collapsed = isMobile ? false : isCollapsed;

  return (
    <div
      className={cn(
        "relative flex flex-col bg-card dark:bg-zinc-950 border-r border-border dark:border-zinc-800/60 transition-all duration-300 ease-in-out h-full",
        isMobile ? "w-full border-r-0" : (collapsed ? "w-[60px]" : "w-[220px]")
      )}
    >
      {/* Logo / Workspace Header */}
      <div className="flex h-14 items-center px-2 border-b border-border dark:border-border dark:border-zinc-800/60 shrink-0">
        <WorkspaceSwitcher workspaces={workspaces} activeSlug={workspaceSlug} isCollapsed={collapsed} />

        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-zinc-600 hover:text-foreground dark:text-zinc-300 hover:bg-muted dark:bg-zinc-800"
            onClick={() => setIsCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </Button>
        )}
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
              title={collapsed ? item.title : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150",
                collapsed ? "justify-center" : "",
                isActive
                  ? "bg-muted dark:bg-zinc-800 text-foreground dark:text-white"
                  : "text-muted-foreground dark:text-zinc-500 hover:bg-muted dark:bg-muted dark:bg-zinc-800/60 hover:text-foreground dark:text-zinc-200"
              )}
              onClick={onNavigate}
            >
              <item.icon className={cn(
                "shrink-0 transition-colors",
                collapsed ? "h-5 w-5" : "h-4 w-4",
                isActive ? "text-violet-400" : "text-muted-foreground dark:text-zinc-500 group-hover:text-foreground dark:text-zinc-300"
              )} />
              {!collapsed && <span>{item.title}</span>}
              {!collapsed && isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom: User + Settings + Invite */}
      <div className="p-2 border-t border-border dark:border-border dark:border-zinc-800/60 shrink-0 space-y-2">

        {/* Invite Members */}
        <Link
          href={`/workspace/${workspaceSlug}/settings?tab=members`}
          className={cn(
            "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground dark:text-zinc-500 hover:bg-muted dark:bg-zinc-800 hover:text-foreground dark:text-zinc-200 transition-colors",
            collapsed ? "justify-center" : ""
          )}
          onClick={onNavigate}
          title={collapsed ? "Invite Members" : undefined}
        >
          <UserPlus className={cn("shrink-0 text-violet-400", collapsed ? "h-5 w-5" : "h-4 w-4")} />
          {!collapsed && <span>Invite Members</span>}
        </Link>
        
        {/* Settings */}
        <Link
          href={`/workspace/${workspaceSlug}/settings`}
          className={cn(
            "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground dark:text-zinc-500 hover:bg-muted dark:bg-zinc-800 hover:text-foreground dark:text-zinc-200 transition-colors",
            collapsed ? "justify-center" : ""
          )}
          onClick={onNavigate}
          title={collapsed ? "Settings" : undefined}
        >
          <Settings className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />
          {!collapsed && <span>Workspace Settings</span>}
        </Link>

        {/* Theme Toggle */}
        <ThemeToggle isCollapsed={collapsed} />

        <div className={cn("flex items-center gap-2", collapsed ? "justify-center" : "")}>
          <UserButton />
          {!collapsed && (
            <div className="flex-1 min-w-0" />
          )}
          {!collapsed && (
            <div className="flex items-center gap-1">
              <NotificationBell />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
