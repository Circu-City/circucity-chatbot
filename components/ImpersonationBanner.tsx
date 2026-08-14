"use client";

import React from "react";
import { UserCog, X } from "lucide-react";

interface ImpersonationBannerProps {
  isImpersonating?: boolean;
  impersonatedEmail?: string;
}

export default function ImpersonationBanner({ isImpersonating, impersonatedEmail }: ImpersonationBannerProps) {
  if (!isImpersonating) return null;

  const handleStop = async () => {
    try {
      await fetch("/api/admin/stop-impersonation", { method: "POST" });
      window.location.reload();
    } catch (err) {
      alert("Failed to stop impersonation");
    }
  };

  return (
    <div className="bg-purple-600 text-white px-4 py-2 text-sm flex items-center justify-between z-50">
      <div className="flex items-center gap-2">
        <UserCog className="w-4 h-4" />
        <span>
          You are currently impersonating <strong>{impersonatedEmail || "a user"}</strong>. 
          All actions will be performed as this user.
        </span>
      </div>
      <button 
        onClick={handleStop}
        className="flex items-center gap-1 px-3 py-1 bg-purple-700 hover:bg-purple-800 rounded text-xs font-medium transition-colors"
      >
        <X className="w-3.5 h-3.5" />
        Stop Impersonating
      </button>
    </div>
  );
}
