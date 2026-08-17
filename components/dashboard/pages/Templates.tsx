"use client";

import React, { useEffect, useState } from "react";
import { Plus, Edit3, Trash2, CheckCircle2, Loader2, ChevronRight, FileText, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardI18n } from "@/components/dashboard/I18nProvider";

type Category = "marketing" | "utility" | "authentication" | "sales" | "support" | "faq" | "greeting";

interface Template {
  id: string;
  name: string;
  category: Category;
  content: string;
  variables: string[];
  status: "active" | "draft" | "archived";
}

const CATEGORIES: { id: Category; label: string; desc: string }[] = [
  { id: "sales", label: "Sales", desc: "Product recommendations, upsells, promotions" },
  { id: "support", label: "Support", desc: "Shipping, returns, order issues" },
  { id: "faq", label: "FAQ", desc: "Common questions, policies, about" },
  { id: "greeting", label: "Greeting", desc: "Welcome messages, proactive greetings" },
  { id: "utility", label: "Utility", desc: "Order confirmations, status updates" },
  { id: "marketing", label: "Marketing", desc: "Campaigns, newsletters, offers" },
  { id: "authentication", label: "Authentication", desc: "Login codes, verification" },
];

export default function ResponseTemplates() {
  const { t } = useDashboardI18n();
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", category: "support" as Category, content: "", variables: "" });

  useEffect(() => {
    fetch("/api/client/templates")
      .then(r => r.json().catch(() => ({})))
      .then(d => { if (d.success) setTemplates(d.data); })
      .catch(() => setError("Failed to load templates"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeCategory === "all" ? templates : templates.filter(t => t.category === activeCategory);

  const handleSave = async () => {
    if (!form.name || !form.content) return;
    setSaving(true);
    const vars = form.variables.split(",").map(v => v.trim()).filter(Boolean);
    try {
      const res = await fetch("/api/client/templates", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, variables: vars, id: editing?.id }),
      });
      const d = await res.json();
      if (d.success) {
        setTemplates(prev => editing
          ? prev.map(t => t.id === editing.id ? d.data : t)
          : [...prev, d.data]
        );
        setShowEditor(false);
        setEditing(null);
        setForm({ name: "", category: "support", content: "", variables: "" });
      }
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/client/templates/${id}`, { method: "DELETE" });
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const handleEdit = (t: Template) => {
    setEditing(t);
    setForm({ name: t.name, category: t.category, content: t.content, variables: t.variables.join(", ") });
    setShowEditor(true);
  };

  const copyPreview = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-dark-navy">{t("tmpl.title")}</h2>
            <p className="text-xs text-muted-foreground">Create and manage reusable chatbot responses</p>
          </div>
        </div>
        <button onClick={() => { setEditing(null); setForm({ name: "", category: "support", content: "", variables: "" }); setShowEditor(true); }}
          className="px-4 py-2 rounded-xl bg-primary text-dark-navy font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-all">
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>

      {/* Category tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0 -mb-px overflow-x-auto">
          <button onClick={() => setActiveCategory("all")}
            className={cn("px-4 py-3 text-sm font-medium transition-all whitespace-nowrap border-b-2 shrink-0",
              activeCategory === "all" ? "text-primary border-primary" : "text-gray-400 border-transparent hover:text-gray-600")}>
            All
          </button>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={cn("px-4 py-3 text-sm font-medium transition-all whitespace-nowrap border-b-2 shrink-0",
                activeCategory === cat.id ? "text-primary border-primary" : "text-gray-400 border-transparent hover:text-gray-600")}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Templates grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(t => (
          <div key={t.id} className="bg-white rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                  t.category === "sales" ? "bg-green-100 text-green-700" :
                  t.category === "support" ? "bg-blue-100 text-blue-700" :
                  t.category === "faq" ? "bg-purple-100 text-purple-700" :
                  t.category === "greeting" ? "bg-amber-100 text-amber-700" :
                  "bg-gray-100 text-gray-700"
                )}>{t.category}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(t)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"><Edit3 className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-dark-navy mb-2">{t.name}</h3>
            <p className="text-xs text-gray-500 mb-3 line-clamp-3 leading-relaxed">{t.content}</p>
            {t.variables.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {t.variables.map(v => <span key={v} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono">{`{${v}}`}</span>)}
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded", t.status === "active" ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-500")}>{t.status}</span>
              <button onClick={() => copyPreview(t.content, t.id)} className="text-xs text-primary hover:underline flex items-center gap-1">
                {copiedId === t.id ? <><Check className="w-3 h-3" /> {t("tmpl.copied")}</> : <><Copy className="w-3 h-3" /> {t("tmpl.copy")}</>}
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400 text-sm">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>{t("tmpl.noTemplates")}</p>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowEditor(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold text-dark-navy">{editing ? "Edit Template" : "New Template"}</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">{t("tmpl.templateName")}</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Order Status Inquiry" className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">{t("common.category")}</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as Category }))} className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40">
                  {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label} — {cat.desc}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">{t("tmpl.responseContent")}</label>
                <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={5}
                  placeholder="Write the template message. Use {variable} for dynamic content."
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">{t("tmpl.variables")}</label>
                <input value={form.variables} onChange={e => setForm(p => ({ ...p, variables: e.target.value }))} placeholder="product_name, order_number, delivery_date" className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowEditor(false)} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.name || !form.content}
                  className="flex-1 px-4 py-2.5 bg-primary text-dark-navy rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
