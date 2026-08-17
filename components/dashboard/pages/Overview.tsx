"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, TrendingUp, Users, ShoppingBag, Clock, ArrowUpRight, Loader2, RefreshCw, Database, Globe, CheckCircle2, XCircle, AlertCircle, ExternalLink, ShieldCheck, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useDashboardI18n } from "../I18nProvider";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-8  max-w-full overflow-hidden">
      {children}
    </div>
  );
}

const StatCard = ({ title, value, change, icon: Icon, trend }: { title: string; value: string; change: string; icon: any; trend: "up" | "down" }) => (
  <Card className="border-border shadow-sm overflow-hidden group hover:border-primary/50 transition-all">
    <CardContent className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-primary/10 rounded-lg text-primary"><Icon className="w-5 h-5" /></div>
        <div className={cn("flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full", trend === "up" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
          <ArrowUpRight className={cn("w-3 h-3", trend === "down" && "rotate-180")} />{change}
        </div>
      </div>
      <p className="text-sm text-muted-foreground font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-dark-navy mt-1">{value}</h3>
    </CardContent>
  </Card>
);

export default function Overview() {
  const router = useRouter();
  const { t } = useDashboardI18n();
  const [stats, setStats] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [store, setStore] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    let authFailed = false;
    Promise.all([
      fetch("/api/client/analytics").then(r => { if (r.status === 401) authFailed = true; return r.json().catch(() => ({})); }),
      fetch("/api/client/conversations?limit=5").then(r => r.json().catch(() => ({}))),
      fetch("/api/client/store").then(r => { if (r.status === 401) authFailed = true; return r.json().catch(() => ({})); }),
      fetch("/api/client/sync-status").then(r => r.json().catch(() => ({}))),
    ]).then(([analytics, convs, storeData, sync]) => {
      if (authFailed) return;
      if (analytics.success) setStats(analytics.data);
      if (convs.success) setConversations(convs.data);
      if (storeData.success) setStore(storeData.data);
      if (sync.success) setSyncStatus(sync.data);
    }).catch(() => { setError(t("ov.loadFailed")); }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [router]);

  const triggerSync = async () => {
    setSyncing(true);
    try {
      await fetch("/api/workspace/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: store?.apiKey || "" }),
      });
      setTimeout(() => { fetchData(); setSyncing(false); }, 2000);
    } catch { setSyncing(false); }
  };

  const userName = store?.user?.name || store?.user?.email?.split("@")[0] || "there";
  const subscription = store?.subscriptions?.[0];
  const isTrialing = subscription?.status === "trialing";
  const trialEnd = subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
  const trialDaysLeft = trialEnd ? Math.ceil((trialEnd.getTime() - Date.now()) / 86400000) : 14;
  const showTrialBanner = isTrialing && trialDaysLeft <= 7;

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    idle: { label: t("ov.waiting"), color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
    crawling: { label: t("ov.syncing"), color: "bg-blue-100 text-blue-700 border-blue-200", icon: RefreshCw },
    completed: { label: t("ov.synced"), color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
    failed: { label: t("ov.syncFailed"), color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
  };
  const sc = statusConfig[syncStatus?.status || "idle"] || statusConfig.idle;
  const StatusIcon = sc.icon;

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return t("ov.never");
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("ov.justNow");
    if (mins < 60) return mins + " " + t("ov.minutesAgo");
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + " " + t("ov.hoursAgo");
    return Math.floor(hours / 24) + " " + t("ov.daysAgo");
  };

  return (
    <Wrapper>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : !store ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-muted-foreground mb-2">{t("ov.noStoreData")}</p>
          <Button onClick={() => router.push("/onboarding")}>{t("ov.completeSetup")}</Button>
        </div>
      ) : (
        <>
          {showTrialBanner && (
            <div className={cn("p-4 rounded-xl flex items-center justify-between gap-4", trialDaysLeft <= 0 ? "bg-red-500/10 border border-red-500/30" : "bg-amber-500/10 border border-amber-500/30")}>
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl shrink-0">{trialDaysLeft <= 0 ? "⏰" : "⏳"}</span>
                <div>
                  <p className="text-sm font-semibold text-dark-navy">
                    {trialDaysLeft <= 0 ? t("ov.trialEnded") : t("ov.trialEndsIn") + " " + trialDaysLeft + " " + (trialDaysLeft === 1 ? t("ov.day") : t("ov.days"))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {trialDaysLeft <= 0 ? t("ov.upgradeKeepRunning") : t("ov.upgradeBeforeEnd")}
                  </p>
                </div>
              </div>
              <Button variant="primary" size="sm" className="shrink-0" onClick={() => router.push("/dashboard?tab=billing")}>
                {trialDaysLeft <= 0 ? t("ov.reactivate") : t("ov.upgradeNow")}
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title={t("ov.messagesToday")} value={stats?.totalMessages?.toLocaleString() || "0"} change={stats?.conversationsThisMonth ? "+" + stats.conversationsThisMonth : "0"} icon={MessageSquare} trend="up" />
            <StatCard title={t("ov.conversionRate")} value={(stats?.conversionRate || "0") + "%"} change={(stats?.resolutionRate || "0") + "% " + t("common.resolved")} icon={TrendingUp} trend="up" />
            <StatCard title={t("ov.totalConversations")} value={stats?.totalConversations?.toLocaleString() || "0"} change={(stats?.resolvedCount || 0) + " " + t("common.resolved")} icon={Users} trend={stats?.resolvedCount > 0 ? "up" : "down"} />
            <StatCard title={t("ov.resolutionRate")} value={(stats?.resolutionRate || "0") + "%"} change={(stats?.csatScore || "0") + "/5 CSAT"} icon={ShoppingBag} trend="up" />
          </div>

          <Card className="border-border shadow-sm overflow-hidden">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", syncStatus?.ownershipVerified ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600")}>
                  {syncStatus?.ownershipVerified ? <ShieldCheck className="w-5 h-5" /> : <ShieldX className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-dark-navy">{t("ov.websiteOwnership")}</h3>
                  <p className="text-xs text-muted-foreground">
                    {syncStatus?.ownershipVerified ? t("ov.ownershipDescVerified") : t("ov.ownershipDescNot")}
                  </p>
                </div>
              </div>
              <Badge className={cn("px-3 py-1", syncStatus?.ownershipVerified ? "bg-green-100 text-green-700 border-green-200" : "bg-yellow-100 text-yellow-700 border-yellow-200")}>
                {syncStatus?.ownershipVerified ? t("ov.verified") : t("ov.notVerified")}
              </Badge>
            </div>
            {!syncStatus?.ownershipVerified && (
              <div className="px-6 pb-6">
                <Button variant="primary" size="sm" onClick={() => router.push("/dashboard?tab=widget")}>{t("ov.installWidget")}</Button>
              </div>
            )}
          </Card>

          <Card className="border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary"><Database className="w-5 h-5" /></div>
                <div>
                  <h3 className="font-bold text-dark-navy">{t("ov.syncStatus")}</h3>
                  <p className="text-xs text-muted-foreground">
                    {syncStatus?.ownershipVerified ? t("ov.syncDescVerified") : t("ov.syncDescNot")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium", syncStatus?.ownershipVerified ? sc.color : "bg-yellow-100 text-yellow-700 border-yellow-200")}>
                  {syncStatus?.ownershipVerified ? <StatusIcon className={cn("w-3.5 h-3.5", syncStatus?.status === "crawling" && "animate-spin")} /> : <ShieldX className="w-3.5 h-3.5" />}
                  {syncStatus?.ownershipVerified ? sc.label : t("ov.notVerified")}
                </div>
                {syncStatus?.ownershipVerified && (
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={triggerSync} disabled={syncing || syncStatus?.status === "crawling"}>
                    <RefreshCw className={cn("w-3.5 h-3.5", syncing && "animate-spin")} />
                    {t("ov.syncNow")}
                  </Button>
                )}
              </div>
            </div>
            <div className="p-6">
              {!syncStatus?.ownershipVerified ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="p-3 bg-yellow-100 rounded-full text-yellow-600 mb-4"><ShieldX className="w-8 h-8" /></div>
                  <h4 className="font-bold text-dark-navy mb-1">{t("ov.websiteNotVerifiedTitle")}</h4>
                  <p className="text-sm text-muted-foreground mb-4 max-w-md">
                    {t("ov.websiteNotVerifiedDesc")}
                  </p>
                  <Button variant="primary" size="sm" onClick={() => router.push("/dashboard?tab=widget")}>{t("ov.goToWidget")}</Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div><p className="text-xs text-muted-foreground mb-1">{t("ov.pagesCrawled")}</p><p className="text-lg font-bold text-dark-navy">{syncStatus?.pagesCrawled || 0}<span className="text-xs text-muted-foreground font-normal ml-1">{t("ov.pages")}</span></p></div>
                    <div><p className="text-xs text-muted-foreground mb-1">{t("ov.productsSynced")}</p><p className="text-lg font-bold text-dark-navy">{syncStatus?.productsSynced || 0}<span className="text-xs text-muted-foreground font-normal ml-1">{t("ov.products")}</span></p></div>
                    <div><p className="text-xs text-muted-foreground mb-1">{t("ov.lastSync")}</p><p className="text-lg font-bold text-dark-navy">{syncStatus?.lastCrawl ? formatTimeAgo(syncStatus.lastCrawl) : t("ov.never")}</p></div>
                    <div><p className="text-xs text-muted-foreground mb-1">{t("ov.nextSync")}</p><p className="text-lg font-bold text-dark-navy">{syncStatus?.nextCrawl ? formatTimeAgo(syncStatus.nextCrawl) : "—"}</p></div>
                  </div>
                  {syncStatus?.websiteUrl && (
                    <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                      <Globe className="w-3.5 h-3.5" />
                      <span>{t("ov.syncingFrom")}</span>
                      <a href={syncStatus.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline flex items-center gap-1">{syncStatus.websiteUrl} <ExternalLink className="w-3 h-3" /></a>
                    </div>
                  )}
                  {syncStatus?.status === "failed" && (
                    <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-red-600">{t("ov.syncFailedDesc")}</span>
                    </div>
                  )}
                  {syncStatus?.status === "idle" && !syncStatus?.lastCrawl && (
                    <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />
                      <span className="text-yellow-600">{t("ov.notSyncedYet")} <strong>{t("ov.syncNow")}</strong> {t("ov.toStartCrawl")}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-dark-navy"><Clock className="w-5 h-5 text-primary" /> {t("ov.recentConversations")}</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                    <tr><th className="px-6 py-3">{t("common.customer")}</th><th className="px-6 py-3">{t("common.status")}</th><th className="px-6 py-3 text-right">{t("common.date")}</th></tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {conversations.length > 0 ? conversations.map((conv: any) => (
                      <tr key={conv.id} className="hover:bg-muted/30 transition-colors group cursor-pointer">
                        <td className="px-6 py-4 text-sm font-medium text-dark-navy">{conv.customerName || t("ov.anonymous")}</td>
                        <td className="px-6 py-4"><Badge variant={conv.resolved ? "primary" : "outline"} className="text-[10px]">{conv.resolved ? t("common.resolved") : t("common.active")}</Badge></td>
                        <td className="px-6 py-4 text-sm text-muted-foreground text-right">{new Date(conv.createdAt).toLocaleDateString()}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={3} className="px-6 py-12 text-center text-sm text-muted-foreground">{t("ov.noConversations")}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="border-border shadow-sm bg-dark-navy text-white p-6 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="p-2 bg-primary/20 rounded-lg text-primary w-fit mb-4"><TrendingUp className="w-5 h-5" /></div>
                  <h3 className="font-bold text-lg mb-2">{t("ov.yourStore")}</h3>
                  <p className="text-sm text-gray-400 mb-4">{store?.name} — {syncStatus?.productsSynced || 0} {t("ov.productsSynced")}</p>
                  <Button variant="primary" size="sm" className="w-full" onClick={() => router.push("/dashboard?tab=widget")}>{t("ov.configureWidget")}</Button>
                </div>
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
              </Card>
              <Card className="border-border shadow-sm p-6">
                <h3 className="font-bold text-dark-navy mb-3">{t("ov.subscription")}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">{t("common.plan")}</span><span className="text-dark-navy font-medium capitalize">{store?.subscriptions?.[0]?.plan || t("ov.free")}</span></div>
                  <div className="flex justify-between text-xs pt-2"><span className="text-muted-foreground">{t("common.status")}</span><span className="text-dark-navy font-medium capitalize">{store?.subscriptions?.[0]?.status || t("common.active")}</span></div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </Wrapper>
  );
}
