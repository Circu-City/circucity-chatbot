'use client';
import { useState, useEffect, useCallback } from 'react';
import { HelpCircle, CheckCircle, RefreshCw, Search, MessageSquare } from 'lucide-react';

interface UnansweredItem {
  question: string;
  reply: string;
  timestamp: string;
  storeName: string;
  storeId: string;
}

export default function UnansweredPage() {
  const [items, setItems] = useState<UnansweredItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/unanswered');
      const json = await res.json();
      if (json.success) setItems(json.data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function addToFaq(item: UnansweredItem) {
    try {
      const res = await fetch('/api/knowledge/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: item.storeId,
          question: item.question,
          answer: item.reply,
        }),
      });
      if (res.ok) {
        setSuccessMsg('Added to FAQ: "' + item.question.substring(0, 50) + '..."');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch {}
  }

  const filtered = items.filter(i =>
    !search || i.question.toLowerCase().includes(search.toLowerCase()) ||
    i.storeName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Unanswered Questions</h2>
          <p className="text-sm text-slate-500">{items.length} questions the bot couldn't answer</p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCw className={"w-3.5 h-3.5" + (loading ? " animate-spin" : "")} /> Refresh
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
          <CheckCircle className="w-4 h-4" /> {successMsg}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search questions or stores..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-400" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {filtered.length === 0 && (
            <div className="p-12 text-center">
              <HelpCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">{loading ? 'Loading...' : 'No unanswered questions yet'}</p>
              <p className="text-xs text-slate-300 mt-1">Questions the bot couldn't answer will appear here</p>
            </div>
          )}
          {filtered.map((item, i) => (
            <div key={i} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 mb-1">{item.question}</p>
                  <p className="text-xs text-slate-500 mb-2">
                    {item.storeName} &middot; {new Date(item.timestamp).toLocaleDateString()} &middot; {new Date(item.timestamp).toLocaleTimeString()}
                  </p>
                  <p className="text-xs text-slate-400 bg-slate-50 p-2 rounded italic">
                    Bot: "{item.reply}"
                  </p>
                </div>
                <button onClick={() => addToFaq(item)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 whitespace-nowrap shrink-0">
                  <MessageSquare className="w-3 h-3" /> Add to FAQ
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
