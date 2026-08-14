"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorDisplayProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-red-500" />
      </div>
      <p className="text-sm text-red-600 font-medium mb-1">{message || "Something went wrong"}</p>
      <p className="text-xs text-muted-foreground mb-4">Please try again or refresh the page.</p>
      {onRetry && (
        <button onClick={onRetry} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-dark-navy text-white text-sm font-medium hover:bg-dark-navy/90 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      )}
    </div>
  );
}
