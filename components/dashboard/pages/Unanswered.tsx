"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Search, RefreshCw, Loader2, BookOpen, CheckCircle2, Sparkles, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDashboardI18n } from "@/components/dashboard/I18nProvider";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <div className="space-y-8  max-w-full overflow-hidden">{children}</div>;
}

export default function Unanswered() {
  const { t } = useDashboardI18n();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch("/api/client/unanswered");
    const json = await res.json();
    if (json.success) setQuestions(json.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const addToFaq = async (question: string) => {
    setAdding(question);
    const res = await fetch("/api/client/unanswered/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const json = await res.json();
    if (json.success) {
      setQuestions(prev => prev.filter(q => q.question !== question));
      setMessage("Added to FAQ");
    } else {
      setMessage(json.error || "Failed");
    }
    setAdding(null);
    setTimeout(() => setMessage(""), 3000);
  };

  const generateAnswer = async (question: string) => {
    setGenerating(question);
    setMessage("");
    const res = await fetch("/api/client/unanswered/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const json = await res.json();
    if (json.success) {
      setQuestions(prev => prev.filter(q => q.question !== question));
      setMessage("AI answer generated and saved to FAQ");
    } else {
      setMessage(json.error || "Generation failed");
    }
    setGenerating(null);
    setTimeout(() => setMessage(""), 3000);
  };

  const filtered = questions.filter(q =>
    q.question?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Wrapper>

{message && (<div className={cn("p-3 rounded-lg text-sm border", message.includes("Failed") || message.includes("failed") ? "bg-red-500/10 text-red-600 border-red-500/30" : "bg-green-500/10 text-green-600 border-green-500/30")}>

{message}
        </div>
      )}

      <div className="relative w-full md:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search questions..." className="pl-10"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="divide-y divide-border">
            {filtered.map((q: any, i: number) => (
              <div key={i} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    <p className="text-sm font-medium text-dark-navy">{q.question}</p>
                  </div>
                  {q.timestamp && (
                    <p className="text-xs text-muted-foreground ml-6">{new Date(q.timestamp).toLocaleDateString()}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => generateAnswer(q.question)} disabled={generating === q.question}>
                    {generating === q.question ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Generate
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => addToFaq(q.question)} disabled={adding === q.question}>
                    {adding === q.question ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookOpen className="w-3.5 h-3.5" />}
                    Add to FAQ
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-emerald-700">{t("unanswered.noQuestions")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("unanswered.allAnswered")}</p>
          </div>
        )}
      </Card>
    
    
    </Wrapper>
  );
}
