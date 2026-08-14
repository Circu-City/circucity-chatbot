"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, MessageCircle, HelpCircle, X, Loader2, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { playNotificationSound, playEscalationSound } from "@/lib/notification-sound";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const prevEscalationsRef = useRef(0);
  const prevUnansweredRef = useRef(0);
  const settingsLoadedRef = useRef(false);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/client/notifications");
      const settingsRes = await fetch("/api/client/notifications/settings").catch(() => null);
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data.notifications || []);
        const newUnread = json.data.notifications?.reduce((s: number, n: any) => s + (n.count || 0), 0) || 0;
        setUnreadCount(newUnread);

        // Load sound preference on first fetch
        if (!settingsLoadedRef.current && json.data.settings) {
          setSoundEnabled(json.data.settings.soundAlerts !== false);
          settingsLoadedRef.current = true;
        }

        // Play sounds for new notifications (only after initial load)
        if (settingsLoadedRef.current && soundEnabled) {
          const escalations = json.data.openEscalations || 0;
          const unanswered = json.data.unansweredCount || 0;
          if (escalations > prevEscalationsRef.current) playEscalationSound();
          else if (unanswered > prevUnansweredRef.current) playNotificationSound();
          prevEscalationsRef.current = escalations;
          prevUnansweredRef.current = unanswered;
        } else if (!settingsLoadedRef.current) {
          const escalations = json.data.openEscalations || 0;
          const unanswered = json.data.unansweredCount || 0;
          prevEscalationsRef.current = escalations;
          prevUnansweredRef.current = unanswered;
          settingsLoadedRef.current = true;
        }
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [soundEnabled]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => { setOpen(!open); if (!open) fetchNotifs(); }} className="relative p-1.5 rounded-lg hover:bg-white/10 transition-colors">
        <Bell className="w-5 h-5 text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-border z-50 overflow-hidden">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-bold text-dark-navy">Notifications</h3>
            <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); setSoundEnabled(!soundEnabled);
            fetch("/api/client/notifications/settings", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ soundAlerts: !soundEnabled }),
            }).catch(() => {}); }} className="text-slate-400 hover:text-slate-600 transition-colors" title={soundEnabled ? "Mute sounds" : "Enable sounds"}>
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          {loading ? (
            <div className="p-6 text-center"><Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" /></div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-border max-h-64 overflow-y-auto">
              {notifications.map((n, i) => (
                <div key={i} className="p-3 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex items-start gap-2">
                    {n.type === "escalation" ? (
                      <MessageCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <HelpCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-dark-navy">{n.title}</p>
                      {n.items?.map((item: any, j: number) => (
                        <p key={j} className="text-xs text-muted-foreground mt-0.5 truncate">
                          {item.customerName || "Anonymous"}{item.escalationReason ? ": " + item.escalationReason : ""}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-muted-foreground">No new notifications</div>
          )}
        </div>
      )}
    </div>
  );
}
