"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, WifiOff, ExternalLink, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-8  max-w-full overflow-hidden">
      {children}
    </div>
  );
}

function formatRelativeTime(dateStr: string) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return secs + "s ago";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return mins + "m ago";
  return Math.floor(mins / 60) + "h ago";
}

interface Visitor {
  id: string;
  name?: string;
  email?: string;
  pageUrl?: string;
  pageTitle?: string;
  lastSeen: string;
  ip?: string;
  country?: string;
  city?: string;
}

export default function LiveVisitors() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVisitors = useCallback(async () => {
    try {
      const res = await fetch("/api/visitors");
      const d = await res.json();
      if (d.success) setVisitors(d.data?.online || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVisitors();
    const interval = setInterval(fetchVisitors, 10000);
    return () => clearInterval(interval);
  }, [fetchVisitors]);

  return (
    <Wrapper>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : visitors.length === 0 ? (
        <Card className="border-border shadow-sm">
          <CardContent className="p-12 text-center">
            <WifiOff className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold text-dark-navy mb-2">No visitors right now</h3>
            <p className="text-sm text-muted-foreground">When someone visits your site, they&apos;ll appear here in real-time.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-dark-navy">{visitors.length} visitor{visitors.length !== 1 ? "s" : ""} online</span>
          </div>
          {visitors.map((visitor) => (
            <Card key={visitor.id} className="border-border shadow-sm hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Monitor className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-dark-navy truncate">
                        {visitor.name || visitor.email || "Anonymous"}
                      </p>
                      {visitor.email && (
                        <p className="text-xs text-muted-foreground truncate">{visitor.email}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px] text-green-600 border-green-200 bg-green-50">
                    {formatRelativeTime(visitor.lastSeen)}
                  </Badge>
                </div>
                {visitor.pageUrl && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{visitor.pageUrl}</span>
                    </div>
                    {visitor.pageTitle && (
                      <p className="text-xs text-dark-navy font-medium mt-0.5 truncate">{visitor.pageTitle}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Wrapper>
  );
}
