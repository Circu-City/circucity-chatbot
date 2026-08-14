"use client";

import React from "react";

interface DashboardPageShellProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function DashboardPageShell({ title, subtitle, children }: DashboardPageShellProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-full overflow-hidden">
      {children}
    </div>
  );
}
