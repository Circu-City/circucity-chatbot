"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MessageCircle, Mail, Activity, Users, ClipboardList, Send, RefreshCw, CheckCheck, Copy, Check, ChevronDown, ArrowUpRight } from "lucide-react";

type Activity = { id: string; action: string; details: string | null; createdAt: string; user?: { name: string | null; email: string } };
type Lead = { id: string; company: string; contact: string; email: string; stage: string; value: number | null; nextFollowup: string | null; notes: string | null; source: string | null; createdAt: string };
type StaffMember = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  emailVerified: boolean;
  partner: { id: string; status: string; type: string; referralCode: string; clickCount: number; referralCount: number; conversionRate: number; totalEarned: number; totalPaid: number; approvedAt: string | null; link: string } | null;
  crm: { registered: boolean; activated: boolean; createdAt: string | null };
  messagesSent: number;
  unreadFromThem: number;
  recentActivities: Activity[];
  leads: Lead[];
};
type Thread = { user: { id: string; name: string | null; email: string }; lastMessage: { body: string; createdAt: string; senderId: string }; unread: number };
type ChatMsg = { id: string; senderId: string; body: string; createdAt: string; sender: { name: string | null; email: string } };

const stageColors: Record<string, string> = {
  "Closed Won": "bg-green-100 text-green-700",
  "Closed Lost": "bg-red-100 text-red-700",
  "Meeting Scheduled": "bg-purple-100 text-purple-700",
  "Proposal Sent": "bg-indigo-100 text-indigo-700",
  Registered: "bg-blue-100 text-blue-700",
};
const stageColor = (s: string) => stageColors[s] || "bg-gray-100 text-gray-700";

export default function AdminStaffPage() {
  const [tab, setTab] = useState("staff");
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [openThread, setOpenThread] = useState<string | null>(null);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [adminId, setAdminId] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [activityFilter, setActivityFilter] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [leadStage, setLeadStage] = useState("all");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadStaff = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/staff");
      const j = await r.json();
      if (j.success) setStaff(j.staff);
    } catch { setError("Failed to load staff"); }
  }, []);

  const loadThreads = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/messages");
      const j = await r.json();
      if (j.success) setThreads(j.threads);
    } catch {}
  }, []);

  const loadActivities = useCallback(async (userId?: string) => {
    try {
      const r = await fetch("/api/admin/staff/activities" + (userId ? `?userId=${userId}` : ""));
      const j = await r.json();
      if (j.success) setActivities(j.activities);
    } catch {}
  }, []);

  useEffect(() => { setLoading(true); Promise.all([loadStaff(), loadThreads(), loadActivities()]).finally(() => setLoading(false)); }, [loadStaff, loadThreads, loadActivities]);
  useEffect(() => {
    const t = setInterval(() => { loadThreads(); if (openThread) loadChat(openThread); }, 5000);
    return () => clearInterval(t);
  }, [openThread]);

  const loadChat = async (userId: string) => {
    try {
      const r = await fetch("/api/admin/messages/" + userId);
      const j = await r.json();
      if (j.success) { setChat(j.messages); setAdminId(j.adminId); }
    } catch {}
  };

  const openConversation = async (userId: string) => {
    setOpenThread(userId);
    await loadChat(userId);
  };

  const sendMessage = async () => {
    if (!draft.trim() || !openThread) return;
    setSending(true);
    try {
      await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: openThread, body: draft.trim() }),
      });
      setDraft("");
      await loadChat(openThread);
      await loadThreads();
    } finally { setSending(false); }
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  const statusBadge = (m: StaffMember) => {
    if (m.role !== "partner") return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">{m.role}</span>;
    const s = m.partner?.status;
    const crmOk = m.crm.registered;
    if (s === "pending") return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Pending approval</span>;
    if (!crmOk) return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Approved - not registered</span>;
    if (!m.crm.activated) return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">Registered - not activated</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">Active</span>;
  };

  const filteredStaff = staff.filter(m => {
    const q = search.toLowerCase();
    return !q || (m.name || "").toLowerCase().includes(q) || (m.email || "").toLowerCase().includes(q);
  });

  const allLeads = staff.flatMap(m => m.leads.map(l => ({ ...l, person: m.name || m.email })));
  const filteredLeads = allLeads.filter(l => leadStage === "all" || l.stage === leadStage);
  const leadStages = [...new Set(allLeads.map(l => l.stage))];

  const tabBtn = (id: string, label: string, Icon: any, badge?: number) => (
    <button onClick={() => setTab(id)} className={"px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 " + (tab === id ? "bg-dark-navy text-white" : "bg-gray-100 text-gray-600")}>
      <Icon className="w-4 h-4" /> {label} {badge ? <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-500 text-white">{badge}</span> : null}
    </button>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-navy">Staff Management</h1>
          <p className="text-sm text-gray-500">Monitor staff and partners, track progress, and stay in touch</p>
        </div>
        <button onClick={() => { setLoading(true); Promise.all([loadStaff(), loadThreads(), loadActivities()]).finally(() => setLoading(false)); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border text-sm font-bold">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        {tabBtn("staff", "Staff", Users, staff.filter(m => m.unreadFromThem > 0).length)}
        {tabBtn("messages", "Messages", MessageCircle, threads.reduce((s, t) => s + t.unread, 0))}
        {tabBtn("activities", "Activities", Activity)}
        {tabBtn("leads", "Leads", ClipboardList, filteredLeads.length)}
      </div>

      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm font-semibold">{error}</div>}

      {loading && tab === "staff" && <div className="text-center py-16 text-gray-400">Loading staff…</div>}

      {tab === "staff" && !loading && (
        <div>
          <div className="mb-4 max-w-md">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…" className="w-full p-2.5 rounded-xl border text-sm" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {filteredStaff.map(m => (
              <div key={m.id} className="bg-white rounded-xl border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-dark-navy flex items-center gap-2">{m.name || m.email} {statusBadge(m)}</div>
                    <div className="text-xs text-gray-500">{m.email}</div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {m.role !== "admin" && (
                      <button onClick={() => openConversation(m.id)} title="Message" className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}
                    <a href={"mailto:" + m.email} title="Email" className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
                      <Mail className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {m.unreadFromThem > 0 && <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold"><MessageCircle className="w-3 h-3" /> {m.unreadFromThem} unread message{m.unreadFromThem > 1 ? "s" : ""}</div>}

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 rounded-lg p-2"><span className="text-gray-500 block">Messages sent</span><span className="font-bold">{m.messagesSent}</span></div>
                  <div className="bg-slate-50 rounded-lg p-2"><span className="text-gray-500 block">Leads</span><span className="font-bold">{m.leads.length}</span></div>
                  {m.partner && (
                    <>
                      <div className="bg-slate-50 rounded-lg p-2"><span className="text-gray-500 block">Clicks</span><span className="font-bold">{m.partner.clickCount}</span></div>
                      <div className="bg-slate-50 rounded-lg p-2"><span className="text-gray-500 block">Commission earned</span><span className="font-bold">${(m.partner.totalEarned || 0).toFixed(2)}</span></div>
                    </>
                  )}
                </div>

                {m.partner && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="text-gray-500 shrink-0">Referral:</span>
                    <code className="flex-1 truncate bg-slate-50 rounded px-2 py-1">{m.partner.link}</code>
                    <button onClick={() => copyLink(m.partner.link)} className="p-1.5 rounded bg-gray-100 hover:bg-gray-200">
                      {copied === m.partner.link ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a href={m.partner.link} target="_blank" rel="noreferrer" className="p-1.5 rounded bg-gray-100 hover:bg-gray-200"><ArrowUpRight className="w-3.5 h-3.5" /></a>
                  </div>
                )}

                {m.recentActivities.length > 0 && (
                  <details className="mt-3 bg-slate-50 rounded-xl">
                    <summary className="p-2.5 cursor-pointer text-xs font-bold text-gray-600 flex items-center gap-1">Recent activity <ChevronDown className="w-3.5 h-3.5" /></summary>
                    <div className="px-2.5 pb-2.5 space-y-1.5">
                      {m.recentActivities.slice(0, 6).map(a => (
                        <div key={a.id} className="text-xs text-gray-600">
                          <span className="text-gray-400">[{new Date(a.createdAt).toLocaleString()}]</span> <span className="font-semibold">{a.action}</span> {a.details ? <span className="text-gray-500">- {a.details}</span> : null}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            ))}
            {filteredStaff.length === 0 && <div className="col-span-2 text-center py-12 text-gray-400">No staff found</div>}
          </div>
        </div>
      )}

      {tab === "messages" && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border overflow-y-auto" style={{ maxHeight: 560 }}>
            {threads.map(t => (
              <button key={t.user.id} onClick={() => openConversation(t.user.id)} className={"w-full text-left px-4 py-3 border-b flex items-center gap-3 hover:bg-gray-50 " + (openThread === t.user.id ? "bg-blue-50" : "")}>
                <div className="w-9 h-9 rounded-full bg-dark-navy text-white flex items-center justify-center font-bold text-sm shrink-0">{(t.user.name || t.user.email)[0]?.toUpperCase()}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold truncate">{t.user.name || t.user.email}</div>
                  <div className="text-xs text-gray-500 truncate">{t.lastMessage.body}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-gray-400">{new Date(t.lastMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                  {t.unread > 0 && <div className="mt-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">{t.unread}</div>}
                </div>
              </button>
            ))}
            {threads.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">No conversations yet</div>}
          </div>

          <div className="md:col-span-2 bg-white rounded-xl border flex flex-col" style={{ maxHeight: 560 }}>
            {openThread ? (
              <>
                <div className="p-3 border-b font-bold text-sm">{threads.find(t => t.user.id === openThread)?.user.name || threads.find(t => t.user.id === openThread)?.user.email || "Conversation"}</div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {chat.map(m => (
                    <div key={m.id} className={"flex " + (m.senderId === adminId ? "justify-end" : "justify-start")}>
                      <div className={"max-w-[75%] rounded-2xl px-3.5 py-2 text-sm " + (m.senderId === adminId ? "bg-dark-navy text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm")}>
                        <div>{m.body}</div>
                        <div className={"text-[10px] mt-1 " + (m.senderId === adminId ? "text-white/60" : "text-gray-400")}>{new Date(m.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-3 border-t flex gap-2">
                  <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Type a message…" className="flex-1 p-2.5 rounded-xl border text-sm" />
                  <button onClick={sendMessage} disabled={sending || !draft.trim()} className="px-4 py-2 rounded-xl bg-dark-navy text-white font-bold disabled:opacity-40 flex items-center gap-2">
                    <Send className="w-4 h-4" /> Send
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Select a conversation</div>
            )}
          </div>
        </div>
      )}

      {tab === "activities" && (
        <div>
          <div className="mb-4 max-w-md">
            <select value={activityFilter} onChange={e => { setActivityFilter(e.target.value); loadActivities(e.target.value || undefined); }} className="w-full p-2.5 rounded-xl border text-sm">
              <option value="">All staff</option>
              {staff.map(m => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
            </select>
          </div>
          <div className="bg-white rounded-xl border divide-y">
            {activities.map(a => (
              <div key={a.id} className="px-4 py-3 flex items-start gap-3 text-sm">
                <Activity className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                <div>
                  <span className="text-gray-400 text-xs">[{new Date(a.createdAt).toLocaleString()}]</span>{" "}
                  <span className="font-bold">{a.user?.name || a.user?.email || "Unknown"}</span> <span className="font-semibold text-dark-navy">{a.action}</span>
                  {a.details ? <span className="text-gray-500"> - {a.details}</span> : null}
                </div>
              </div>
            ))}
            {activities.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">No activity recorded yet</div>}
          </div>
        </div>
      )}

      {tab === "leads" && (
        <div>
          <div className="mb-4 flex gap-2 flex-wrap">
            <button onClick={() => setLeadStage("all")} className={"px-3 py-1.5 rounded-lg text-xs font-bold " + (leadStage === "all" ? "bg-dark-navy text-white" : "bg-gray-100 text-gray-600")}>All ({allLeads.length})</button>
            {leadStages.map(s => <button key={s} onClick={() => setLeadStage(s)} className={"px-3 py-1.5 rounded-lg text-xs font-bold " + (leadStage === s ? "bg-dark-navy text-white" : "bg-gray-100 text-gray-600")}>{s}</button>)}
          </div>
          <div className="bg-white rounded-xl border overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-left text-xs font-bold text-gray-500">
                <th className="p-3">Company</th><th className="p-3">Contact</th><th className="p-3">Stage</th><th className="p-3">Value</th><th className="p-3">Staff / Partner</th><th className="p-3">Next follow-up</th><th className="p-3">Source</th><th className="p-3">Notes</th>
              </tr></thead>
              <tbody>
                {filteredLeads.map(l => (
                  <tr key={l.id} className="border-t">
                    <td className="p-3 font-medium">{l.company}</td>
                    <td className="p-3 text-gray-500">{l.contact}</td>
                    <td className="p-3"><span className={"px-2 py-0.5 rounded-full text-xs font-bold " + stageColor(l.stage)}>{l.stage}</span></td>
                    <td className="p-3">{l.value ? "$" + l.value.toLocaleString() : "-"}</td>
                    <td className="p-3 text-gray-500">{(l as any).person}</td>
                    <td className="p-3 text-gray-500">{l.nextFollowup ? new Date(l.nextFollowup).toLocaleDateString() : "-"}</td>
                    <td className="p-3 text-gray-500">{l.source || "-"}</td>
                    <td className="p-3 text-gray-500 max-w-[200px] truncate">{l.notes || "-"}</td>
                  </tr>
                ))}
                {filteredLeads.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-gray-400">No leads in this stage</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
