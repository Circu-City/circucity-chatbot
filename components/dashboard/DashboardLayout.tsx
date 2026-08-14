"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  Package,
  MessageCircle,
  BarChart3,
  CreditCard,
  Settings,
  BookOpen,
  Database,
  Users,
  Menu,
  X,
  LogOut,
  Bot,
  User,
  Activity,
  HelpCircle,
  Globe,
  GitBranch,
  UserPlus,
  Plug,
  Handshake,
  Search,
  Bell,
  ChevronDown,
  Zap,
  Clock,
  Brain,
  Lock,
  Calendar,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { signOut } from "@/lib/actions/auth";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import NotificationBell from "./NotificationBell";
import { hasFeature, getPlanLevel } from "@/lib/feature-gating";
import { FileText } from "lucide-react";

interface NavItemWithPlan extends NavItemProps {
  feature?: string;
}

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  badge?: string;
  locked?: boolean;
  upgradeLabel?: string;
}

const NavItem = ({ icon: Icon, label, isActive, onClick, badge, locked, upgradeLabel }: NavItemProps) => (
  <button
    onClick={locked ? undefined : onClick}
    className={cn(
      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium",
      isActive
        ? "bg-lemon-gradient text-dark-navy font-bold shadow-md"
        : locked
        ? "text-gray-600 cursor-not-allowed"
        : "text-gray-400 hover:bg-white/10 hover:text-white"
    )}
  >
    {locked ? <Lock className="w-4 h-4 text-gray-600 shrink-0" /> : <Icon className={cn("w-5 h-5", isActive ? "text-dark-navy" : "text-gray-500 group-hover:text-white")} />}
    <span className="flex-1 text-left">{locked ? <span className="line-through">{label}</span> : label}</span>
    {badge && <Badge className="bg-dark-navy/20 text-dark-navy border-0 text-[10px] px-2 py-0.5 font-bold">{badge}</Badge>}
    {locked && upgradeLabel && <Badge className="bg-amber-500/20 text-amber-400 border-0 text-[9px] px-2 py-0.5 font-bold whitespace-nowrap">{upgradeLabel}</Badge>}
  </button>
);

export default function DashboardLayout({ children, activePage, setActivePage }: {
  children: React.ReactNode;
  activePage: string;
  setActivePage: (page: string) => void;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  const [storeName, setStoreName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userInitials, setUserInitials] = useState("U");
  const [currentPlan, setCurrentPlan] = useState("free");
  const [isOnline, setIsOnline] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedEmail, setImpersonatedEmail] = useState("");
  const [usage, setUsage] = useState({ conversations: 0, limit: 1000 });
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/me").then(r => r.json()).catch(() => ({})),
      fetch("/api/client/subscription").then(r => r.json()).catch(() => ({})),
    ]).then(([meRes, subRes]) => {
      if (meRes.success) {
        setUserEmail(meRes.data?.email || "");
        const name = meRes.data?.name || "";
        setUserInitials(name ? name.split(" ").map((s: string) => s[0]).join("").toUpperCase().slice(0, 2) : "U");
        setStoreName(meRes.data?.storeName || meRes.data?.name || "");
      }
      if (subRes.success && subRes.data?.plan) {
        setCurrentPlan(subRes.data.plan);
        const limit = subRes.data.plan === "free" || subRes.data.plan === "starter" ? 1000 : subRes.data.plan === "growth" ? 10000 : 50000;
        setUsage(prev => ({ ...prev, limit }));
      }
    }).catch(() => {}).finally(() => setLoadingUser(false));

    const checkImpersonation = async () => {
      try {
        const res = await fetch("/api/me");
        const json = await res.json();
        if (json.success && json.data?.isImpersonating) {
          setIsImpersonating(true);
          setImpersonatedEmail(json.data.email);
        }
      } catch {}
    };
    checkImpersonation();
  }, []);

  const handleSignOut = async () => {
    setAvatarOpen(false);
    await signOut();
  };

  const planLabel = currentPlan === "free" ? "FREE" : currentPlan === "starter" ? "STARTER" : currentPlan === "growth" ? "GROWTH" : "ENTERPRISE";
  const planColor = currentPlan === "free" ? "text-gray-400 bg-gray-500/20" : currentPlan === "starter" ? "text-blue-400 bg-blue-500/20" : currentPlan === "growth" ? "text-lemon-green bg-lemon-green/20" : "text-amber-400 bg-amber-500/20";
  const usagePct = Math.min(100, Math.round((usage.conversations / usage.limit) * 100));

  const planLevel = getPlanLevel(currentPlan);
  const isLocked = (feature: string) => !hasFeature(feature, currentPlan);

  const mainItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "conversations", label: "Conversations", icon: MessageCircle },
    { id: "ai-agent", label: "AI Agent", icon: Bot },
    { id: "analytics", label: "Analytics", icon: BarChart3, feature: "advanced_analytics" },
    { id: "intelligence", label: "Intelligence", icon: Brain, feature: "unanswered_insights" },
  ];

  const configItems = [
    { id: "widget", label: "Chat Widget", icon: MessageSquare },
    { id: "catalog", label: "Product Catalog", icon: Package },
    { id: "listing", label: "Listings", icon: Store },
    { id: "knowledge", label: "Knowledge Base", icon: Database },
    { id: "templates", label: "Templates", icon: FileText },
    { id: "integrations", label: "Integrations", icon: Plug, feature: "custom_integrations" },
    { id: "flows", label: "Flows", icon: GitBranch, feature: "flows_automation" },
    { id: "unanswered", label: "Unanswered", icon: HelpCircle, feature: "unanswered_insights" },
  ];

  const managementItems = [
    { id: "visitors", label: "Live Visitors", icon: Users },
    { id: "monitoring", label: "Monitoring", icon: Activity },
    { id: "team", label: "Team", icon: UserPlus, feature: "multiple_stores" },
    { id: "booking", label: "Book a Call", icon: Calendar },
    { id: "partner", label: "Partner Program", icon: Handshake },
    { id: "billing", label: "Billing & Plans", icon: CreditCard },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "docs", label: "Docs", icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex overflow-hidden">
      <ImpersonationBanner isImpersonating={isImpersonating} impersonatedEmail={impersonatedEmail} />

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-dark-navy text-white transition-transform duration-300 flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-lemon-gradient rounded-xl flex items-center justify-center shadow-lemon">
              <Bot className="text-dark-navy w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white block leading-tight">CircuCity</span>
              <span className="text-[10px] text-lemon-green font-semibold tracking-wider uppercase">AI</span>
            </div>
          </div>
          <button className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 hide-scrollbar">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-3 mb-3">Main</p>
           {mainItems.map((item: any) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activePage === item.id}
              onClick={() => { setActivePage(item.id); setIsSidebarOpen(false); }}
              locked={item.feature ? isLocked(item.feature) : false}
              upgradeLabel={item.feature && isLocked(item.feature) ? "UPGRADE" : undefined}
            />
          ))}
          <div className="my-3 border-t border-white/10" />
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-3 mb-3">Configuration</p>
          {configItems.map((item: any) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activePage === item.id}
              onClick={() => { setActivePage(item.id); setIsSidebarOpen(false); }}
              locked={item.feature ? isLocked(item.feature) : false}
              upgradeLabel={item.feature && isLocked(item.feature) ? "UPGRADE" : undefined}
            />
          ))}
          <div className="my-3 border-t border-white/10" />
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-3 mb-3">Management</p>
          {managementItems.map((item: any) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activePage === item.id}
              onClick={() => { setActivePage(item.id); setIsSidebarOpen(false); }}
              locked={item.feature ? isLocked(item.feature) : false}
              upgradeLabel={item.feature && isLocked(item.feature) ? "UPGRADE" : undefined}
            />
          ))}
        </nav>

        <div className="border-t border-white/10 px-3 py-3">
          <div className="flex items-center gap-3 px-2 mb-3">
            {loadingUser ? (
              <div className="flex items-center gap-3 w-full">
                <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/10 rounded animate-pulse w-3/4" />
                  <div className="h-2 bg-white/10 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ) : (
              <>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-lemon-green to-green-400 flex items-center justify-center font-bold text-xs text-dark-navy relative">
                  {userInitials}
                  <span className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-dark-navy",
                    isOnline ? "bg-green-500" : "bg-gray-500"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{storeName}</p>
                  <p className="text-[10px] text-gray-500 truncate">{userEmail}</p>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition",
                isOnline ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", isOnline ? "bg-green-400" : "bg-gray-400")} />
              {isOnline ? "Online" : "Offline"}
            </button>
            <div className="flex items-center gap-1 text-[10px] text-gray-500">
              <Clock className="w-3 h-3" />
              24/7
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-white hover:bg-white/5 transition"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="h-14 bg-white border-b border-gray-200 sticky top-0 z-40 px-4 lg:px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="lg:hidden p-2" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-5 h-5 text-gray-600" />
            </Button>
            <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 w-64">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations, customers..."
                className="bg-transparent text-sm text-gray-700 outline-none w-full placeholder-gray-400"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="relative" ref={avatarRef}>
              <button
                onClick={() => setAvatarOpen(!avatarOpen)}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-lemon-green to-green-400 flex items-center justify-center font-bold text-xs text-dark-navy hover:shadow-md transition-shadow"
              >
                {userInitials}
              </button>
              {avatarOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-border rounded-xl shadow-lg z-50 py-2">
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-sm font-medium text-dark-navy">{userEmail}</p>
                    <Badge className={cn("mt-1 text-[10px] border-0", planColor)}>{planLabel}</Badge>
                  </div>
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Usage</span>
                      <span className="text-xs font-medium text-dark-navy">{usage.conversations}/{usage.limit}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-lemon-green rounded-full transition-all" style={{ width: usagePct + "%" }} />
                    </div>
                  </div>
                  <div className="border-t border-border pt-2">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
