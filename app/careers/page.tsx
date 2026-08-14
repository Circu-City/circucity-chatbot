"use client";
import { useState, useEffect } from "react";
import MarketingShell from "@/components/marketing/MarketingShell";
import { Briefcase, MapPin, Clock, ArrowRight, Loader2, CalendarDays, Banknote } from "lucide-react";
import Link from "next/link";

const TYPE_LABEL: Record<string, string> = {
  "full-time": "Full Time",
  "part-time": "Part Time",
  contract: "Contract",
  internship: "Internship",
  remote: "Remote",
};

function postedDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.max(0, Math.floor((now.getTime() - d.getTime()) / 86400000));
  if (days === 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  return "Posted " + days + " days ago";
}

export default function CareersPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/jobs")
      .then(r => r.json())
      .then(d => {
        if (d.success) setJobs(d.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <MarketingShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-36 pb-24">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#A3E635]/10 border border-[#A3E635]/30 text-[#4d7c0f] text-xs font-bold uppercase tracking-wider mb-5">
            <Briefcase className="w-3.5 h-3.5" /> Careers
          </span>
          <h1 className="text-5xl font-extrabold text-[#0A1428] mb-5 tracking-tight">Join Our Team</h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Help us build the future of AI-powered customer support for e-commerce.
            We're always looking for curious, ambitious people who love shipping great software.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#A3E635] mx-auto" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border border-gray-100">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#0A1428] mb-2">No Open Positions</h3>
            <p className="text-gray-500">
              We don't have any open positions right now. Check back later or send us your resume at{" "}
              <a href="mailto:careers@circucity.com" className="text-[#4d7c0f] font-bold">careers@circucity.com</a>.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-5">{jobs.length} open position{jobs.length === 1 ? "" : "s"}</p>
            <div className="space-y-4">
              {jobs.map((j) => (
                <Link
                  key={j.id}
                  href={"/careers/" + j.id}
                  className="group block bg-white rounded-2xl border border-gray-200 p-6 sm:p-7 hover:border-[#A3E635]/50 hover:shadow-xl hover:shadow-black/5 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-bold text-[#0A1428] group-hover:text-[#4d7c0f] transition-colors">
                          {j.title}
                        </h2>
                        {j.type && (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#A3E635]/10 border border-[#A3E635]/30 text-xs font-bold text-[#4d7c0f]">
                            {TYPE_LABEL[j.type] || j.type}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" />{j.department}</span>
                        <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{j.location}</span>
                        {j.salaryRange && <span className="flex items-center gap-1.5"><Banknote className="w-4 h-4" />{j.salaryRange}</span>}
                        <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4" />{postedDate(j.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-3 leading-relaxed line-clamp-2">
                        {j.description}
                      </p>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-[#0A1428] group-hover:bg-[#A3E635] group-hover:border-[#A3E635] group-hover:text-[#0A1428] transition-all duration-300">
                      View Role <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        <div className="mt-16 text-center p-8 bg-slate-50 rounded-3xl border border-gray-100">
          <h3 className="font-bold text-[#0A1428] text-lg mb-1">Don't see the right role?</h3>
          <p className="text-gray-500">
            Send your resume to <a href="mailto:careers@circucity.com" className="text-[#4d7c0f] font-bold">careers@circucity.com</a> and we'll keep you in mind.
          </p>
        </div>
      </div>
    </MarketingShell>
  );
}
