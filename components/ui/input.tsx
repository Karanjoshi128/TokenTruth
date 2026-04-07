import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftIcon, rightElement, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-muted-foreground pointer-events-none">{leftIcon}</div>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/40",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            leftIcon && "pl-9",
            rightElement && "pr-10",
            className
          )}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-2">{rightElement}</div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
