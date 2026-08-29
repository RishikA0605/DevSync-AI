"use client";

import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { ChatSidebar } from "./chat-sidebar";
import { usePathname } from "next/navigation";
import { Channel } from "@prisma/client";

interface MobileChatSidebarProps {
  channels: Channel[];
  workspaceId: string;
  workspaceSlug: string;
  unreadCounts: Record<string, number>;
}

export function MobileChatSidebar({ channels, workspaceId, workspaceSlug, unreadCounts }: MobileChatSidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the sheet when navigation happens (channel changed)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="md:hidden flex items-center p-2 border-b border-border dark:border-zinc-800/60 bg-card dark:bg-zinc-950 shrink-0">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Menu size={16} /> Channels
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72 bg-card dark:bg-zinc-950 border-r-0">
          <SheetTitle className="sr-only">Chat Channels</SheetTitle>
          <ChatSidebar
            channels={channels}
            workspaceId={workspaceId}
            workspaceSlug={workspaceSlug}
            unreadCounts={unreadCounts}
            onlineUserIds={[]}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
