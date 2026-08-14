import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "primary" | "outline" | "secondary";
}

export function Badge({ className, variant = "primary", ...props }: BadgeProps) {
  const variantClasses = {
    primary: "bg-primary text-dark-navy border-transparent",
    outline: "bg-transparent text-dark-navy border-border",
    secondary: "bg-muted text-muted-foreground border-transparent",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}