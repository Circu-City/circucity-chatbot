"use client";
import { useState, useEffect } from "react";
import { Briefcase, Plus, Pencil, Trash2, Users, Loader2 } from "lucide-react";

const EMPTY_FORM = {
  title: "", department: "", location: "", type: "full-time",
  description: "", requirements: "", expectations: "", salaryRange: "", vettingRules: "", screeningQuestions: "",
};

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [tab, setTab] = useState("jobs");
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const j = await fetch("/api/admin/jobs").then(r => r.json());
      if (j.success) setJobs(j.data);
      const a = await fetch("/api/admin/applications").then(r => r.json());
      if (a.success) setApps(a.data);
    } catch {}
  };
  useEffect(() => { load(); }, []);

  const reset = () => { setForm({ ...EMPTY_FORM }); setEditingId(null); };

  const saveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...form,
        screeningQuestions: form.screeningQuestions ? JSON.stringify(form.screeningQuestions.split("\n").filter(Boolean)) : null,
        vettingRules: form.vettingRules ? JSON.stringify(form.vettingRules.split(",").map((s: string) => s.trim()).filter(Boolean)) : null,
      };
      const url = "/api/admin/jobs";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });
      const d = await res.json();
      if (!d.success) alert(d.error || "Failed to save job");
    } catch {
      alert("Failed to save job");
    }
    reset();
    setBusy(false);
    load();
  };

  const startEdit = (j: any) => {
    setEditingId(j.id);
    let qs = "";
    try { qs = JSON.parse(j.screeningQuestions || "[]").join("\n"); } catch {}
    let vr = "";
    try { vr = JSON.parse(j.vettingRules || "[]").join(", "); } catch {}
    setForm({
      title: j.title || "", department: j.department || "", location: j.location || "", type: j.type || "full-time",
      description: j.description || "", requirements: j.requirements || "", expectations: j.expectations || "",
      salaryRange: j.salaryRange || "", vettingRules: vr, screeningQuestions: qs,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleStatus = async (id: string, current: string) => {
    await fetch("/api/admin/jobs", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: current === "open" ? "closed" : "open" }),
    });
    load();
  };

  const deleteJob = async (id: string, title: string) => {
    if (!confirm('Delete "' + title + '"? This also deletes all its applications.')) return;
    await fetch("/api/admin/jobs", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/admin/applications/" + id, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const updateNotes = async (id: string, notes: string) => {
    await fetch("/api/admin/applications/" + id, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminNotes: notes }),
    });
    load();
  };

  const parseAns = (a: any) => { try { return JSON.parse(a); } catch { return []; } };

  const input = "w-full p-2.5 rounded-lg border border-gray-200 text-sm focus:border-[#A3E635] focus:ring-2 focus:ring-[#A3E635]/20 outline-none";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Briefcase className="w-6 h-6 text-[#A3E635]" />
        <h1 className="text-2xl font-bold text-[#0A1428]">Careers Manager</h1>
      </div>

      <div className="flex gap-4 mb-8">
        <button onClick={() => setTab("jobs")} className={"px-6 py-2 rounded-xl font-bold text-sm inline-flex items-center gap-2 " + (tab === "jobs" ? "bg-[#0A1428] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
          <Briefcase className="w-4 h-4" /> Jobs ({jobs.length})
        </button>
        <button onClick={() => setTab("applications")} className={"px-6 py-2 rounded-xl font-bold text-sm inline-flex items-center gap-2 " + (tab === "applications" ? "bg-[#0A1428] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
          <Users className="w-4 h-4" /> Applications ({apps.length})
        </button>
      </div>

      {tab === "jobs" && (
        <div>
          <div className="mb-6 bg-slate-50 rounded-2xl p-5 border border-gray-100">
            <h2 className="font-bold text-sm text-[#0A1428] mb-4 inline-flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#4d7c0f]" /> {editingId ? "Edit Job" : "New Job"}
            </h2>
            <form onSubmit={saveJob} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input required placeholder="Title *" className={input} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                <input required placeholder="Department *" className={input} value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
                <input required placeholder="Location *" className={input} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                <select className={input} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                  <option value="remote">Remote</option>
                </select>
              </div>
              <textarea required placeholder="Description * (what the role is about)" rows={4} className={input} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <textarea placeholder="Requirements (one per line)" rows={3} className={input} value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })} />
              <textarea placeholder="What We Expect From You (one per line)" rows={3} className={input} value={form.expectations} onChange={e => setForm({ ...form, expectations: e.target.value })} />
              <textarea placeholder="Screening Questions (one per line) — asked during application" rows={4} className={input} value={form.screeningQuestions} onChange={e => setForm({ ...form, screeningQuestions: e.target.value })} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input placeholder="Vetting keywords (comma separated)" className={input} value={form.vettingRules} onChange={e => setForm({ ...form, vettingRules: e.target.value })} />
                <input placeholder="Salary Range (e.g. 45,000 - 55,000 USD)" className={input} value={form.salaryRange} onChange={e => setForm({ ...form, salaryRange: e.target.value })} />
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={busy} className="px-6 py-2.5 rounded-xl bg-[#A3E635] text-[#0A1428] font-bold text-sm inline-flex items-center gap-2 hover:bg-[#8DC92E] disabled:opacity-60">
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? "Save Changes" : "Create Job"}
                </button>
                {editingId && (
                  <button type="button" onClick={reset} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="space-y-3">
            {jobs.length === 0 && <p className="text-sm text-gray-400 text-center py-10">No jobs yet. Create your first job above.</p>}
            {jobs.map(j => (
              <div key={j.id} className="p-4 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 transition-colors">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <h3 className="font-bold text-[#0A1428]">{j.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {j.department} · {j.location} · {j.type} · {j._count?.applications || 0} applicants
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xl">
                      {j.screeningQuestions ? JSON.parse(j.screeningQuestions).length + " screening questions" : "No screening questions"}
                      {j.expectations ? " · has expectations" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => startEdit(j)} className="px-3 py-1.5 rounded-lg bg-slate-100 text-gray-600 text-xs font-bold hover:bg-slate-200 inline-flex items-center gap-1">
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => deleteJob(j.id, j.title)} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 inline-flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                    <span onClick={() => toggleStatus(j.id, j.status)} className={"px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer select-none " + (j.status === "open" ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700" : "bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700")}>
                      {j.status === "open" ? "Open" : "Closed"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "applications" && (
        <div>
          {apps.length === 0 && <p className="text-sm text-gray-400 text-center py-10">No applications yet.</p>}
          <div className="space-y-4">
            {apps.map(a => {
              const ans = parseAns(a.answers);
              return (
                <div key={a.id} className="p-5 rounded-2xl border border-gray-200 bg-white">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <h3 className="font-bold text-[#0A1428]">{a.firstName} {a.lastName}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{a.email} · {a.job?.title} · Score: {a.score ?? "N/A"}/100</p>
                      {a.phone && <p className="text-xs text-gray-400">{a.phone}</p>}
                      {a.resumeUrl && <a href={a.resumeUrl} target="_blank" className="inline-flex items-center gap-1 text-xs font-bold text-[#4d7c0f] hover:underline mt-1">View CV / Resume</a>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      {a.status === "pending" && (
                        <>
                          <button onClick={() => updateStatus(a.id, "shortlisted")} className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold hover:bg-blue-200">Shortlist</button>
                          <button onClick={() => updateStatus(a.id, "approved")} className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-bold hover:bg-green-200">Approve</button>
                          <button onClick={() => updateStatus(a.id, "rejected")} className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-bold hover:bg-red-200">Reject</button>
                        </>
                      )}
                      <span className={"px-3 py-1 rounded-full text-xs font-bold " + (a.status === "approved" ? "bg-green-100 text-green-700" : a.status === "rejected" ? "bg-red-100 text-red-700" : a.status === "shortlisted" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700")}>{a.status}</span>
                    </div>
                  </div>
                  {ans.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {ans.map((answer: string, i: number) => (
                        <p key={i} className="text-xs text-gray-600 bg-slate-50 p-2.5 rounded-lg"><strong className="text-[#0A1428]">Q{i + 1}:</strong> {answer}</p>
                      ))}
                    </div>
                  )}
                  {a.coverLetter && <p className="text-sm text-gray-600 mt-2 bg-slate-50 p-2.5 rounded-lg whitespace-pre-line"><strong className="text-[#0A1428]">Cover letter:</strong> {a.coverLetter}</p>}
                  <input className="w-full p-2 rounded-lg border border-gray-200 text-xs mt-3" placeholder="Admin notes..." defaultValue={a.adminNotes || ""} onBlur={e => updateNotes(a.id, e.target.value)} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
