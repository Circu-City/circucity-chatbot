"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  CreditCard,
  MessageCircle,
  Key,
  Activity,
  Settings,
  Shield,
  HelpCircle, TrendingUp, Lightbulb, BookOpen,
  Menu,
  X,
  LogOut,
  Bot,
  ChevronDown,
  Mail,
  Eye,
  Building2,
  Handshake,
  Briefcase,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ImpersonationBanner from "@/components/ImpersonationBanner";

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, href: "/admin" },
  { id: "organizations", label: "Organizations", icon: Building2, href: "/admin/organizations" },
  { id: "users", label: "Users", icon: Users, href: "/admin/users" },
  { id: "stores", label: "Workspaces", icon: Store, href: "/admin/stores" },
  { id: "products", label: "Products", icon: Package, href: "/admin/products" },
  { id: "subscriptions", label: "Subscriptions", icon: CreditCard, href: "/admin/subscriptions" },
  { id: "conversations", label: "Conversations", icon: MessageCircle, href: "/admin/conversations" },
  { id: "api-keys", label: "API Keys", icon: Key, href: "/admin/api-keys" },
  { id: "activity", label: "Activity Log", icon: Activity, href: "/admin/activity" },
  { id: "settings", label: "Settings", icon: Settings, href: "/admin/settings" },
  { id: "platform-config", label: "Platform Config", icon: Key, href: "/admin/platform-config" },
  { id: "tickets", label: "Support Tickets", icon: Mail, href: "/admin/tickets" },
  { id: "moderation", label: "Moderation", icon: Eye, href: "/admin/moderation" },
  { id: "knowledge", label: "Knowledge Base", icon: BookOpen, href: "/admin/knowledge" },
  { id: "unanswered", label: "Unanswered", icon: HelpCircle, href: "/admin/unanswered" },
  { id: "partner-applications", label: "Partner Applications", icon: Handshake, href: "/admin/partner-applications" },
  { id: "partners", label: "Partners", icon: TrendingUp, href: "/admin/partners" },
  { id: "staff", label: "Staff & Leads", icon: ClipboardList, href: "/admin/staff" },
  { id: "metrics", label: "Metrics", icon: TrendingUp, href: "/admin/metrics" },
  { id: "jobs", label: "Jobs", icon: Briefcase, href: "/admin/jobs" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedEmail, setImpersonatedEmail] = useState("");

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/me");
        const json = await res.json();
        if (json.success && json.data?.isImpersonating) {
          setIsImpersonating(true);
          setImpersonatedEmail(json.data.email);
        }
      } catch {}
    };
    check();
  }, []);

  const activePage = navItems.find((item) =>
    item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
  )?.id || "overview";

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      <ImpersonationBanner isImpersonating={isImpersonating} impersonatedEmail={impersonatedEmail} />
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out transform",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full p-4">
          {/* Logo */}
          <div className="flex items-center justify-between px-2 mb-8">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-emerald-400 rounded-xl flex items-center justify-center">
                <Shield className="text-slate-900 w-5 h-5" />
              </div>
              <span className="text-lg font-bold">Admin Panel</span>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto hide-scrollbar">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm",
                  activePage === item.id
                    ? "bg-emerald-400/20 text-emerald-400 font-bold"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className={cn("w-5 h-5", activePage === item.id ? "text-emerald-400" : "text-gray-400 group-hover:text-white")} />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-4 pt-4 border-t border-white/10">
            <button
              onClick={async () => { await signOut(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 text-sm"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-40 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 text-gray-500"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 capitalize">
              {navItems.find((n) => n.id === activePage)?.label || "Admin"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <Shield className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-8 flex-1">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
