'use client';
import { useState, useEffect, useCallback } from 'react';
import { Lightbulb, AlertTriangle, CheckCircle, Info, Store, RefreshCw } from 'lucide-react';

interface RecItem {
  type: string;
  severity: string;
  title: string;
  description: string;
  action: string;
}

interface StoreRecs {
  storeId: string;
  storeName: string;
  recommendations: RecItem[];
  score: { total: number; high: number; medium: number; low: number };
}

export default function RecommendationsPage() {
  const [data, setData] = useState<StoreRecs[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/recommendations');
      const json = await res.json();
      if (json.success) setData(json.data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const severityIcon = (sev: string) => {
    switch (sev) {
      case 'high': return <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />;
      case 'medium': return <Info className="w-3.5 h-3.5 text-amber-500" />;
      default: return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />;
    }
  };

  const severityColor = (sev: string) => {
    switch (sev) {
      case 'high': return 'bg-rose-50 border-rose-200';
      case 'medium': return 'bg-amber-50 border-amber-200';
      default: return 'bg-emerald-50 border-emerald-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Strategic Recommendations</h2>
          <p className="text-sm text-slate-500">Automated insights to improve each workspace</p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCw className={'w-3.5 h-3.5' + (loading ? ' animate-spin' : '')} /> Refresh
        </button>
      </div>

      {loading && !data.length && (
        <div className="p-12 text-center text-sm text-slate-400">Analyzing workspaces...</div>
      )}

      {data.length === 0 && !loading && (
        <div className="p-12 text-center">
          <Lightbulb className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No recommendations yet</p>
          <p className="text-xs text-slate-300 mt-1">As stores add products and receive inquiries, insights will appear here</p>
        </div>
      )}

      {data.filter(s => s.recommendations.length > 0).map((store) => (
        <div key={store.storeId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-slate-500" />
              <h3 className="font-semibold text-slate-900">{store.storeName}</h3>
            </div>
            <div className="flex gap-2 text-[10px] font-bold">
              {store.score.high > 0 && <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">{store.score.high} High</span>}
              {store.score.medium > 0 && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{store.score.medium} Med</span>}
              {store.score.low > 0 && <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{store.score.low} Low</span>}
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {store.recommendations.map((rec, i) => (
              <div key={i} className={'p-4 border-l-2 ' + (rec.severity === 'high' ? 'border-l-rose-400' : rec.severity === 'medium' ? 'border-l-amber-400' : 'border-l-emerald-400')}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{severityIcon(rec.severity)}</div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-900 mb-1">{rec.title}</h4>
                    <p className="text-xs text-slate-600 mb-2">{rec.description}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      <Lightbulb className="w-2.5 h-2.5" /> {rec.action}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {data.filter(s => s.recommendations.length > 0).length === 0 && data.length > 0 && !loading && (
        <div className="p-12 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-emerald-700">All workspaces look good!</p>
          <p className="text-xs text-slate-400 mt-1">No critical issues found.</p>
        </div>
      )}
    </div>
  );
}
