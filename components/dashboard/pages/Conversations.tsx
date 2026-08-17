"use client";

import React, { useEffect, useState } from "react";
import { ErrorDisplay } from "@/components/ui/ErrorDisplay";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Search, 
  RefreshCw,
  Loader2,
  Eye,
  Download
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDashboardI18n } from "../I18nProvider";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <div className="space-y-8  max-w-full overflow-hidden">{children}</div>;
}

export default function Conversations() {
  const { t } = useDashboardI18n();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewingConv, setViewingConv] = useState<any>(null);
  const [exporting, setExporting] = useState(false);
  const [savingTag, setSavingTag] = useState("");

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/client/conversations?limit=50");
      const json = await res.json();
      if (json.success) setConversations(json.data);
    } catch { setError(t("conv.loadFailed")); }
    setLoading(false);
  };

  useEffect(() => { fetchConversations(); }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/client/conversations/export?format=csv");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "conversations.csv"; a.click();
      URL.revokeObjectURL(url);
    } catch { setError(t("conv.loadFailed")); }
    setExporting(false);
  };

  const handleTag = async (convId: string, tags: string[]) => {
    setSavingTag(convId);
    try {
      await fetch("/api/client/conversations/tags", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId, tags }),
      });
      setConversations(prev => prev.map(c => {
        if (c.id === convId) {
          let meta: any = {};
          if (c.metadata) try { meta = JSON.parse(c.metadata); } catch {}
          meta.tags = tags;
          return { ...c, metadata: JSON.stringify(meta) };
        }
        return c;
      }));
    } catch { setError(t("conv.loadFailed")); }
    setSavingTag("");
  };

  const filtered = conversations.filter(c =>
    (c.customerName?.toLowerCase().includes(search.toLowerCase()) || "") ||
    (c.customerEmail?.toLowerCase().includes(search.toLowerCase()) || "")
  );

  return (
    <Wrapper>

<div className="relative w-full md:w-72"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

<Input placeholder={t("conv.search")} className="pl-10"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-dark-navy">{t("conv.title")}</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={fetchConversations}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport} disabled={exporting}>
                <Download className="w-4 h-4" />
                {exporting ? t("conv.exporting") : t("conv.export")}
              </Button>
            </div>
          </div>

          <Card className="border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-border">
                <tr>
                  <th className="p-4 text-sm font-semibold text-dark-navy">{t("common.customer")}</th>
                  <th className="p-4 text-sm font-semibold text-dark-navy">{t("common.email")}</th>
                  <th className="p-4 text-sm font-semibold text-dark-navy">{t("common.status")}</th>
                  <th className="p-4 text-sm font-semibold text-dark-navy">{t("conv.sentiment")}</th>
                  <th className="p-4 text-sm font-semibold text-dark-navy">{t("common.date")}</th>
                  <th className="p-4 text-sm font-semibold text-dark-navy text-right">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length > 0 ? filtered.map((conv: any) => (
                  <tr key={conv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-sm font-medium text-dark-navy">{conv.customerName || t("ov.anonymous")}</td>
                    <td className="p-4 text-sm text-muted-foreground">{conv.customerEmail || "-"}</td>
                    <td className="p-4">
                      <Badge className={cn(
                        "text-[10px] uppercase tracking-wider",
                        conv.resolved ? "bg-green-100 text-green-700 border-green-200" : "bg-blue-100 text-blue-700 border-blue-200"
                      )}>
                        {conv.resolved ? t("common.resolved") : t("conv.open")}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{conv.sentiment || "-"}</td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(conv.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" className="p-2 h-8 w-8" onClick={() => setViewingConv(conv)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-sm text-muted-foreground">
                      {search ? t("conv.noMatch") : t("conv.noConversations")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    
    
    </Wrapper>
  );
}