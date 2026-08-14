"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Ticket, CheckCircle, Clock, AlertTriangle, XCircle, Loader2, ChevronDown, Mail, MessageSquare, Trash2, Save } from "lucide-react";

interface Ticket {
  id: string;
  name: string;
  email: string;
  category: string;
  priority: string;
  subject: string;
  message: string;
  status: string;
  adminReply: string | null;
  createdAt: string;
}

const STATUS_OPTIONS = ["open", "in_progress", "closed"];
const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"];

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("open");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tickets?status=${filter}`);
      const data = await res.json();
      if (data.success) setTickets(data.tickets);
    } catch { setTickets([]); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const handleReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/admin/tickets/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedTicket.id, reply: replyText, status: "closed" }),
      });
      if (res.ok) {
        setSelectedTicket({ ...selectedTicket, adminReply: replyText, status: "closed" });
        setReplyText("");
        loadTickets();
      }
    } catch {}
    setReplying(false);
  };

  const statusIcon = (s: string) => {
    if (s === "open") return <Clock className="w-4 h-4 text-yellow-500" />;
    if (s === "in_progress") return <AlertTriangle className="w-4 h-4 text-blue-500" />;
    if (s === "closed") return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <XCircle className="w-4 h-4 text-gray-400" />;
  };

  const statusColor = (s: string) => {
    if (s === "open") return "bg-yellow-100 text-yellow-700 border-yellow-200";
    if (s === "in_progress") return "bg-blue-100 text-blue-700 border-blue-200";
    if (s === "closed") return "bg-green-100 text-green-700 border-green-200";
    return "bg-gray-100 text-gray-600 border-gray-200";
  };

  const priorityColor = (p: string) => {
    if (p === "urgent") return "bg-red-100 text-red-700";
    if (p === "high") return "bg-orange-100 text-orange-700";
    if (p === "medium") return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-600";
  };

  const openCount = tickets.filter(t => t.status === "open").length;
  const inProgressCount = tickets.filter(t => t.status === "in_progress").length;
  const closedCount = tickets.filter(t => t.status === "closed").length;

  if (selectedTicket) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedTicket(null)} className="text-sm text-primary font-bold hover:underline mb-4">
          ← Back to tickets
        </button>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">{selectedTicket.subject}</h2>
              <p className="text-sm text-slate-400 mt-1">{selectedTicket.name} · {selectedTicket.email}</p>
            </div>
            <div className="flex gap-2">
              <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold border", statusColor(selectedTicket.status))}>
                {selectedTicket.status}
              </span>
              <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold", priorityColor(selectedTicket.priority))}>
                {selectedTicket.priority}
              </span>
            </div>
          </div>
          <div className="flex gap-2 mb-4">
            <span className="text-xs bg-white/10 text-slate-300 px-2 py-0.5 rounded">{selectedTicket.category}</span>
            <span className="text-xs text-slate-500">{new Date(selectedTicket.createdAt).toLocaleString()}</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{selectedTicket.message}</p>
          </div>

          {selectedTicket.adminReply && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6">
              <p className="text-xs text-emerald-400 font-bold mb-1">Admin Reply</p>
              <p className="text-sm text-slate-200">{selectedTicket.adminReply}</p>
            </div>
          )}

          {selectedTicket.status !== "closed" && (
            <div className="flex gap-2 mb-4">
              <select className="px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 bg-white/5 text-white outline-none focus:border-primary/50"
                value={selectedTicket.status}
                onChange={async (e) => {
                  const newStatus = e.target.value;
                  const res = await fetch(`/api/admin/tickets/${selectedTicket.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: newStatus }),
                  });
                  if (res.ok) {
                    setSelectedTicket({ ...selectedTicket, status: newStatus });
                    loadTickets();
                  }
                }}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
              <select className="px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 bg-white/5 text-white outline-none focus:border-primary/50"
                value={selectedTicket.priority}
                onChange={async (e) => {
                  const newPriority = e.target.value;
                  const res = await fetch(`/api/admin/tickets/${selectedTicket.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ priority: newPriority }),
                  });
                  if (res.ok) setSelectedTicket({ ...selectedTicket, priority: newPriority });
                }}>
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <button onClick={async () => {
                if (!confirm("Delete this ticket?")) return;
                const res = await fetch(`/api/admin/tickets/${selectedTicket.id}`, { method: "DELETE" });
                if (res.ok) { setSelectedTicket(null); loadTickets(); }
              }} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          )}
          {selectedTicket.status !== "closed" && (
            <div className="space-y-3">
              <label className="block text-sm font-bold text-white">Reply to {selectedTicket.name}</label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                placeholder="Type your reply..."
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white resize-none focus:outline-none focus:border-primary/50"
              />
              <button
                onClick={handleReply}
                disabled={replying || !replyText.trim()}
                className="bg-primary text-dark-navy font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-primary/90 disabled:opacity-50"
              >
                {replying ? "Sending..." : "Send Reply & Close"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Support Tickets</h1>
        <p className="text-sm text-slate-400">Manage customer support requests.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Open", count: openCount, color: "text-yellow-500", bg: "bg-yellow-500/10" },
          { label: "In Progress", count: inProgressCount, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Closed", count: closedCount, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
            <p className="text-xs text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["open", "in_progress", "closed", "all"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-all", filter === f ? "bg-primary text-dark-navy" : "bg-white/5 text-slate-400 hover:text-white")}
          >
            {f === "all" ? "All" : f.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : tickets.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <Ticket className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No {filter === "all" ? "" : filter.replace("_", " ") + " "}tickets</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map(ticket => (
            <button
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-5 text-left hover:border-primary/30 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-white text-sm">{ticket.subject}</h4>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", statusColor(ticket.status))}>
                      {ticket.status}
                    </span>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", priorityColor(ticket.priority))}>
                      {ticket.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2 line-clamp-2">{ticket.message}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {ticket.email}</span>
                    <span>{ticket.category}</span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                {statusIcon(ticket.status)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
