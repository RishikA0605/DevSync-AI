"use client";

import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { Workspace } from "@prisma/client";
import { usePathname } from "next/navigation";

interface MobileHeaderProps {
  workspaceSlug: string;
  workspaces: Workspace[];
}

export function MobileHeader({ workspaceSlug, workspaces }: MobileHeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the sheet when navigation happens
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const activeWorkspace = workspaces.find((w) => w.slug === workspaceSlug) || workspaces[0];

  return (
    <div className="md:hidden flex h-14 items-center justify-between border-b border-border dark:border-zinc-800/60 bg-card dark:bg-zinc-950 px-4 shrink-0">
      <div className="flex items-center gap-2">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 -ml-2 text-foreground dark:text-zinc-300">
              <Menu size={20} />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-card dark:bg-zinc-950 border-r-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <Sidebar 
              workspaceSlug={workspaceSlug} 
              workspaces={workspaces} 
              isMobile 
              onNavigate={() => setOpen(false)} 
            />
          </SheetContent>
        </Sheet>
        <span className="font-semibold text-sm truncate">{activeWorkspace?.name || "Workspace"}</span>
      </div>
    </div>
  );
}
