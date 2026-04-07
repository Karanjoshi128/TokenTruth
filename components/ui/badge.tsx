import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "valid" | "invalid" | "neutral" | "warning";
}

export function Badge({ className, variant = "neutral", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
        {
          "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30": variant === "valid",
          "bg-red-500/15 text-red-400 ring-1 ring-red-500/30": variant === "invalid",
          "bg-white/10 text-muted-foreground ring-1 ring-white/10": variant === "neutral",
          "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30": variant === "warning",
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
