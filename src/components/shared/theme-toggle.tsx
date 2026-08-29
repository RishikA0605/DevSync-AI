"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle({ isCollapsed }: { isCollapsed?: boolean }) {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className={cn(
          "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150 text-muted-foreground hover:bg-muted hover:text-foreground",
          isCollapsed ? "justify-center" : "w-full justify-start"
        )}
      >
        <div className="relative flex h-5 w-5 items-center justify-center shrink-0">
          <Moon className="h-4 w-4" />
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={cn(
        "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150 text-muted-foreground hover:bg-muted hover:text-foreground",
        isCollapsed ? "justify-center" : "w-full justify-start"
      )}
      title={isCollapsed ? "Toggle Theme" : undefined}
    >
      <div className="relative flex h-5 w-5 items-center justify-center shrink-0">
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-violet-400" />
      </div>
      {!isCollapsed && <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>}
    </button>
  );
}
