import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow, format, isToday, isYesterday, startOfDay } from "date-fns";
import { FileUp, CheckSquare, UserPlus, MessageSquare, Pencil, Trash2, Activity } from "lucide-react";

interface ActivityEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string | null;
  createdAt: Date;
  user: { id: string; name: string | null; image: string | null };
}

interface ActivityFeedProps {
  activities: ActivityEntry[];
}

const actionConfig: Record<string, { icon: React.ElementType; color: string }> = {
  created_task: { icon: CheckSquare, color: "bg-violet-500/20 text-violet-400" },
  updated_task: { icon: Pencil, color: "bg-blue-500/20 text-blue-400" },
  updated_task_status: { icon: CheckSquare, color: "bg-blue-500/20 text-blue-400" },
  deleted_task: { icon: Trash2, color: "bg-red-500/20 text-red-400" },
  uploaded_file: { icon: FileUp, color: "bg-emerald-500/20 text-emerald-400" },
  joined_workspace: { icon: UserPlus, color: "bg-amber-500/20 text-amber-400" },
  left_workspace: { icon: UserPlus, color: "bg-zinc-500/20 text-muted-foreground dark:text-zinc-400" },
  sent_message: { icon: MessageSquare, color: "bg-sky-500/20 text-sky-400" },
};

function getGroupLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

function groupByDay(activities: ActivityEntry[]) {
  const groups: Record<string, ActivityEntry[]> = {};
  for (const a of activities) {
    const key = startOfDay(new Date(a.createdAt)).toISOString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  }
  return groups;
}

function ActivityRow({ activity }: { activity: ActivityEntry }) {
  const config = actionConfig[activity.action] ?? { icon: Activity, color: "bg-zinc-500/20 text-muted-foreground dark:text-zinc-400" };
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 py-3">
      {/* Timeline line + icon */}
      <div className="flex flex-col items-center shrink-0">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${config.color}`}>
          <Icon size={14} />
        </div>
        <div className="flex-1 w-px bg-muted dark:bg-zinc-800 mt-1" style={{ minHeight: "16px" }} />
      </div>

      {/* Content */}
      <div className="flex items-start gap-2.5 pb-3 flex-1 min-w-0">
        <Avatar className="h-6 w-6 mt-1 shrink-0 border border-border dark:border-zinc-800">
          <AvatarImage src={activity.user.image || ""} />
          <AvatarFallback className="text-[10px] bg-muted dark:bg-zinc-800 text-muted-foreground dark:text-zinc-400">
            {activity.user.name?.charAt(0) || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground dark:text-zinc-200 leading-snug">
            <span className="font-medium text-foreground dark:text-white">{activity.user.name || "Someone"}</span>{" "}
            {activity.details || activity.action.replace(/_/g, " ")}
          </p>
          <p className="text-xs text-muted-foreground dark:text-zinc-500 mt-0.5">
            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Activity size={40} className="text-zinc-700 mb-4" />
        <h3 className="text-lg font-semibold text-foreground dark:text-zinc-300 mb-1">No activity yet</h3>
        <p className="text-sm text-muted-foreground dark:text-zinc-500">
          Workspace events like task creation, file uploads, and member changes will appear here.
        </p>
      </div>
    );
  }

  const groups = groupByDay(activities);

  return (
    <div className="max-w-2xl mx-auto">
      {Object.entries(groups).map(([dateKey, dayActivities]) => (
        <div key={dateKey} className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px flex-1 bg-muted dark:bg-zinc-800" />
            <span className="text-xs font-medium text-muted-foreground dark:text-zinc-500 px-2">
              {getGroupLabel(new Date(dateKey))}
            </span>
            <div className="h-px flex-1 bg-muted dark:bg-zinc-800" />
          </div>
          <div>
            {dayActivities.map((a) => (
              <ActivityRow key={a.id} activity={a} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
