"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  Store,
  Package,
  MessageCircle,
  CreditCard,
  Activity,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

interface PlatformStats {
  totalUsers: number;
  totalStores: number;
  totalProducts: number;
  totalConversations: number;
  activeSubscriptions: number;
  totalMessages: number;
  recentUsers: { id: string; name: string | null; email: string; createdAt: Date }[];
  recentConversations: { id: string; customerName: string | null; store: { name: string }; createdAt: Date }[];
  planDistribution: { plan: string; _count: number }[];
  storeStatusDistribution: { status: string; _count: number }[];
}

export default function AdminOverviewClient({ stats }: { stats: PlatformStats }) {
  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "bg-blue-500", href: "/admin/users" },
    { label: "Total Stores", value: stats.totalStores, icon: Store, color: "bg-violet-500", href: "/admin/stores" },
    { label: "Products", value: stats.totalProducts, icon: Package, color: "bg-emerald-500", href: "/admin/products" },
    { label: "Conversations", value: stats.totalConversations, icon: MessageCircle, color: "bg-amber-500", href: "/admin/conversations" },
    { label: "Active Subs", value: stats.activeSubscriptions, icon: CreditCard, color: "bg-rose-500", href: "/admin/subscriptions" },
    { label: "Total Messages", value: stats.totalMessages, icon: Activity, color: "bg-cyan-500", href: "/admin/activity" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Admin Overview</h2>
        <p className="text-sm text-slate-500 mt-1">Platform-wide analytics and management dashboard.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all group"
          >
            <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-slate-500 font-medium">{card.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{card.value.toLocaleString()}</p>
          </Link>
        ))}
      </div>

      {/* Charts / Distribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Plan Distribution</h3>
            <CreditCard className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-3">
            {stats.planDistribution.map((p) => (
              <div key={p.plan}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 capitalize">{p.plan}</span>
                  <span className="font-medium text-slate-900">{p._count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all"
                    style={{ width: `${(p._count / Math.max(...stats.planDistribution.map((x) => x._count))) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {stats.planDistribution.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No subscriptions yet</p>
            )}
          </div>
        </div>

        {/* Store Status Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Store Status</h3>
            <Store className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-3">
            {stats.storeStatusDistribution.map((s) => (
              <div key={s.status}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 capitalize">{s.status}</span>
                  <span className="font-medium text-slate-900">{s._count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      s.status === "active" ? "bg-emerald-400" : s.status === "suspended" ? "bg-red-400" : "bg-amber-400"
                    }`}
                    style={{ width: `${(s._count / Math.max(...stats.storeStatusDistribution.map((x) => x._count))) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {stats.storeStatusDistribution.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No stores yet</p>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Recent Users</h3>
            <Link href="/admin/users" className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
                  {(user.name || user.email)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{user.name || "Unnamed"}</p>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
              </div>
            ))}
            {stats.recentUsers.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No users yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Conversations */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Recent Conversations</h3>
          <Link href="/admin/conversations" className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Store</th>
                <th className="px-6 py-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.recentConversations.map((conv) => (
                <tr key={conv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{conv.customerName || "Anonymous"}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{conv.store.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-400 text-right">
                    {new Date(conv.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {stats.recentConversations.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-slate-400">
                    No conversations yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}