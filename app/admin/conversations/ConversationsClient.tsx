"use client";

import React, { useState, useCallback } from "react";
import { Search, MessageCircle, ChevronLeft, ChevronRight, Eye, Send, CheckCircle, Trash2 } from "lucide-react";

interface ConvItem {
  id: string;
  customerName: string | null;
  customerEmail: string | null;
  sentiment: string | null;
  resolved: boolean;
  escalated: boolean;
  messages: any;
  createdAt: Date;
  updatedAt: Date;
  store: { id: string; name: string };
}

interface PaginatedResult {
  conversations: ConvItem[];
  total: number;
  page: number;
  totalPages: number;
}

export default function ConversationsClient({ initialData }: { initialData: PaginatedResult }) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [resolvedFilter, setResolvedFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [viewingConv, setViewingConv] = useState<ConvItem | null>(null);
  const [agentReply, setAgentReply] = useState("");
  const [agentName, setAgentName] = useState("Support Agent");
  const [sending, setSending] = useState(false);

  const fetchData = useCallback(async (page: number, searchTerm?: string, resolved?: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString() });
    if (searchTerm) params.set("search", searchTerm);
    if (resolved && resolved !== "all") params.set("resolved", resolved);
    const res = await fetch(`/api/admin/conversations?${params}`);
    const json = await res.json();
    if (json.success) setData(json.data);
    setLoading(false);
  }, []);

  const handleSearch = () => fetchData(1, search, resolvedFilter);

  const handleResolve = async (sessionId: string) => {
    setSending(true);
    try {
      await fetch("/api/admin/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve", id: sessionId }),
      });
      fetchData(data.page, search, resolvedFilter);
      setViewingConv(null);
    } catch {}
    setSending(false);
  };

  const handleDeleteConv = async (id: string) => {
    if (!confirm("Delete this conversation? This cannot be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/conversations/${id}`, { method: "DELETE" });
      if (res.ok) fetchData(data.page, search, resolvedFilter);
    } catch {}
    setLoading(false);
  };

  const handleAgentReply = async () => {
    if (!viewingConv || !agentReply.trim()) return;
    setSending(true);
    try {
      await fetch("/api/admin/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reply",
          id: viewingConv.id,
          agentReply: agentReply.trim(),
          agentName,
        }),
      });
      setAgentReply("");
      fetchData(data.page, search, resolvedFilter);
      setViewingConv(null);
    } catch {}
    setSending(false);
  };

  const parseMessages = (conv: ConvItem): any[] => {
    if (Array.isArray(conv.messages)) return conv.messages;
    try { return JSON.parse(conv.messages); } catch { return []; }
  };

  return (
    <div className="space-y-6">
      {/* View & Reply Modal */}
      {viewingConv && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setViewingConv(null); setAgentReply(""); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Conversation Detail</h3>
                <p className="text-sm text-slate-500">{viewingConv.customerName || "Anonymous"}{viewingConv.customerEmail ? ` (${viewingConv.customerEmail})` : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                {viewingConv.escalated && !viewingConv.resolved && (
                  <button onClick={() => handleResolve(viewingConv.id)}
                    className="px-3 py-1.5 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 flex items-center gap-1"
                    disabled={sending}>
                    <CheckCircle className="w-3 h-3" /> Resolve
                  </button>
                )}
                <button onClick={() => { setViewingConv(null); setAgentReply(""); }} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
              </div>
            </div>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {parseMessages(viewingConv).length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">No messages in this conversation</p>
              )}
              {parseMessages(viewingConv).map((msg: any, i: number) => {
                const isBot = msg.role === "bot" || msg.role === "assistant";
                const isAgent = msg.role === "agent";
                const isUser = msg.role === "user";
                const name = isAgent ? (msg.agentName || "Agent") : isBot ? "AI" : isUser ? "Customer" : msg.role;
                return (
                  <div key={i} className={`p-3 rounded-xl text-sm ${isAgent ? "bg-purple-50 ml-8 border border-purple-100" : isBot ? "bg-emerald-50 ml-8" : isUser ? "bg-blue-50 mr-8" : "bg-gray-50 mr-8"}`}>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                      {name}
                      {msg.timestamp && <span className="font-normal">{new Date(msg.timestamp).toLocaleTimeString()}</span>}
                    </p>
                    <p className="text-slate-700 whitespace-pre-wrap">{msg.content}</p>
                  </div>
                );
              })}
            </div>
            {/* Reply Form */}
            {viewingConv.escalated && !viewingConv.resolved && (
              <div className="border-t border-gray-100 p-4 space-y-3">
                <div className="flex gap-2">
                  <input type="text" placeholder="Your name (optional)"
                    className="w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                    value={agentName} onChange={(e) => setAgentName(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <textarea placeholder="Type your reply..."
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm resize-none outline-none focus:ring-2 focus:ring-emerald-400"
                    rows={2} value={agentReply} onChange={(e) => setAgentReply(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAgentReply(); } }} />
                  <button onClick={handleAgentReply} disabled={sending || !agentReply.trim()}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-40 flex items-center gap-1">
                    <Send className="w-3.5 h-3.5" /> Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Conversations</h2>
          <p className="text-sm text-slate-500">{data.total} total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchData(1, search, "unresolved")}
            className="px-3 py-1.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200">
            Escalated
          </button>
          <button onClick={() => fetchData(1, search, "all")}
            className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">
            All
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search by customer name or email..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
            value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
        </div>
        <select className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none"
          value={resolvedFilter} onChange={(e) => { setResolvedFilter(e.target.value); fetchData(1, search, e.target.value); }}>
          <option value="all">All</option>
          <option value="resolved">Resolved</option>
          <option value="unresolved">Unresolved</option>
        </select>
        <button onClick={handleSearch} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
          Search
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Store</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Sentiment</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.conversations.map((conv) => (
                <tr key={conv.id} className={`hover:bg-gray-50 transition-colors ${conv.escalated && !conv.resolved ? "bg-amber-50/50" : ""}`}>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{conv.customerName || "Anonymous"}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{conv.store.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {conv.resolved && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Resolved</span>}
                      {conv.escalated && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Escalated</span>}
                      {!conv.resolved && !conv.escalated && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Open</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{conv.sentiment || "-"}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{new Date(conv.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { setViewingConv(conv); setAgentReply(""); }}
                      className="p-2 rounded-lg hover:bg-gray-100 text-slate-400 hover:text-emerald-600 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteConv(conv.id)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-slate-400 hover:text-red-500 transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {data.conversations.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">No conversations found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {data.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">Page {data.page} of {data.totalPages}</span>
            <div className="flex gap-1">
              <button disabled={data.page <= 1} onClick={() => fetchData(data.page - 1, search, resolvedFilter)}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50">
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button disabled={data.page >= data.totalPages} onClick={() => fetchData(data.page + 1, search, resolvedFilter)}
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
