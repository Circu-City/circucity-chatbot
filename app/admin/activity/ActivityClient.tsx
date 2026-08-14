"use client";

import React, { useState, useCallback } from "react";
import { Activity, ChevronLeft, ChevronRight, Shield, UserCog, Store, CreditCard } from "lucide-react";

interface LogItem {
  id: string;
  action: string;
  target: string | null;
  targetId: string | null;
  details: any;
  createdAt: Date;
  admin: { id: string; name: string | null; email: string };
}

interface PaginatedResult {
  logs: LogItem[];
  total: number;
  page: number;
  totalPages: number;
}

export default function ActivityClient({ initialData }: { initialData: PaginatedResult }) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (page: number) => {
    setLoading(true);
    const res = await fetch(`/api/admin/activity?page=${page}`);
    const json = await res.json();
    if (json.success) setData(json.data);
    setLoading(false);
  }, []);

  const getActionIcon = (action: string) => {
    if (action.includes("user")) return UserCog;
    if (action.includes("store")) return Store;
    if (action.includes("subscription") || action.includes("plan")) return CreditCard;
    return Shield;
  };

  const getActionColor = (action: string) => {
    if (action.includes("delete")) return "text-red-600 bg-red-50";
    if (action.includes("create")) return "text-emerald-600 bg-emerald-50";
    if (action.includes("update")) return "text-blue-600 bg-blue-50";
    return "text-slate-600 bg-slate-50";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Activity Log</h2>
        <p className="text-sm text-slate-500">{data.total} total admin actions logged</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-3">Admin</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Target</th>
                <th className="px-6 py-3">Target ID</th>
                <th className="px-6 py-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.logs.map((log) => {
                const Icon = getActionIcon(log.action);
                const colorClass = getActionColor(log.action);
                return (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {log.admin.name || log.admin.email}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${colorClass}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm text-slate-700 capitalize">
                          {log.action.replace(/_/g, " ")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{log.target || "-"}</td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                      {log.targetId ? log.targetId.substring(0, 12) + "..." : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 text-right">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {data.logs.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">No activity logged yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {data.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">Page {data.page} of {data.totalPages}</span>
            <div className="flex gap-1">
              <button disabled={data.page <= 1} onClick={() => fetchData(data.page - 1)}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50">
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button disabled={data.page >= data.totalPages} onClick={() => fetchData(data.page + 1)}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50">
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}