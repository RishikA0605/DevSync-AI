"use client";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Info, LogOut, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
  onConfirm: () => void;
}

const variantStyles = {
  danger: {
    iconWrapper: "bg-red-500/10 border border-red-500/20",
    icon: <AlertTriangle className="h-6 w-6 text-red-500" />,
    titleClass: "text-foreground dark:text-white",
    accentLine: "bg-red-600",
    btnClass: "bg-red-600 hover:bg-red-500 text-foreground dark:text-white shadow-lg shadow-red-900/30",
    dialogBorder: "border-border dark:border-zinc-800",
  },
  warning: {
    iconWrapper: "bg-amber-500/10 border border-amber-500/20",
    icon: <LogOut className="h-6 w-6 text-amber-400" />,
    titleClass: "text-foreground dark:text-white",
    accentLine: "bg-amber-500",
    btnClass: "bg-amber-600 hover:bg-amber-500 text-foreground dark:text-white shadow-lg shadow-amber-900/30",
    dialogBorder: "border-border dark:border-zinc-800",
  },
  info: {
    iconWrapper: "bg-blue-500/10 border border-blue-500/20",
    icon: <Info className="h-6 w-6 text-blue-400" />,
    titleClass: "text-foreground dark:text-white",
    accentLine: "bg-blue-500",
    btnClass: "bg-blue-600 hover:bg-blue-500 text-foreground dark:text-white shadow-lg shadow-blue-900/30",
    dialogBorder: "border-border dark:border-zinc-800",
  },
};

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
  onConfirm,
}: ConfirmModalProps) {
  const s = variantStyles[variant];

  return (
    <Dialog open={open} onOpenChange={isLoading ? undefined : onOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-[400px] p-0 overflow-hidden bg-background dark:bg-zinc-950 gap-0",
          s.dialogBorder
        )}
      >
        {/* Top accent bar */}
        <div className={cn("h-1 w-full", s.accentLine)} />

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Icon + Title */}
          <div className="flex items-start gap-4">
            <div className={cn("flex items-center justify-center h-11 w-11 rounded-xl shrink-0", s.iconWrapper)}>
              {s.icon}
            </div>
            <div className="pt-1">
              <h2 className={cn("text-base font-semibold leading-snug", s.titleClass)}>
                {title}
              </h2>
              <p className="text-sm text-muted-foreground dark:text-zinc-400 mt-1.5 leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-muted dark:bg-zinc-800/70" />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="h-9 px-4 text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:text-zinc-100 hover:bg-muted dark:bg-zinc-800"
            >
              {cancelLabel}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className={cn("h-9 px-5 font-medium transition-all", s.btnClass)}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
