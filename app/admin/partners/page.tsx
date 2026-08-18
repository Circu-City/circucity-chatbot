"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, ClipboardList, Megaphone, CheckCheck, Copy, Check, Mail, Send, RefreshCw, MessageSquare } from "lucide-react";

type CrmPartner = { id: string; email: string; name: string; role: string; created_at: string; setup_token: string | null; setup_expires: string | null };
type CrmLead = { id: string; company: string; contact_name: string; email: string; stage: string; expected_value_usd: number | null; next_followup: string | null; notes: string | null; source: string | null; created_at: string; partner_name: string | null };
type ProgramPartner = {
  id: string; firstName: string | null; lastName: string | null; email: string | null; type: string; status: string;
  referralCode: string; link: string; clickCount: number; referralCount: number; conversionRate: number;
  totalEarned: number; totalPaid: number; approvedAt: string | null; createdAt: string;
  registered: boolean; activated: boolean; convertedReferrals: number; commissionEarned: number; commissionsPending: number;
  messages: { id: string; subject: string; body: string; createdAt: string }[];
};
type PartnerMsgHistory = { id: string; subject: string; body: string; createdAt: string };

const stageColors: Record<string, string> = {
  "Closed Won": "bg-green-100 text-green-700",
  "Closed Lost": "bg-red-100 text-red-700",
  "Meeting Scheduled": "bg-purple-100 text-purple-700",
  "Proposal Sent": "bg-indigo-100 text-indigo-700",
  Registered: "bg-blue-100 text-blue-700",
};
const stageColor = (s: string) => stageColors[s] || "bg-gray-100 text-gray-700";

export default function AdminPartnersPage() {
  const [tab, setTab] = useState("overview");
  const [crm, setCrm] = useState<{ partners: CrmPartner[]; leads: CrmLead[]; kpis: any; tasks: any[] }>({ partners: [], leads: [], kpis: {}, tasks: [] });
  const [program, setProgram] = useState<ProgramPartner[]>([]);
  const [progStats, setProgStats] = useState<any>({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [compose, setCompose] = useState<{ subject: string; body: string; open: boolean; sending: boolean; result: string }>({ subject: "", body: "", open: false, sending: false, result: "" });
  const [historyFor, setHistoryFor] = useState<ProgramPartner | null>(null);
  const [msgCompose, setMsgCompose] = useState<{ subject: string; body: string; open: boolean; sending: boolean; result: string }>({ subject: "", body: "", open: false, sending: false, result: "" });
  const [msgView, setMsgView] = useState<{ partner: ProgramPartner; history: any[]; delivered: any[] } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/partners");
      const j = await r.json();
      if (j.success) setCrm(j.data);
    } catch {}
    try {
      const r = await fetch("/api/admin/partners/program?status=" + statusFilter);
      const j = await r.json();
      if (j.success) { setProgram(j.partners); setProgStats(j.stats); }
    } catch {}
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const sendEmail = async () => {
    if (!compose.subject.trim() || !compose.body.trim() || selected.size === 0) return;
    setCompose(c => ({ ...c, sending: true, result: "" }));
    try {
      const r = await fetch("/api/admin/partners/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerIds: [...selected], subject: compose.subject, body: compose.body }),
      });
      const j = await r.json();
      if (!r.ok || j.error) {
        setCompose(c => ({ ...c, result: j.error || "Failed to send" }));
        return;
      }
      const sent = j.results?.filter((x: any) => x.sent).length ?? 0;
      setCompose(c => ({ ...c, open: true, result: `Sent to ${sent}/${j.results?.length ?? 0} partners` }));
      setSelected(new Set());
      load();
    } catch {
      setCompose(c => ({ ...c, result: "Failed to send" }));
    } finally {
      setCompose(c => ({ ...c, sending: false }));
    }
  };

  const copyLink = (link: string) => { navigator.clipboard.writeText(link); setCopied(link); setTimeout(() => setCopied(null), 1500); };

  const sendMessage = async () => {
    if (!msgCompose.subject.trim() || !msgCompose.body.trim() || selected.size === 0) return;
    setMsgCompose(c => ({ ...c, sending: true, result: "" }));
    try {
      const r = await fetch("/api/admin/partners/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerIds: [...selected], subject: msgCompose.subject, body: msgCompose.body }),
      });
      const j = await r.json();
      if (!r.ok || j.error) {
        setMsgCompose(c => ({ ...c, result: j.error || "Failed to send" }));
        return;
      }
      const skipped = j.skipped ? ` (${j.skipped} skipped - no partners.circucity.com account)` : "";
      setMsgCompose(c => ({ ...c, open: true, result: `Delivered to ${j.count ?? 0} partner inbox(es)${skipped}` }));
      setSelected(new Set());
      load();
    } catch {
      setMsgCompose(c => ({ ...c, result: "Failed to send" }));
    } finally {
      setMsgCompose(c => ({ ...c, sending: false }));
    }
  };

  const viewMessages = async (p: ProgramPartner) => {
    try {
      const r = await fetch("/api/admin/partners/message?partnerId=" + p.id);
      const j = await r.json();
      if (j.success) setMsgView({ partner: p, history: j.history, delivered: j.delivered });
    } catch {}
  };

  const filtered = program.filter(p => statusFilter === "all" || p.status === statusFilter);

  const tabBtn = (id: string, label: string, Icon: any) => (
    <button onClick={() => setTab(id)} className={"px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 " + (tab === id ? "bg-dark-navy text-white" : "bg-gray-100 text-gray-600")}>
      <Icon className="w-4 h-4" /> {label}
    </button>
  );

  const progBadge = (p: ProgramPartner) => {
    if (p.status === "pending") return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Pending</span>;
    if (!p.registered) return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Approved - not registered</span>;
    if (!p.activated) return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">Registered - not activated</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">Active</span>;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-navy">Partner Management</h1>
          <p className="text-sm text-gray-500">Global Sales Partner program tracking and partner CRM</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border text-sm font-bold"><RefreshCw className="w-4 h-4" /> Refresh</button>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        {tabBtn("overview", "Overview", Users)}
        {tabBtn("program", "Program Tracking", Megaphone)}
        {tabBtn("messages", "Messages", MessageSquare)}
        {tabBtn("leads", "Leads", ClipboardList)}
        {tabBtn("tasks", "Tasks", CheckCheck)}
      </div>

      {tab === "overview" && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border"><div className="text-xs text-gray-500 font-bold uppercase">Active Pipeline</div><div className="text-2xl font-bold mt-1">{crm.kpis.activePipeline || 0}</div></div>
            <div className="bg-white p-4 rounded-xl border"><div className="text-xs text-gray-500 font-bold uppercase">Won</div><div className="text-2xl font-bold text-green-600 mt-1">{crm.kpis.dealsWon || 0}</div></div>
            <div className="bg-white p-4 rounded-xl border"><div className="text-xs text-gray-500 font-bold uppercase">Pipeline Value</div><div className="text-2xl font-bold mt-1">${(crm.kpis.pipelineValue || 0).toLocaleString()}</div></div>
            <div className="bg-white p-4 rounded-xl border"><div className="text-xs text-gray-500 font-bold uppercase">Pending Tasks</div><div className="text-2xl font-bold mt-1">{crm.kpis.tasksPending || 0}</div></div>
            <div className="bg-white p-4 rounded-xl border"><div className="text-xs text-gray-500 font-bold uppercase">Follow-ups ≤7d</div><div className="text-2xl font-bold mt-1">{crm.kpis.upcomingFollowups || 0}</div></div>
          </div>
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="p-4 border-b font-bold text-sm">Registered CRM Partners ({crm.partners.length})</div>
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-left text-xs font-bold text-gray-500"><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Registered</th><th className="p-3">Activated</th><th className="p-3">Joined</th></tr></thead>
              <tbody>
                {crm.partners.map(p => (
                  <tr key={p.id} className="border-t">
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3 text-gray-500">{p.email}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">Yes</span></td>
                    <td className="p-3">{p.setup_token ? <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">No - setup pending</span> : <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">Yes</span>}</td>
                    <td className="p-3 text-gray-500">{p.created_at?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "program" && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border"><div className="text-xs text-gray-500 font-bold uppercase">Total applications</div><div className="text-2xl font-bold mt-1">{progStats.total || 0}</div></div>
            <div className="bg-white p-4 rounded-xl border"><div className="text-xs text-gray-500 font-bold uppercase">Approved</div><div className="text-2xl font-bold text-blue-600 mt-1">{progStats.approved || 0}</div></div>
            <div className="bg-white p-4 rounded-xl border"><div className="text-xs text-gray-500 font-bold uppercase">Registered</div><div className="text-2xl font-bold mt-1">{progStats.registered || 0}</div></div>
            <div className="bg-white p-4 rounded-xl border"><div className="text-xs text-gray-500 font-bold uppercase">Activated</div><div className="text-2xl font-bold text-green-600 mt-1">{progStats.activated || 0}</div></div>
            <div className="bg-white p-4 rounded-xl border"><div className="text-xs text-gray-500 font-bold uppercase">No activity</div><div className="text-2xl font-bold text-amber-600 mt-1">{progStats.noActivity || 0}</div></div>
          </div>

          <div className="mb-4 flex gap-2 flex-wrap items-center">
            {["all", "pending", "approved", "active"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={"px-3 py-1.5 rounded-lg text-xs font-bold capitalize " + (statusFilter === s ? "bg-dark-navy text-white" : "bg-gray-100 text-gray-600")}>{s}</button>
            ))}
            <span className="flex-1" />
            {selected.size > 0 && (
              <button onClick={() => setCompose(c => ({ ...c, open: !c.open, result: "" }))} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-navy text-white text-sm font-bold">
                <Mail className="w-4 h-4" /> Email {selected.size} partner{selected.size > 1 ? "s" : ""}
              </button>
            )}
          </div>

          {compose.open && (
            <div className="mb-6 bg-white rounded-xl border p-4 space-y-3">
              <div className="text-sm font-bold">Send email to {selected.size} selected partner{selected.size > 1 ? "s" : ""}</div>
              <input value={compose.subject} onChange={e => setCompose(c => ({ ...c, subject: e.target.value }))} placeholder="Subject" className="w-full p-2.5 rounded-xl border text-sm" />
              <textarea value={compose.body} onChange={e => setCompose(c => ({ ...c, body: e.target.value }))} placeholder="Message" rows={4} className="w-full p-2.5 rounded-xl border text-sm" />
              <div className="flex items-center gap-3">
                <button onClick={sendEmail} disabled={compose.sending || !compose.subject.trim() || !compose.body.trim()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-navy text-white text-sm font-bold disabled:opacity-40">
                  <Send className="w-4 h-4" /> {compose.sending ? "Sending…" : "Send"}
                </button>
                {compose.result && <span className="text-sm text-green-600 font-semibold">{compose.result}</span>}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-left text-xs font-bold text-gray-500">
                <th className="p-3 w-8"></th>
                <th className="p-3">Partner</th><th className="p-3">Status</th><th className="p-3">Referral link</th><th className="p-3">Clicks</th><th className="p-3">Referrals</th><th className="p-3">Converted</th><th className="p-3">Commission earned</th><th className="p-3">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-t align-top">
                    <td className="p-3"><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} className="w-4 h-4" /></td>
                    <td className="p-3">
                      <div className="font-medium">{p.firstName || p.lastName ? `${p.firstName || ""} ${p.lastName || ""}`.trim() : p.email}</div>
                      <div className="text-xs text-gray-500">{p.email}</div>
                      {p.country && <div className="text-xs text-gray-400">{p.country}</div>}
                    </td>
                    <td className="p-3">{progBadge(p)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <code className="text-[11px] bg-slate-50 rounded px-1.5 py-0.5 truncate max-w-[180px]">{p.link}</code>
                        <button onClick={() => copyLink(p.link)} className="p-1 rounded bg-gray-100 hover:bg-gray-200 shrink-0">
                          {copied === p.link ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <a href={p.link} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 hover:underline">open</a>
                    </td>
                    <td className="p-3">{p.clickCount}</td>
                    <td className="p-3">{p.referralCount}</td>
                    <td className="p-3">{p.convertedReferrals}</td>
                    <td className="p-3">
                      <div className="font-bold">${(p.totalEarned || 0).toFixed(2)}</div>
                      <div className="text-xs text-gray-500">{p.commissionsPending} pending</div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => { setSelected(new Set([p.id])); setCompose(c => ({ ...c, open: true, result: "" })); }} title="Email" className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"><Mail className="w-4 h-4" /></button>
                        <button onClick={() => setHistoryFor(p)} title="Email history" className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"><CheckCheck className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-gray-400">No partners found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "messages" && (
        <div>
          <div className="mb-4 bg-white rounded-xl border p-4">
            <div className="text-sm font-bold mb-2">Send updates, resources & materials to partners.circucity.com</div>
            <p className="text-xs text-gray-500 mb-4">Messages appear in each partner's inbox on partners.circucity.com. Select partners on the Program Tracking tab, or pick recipients below. Group messaging sends the same message to everyone selected.</p>
            <div className="flex gap-2 flex-wrap items-center mb-3">
              <button onClick={() => { setMsgCompose(c => ({ ...c, open: !c.open, result: "" })); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-navy text-white text-sm font-bold">
                <MessageSquare className="w-4 h-4" /> Compose message
              </button>
              <span className="text-xs text-gray-500">{selected.size > 0 ? `Recipients: ${selected.size} selected` : "No recipients selected yet"}</span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-2">
              {filtered.map(p => (
                <label key={p.id} className="flex items-center gap-2 text-sm bg-slate-50 rounded-lg px-3 py-2 cursor-pointer">
                  <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} className="w-4 h-4" />
                  <span className="truncate">{p.firstName || p.lastName || p.email}</span>
                </label>
              ))}
              {filtered.length === 0 && <div className="text-xs text-gray-400">No partners</div>}
            </div>
            {msgCompose.open && (
              <div className="mt-4 bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="text-sm font-bold">New message to {selected.size} partner{selected.size === 1 ? "" : "s"}</div>
                <input value={msgCompose.subject} onChange={e => setMsgCompose(c => ({ ...c, subject: e.target.value }))} placeholder="Subject (e.g. New resource: Q3 pitch deck)" className="w-full p-2.5 rounded-xl border text-sm" />
                <textarea value={msgCompose.body} onChange={e => setMsgCompose(c => ({ ...c, body: e.target.value }))} placeholder="Message body…" rows={4} className="w-full p-2.5 rounded-xl border text-sm" />
                <div className="flex items-center gap-3">
                  <button onClick={sendMessage} disabled={msgCompose.sending || !msgCompose.subject.trim() || !msgCompose.body.trim() || selected.size === 0} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-navy text-white text-sm font-bold disabled:opacity-40">
                    <Send className="w-4 h-4" /> {msgCompose.sending ? "Sending…" : "Send to partner inboxes"}
                  </button>
                  {msgCompose.result && <span className="text-sm text-green-600 font-semibold">{msgCompose.result}</span>}
                </div>
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="p-4 border-b font-bold text-sm">Message history (email + portal)</div>
            <div className="divide-y">
              {program.map(p => {
                const all = [...(p.messages || []).map(m => ({ ...m, via: "email" }))];
                if (all.length === 0) return null;
                return (
                  <div key={p.id} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{p.firstName || p.lastName || p.email}</span>
                      <button onClick={() => viewMessages(p)} className="text-xs font-bold text-blue-600 hover:underline">View full history</button>
                    </div>
                    <div className="text-xs text-gray-500">{all.length} message{all.length === 1 ? "" : "s"} · last {new Date(all[0].createdAt).toLocaleString()}</div>
                  </div>
                );
              })}
              {program.filter(p => !p.messages || p.messages.length === 0).length > 0 && <div className="p-6 text-center text-gray-400 text-sm">No messages sent yet</div>}
            </div>
          </div>
        </div>
      )}

      {tab === "leads" && (
        <div className="bg-white rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-left text-xs font-bold text-gray-500">
              <th className="p-3">Company</th><th className="p-3">Contact</th><th className="p-3">Stage</th><th className="p-3">Value</th><th className="p-3">Partner</th><th className="p-3">Next follow-up</th><th className="p-3">Source</th><th className="p-3">Notes</th>
            </tr></thead>
            <tbody>
              {crm.leads.map(l => (
                <tr key={l.id} className="border-t">
                  <td className="p-3 font-medium">{l.company}</td>
                  <td className="p-3 text-gray-500">{l.contact_name}</td>
                  <td className="p-3"><span className={"px-2 py-0.5 rounded-full text-xs font-bold " + stageColor(l.stage)}>{l.stage}</span></td>
                  <td className="p-3">{l.expected_value_usd ? "$" + l.expected_value_usd.toLocaleString() : "-"}</td>
                  <td className="p-3 text-gray-500">{l.partner_name || "-"}</td>
                  <td className="p-3 text-gray-500">{l.next_followup ? new Date(l.next_followup).toLocaleDateString() : "-"}</td>
                  <td className="p-3 text-gray-500">{l.source || "-"}</td>
                  <td className="p-3 text-gray-500 max-w-[200px] truncate">{l.notes || "-"}</td>
                </tr>
              ))}
              {crm.leads.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-gray-400">No leads yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === "tasks" && (
        <div className="bg-white rounded-xl border">
          <div className="p-4 border-b font-bold text-sm">Partner tasks ({crm.tasks.length})</div>
          {crm.tasks.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">No tasks</div>}
          {crm.tasks.map((t: any) => (
            <div key={t.id} className="px-4 py-3 border-b flex items-center gap-3 text-sm">
              <span className={"w-2.5 h-2.5 rounded-full shrink-0 " + (t.completed ? "bg-green-500" : "bg-amber-500")} />
              <div className="flex-1">
                <div className={t.completed ? "line-through text-gray-400" : "font-medium"}>{t.title}</div>
                <div className="text-xs text-gray-500">{t.partner_name}{t.due_date ? ` - due ${t.due_date}` : ""}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {historyFor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setHistoryFor(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-bold text-dark-navy">Email history - {historyFor.firstName || historyFor.email}</div>
                <div className="text-xs text-gray-500">{historyFor.email}</div>
              </div>
              <button onClick={() => setHistoryFor(null)} className="px-3 py-1 rounded-lg bg-gray-100 font-bold">Close</button>
            </div>
            {historyFor.messages.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">No emails sent yet</div>}
            {historyFor.messages.map(m => (
              <div key={m.id} className="mb-3 bg-slate-50 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm">{m.subject}</div>
                  <div className="text-[10px] text-gray-400">{new Date(m.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{m.body}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {msgView && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setMsgView(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-bold text-dark-navy">Full history - {msgView.partner.firstName || msgView.partner.email}</div>
                <div className="text-xs text-gray-500">{msgView.partner.email}{msgView.crmUser ? ` · partners.circucity.com account: ${msgView.crmUser.name}` : ""}</div>
              </div>
              <button onClick={() => setMsgView(null)} className="px-3 py-1 rounded-lg bg-gray-100 font-bold">Close</button>
            </div>
            <div className="space-y-3">
              {[...msgView.delivered.map((m: any) => ({ id: "crm-" + m.id, subject: m.subject, body: m.body, createdAt: m.created_at, via: "portal" })), ...msgView.history.map(m => ({ id: "em-" + m.id, subject: m.subject, body: m.body, createdAt: m.createdAt, via: "email" }))].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map(m => (
                <div key={m.id} className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-sm">{m.subject}</div>
                    <div className="flex items-center gap-2">
                      <span className={"px-1.5 py-0.5 rounded text-[10px] font-bold " + (m.via === "portal" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700")}>{m.via === "portal" ? "partners.circucity.com" : "email"}</span>
                      <span className="text-[10px] text-gray-400">{new Date(m.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{m.body}</div>
                </div>
              ))}
              {msgView.delivered.length === 0 && msgView.history.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">No messages yet</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
