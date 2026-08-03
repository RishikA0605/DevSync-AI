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
  ChevronRight
} from "lucide-react";
import { UserButton } from "@/components/shared/user-button";
import { Button } from "@/components/ui/button";

const sidebarNav = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Chat", href: "/chat", icon: MessageSquare },
  { title: "Tasks", href: "/tasks", icon: CheckSquare },
  { title: "Notes", href: "/notes", icon: FileText },
  { title: "Files", href: "/files", icon: Files },
  { title: "AI Assistant", href: "/ai", icon: Bot },
];

export function Sidebar({ workspaceSlug }: { workspaceSlug: string }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div 
      className={cn(
        "relative flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-14 items-center border-b border-zinc-200 dark:border-zinc-800 px-4 py-2">
        {!isCollapsed && (
          <div className="flex-1 font-semibold text-lg truncate">
            {workspaceSlug}
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 ml-auto text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {sidebarNav.map((item) => {
            const href = `/workspace/${workspaceSlug}${item.href}`;
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50"
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
          <UserButton />
          {!isCollapsed && (
            <Link href={`/workspace/${workspaceSlug}/settings`} className="text-zinc-500 hover:text-zinc-900 ml-auto">
              <Settings size={18} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
