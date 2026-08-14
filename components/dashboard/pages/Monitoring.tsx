"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, MessageCircle, Activity, AlertTriangle, CheckCircle,
  RefreshCw, Loader2, Lightbulb, Info, Store
} from "lucide-react";
import { cn } from "@/lib/utils";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-8  max-w-full overflow-hidden">
      {children}
    </div>
  );
}

export default function Monitoring() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mRes] = await Promise.all([
        fetch("/api/client/metrics?days=" + days).then(r => r.json()),
      ]);
      if (mRes.success) setMetrics(mRes.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [days]);

  const d = metrics;

  return (
    <Wrapper>
      {loading && !metrics ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : !d ? (
        <div className="p-12 text-center">
          <TrendingUp className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No metrics available yet</p>
          <p className="text-xs text-slate-300 mt-1">Data will appear once customers start chatting.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Conversations</span>
                </div>
                <p className="text-2xl font-bold text-dark-navy">{d.totals?.conversations}</p>
                <p className="text-xs text-muted-foreground">{d.totals?.messages} messages</p>
              </CardContent>
            </Card>
            <Card className="border-border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <Activity className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Avg Msgs/Chat</span>
                </div>
                <p className="text-2xl font-bold text-dark-navy">{d.totals?.avgMessagesPerConv}</p>
                <p className="text-xs text-muted-foreground">Per conversation</p>
              </CardContent>
            </Card>
            <Card className="border-border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Escalation Rate</span>
                </div>
                <p className="text-2xl font-bold text-dark-navy">{d.quality?.escalationRate}%</p>
                <p className="text-xs text-muted-foreground">{d.quality?.escalated} escalated</p>
              </CardContent>
            </Card>
            <Card className="border-border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Resolution Rate</span>
                </div>
                <p className="text-2xl font-bold text-dark-navy">{d.quality?.resolutionRate}%</p>
                <p className="text-xs text-muted-foreground">{d.quality?.resolved} resolved</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border shadow-sm">
              <CardContent className="p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Resolution Rate
                </h3>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: d.quality?.resolutionRate + '%' }} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{d.quality?.resolved} of {d.totals?.conversations} conversations resolved</p>
              </CardContent>
            </Card>
            <Card className="border-border shadow-sm">
              <CardContent className="p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-rose-500" /> Negative Sentiment
                </h3>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full transition-all" style={{ width: d.quality?.negativeSentimentRate + '%' }} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{d.quality?.negativeSentimentRate}% of conversations</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border shadow-sm">
            <CardContent className="p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> Daily Messages
              </h3>
              {d.trends?.daily?.length > 0 ? (
                <div className="h-32 flex items-end gap-1">
                  {d.trends?.daily.slice(-30).map((day: any, i: number) => {
                    const max = Math.max(...d.trends?.daily.map((x: any) => x.messages), 1);
                    const h = (day.messages / max) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div className="w-full bg-emerald-100 rounded-t hover:bg-emerald-200 transition-colors relative" style={{ height: Math.max(h, 2) + '%' }}>
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 whitespace-nowrap">{day.messages}</span>
                        </div>
                        {d.trends?.daily.length <= 31 && (
                          <span className="text-[7px] text-slate-300 -rotate-45 origin-left">{day.date.slice(5)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No message data for this period</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Wrapper>
  );
}
