"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Workspace } from "@prisma/client";
import { Sparkles, ChevronsUpDown, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateWorkspaceModal } from "./create-workspace-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface WorkspaceSwitcherProps {
  workspaces: Workspace[];
  activeSlug: string;
  isCollapsed: boolean;
}

export function WorkspaceSwitcher({ workspaces, activeSlug, isCollapsed }: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeWorkspace = workspaces.find((w) => w.slug === activeSlug) || workspaces[0];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div
            role="button"
            className={cn(
              "flex items-center gap-2.5 flex-1 min-w-0 p-1.5 rounded-lg hover:bg-zinc-800/60 cursor-pointer transition-colors",
              isCollapsed && "justify-center px-0"
            )}
          >
            <Avatar className="h-7 w-7 rounded-lg shrink-0">
              {activeWorkspace?.logo ? (
                <AvatarImage src={activeWorkspace.logo} alt={activeWorkspace.name} />
              ) : (
                <AvatarFallback className="rounded-lg bg-gradient-to-br from-violet-500 to-blue-600">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </AvatarFallback>
              )}
            </Avatar>
            {!isCollapsed && (
              <>
                <span className="text-sm font-semibold text-white truncate capitalize flex-1 text-left">
                  {activeWorkspace?.name || activeSlug}
                </span>
                <ChevronsUpDown className="h-4 w-4 text-zinc-500 shrink-0" />
              </>
            )}
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60 bg-zinc-950 border-zinc-800 text-zinc-200">
          <div className="px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Workspaces
          </div>
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => router.push(`/workspace/${workspace.slug}/dashboard`)}
              className="flex items-center gap-2 cursor-pointer focus:bg-zinc-800"
            >
              <Avatar className="h-6 w-6 rounded-md">
                {workspace.logo ? (
                  <AvatarImage src={workspace.logo} alt={workspace.name} />
                ) : (
                  <AvatarFallback className="rounded-md bg-zinc-800 text-xs">
                    {workspace.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <span className="flex-1 truncate">{workspace.name}</span>
              {workspace.slug === activeSlug && (
                <Check className="h-4 w-4 text-violet-400" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator className="bg-zinc-800" />
          <DropdownMenuItem
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 cursor-pointer focus:bg-zinc-800 text-zinc-300"
          >
            <div className="h-6 w-6 rounded-md bg-zinc-800 flex items-center justify-center">
              <Plus className="h-4 w-4 text-zinc-400" />
            </div>
            <span>Create Workspace</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateWorkspaceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
