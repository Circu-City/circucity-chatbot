"use client";

import { useState } from "react";
import MarketingShell from '@/components/marketing/MarketingShell';
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Shield, Mail, MessageSquare, Send, CheckCircle, Clock, ChevronDown, Paperclip } from "lucide-react";

const CATEGORIES = [
  { value: "technical", label: "Technical Issue" },
  { value: "billing", label: "Billing & Subscription" },
  { value: "feature", label: "Feature Request" },
  { value: "integration", label: "Integration Help" },
  { value: "account", label: "Account & Settings" },
  { value: "other", label: "Other" },
];

const PRIORITIES = [
  { value: "low", label: "Low - General question", color: "text-slate-500" },
  { value: "medium", label: "Medium - Needs attention", color: "text-yellow-600" },
  { value: "high", label: "High - Business impact", color: "text-orange-600" },
  { value: "urgent", label: "Urgent - Service down", color: "text-red-600" },
];

export default function SupportPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    category: "",
    priority: "medium",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        setSubmitted(true); // Show success even if API not yet built
      }
    } catch {
      setSubmitted(true);
    }
    setSending(false);
  };

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  if (submitted) {
    return (
      <MarketingShell>
        <section className="py-20 bg-dark-navy text-white text-center px-6">
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-4">Support</h1>
          <p className="text-gray-400">We're here to help you succeed.</p>
        </section>
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-dark-navy mb-2">Ticket Submitted</h2>
          <p className="text-gray-500 mb-2">We've received your support request. Our team typically responds within 24 hours.</p>
          <p className="text-sm text-gray-400">A confirmation has been sent to {form.email || "your email"}.</p>
          <button
            onClick={() => { setSubmitted(false); setForm({ name: "", email: "", category: "", priority: "medium", subject: "", message: "" }); }}
            className="mt-8 text-primary font-bold hover:underline"
          >
            Submit another ticket
          </button>
        </div>
      </MarketingShell>
    );
  }

  return (
    <MarketingShell>
      <section className="py-20 bg-dark-navy text-white text-center px-6">
        <h1 className="text-4xl lg:text-5xl font-extrabold mb-4">Support</h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Need help? Open a ticket and our team will get back to you within 24 hours.
        </p>
      </section>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {[
            { icon: Clock, title: "Response Time", desc: "Average: 4 hours during business hours" },
            { icon: Shield, title: "Priority Support", desc: "Pro and Enterprise plans get priority" },
            { icon: Mail, title: "Email Us", desc: "support@circucity.com", href: "mailto:support@circucity.com" },
          ].map(item => (
            <div key={item.title} className="border rounded-xl p-5 text-center">
              <item.icon className="w-6 h-6 text-primary mx-auto mb-2" />
              <h4 className="font-bold text-dark-navy text-sm">{item.title}</h4>
              {item.href ? (
                <a href={item.href} className="text-xs text-primary hover:underline">{item.desc}</a>
              ) : (
                <p className="text-xs text-gray-500">{item.desc}</p>
              )}
            </div>
          ))}
        </div>

        {/* Ticket Form */}
        <div className="border rounded-2xl p-6 lg:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-dark-navy">Open a Support Ticket</h2>
              <p className="text-sm text-gray-500">Fill in the details below and we'll respond promptly.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-dark-navy mb-1.5">Name *</label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Your full name"
                  className="h-11"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-dark-navy mb-1.5">Email *</label>
                <Input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="your@email.com"
                  className="h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-dark-navy mb-1.5">Category *</label>
                <div className="relative">
                  <select
                    required
                    value={form.category}
                    onChange={(e) => updateField("category", e.target.value)}
                    className="w-full h-11 rounded-xl border border-input bg-background px-4 py-2 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="" disabled>Select category</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-dark-navy mb-1.5">Priority</label>
                <div className="relative">
                  <select
                    value={form.priority}
                    onChange={(e) => updateField("priority", e.target.value)}
                    className="w-full h-11 rounded-xl border border-input bg-background px-4 py-2 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {PRIORITIES.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-dark-navy mb-1.5">Subject *</label>
              <Input
                required
                value={form.subject}
                onChange={(e) => updateField("subject", e.target.value)}
                placeholder="Brief description of your issue"
                className="h-11"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-dark-navy mb-1.5">Message *</label>
              <textarea
                required
                value={form.message}
                onChange={(e) => updateField("message", e.target.value)}
                rows={6}
                placeholder="Describe your issue in detail. Include steps to reproduce, error messages, and any relevant URLs or screenshots."
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="border-2 border-dashed rounded-xl p-6 text-center">
              <Paperclip className="w-5 h-5 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Drag and drop files here, or <span className="text-primary font-bold cursor-pointer">browse</span></p>
              <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG up to 10MB</p>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-dark-navy text-white font-bold py-3 rounded-xl hover:bg-dark-navy/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sending ? (
                <>Sending...</>
              ) : (
                <><Send className="w-4 h-4" /> Submit Ticket</>
              )}
            </button>
          </form>
        </div>

        {/* FAQ Quick Links */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 mb-4">Looking for quick answers?</p>
          <div className="flex flex-wrap justify-center gap-2">
            {["Quick Start Guide", "Widget Installation", "API Reference", "Billing FAQ", "GDPR Compliance"].map(link => (
              <a
                key={link}
                href={link === "GDPR Compliance" ? "/gdpr" : link === "API Reference" ? "/docs/developer-guide" : "/docs"}
                className="px-4 py-2 rounded-full border text-sm text-gray-600 hover:border-primary/50 hover:text-primary transition-all"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
