"use client";

import { useNotifications } from "@/features/notifications/hooks/use-notifications";
import { NotificationItem } from "@/features/notifications/components/notification-item";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    markRead,
    markAllRead,
    loadMore,
  } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative p-1.5 rounded-lg text-muted-foreground dark:text-zinc-500 hover:text-foreground dark:text-zinc-300 hover:bg-muted dark:bg-zinc-800 transition-colors"
          title="Notifications"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-violet-500 text-foreground dark:text-white text-[9px] font-bold flex items-center justify-center leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="right"
        className="w-80 p-0 bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 shadow-2xl shadow-black/40 rounded-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-violet-600 text-foreground dark:text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:text-white px-2"
              onClick={markAllRead}
            >
              <CheckCheck size={12} />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notification List */}
        <div className="overflow-y-auto max-h-[400px]">
          {isLoading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="animate-spin text-muted-foreground dark:text-zinc-500" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <Bell size={28} className="text-zinc-700 mb-2" />
              <p className="text-sm text-muted-foreground dark:text-zinc-400 font-medium">All caught up!</p>
              <p className="text-xs text-zinc-600 mt-1">No notifications yet</p>
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              {notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onRead={markRead} />
              ))}
              {hasMore && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadMore}
                  disabled={isLoading}
                  className="w-full mt-1 text-xs text-muted-foreground dark:text-zinc-500 hover:text-foreground dark:text-white"
                >
                  {isLoading ? <Loader2 size={12} className="animate-spin" /> : "Load more"}
                </Button>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
