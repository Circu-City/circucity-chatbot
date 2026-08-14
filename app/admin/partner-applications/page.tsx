"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, Check, RefreshCw, UserCheck, UserX, Clipboard } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  active: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function AdminPartnerApplicationsPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/admin/partner-applications").then(r => r.json());
      if (r.success) setApps(r.applications || []);
      else setError(r.error || "Failed to load");
    } catch {
      setError("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (id: string, action: string) => {
    if (!confirm(action === "approve" ? "Approve this application? The applicant will receive a setup link." : "Reject this application?")) return;
    const r = await fetch(`/api/admin/partner-applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    }).then(r => r.json());
    if (r.success) {
      load();
      if (action === "approve" && r.verifyUrl) {
        alert("Application approved!\n\nSetup link (send to applicant):\n" + r.verifyUrl);
      }
    } else {
      alert(r.error || "Action failed");
    }
  };

  const copy = (id: string, url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const filtered = filter === "all" ? apps : apps.filter(a => a.status === filter);

  const pendingCount = apps.filter(a => a.status === "pending").length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Partner Applications</h1>
          <p className="text-sm text-gray-500 mt-1">Review and approve partner program applications.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-all">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {pendingCount > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium">
          {pendingCount} application{pendingCount !== 1 ? "s" : ""} waiting for review
        </div>
      )}

      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", "pending", "approved", "active", "rejected"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${filter === s ? "bg-slate-900 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
            {s} {s === "all" ? `(${apps.length})` : s === "pending" ? `(${pendingCount})` : ""}
          </button>
        ))}
      </div>

      {error && <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Clipboard className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No applications found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Applicant</th>
                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Program</th>
                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Country</th>
                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Details</th>
                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                  <td className="p-4">
                    <div className="font-semibold text-slate-900">{a.firstName} {a.lastName}</div>
                    <div className="text-xs text-gray-500">{a.email}</div>
                  </td>
                  <td className="p-4">
                    <span className="inline-block px-2 py-1 rounded-full bg-[#A3E635]/15 text-[#0A1428] text-xs font-bold capitalize">{a.type}</span>
                  </td>
                  <td className="p-4 text-gray-600">{a.country || "—"}</td>
                  <td className="p-4">
                    {a.website && <div className="text-xs text-gray-500">{a.website}</div>}
                    {a.bio && <div className="text-xs text-gray-500 mt-1 max-w-[220px] truncate">{a.bio}</div>}
                    {a.phone && <div className="text-xs text-gray-400 mt-1">{a.phone}</div>}
                  </td>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold capitalize ${STATUS_COLORS[a.status] || "bg-gray-100 text-gray-600"}`}>{a.status}</span>
                  </td>
                  <td className="p-4 text-xs text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 whitespace-nowrap">
                    {a.status === "pending" && (
                      <div className="flex gap-2">
                        <button onClick={() => act(a.id, "approve")}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all">
                          <UserCheck className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button onClick={() => act(a.id, "reject")}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-all">
                          <UserX className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                    {a.status === "approved" && a.verificationToken && (
                      <button onClick={() => copy(a.id, `${window.location.origin}/partner/setup?token=${a.verificationToken}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all">
                        {copiedId === a.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedId === a.id ? "Copied!" : "Copy Setup Link"}
                      </button>
                    )}
                    {a.status === "active" && <span className="text-xs text-gray-400">Active</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
