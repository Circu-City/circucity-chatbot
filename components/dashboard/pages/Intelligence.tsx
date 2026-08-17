"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  TrendingUp, MessageSquare, Users, RotateCcw, AlertTriangle, Sparkles,
  ShoppingBag, Target, Smile, HelpCircle, Filter, Lightbulb, Bell,
  Search, Loader2, RefreshCw, ChevronLeft, ChevronRight, Send, Bot,
  BarChart3, Activity, AlertCircle, CheckCircle2, Brain,
  MessageCircle, Zap, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardI18n } from "@/components/dashboard/I18nProvider";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-full overflow-hidden">
      {children}
    </div>
  );
}

const SUB_TABS = [
  { id: "summary", label: "Summary", icon: BarChart3 },
  { id: "products", label: "Product Interests", icon: ShoppingBag },
  { id: "intents", label: "Intent Breakdown", icon: Target },
  { id: "sentiment", label: "Sentiment", icon: Smile },
  { id: "unanswered", label: "Unanswered", icon: HelpCircle },
  { id: "funnel", label: "Funnel", icon: Filter },
  { id: "recommendations", label: "Recommendations", icon: Lightbulb },
  { id: "transcripts", label: "Transcripts", icon: MessageCircle },
  { id: "events", label: "Events", icon: Zap },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "system", label: "System", icon: Shield },
  { id: "ask", label: "Ask AI", icon: Brain },
];

const SUB_TAB_KEYS: Record<string, string> = {
  summary: "tab.summary",
  products: "int.productInterests",
  intents: "int.intentBreakdown",
  sentiment: "tab.sentiment",
  unanswered: "unanswered.title",
  funnel: "tab.funnel",
  recommendations: "tab.recommendations",
  transcripts: "int.transcripts",
  events: "tab.events",
  alerts: "int.alerts",
  system: "tab.system",
  ask: "tab.askAi",
};

type AlertItem = { message: string; severity: "info" | "warning" | "critical"; timestamp?: string };

export default function Intelligence() {
  const { t } = useDashboardI18n();
  const [subTab, setSubTab] = useState("summary");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [productInterests, setProductInterests] = useState<any>(null);
  const [intentBreakdown, setIntentBreakdown] = useState<any>(null);
  const [sentimentTrend, setSentimentTrend] = useState<any>(null);
  const [unanswered, setUnanswered] = useState<any>(null);
  const [funnel, setFunnel] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [alerts, setAlerts] = useState<any>(null);
  const [transcripts, setTranscripts] = useState<any>(null);
  const [events, setEvents] = useState<any>(null);
  const [hallucinations, setHallucinations] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);

  // Ask AI state
  const [askQuestion, setAskQuestion] = useState("");
  const [askAnswer, setAskAnswer] = useState("");
  const [askLoading, setAskLoading] = useState(false);

  // Alert banner carousel
  const [alertIndex, setAlertIndex] = useState(0);

  const fetchIntelligence = useCallback(async (endpoint: string) => {
    try {
      const res = await fetch("/api/client/intelligence/" + endpoint);
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [sum, prod, intent, sent, unans, fun, recs, alrt, trans, evts, hal, sys] = await Promise.all([
      fetchIntelligence("summary"),
      fetchIntelligence("product-interests"),
      fetchIntelligence("intent-breakdown"),
      fetchIntelligence("sentiment-trend"),
      fetchIntelligence("unanswered"),
      fetchIntelligence("funnel"),
      fetchIntelligence("recommendations"),
      fetchIntelligence("alerts"),
      fetchIntelligence("transcripts"),
      fetchIntelligence("events"),
      fetchIntelligence("hallucination-flags"),
      fetchIntelligence("system/integrity"),
    ]);
    if (sum) setSummary(sum);
    if (prod) setProductInterests(prod);
    if (intent) setIntentBreakdown(intent);
    if (sent) setSentimentTrend(sent);
    if (unans) setUnanswered(unans);
    if (fun) setFunnel(fun);
    if (recs) setRecommendations(recs);
    if (alrt) setAlerts(alrt);
    if (trans) setTranscripts(trans);
    if (evts) setEvents(evts);
    if (hal) setHallucinations(hal);
    if (sys) setSystemStatus(sys);
    setLoading(false);
  }, [fetchIntelligence]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const alertsList: AlertItem[] = alerts?.alerts || [];
  const activeAlerts = alertsList.filter((a) => a.severity !== "info");

  // Auto-cycle alerts banner
  useEffect(() => {
    if (alertsList.length < 2) return;
    const timer = setInterval(() => {
      setAlertIndex((i) => (i + 1) % alertsList.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [alertsList.length]);

  const handleAsk = async () => {
    const q = askQuestion.trim();
    if (!q || askLoading) return;
    setAskLoading(true);
    setAskAnswer("");
    try {
      const res = await fetch("/api/client/intelligence/ask?question=" + encodeURIComponent(q));
      const data = await res.json();
      setAskAnswer(data.answer || data.error || "No response");
    } catch {
      setAskAnswer("Failed to get answer");
    }
    setAskLoading(false);
  };

  const handleBackup = async () => {
    try {
      const res = await fetch("/api/client/intelligence/system/backup");
      const data = await res.json();
      if (data.success) {
        const sys = await fetchIntelligence("system/integrity");
        if (sys) setSystemStatus(sys);
      }
    } catch {}
  };

  const severityColor = (s: string) =>
    s === "critical" ? "text-red-600 bg-red-50 border-red-200" :
    s === "warning" ? "text-amber-600 bg-amber-50 border-amber-200" :
    "text-blue-600 bg-blue-50 border-blue-200";

  const severityIcon = (s: string) =>
    s === "critical" ? AlertCircle :
    s === "warning" ? AlertTriangle :
    CheckCircle2;

  return (
    <Wrapper>
      {/* Smart Alerts Banner */}
      {activeAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex-1 overflow-hidden">
            <div className="relative h-5">
              {activeAlerts.map((alert, i) => {
                const Icon = severityIcon(alert.severity);
                return (
                  <div
                    key={i}
                    className={cn(
                      "absolute inset-0 flex items-center gap-2 transition-all duration-500",
                      i === alertIndex % activeAlerts.length ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", severityColor(alert.severity).split(" ")[0])} />
                    <span className="text-sm font-medium text-amber-800 truncate">{alert.message}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="sm" className="p-1 h-6 w-6" onClick={() => setAlertIndex((i) => (i - 1 + activeAlerts.length) % activeAlerts.length)}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="text-[10px] text-amber-500 font-medium">{(alertIndex % activeAlerts.length) + 1}/{activeAlerts.length}</span>
            <Button variant="ghost" size="sm" className="p-1 h-6 w-6" onClick={() => setAlertIndex((i) => (i + 1) % activeAlerts.length)}>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : !summary ? (
        <div className="p-12 text-center">
          <Brain className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{t("int.noData")}</p>
          <p className="text-xs text-slate-300 mt-1">{t("mon.dataWillAppear")}</p>
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: t("mon.conversations"), value: summary.total_conversations ?? 0, icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50" },
              { label: t("int.messages"), value: summary.total_messages ?? 0, icon: Activity, color: "text-primary", bg: "bg-primary/10" },
              { label: t("int.uniqueVisitors"), value: summary.unique_visitors ?? 0, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: t("int.returning"), value: summary.returning_visitors ?? 0, icon: RotateCcw, color: "text-purple-600", bg: "bg-purple-50" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="bg-white rounded-xl border border-border shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn("p-2 rounded-lg", stat.bg)}>
                      <Icon className={cn("w-5 h-5", stat.color)} />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-dark-navy mt-1">{stat.value.toLocaleString()}</p>
                </div>
              );
            })}
          </div>

          {/* Alert Summary Badges */}
          {alertsList.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {alertsList.slice(0, 5).map((a, i) => {
                const Icon = severityIcon(a.severity);
                return (
                  <Badge key={i} variant="outline" className={cn("gap-1.5 px-3 py-1.5 text-xs font-normal", severityColor(a.severity))}>
                    <Icon className="w-3 h-3" />
                    {a.message}
                  </Badge>
                );
              })}
              {alertsList.length > 5 && (
                <Badge variant="outline" className="text-xs text-muted-foreground">+{alertsList.length - 5} {t("int.more")}</Badge>
              )}
            </div>
          )}

          {/* Sub-tabs */}
          <div className="flex flex-wrap gap-1.5 border-b border-border pb-3">
            {SUB_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSubTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all",
                    subTab === tab.id
                      ? "bg-dark-navy text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t(SUB_TAB_KEYS[tab.id])}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <Card className="border-border shadow-sm">
            <CardContent className="p-6">
              {subTab === "summary" && (
                <div className="space-y-6">
                  <h3 className="font-semibold text-dark-navy text-lg">{t("int.summary")}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs text-muted-foreground">{t("int.leads")}</p>
                      <p className="text-xl font-bold text-dark-navy">{summary.leads ?? 0}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs text-muted-foreground">{t("int.purchaseIntents")}</p>
                      <p className="text-xl font-bold text-dark-navy">{summary.purchase_intents ?? 0}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs text-muted-foreground">{t("int.returningVisitors")}</p>
                      <p className="text-xl font-bold text-dark-navy">{summary.returning_visitors ?? 0}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs text-muted-foreground">{t("unanswered.title")}</p>
                      <p className="text-xl font-bold text-dark-navy">{summary.unanswered_queries ?? 0}</p>
                    </div>
                  </div>
                </div>
              )}

              {subTab === "products" && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-dark-navy text-lg">{t("int.productInterests")}</h3>
                  {productInterests?.products?.length > 0 ? (
                    <div className="divide-y divide-border">
                      {productInterests.products.map((p: any, i: number) => (
                        <div key={i} className="py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <ShoppingBag className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-sm font-medium text-dark-navy">{p.product_name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-xs">{p.mention_count} {t("int.mentions")}</Badge>
                            {p.category && <span className="text-xs text-muted-foreground">{p.category}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">{t("int.noProductInterests")}</p>
                  )}
                  {productInterests?.categories?.length > 0 && (
                    <>
                      <h4 className="font-medium text-sm text-dark-navy mt-6">{t("int.categories")}</h4>
                      <div className="flex flex-wrap gap-2">
                        {productInterests.categories.map((c: any, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs gap-1">
                            {c.category}
                            <span className="text-muted-foreground">({c.count})</span>
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {subTab === "intents" && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-dark-navy text-lg">{t("int.intentBreakdown")}</h3>
                  {intentBreakdown?.intents?.length > 0 ? (
                    <div className="space-y-3">
                      {intentBreakdown.intents.map((intent: any, i: number) => {
                        const max = Math.max(...intentBreakdown.intents.map((x: any) => x.count), 1);
                        const pct = Math.round((intent.count / max) * 100);
                        return (
                          <div key={i}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-dark-navy capitalize">{intent.intent.replace(/_/g, " ")}</span>
                              <span className="text-xs text-muted-foreground">{intent.count} ({intent.percentage?.toFixed(1) || 0}%)</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all" style={{ width: pct + "%" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">{t("int.noIntentData")}</p>
                  )}
                </div>
              )}

              {subTab === "sentiment" && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-dark-navy text-lg">{t("int.sentimentTrend")}</h3>
                  {sentimentTrend?.trend?.length > 0 ? (
                    <div className="space-y-2">
                      {sentimentTrend.trend.map((s: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                          <Smile className={cn(
                            "w-4 h-4 shrink-0",
                            s.sentiment === "positive" ? "text-emerald-500" : s.sentiment === "negative" ? "text-red-500" : "text-amber-500"
                          )} />
                          <span className="text-xs text-muted-foreground w-24">{s.period || s.date}</span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={cn(
                              "h-full rounded-full",
                              s.sentiment === "positive" ? "bg-emerald-500" : s.sentiment === "negative" ? "bg-red-500" : "bg-amber-500"
                            )} style={{ width: Math.min((s.score || 0.5) * 100, 100) + "%" }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-16 text-right">{s.score?.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">{t("int.noSentimentData")}</p>
                  )}
                </div>
              )}

              {subTab === "unanswered" && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-dark-navy text-lg">{t("int.unansweredQueries")}</h3>
                  {unanswered?.queries?.length > 0 ? (
                    <div className="divide-y divide-border">
                      {unanswered.queries.map((q: any, i: number) => (
                        <div key={i} className="py-3 flex items-start gap-3">
                          <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-dark-navy">{q.query || q.question}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {q.count ? q.count + "x asked" : ""}
                              {q.last_asked ? " · " + new Date(q.last_asked).toLocaleDateString() : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto mb-2" />
                      <p className="text-sm text-emerald-700 font-medium">{t("unanswered.noQuestions")}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t("unanswered.allAnswered")}</p>
                    </div>
                  )}
                </div>
              )}

              {subTab === "funnel" && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-dark-navy text-lg">{t("int.funnel")}</h3>
                  {funnel?.funnel?.length > 0 ? (
                    <div className="space-y-3">
                      {funnel.funnel.map((stage: any, i: number) => {
                        const maxVal = Math.max(...funnel.funnel.map((x: any) => x.count), 1);
                        const pct = Math.round((stage.count / maxVal) * 100);
                        return (
                          <div key={i}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-dark-navy capitalize">{stage.stage.replace(/_/g, " ")}</span>
                              <span className="text-xs text-muted-foreground">{stage.count} ({stage.percentage?.toFixed(1) || 0}%)</span>
                            </div>
                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                              <div className={cn(
                                "h-full rounded-full",
                                i === 0 ? "bg-emerald-500" : i === funnel.funnel.length - 1 ? "bg-primary" : "bg-amber-500"
                              )} style={{ width: pct + "%" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">{t("int.noFunnelData")}</p>
                  )}
                </div>
              )}

              {subTab === "recommendations" && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-dark-navy text-lg">{t("int.recommendations")}</h3>
                  {recommendations?.recommendations?.length > 0 ? (
                    <div className="grid gap-3">
                      {recommendations.recommendations.map((r: any, i: number) => (
                        <div key={i} className="p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-xl border border-primary/10">
                          <div className="flex items-start gap-3">
                            <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-dark-navy">{r.title || r.recommendation}</p>
                              <p className="text-xs text-muted-foreground mt-1">{r.reason || r.description}</p>
                              {r.impact && (
                                <Badge variant="outline" className="mt-2 text-[10px] text-emerald-600 border-emerald-200 bg-emerald-50">
                                  {r.impact} {t("int.impact")}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No recommendations yet. Data will generate as more conversations occur.</p>
                  )}
                </div>
              )}

              {/* Transcripts sub-tab */}
              {subTab === "transcripts" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-dark-navy text-lg">{t("int.transcripts")}</h3>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fetchIntelligence("transcripts").then(d => { if (d) setTranscripts(d); })}>
                      <RefreshCw className="w-3.5 h-3.5" />
                      {t("int.refresh")}
                    </Button>
                  </div>
                  {transcripts?.transcripts?.length > 0 ? (
                    <div className="divide-y divide-border">
                      {transcripts.transcripts.map((tr: any, i: number) => (
                        <details key={i} className="py-3 group">
                          <summary className="flex items-center justify-between cursor-pointer text-sm">
                            <div className="flex items-center gap-2">
                              <MessageCircle className="w-4 h-4 text-primary shrink-0" />
                              <span className="font-medium text-dark-navy">{tr.first_message?.slice(0, 60)}...</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-[10px]">{tr.message_count} {t("int.msgs")}</Badge>
                              {tr.started_at && <span>{new Date(tr.started_at).toLocaleDateString()}</span>}
                            </div>
                          </summary>
                          <div className="mt-3 ml-6 space-y-2">
                            {tr.messages?.map((m: any, j: number) => (
                              <div key={j} className="p-2.5 bg-slate-50 rounded-lg text-sm">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">{m.role}</span>
                                <p className="text-dark-navy mt-0.5">{m.content}</p>
                              </div>
                            ))}
                            {(!tr.messages || tr.messages.length === 0) && (
                              <p className="text-xs text-muted-foreground">{t("int.noMessages")}</p>
                            )}
                          </div>
                        </details>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageCircle className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">{t("int.noTranscripts")}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Events sub-tab */}
              {subTab === "events" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-dark-navy text-lg">{t("int.systemEvents")}</h3>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fetchIntelligence("events").then(d => { if (d) setEvents(d); })}>
                      <RefreshCw className="w-3.5 h-3.5" />
                      {t("int.refresh")}
                    </Button>
                  </div>
                  {events?.events?.length > 0 ? (
                    <div className="divide-y divide-border">
                      {events.events.map((e: any, i: number) => (
                        <div key={i} className="py-2.5 flex items-start gap-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full mt-1.5 shrink-0",
                            e.event_type === "error" ? "bg-red-500" : e.event_type === "warning" ? "bg-amber-500" : "bg-blue-500"
                          )} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-dark-navy">{e.event_type}</span>
                              {e.source && <span className="text-[10px] text-muted-foreground">{e.source}</span>}
                            </div>
                            <p className="text-sm text-dark-navy mt-0.5">{e.message}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{e.created_at ? new Date(e.created_at).toLocaleString() : ""}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto mb-2" />
                      <p className="text-sm text-emerald-700 font-medium">{t("int.noEvents")}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t("int.runningSmoothly")}</p>
                    </div>
                  )}
                </div>
              )}

              {subTab === "alerts" && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-dark-navy text-lg">{t("int.alertHistory")}</h3>
                  {alertsList.length > 0 ? (
                    <div className="divide-y divide-border">
                      {alertsList.map((a: any, i: number) => {
                        const Icon = severityIcon(a.severity);
                        return (
                          <div key={i} className="py-3 flex items-start gap-3">
                            <Icon className={cn(
                              "w-4 h-4 shrink-0 mt-0.5",
                              a.severity === "critical" ? "text-red-500" : a.severity === "warning" ? "text-amber-500" : "text-blue-500"
                            )} />
                            <div>
                              <p className="text-sm text-dark-navy">{a.message}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="outline" className={cn("text-[10px]", severityColor(a.severity))}>{a.severity}</Badge>
                                {a.timestamp && <span className="text-[10px] text-muted-foreground">{new Date(a.timestamp).toLocaleString()}</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto mb-2" />
                      <p className="text-sm text-emerald-700 font-medium">{t("int.noAlerts")}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t("int.runningSmoothly")}</p>
                    </div>
                  )}
                </div>
              )}

              {/* System sub-tab */}
              {subTab === "system" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-dark-navy text-lg">{t("int.systemStatus")}</h3>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fetchIntelligence("system/integrity").then(d => { if (d) setSystemStatus(d); })}>
                      <RefreshCw className="w-3.5 h-3.5" />
                      {t("int.refresh")}
                    </Button>
                  </div>

                  {/* Database Integrity */}
                  <div className="p-4 rounded-xl border border-border">
                    <h4 className="font-medium text-dark-navy text-sm mb-3">{t("int.databaseIntegrity")}</h4>
                    {systemStatus ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {systemStatus.clean ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                          <span className={cn("text-sm font-medium", systemStatus.clean ? "text-emerald-700" : "text-red-700")}>
                            {systemStatus.clean ? t("int.dbHealthy") : `${systemStatus.issues?.length || 0} ${t("int.issuesFound")}`}
                          </span>
                        </div>
                        {systemStatus.issues?.length > 0 && (
                          <ul className="ml-6 space-y-1">
                            {systemStatus.issues.map((issue: string, i: number) => (
                              <li key={i} className="text-xs text-red-600">- {issue}</li>
                            ))}
                          </ul>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            {t("int.lastBackup")} {systemStatus.backup_path ? systemStatus.backup_path.split("/").pop() : t("ov.never")}
                          </Badge>
                          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handleBackup}>
                            <RefreshCw className="w-3 h-3" />
                            Backup Now
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t("int.loadingStatus")}</p>
                    )}
                  </div>

                  {/* Hallucination Flags */}
                  <div className="p-4 rounded-xl border border-border">
                    <h4 className="font-medium text-dark-navy text-sm mb-3">{t("int.hallucinationDetections")}</h4>
                    {hallucinations?.flags?.length > 0 ? (
                      <div className="divide-y divide-border">
                        {hallucinations.flags.map((f: any, i: number) => (
                          <div key={i} className="py-2.5 flex items-start gap-3">
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm text-dark-navy">{f.reply?.slice(0, 120)}...</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200 bg-amber-50">{f.flagged_pattern}</Badge>
                                <Badge variant="outline" className={cn("text-[10px]", f.severity === "warning" ? "text-amber-600 border-amber-200 bg-amber-50" : "text-red-600 border-red-200 bg-red-50")}>
                                  {f.severity}
                                </Badge>
                                {f.created_at && <span className="text-[10px] text-muted-foreground">{new Date(f.created_at).toLocaleString()}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        No hallucination flags recorded. Bot responses appear accurate.
                      </div>
                    )}
                  </div>

                  {/* System Info */}
                  <div className="p-4 rounded-xl border border-border bg-slate-50">
                    <h4 className="font-medium text-dark-navy text-sm mb-3">{t("int.systemInfo")}</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">{t("int.totalEvents")}</span>
                        <p className="font-medium text-dark-navy">{events?.events?.length || 0}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t("int.hallucinations")}</span>
                        <p className="font-medium text-dark-navy">{hallucinations?.flags?.length || 0}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t("int.alerts")}</span>
                        <p className="font-medium text-dark-navy">{alertsList.length}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t("int.transcripts")}</span>
                        <p className="font-medium text-dark-navy">{transcripts?.transcripts?.length || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {subTab === "ask" && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-dark-navy text-lg">{t("int.askAboutBusiness")}</h3>
                  <p className="text-xs text-muted-foreground">Ask natural language questions about your customer conversations and business performance.</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder={t("int.askPlaceholder")}
                      value={askQuestion}
                      onChange={(e) => setAskQuestion(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleAsk(); }}
                      className="flex-1"
                    />
                    <Button onClick={handleAsk} disabled={askLoading || !askQuestion.trim()} className="gap-2">
                      {askLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {t("int.ask")}
                    </Button>
                  </div>
                  {askAnswer && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-border mt-4">
                      <div className="flex items-start gap-3">
                        <Bot className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-sm text-dark-navy whitespace-pre-wrap">{askAnswer}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Wrapper>
  );
}
