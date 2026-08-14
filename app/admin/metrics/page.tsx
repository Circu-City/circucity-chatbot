'use client';
import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, ShoppingBag, Store, TrendingUp, AlertTriangle, CheckCircle, Activity, Bot } from 'lucide-react';

interface MetricsData {
  period: { days: number };
  totals: { conversations: number; messages: number; avgMessagesPerConv: number; stores: number; activeProducts: number };
  quality: { escalated: number; resolved: number; escalationRate: number; resolutionRate: number; negativeSentimentRate: number };
  trends: { daily: { date: string; messages: number }[] };
}

export default function MetricsPage() {
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/metrics?days=' + days);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {}
    setLoading(false);
  }, [days]);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Business Metrics</h2>
          <p className="text-sm text-slate-500">Performance overview for the last {days} days</p>
        </div>
        <select value={days} onChange={e => setDays(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
        </select>
      </div>

      {loading && !data && (
        <div className="p-12 text-center text-sm text-slate-400">Loading metrics...</div>
      )}

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-emerald-600 mb-2">
                <MessageCircle className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Conversations</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{data.totals.conversations}</p>
              <p className="text-xs text-slate-400">{data.totals.messages} messages total</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Activity className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Avg Msgs/Chat</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{data.totals.avgMessagesPerConv}</p>
              <p className="text-xs text-slate-400">Per conversation</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <ShoppingBag className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Products</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{data.totals.activeProducts}</p>
              <p className="text-xs text-slate-400">Active in catalog</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-amber-600 mb-2">
                <Store className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Workspaces</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{data.totals.stores}</p>
              <p className="text-xs text-slate-400">Active</p>
            </div>
          </div>

          {/* Quality Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Resolution Rate
              </h3>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold text-slate-900">{data.quality.resolutionRate}%</p>
                <span className="text-xs text-slate-400 mb-1">{data.quality.resolved} resolved</span>
              </div>
              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: data.quality.resolutionRate + '%' }} />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Escalation Rate
              </h3>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold text-slate-900">{data.quality.escalationRate}%</p>
                <span className="text-xs text-slate-400 mb-1">{data.quality.escalated} escalated</span>
              </div>
              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: data.quality.escalationRate + '%' }} />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-rose-500" /> Negative Sentiment
              </h3>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold text-slate-900">{data.quality.negativeSentimentRate}%</p>
                <span className="text-xs text-slate-400 mb-1">of conversations</span>
              </div>
              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: data.quality.negativeSentimentRate + '%' }} />
              </div>
            </div>
          </div>

          {/* Daily Trend */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-500" /> Daily Messages
            </h3>
            {data.trends.daily.length > 0 ? (
              <div className="h-40 flex items-end gap-1">
                {data.trends.daily.slice(-30).map((d, i) => {
                  const max = Math.max(...data.trends.daily.map(x => x.messages), 1);
                  const h = (d.messages / max) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="w-full bg-emerald-100 rounded-t hover:bg-emerald-200 transition-colors relative"
                        style={{ height: Math.max(h, 2) + '%' }}>
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                          {d.messages}
                        </span>
                      </div>
                      {data.trends.daily.length <= 31 && (
                        <span className="text-[7px] text-slate-300 -rotate-45 origin-left">{d.date.slice(5)}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">No message data for this period</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
