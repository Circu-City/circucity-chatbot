"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, MessageSquare, Users, Zap, CheckCircle2, MousePointer2, Download, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardI18n } from "@/components/dashboard/I18nProvider";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-8  max-w-full overflow-hidden">
      {children}
    </div>
  );
}

interface Stats {
  totalMessages?: number;
  totalConversations?: number;
  conversionRate?: number;
  resolutionRate?: number;
  avgResponseTime?: string;
  conversationsThisMonth?: number;
  resolvedCount?: number;
  messagesByDay?: { date: string; count: number }[];
}

export default function Analytics() {
  const { t } = useDashboardI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("30d");
  const [exportLoading, setExportLoading] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);

  useEffect(() => {
    fetch("/api/client/analytics?range=" + dateFilter)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setStats(d.data);
      })
      .catch(() => setError("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, [dateFilter]);

  const handleExport = async () => {
    if (!stats) return;
    setExportLoading(true);
    const rows = [
      ["Total Messages", String(stats.totalMessages || "0")],
      ["Total Conversations", String(stats.totalConversations || "0")],
      ["Conversion Rate", stats.conversionRate ? stats.conversionRate + "%" : "0%"],
      ["Resolution Rate", stats.resolutionRate ? stats.resolutionRate + "%" : "0%"],
      ["Avg Response Time", stats.avgResponseTime || "0s"],
    ];
    const csv = "Metric,Value\n" + rows.map(function(r) { return r.map(function(c) { return '"' + c.replace(/"/g, '""') + '"'; }).join(","); }).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analytics.csv";
    a.click();
    URL.revokeObjectURL(url);
    setExportLoading(false);
  };

  const STATS = [
    { label: t("ana.totalMessages"), value: stats?.totalMessages?.toLocaleString() || "0", change: "+" + (stats?.conversationsThisMonth || 0) + " " + t("int.thisMonth"), icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50" },
    { label: t("ana.totalConversations"), value: stats?.totalConversations?.toLocaleString() || "0", change: "+" + (stats?.resolvedCount || 0) + " resolved", icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Conversion Rate", value: (stats?.conversionRate || 0) + "%", change: (stats?.resolutionRate || 0) + "% resolution", icon: Zap, color: "text-orange-600", bg: "bg-orange-50" },
    { label: t("ana.avgResponseTime"), value: stats?.avgResponseTime || "0s", change: t("ana.live"), icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <Wrapper>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-dark-navy">{t("ana.title")}</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowDateMenu(!showDateMenu)}>
                <Calendar className="w-4 h-4" />
                {dateFilter === "7d" ? "Last 7 days" : dateFilter === "30d" ? t("ana.last30Days") : dateFilter === "90d" ? "Last 90 days" : "Custom"}
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleExport} disabled={exportLoading || !stats}>
                <Download className="w-4 h-4" />
                {exportLoading ? "Exporting..." : t("ana.exportCsv")}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map(function(stat, i) {
              const Icon = stat.icon;
              return (
                <div key={i} className="bg-white rounded-xl border border-border shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn("p-2 rounded-lg", stat.bg)}>
                      <Icon className={cn("w-5 h-5", stat.color)} />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">{stat.change}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-dark-navy mt-1">{stat.value}</p>
                </div>
              );
            })}
          </div>

          <Card className="border-border shadow-sm">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-dark-navy">{t("ana.messageVolume")}</h3>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <CardContent className="p-6">
              {stats?.messagesByDay && stats.messagesByDay.length > 0 ? (
                <div className="h-64 w-full flex items-end justify-between gap-2">
                  {stats.messagesByDay.slice(-30).map(function(day, i) {
                    const max = Math.max(...stats.messagesByDay.map(function(d) { return d.count; }), 1);
                    const height = (day.count / max) * 100;
                    return (
                      <div key={i} className="relative w-full flex flex-col-reverse gap-1 h-full justify-end">
                        <div
                          className="w-full bg-primary/20 rounded-t hover:bg-primary/40 transition-colors cursor-pointer"
                          style={{ height: height + "%" }}
                          title={day.date + ": " + day.count + " messages"}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                  {t("ana.noData")}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardContent className="p-6">
              <div className="pt-6 mt-6 border-t border-border">
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3">
                  <MousePointer2 className="w-5 h-5 text-primary shrink-0" />
                  <p className="text-xs text-dark-navy">
                    <span className="font-bold">{t("ana.insight")}</span> {t("ana.aiHandled")} {stats?.totalConversations || 0} {t("ana.convWith")} {stats?.resolutionRate || "0"}% {t("ana.pctResolution")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </Wrapper>
  );
}
