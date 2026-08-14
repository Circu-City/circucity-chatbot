"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import MarketingShell from "@/components/marketing/MarketingShell";
import {
  Briefcase, MapPin, Clock, ArrowLeft, Loader2, CheckCircle2,
  User, Mail, Phone, FileText, Send, Lock,
} from "lucide-react";

const TYPE_LABEL: Record<string, string> = {
  "full-time": "Full Time",
  "part-time": "Part Time",
  contract: "Contract",
  internship: "Internship",
  remote: "Remote",
};

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", coverLetter: "", answers: {} as Record<number, string>,
  });
  const [cv, setCv] = useState<File | null>(null);
  const [cvError, setCvError] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    fetch("/api/jobs/" + id)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setJob(d.data);
          const qs = d.data.screeningQuestions ? JSON.parse(d.data.screeningQuestions) : [];
          setQuestions(qs);
          const a: Record<number, string> = {};
          qs.forEach((_: any, i: number) => { a[i] = ""; });
          setForm(f => ({ ...f, answers: a }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (submitted) return;
    try {
      const applied = localStorage.getItem("cc_applied_jobs");
      if (applied && job && JSON.parse(applied).includes(job.id)) setSubmitted(true);
    } catch {}
  }, [job, submitted]);

  const startApply = () => {
    setShowForm(true);
    setError("");
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  };

  const pickCv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setCvError("");
    if (!f) { setCv(null); return; }
    const ok = [".pdf", ".doc", ".docx", ".txt", ".rtf", ".odt"].some(x => f.name.toLowerCase().endsWith(x));
    if (!ok) { setCv(null); setCvError("Unsupported file type. Use PDF, DOC, DOCX, TXT, RTF or ODT."); return; }
    if (f.size > 5 * 1024 * 1024) { setCv(null); setCvError("File too large. Maximum size is 5MB."); return; }
    setCv(f);
  };

  const submitApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      let resumeUrl = "";
      if (cv) {
        const fd = new FormData();
        fd.append("file", cv);
        const up = await fetch("/api/jobs/upload", { method: "POST", body: fd });
        const upData = await up.json();
        if (!upData.success) {
          setError(upData.error || "Failed to upload CV. Please try again.");
          return;
        }
        resumeUrl = upData.data.url;
      }
      const r = await fetch("/api/jobs/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: id, ...form, resumeUrl,
          answers: JSON.stringify(Object.values(form.answers)),
        }),
      });
      const d = await r.json();
      if (d.success) {
        try {
          const applied = localStorage.getItem("cc_applied_jobs");
          const list = applied ? JSON.parse(applied) : [];
          if (!list.includes(job.id)) list.push(job.id);
          localStorage.setItem("cc_applied_jobs", JSON.stringify(list));
        } catch {}
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setError(d.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#A3E635]" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Job not found
      </div>
    );
  }

  if (submitted) {
    return (
      <MarketingShell>
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <CheckCircle2 className="w-16 h-16 text-[#A3E635] mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-[#0A1428] mb-3">Application Submitted!</h1>
            <p className="text-gray-500 mb-8">
              Thank you for applying to <span className="font-bold text-[#0A1428]">{job.title}</span>.
              Our team will review your application and get back to you within a few days.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => router.push("/careers")} className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-bold text-[#0A1428] hover:bg-gray-50 transition-colors">
                Browse other roles
              </button>
              <button onClick={() => router.push("/")} className="px-6 py-3 rounded-xl bg-[#A3E635] text-[#0A1428] text-sm font-bold hover:bg-[#8DC92E] transition-colors">
                Back to home
              </button>
            </div>
          </div>
        </div>
      </MarketingShell>
    );
  }

  return (
    <MarketingShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-32 pb-24">
        <button
          onClick={() => router.push("/careers")}
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#4d7c0f] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> All jobs
        </button>

        <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-10">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="px-3 py-1 rounded-full bg-[#A3E635]/10 border border-[#A3E635]/30 text-xs font-bold text-[#4d7c0f]">
              {job.department}
            </span>
            {job.type && (
              <span className="px-3 py-1 rounded-full bg-slate-100 text-xs font-bold text-gray-600">
                {TYPE_LABEL[job.type] || job.type}
              </span>
            )}
            {job.status === "closed" && (
              <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                Position Closed
              </span>
            )}
          </div>

          <h1 className="text-4xl font-extrabold text-[#0A1428] mb-4 tracking-tight">{job.title}</h1>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 mb-8">
            <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#A3E635]" />{job.location}</span>
            {job.salaryRange && <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-[#A3E635]" />{job.salaryRange}</span>}
            <span className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-[#A3E635]" />{job.department}</span>
          </div>

          <div className="space-y-10">
            <section>
              <h2 className="text-xl font-bold text-[#0A1428] mb-3">About the Role</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{job.description}</p>
            </section>

            {job.requirements && (
              <section>
                <h2 className="text-xl font-bold text-[#0A1428] mb-3">Requirements</h2>
                <div className="text-gray-600 leading-relaxed whitespace-pre-line space-y-2">
                  {job.requirements.split("\n").filter(Boolean).map((line: string, i: number) => (
                    <div key={i} className="flex gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] mt-2.5 shrink-0" />
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {job.expectations && (
              <section>
                <h2 className="text-xl font-bold text-[#0A1428] mb-3">What We Expect From You</h2>
                <div className="text-gray-600 leading-relaxed whitespace-pre-line space-y-2">
                  {job.expectations.split("\n").filter(Boolean).map((line: string, i: number) => (
                    <div key={i} className="flex gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0A1428] mt-2.5 shrink-0" />
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="border-t border-gray-100 mt-10 pt-10">
            {!showForm ? (
              <div className="text-center">
                <h3 className="text-xl font-bold text-[#0A1428] mb-2">Ready to join the team?</h3>
                <p className="text-gray-500 mb-6">
                  Apply below — it takes about 5 minutes. We'll review every application personally.
                </p>
                <button
                  onClick={startApply}
                  disabled={job.status === "closed"}
                  className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-[#A3E635] text-[#0A1428] font-bold text-base hover:bg-[#8DC92E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#A3E635]/20"
                >
                  Apply for this position <Send className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div ref={formRef} className="max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold text-[#0A1428] mb-1">Application Form</h3>
                <p className="text-gray-500 mb-6">Tell us about yourself and answer a few questions for this role.</p>
                <form onSubmit={submitApp} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input placeholder="First Name *" required className="w-full pl-11 p-3.5 rounded-xl border border-gray-200 focus:border-[#A3E635] focus:ring-2 focus:ring-[#A3E635]/20 outline-none text-sm" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
                    </div>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input placeholder="Last Name *" required className="w-full pl-11 p-3.5 rounded-xl border border-gray-200 focus:border-[#A3E635] focus:ring-2 focus:ring-[#A3E635]/20 outline-none text-sm" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
                    </div>
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input placeholder="Email *" required type="email" className="w-full pl-11 p-3.5 rounded-xl border border-gray-200 focus:border-[#A3E635] focus:ring-2 focus:ring-[#A3E635]/20 outline-none text-sm" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input placeholder="Phone (optional)" className="w-full pl-11 p-3.5 rounded-xl border border-gray-200 focus:border-[#A3E635] focus:ring-2 focus:ring-[#A3E635]/20 outline-none text-sm" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>

                  {questions.length > 0 && (
                    <div className="bg-slate-50 rounded-2xl p-5 space-y-4 border border-gray-100">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-[#4d7c0f]" />
                        <h4 className="font-bold text-sm text-[#0A1428] uppercase tracking-wide">Role-specific questions</h4>
                      </div>
                      {questions.map((q, i) => (
                        <div key={i}>
                          <p className="text-sm font-bold text-[#0A1428] mb-2">
                            {i + 1}. {q}
                          </p>
                          <textarea
                            required
                            rows={3}
                            placeholder="Your answer..."
                            className="w-full p-3.5 rounded-xl border border-gray-200 focus:border-[#A3E635] focus:ring-2 focus:ring-[#A3E635]/20 outline-none text-sm"
                            value={form.answers[i] || ""}
                            onChange={e => setForm({ ...form, answers: { ...form.answers, [i]: e.target.value } })}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="relative">
                    <FileText className="w-4 h-4 absolute left-4 top-4 text-gray-400" />
                    <textarea placeholder="Cover letter / why you're a good fit" rows={4} className="w-full pl-11 p-3.5 rounded-xl border border-gray-200 focus:border-[#A3E635] focus:ring-2 focus:ring-[#A3E635]/20 outline-none text-sm" value={form.coverLetter} onChange={e => setForm({ ...form, coverLetter: e.target.value })} />
                  </div>

                  <div className="relative">
                    <div className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#A3E635] transition-colors">
                      <FileText className="w-5 h-5 text-[#4d7c0f] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <label className="block cursor-pointer">
                          <span className="text-sm font-bold text-[#0A1428]">{cv ? cv.name : "Upload your CV / Resume (optional)"}</span>
                          <span className="block text-xs text-gray-400">PDF, DOC, DOCX, TXT, RTF or ODT — up to 5MB</span>
                          <input type="file" accept=".pdf,.doc,.docx,.txt,.rtf,.odt" className="hidden" onChange={pickCv} />
                        </label>
                      </div>
                      {cv && (
                        <button type="button" onClick={() => setCv(null)} className="text-xs font-bold text-red-500 hover:text-red-700 shrink-0">
                          Remove
                        </button>
                      )}
                    </div>
                    {cvError && <p className="text-xs text-red-600 font-bold mt-1.5">{cvError}</p>}
                  </div>

                  {error && <p className="text-sm text-red-600 font-bold">{error}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full px-8 py-4 rounded-2xl bg-[#A3E635] text-[#0A1428] font-bold hover:bg-[#8DC92E] transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
                  >
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <>Submit Application <Send className="w-4 h-4" /></>}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
