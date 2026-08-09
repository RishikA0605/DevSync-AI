"use client";

import { AppNotification } from "@/features/notifications/types/notification.types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Bell, CheckSquare, AtSign, UserPlus, Settings } from "lucide-react";

const typeConfig = {
  TASK_ASSIGNED: { icon: CheckSquare, color: "text-violet-400" },
  TASK_STATUS_CHANGED: { icon: CheckSquare, color: "text-blue-400" },
  MENTION: { icon: AtSign, color: "text-emerald-400" },
  WORKSPACE_JOINED: { icon: UserPlus, color: "text-amber-400" },
  SYSTEM: { icon: Settings, color: "text-zinc-400" },
} as const;

interface NotificationItemProps {
  notification: AppNotification;
  onRead: (id: string) => void;
}

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const config = typeConfig[notification.type] ?? typeConfig.SYSTEM;
  const Icon = config.icon;

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-zinc-800/60",
        !notification.isRead && "bg-zinc-800/40"
      )}
      onClick={() => !notification.isRead && onRead(notification.id)}
    >
      {/* Unread dot */}
      {!notification.isRead && (
        <div className="mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full bg-violet-400" />
      )}
      {notification.isRead && <div className="mt-1.5 shrink-0 h-1.5 w-1.5" />}

      {/* Actor Avatar or Icon */}
      {notification.actor ? (
        <Avatar className="h-8 w-8 shrink-0 border border-zinc-700">
          <AvatarImage src={notification.actor.image || ""} />
          <AvatarFallback className="text-xs bg-zinc-800 text-zinc-300">
            {notification.actor.name?.charAt(0) || "?"}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="h-8 w-8 shrink-0 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
          <Icon size={14} className={config.color} />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm leading-snug",
          notification.isRead ? "text-zinc-400" : "text-zinc-100"
        )}>
          {notification.content}
        </p>
        <p className="text-xs text-zinc-500 mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );

  if (notification.link) {
    return (
      <Link href={notification.link} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
