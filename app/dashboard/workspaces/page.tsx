"use client";

import { useState, useEffect } from "react";
import {
  getCurrentOrganization,
  getWorkspaceById,
  updateWorkspace,
  generateWorkspaceApiKey,
  triggerCrawl,
} from "@/lib/actions/organization";
import { inviteTeamMember, removeTeamMember } from "@/lib/actions/inviteMember";
import {
  Settings,
  Globe,
  Bot,
  FileText,
  Key,
  Users,
  Save,
  RefreshCw,
  Copy,
  Check,
  Database,
  Search,
  ExternalLink,
  Trash2,
  Plus,
  Mail,
  X,
} from "lucide-react";

const TABS = [
  { id: "business", label: "Business Profile", icon: Globe },
  { id: "website", label: "Website Source", icon: Search },
  { id: "knowledge", label: "Knowledge Sources", icon: Database },
  { id: "ai", label: "AI Settings", icon: Bot },
  { id: "api", label: "API Access", icon: Key },
  { id: "team", label: "Team Members", icon: Users },
];

export default function WorkspaceSettingsPage() {
  const [org, setOrg] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("business");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [copied, setCopied] = useState(false);

  // Knowledge Base state
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);
  const [documents, setDocuments] = useState<{ name: string; content: string; addedAt: string }[]>([]);
  const [newFaqQ, setNewFaqQ] = useState("");
  const [newFaqA, setNewFaqA] = useState("");
  const [newDocName, setNewDocName] = useState("");
  const [newDocContent, setNewDocContent] = useState("");
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);

  // Team state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [teamLoading, setTeamLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    businessName: "",
    aboutBusiness: "",
    contactInfo: "",
    operatingHours: "",
    websiteUrl: "",
    personality: "professional",
    greetingMessage: "",
    suggestedPrompts: "",
    salesRules: "",
    escalationRules: "",
    leadCaptureSettings: "",
    tone: "professional",
  });

  useEffect(() => {
    async function load() {
      try {
        const orgData = await getCurrentOrganization();
        setOrg(orgData);
        const ws = orgData?.workspaces?.[0];
        if (ws) {
          const fullWs = await getWorkspaceById(ws.id);
          setWorkspace(fullWs);
          setForm({
            name: fullWs?.name || "",
            businessName: fullWs?.businessName || "",
            aboutBusiness: fullWs?.aboutBusiness || "",
            contactInfo: fullWs?.contactInfo || "",
            operatingHours: fullWs?.operatingHours || "",
            websiteUrl: fullWs?.websiteUrl || "",
            personality: fullWs?.personality || "professional",
            greetingMessage: fullWs?.greetingMessage || "",
            suggestedPrompts: fullWs?.suggestedPrompts || "",
            salesRules: fullWs?.salesRules || "",
            escalationRules: fullWs?.escalationRules || "",
            leadCaptureSettings: fullWs?.leadCaptureSettings || "",
            tone: fullWs?.tone || "professional",
          });
          setApiKey(fullWs?.apiKey || "");

          // Load knowledge base data
          if (fullWs?.crawlData) {
            try {
              const parsed = JSON.parse(fullWs.crawlData);
              setFaqs(parsed.faqs || []);
              setDocuments(parsed.documents || []);
            } catch {}
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    if (!workspace) return;
    setSaving(true);
    setMessage("");
    try {
      await updateWorkspace(workspace.id, form);
      setMessage("Saved successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (e: any) {
      setMessage("Error: " + (e.message || "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateKey = async () => {
    if (!workspace) return;
    try {
      const res = await generateWorkspaceApiKey(workspace.id);
      setApiKey(res.apiKey);
      setMessage("API key generated");
    } catch (e: any) {
      setMessage("Error: " + (e.message || "Failed"));
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCrawl = async () => {
    if (!workspace) return;
    try {
      await triggerCrawl(workspace.id);
      setMessage("Website crawl started. This may take a few minutes.");
      setTimeout(() => setMessage(""), 5000);
    } catch (e: any) {
      setMessage("Error: " + (e.message || "Crawl failed"));
    }
  };

  // Knowledge Base handlers
  const handleAddFaq = async () => {
    if (!newFaqQ.trim() || !newFaqA.trim()) return;
    setKnowledgeLoading(true);
    try {
      const res = await fetch("/api/knowledge/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: newFaqQ, answer: newFaqA }),
      });
      const data = await res.json();
      if (data.success) {
        setFaqs(data.data);
        setNewFaqQ("");
        setNewFaqA("");
        setMessage("FAQ added");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch {}
    setKnowledgeLoading(false);
  };

  const handleDeleteFaq = async (index: number) => {
    const res = await fetch("/api/knowledge/faq", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index }),
    });
    const data = await res.json();
    if (data.success) setFaqs(data.data);
  };

  const handleAddDocument = async () => {
    if (!newDocName.trim() || !newDocContent.trim()) return;
    setKnowledgeLoading(true);
    try {
      const res = await fetch("/api/knowledge/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newDocName, content: newDocContent }),
      });
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data);
        setNewDocName("");
        setNewDocContent("");
        setMessage("Document added");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch {}
    setKnowledgeLoading(false);
  };

  const handleDeleteDocument = async (index: number) => {
    const res = await fetch("/api/knowledge/documents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index }),
    });
    const data = await res.json();
    if (data.success) setDocuments(data.data);
  };

  // Team handlers
  const handleInvite = async () => {
    if (!inviteEmail.trim() || !org) return;
    setTeamLoading(true);
    try {
      await inviteTeamMember(org.id, inviteEmail, inviteRole);
      // Reload org data
      const orgData = await getCurrentOrganization();
      setOrg(orgData);
      setInviteEmail("");
      setMessage("Member invited successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (e: any) {
      setMessage("Error: " + (e.message || "Invite failed"));
      setTimeout(() => setMessage(""), 3000);
    }
    setTeamLoading(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!org) return;
    try {
      await removeTeamMember(org.id, memberId);
      const orgData = await getCurrentOrganization();
      setOrg(orgData);
      setMessage("Member removed");
      setTimeout(() => setMessage(""), 3000);
    } catch (e: any) {
      setMessage("Error: " + (e.message || "Remove failed"));
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Loading workspace settings...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-1">Workspace Settings</h1>
      <p className="text-gray-400 text-sm mb-6">
        {workspace?.name || "Configure your AI workspace"}
      </p>

      {message && (
        <div className={`p-3 rounded-lg mb-4 text-sm ${message.startsWith("Error") ? "bg-red-500/10 text-red-400 border border-red-500/30" : "bg-emerald-400/10 text-emerald-400 border border-emerald-400/30"}`}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/[0.02] border border-white/10 rounded-xl p-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-emerald-400 text-slate-900 font-medium"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
        {/* Business Profile */}
        {activeTab === "business" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Globe className="w-5 h-5 text-emerald-400" /> Business Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Workspace Name</label>
                <Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Business Name</label>
                <Input value={form.businessName} onChange={(v) => setForm({ ...form, businessName: v })} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">About Business</label>
                <TextArea value={form.aboutBusiness} onChange={(v) => setForm({ ...form, aboutBusiness: v })} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Contact Info (JSON)</label>
                <TextArea value={form.contactInfo} onChange={(v) => setForm({ ...form, contactInfo: v })} rows={2} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Operating Hours</label>
                <Input value={form.operatingHours} onChange={(v) => setForm({ ...form, operatingHours: v })} placeholder="Mon-Fri 9-17" />
              </div>
            </div>
          </div>
        )}

        {/* Website Source */}
        {activeTab === "website" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Search className="w-5 h-5 text-emerald-400" /> Website Source</h2>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Primary Website URL</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input value={form.websiteUrl} onChange={(v) => setForm({ ...form, websiteUrl: v })} placeholder="https://example.com" />
                </div>
                <button
                  onClick={handleCrawl}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-sm flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Re-index Website
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                The platform will crawl your website daily to learn about your pages, products, FAQs, and policies automatically.
              </p>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Crawl Status</div>
                  <div className="text-xs text-gray-500">
                    {workspace?.crawlStatus === "crawling" ? "Crawling in progress..." : workspace?.crawlStatus || "Not yet crawled"}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Last crawl: {workspace?.lastCrawl ? new Date(workspace.lastCrawl).toLocaleString() : "Never"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Knowledge Sources */}
        {activeTab === "knowledge" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Database className="w-5 h-5 text-emerald-400" /> Knowledge Sources</h2>
            <p className="text-sm text-gray-400">
              Add FAQs and documents to train your AI assistant to answer customer questions accurately.
            </p>

            {/* Website Data */}
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <h3 className="font-medium text-sm">Website Data (Auto-Crawled)</h3>
              </div>
              <div className="text-xs text-gray-500">
                {workspace?.crawlData ? "Crawled data is being used by your AI" : "No crawled data yet — go to Website Source tab to crawl"}
              </div>
            </div>

            {/* FAQs Section */}
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-emerald-400" />
                <h3 className="font-medium text-sm">FAQs ({faqs.length})</h3>
              </div>
              <div className="space-y-2 mb-4">
                {faqs.map((faq, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/5 rounded-lg p-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-emerald-400">Q: {faq.question}</p>
                      <p className="text-xs text-gray-400 mt-1">A: {faq.answer}</p>
                    </div>
                    <button onClick={() => handleDeleteFaq(i)} className="text-red-400 hover:text-red-300 shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {faqs.length === 0 && <p className="text-xs text-gray-500">No FAQs yet. Add one below.</p>}
              </div>
              <div className="border-t border-white/5 pt-3 space-y-2">
                <Input value={newFaqQ} onChange={setNewFaqQ} placeholder="Question" />
                <TextArea value={newFaqA} onChange={setNewFaqA} placeholder="Answer" rows={2} />
                <button
                  onClick={handleAddFaq}
                  disabled={knowledgeLoading || !newFaqQ.trim() || !newDocName.trim()}
                  className="bg-emerald-400 text-slate-900 px-3 py-1.5 rounded text-xs font-medium disabled:opacity-50 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add FAQ
                </button>
              </div>
            </div>

            {/* Documents Section */}
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-emerald-400" />
                <h3 className="font-medium text-sm">Documents ({documents.length})</h3>
              </div>
              <div className="space-y-2 mb-4">
                {documents.map((doc, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/5 rounded-lg p-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-gray-400 mt-1 truncate">{doc.content.substring(0, 120)}...</p>
                    </div>
                    <button onClick={() => handleDeleteDocument(i)} className="text-red-400 hover:text-red-300 shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {documents.length === 0 && <p className="text-xs text-gray-500">No documents yet. Add one below.</p>}
              </div>
              <div className="border-t border-white/5 pt-3 space-y-2">
                <Input value={newDocName} onChange={setNewDocName} placeholder="Document name (e.g. Return Policy)" />
                <TextArea value={newDocContent} onChange={setNewDocContent} placeholder="Paste document content here..." rows={4} />
                <button
                  onClick={handleAddDocument}
                  disabled={knowledgeLoading || !newDocName.trim() || !newDocContent.trim()}
                  className="bg-emerald-400 text-slate-900 px-3 py-1.5 rounded text-xs font-medium disabled:opacity-50 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Document
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Settings */}
        {activeTab === "ai" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Bot className="w-5 h-5 text-emerald-400" /> AI Behavior Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Chat Personality</label>
                <select
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400/50"
                  value={form.personality}
                  onChange={(e) => setForm({ ...form, personality: e.target.value })}
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="sales">Sales Focused</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Chat Tone</label>
                <select
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400/50"
                  value={form.tone}
                  onChange={(e) => setForm({ ...form, tone: e.target.value })}
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="casual">Casual</option>
                  <option value="formal">Formal</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Greeting Message</label>
                <Input value={form.greetingMessage} onChange={(v) => setForm({ ...form, greetingMessage: v })} placeholder="Hi! How can I help you today?" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Suggested Prompts (comma-separated)</label>
                <TextArea value={form.suggestedPrompts} onChange={(v) => setForm({ ...form, suggestedPrompts: v })} placeholder="How does shipping work?, What is your return policy?" rows={2} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Sales Rules</label>
                <TextArea value={form.salesRules} onChange={(v) => setForm({ ...form, salesRules: v })} placeholder="Upsell premium products, mention free shipping over $50" rows={2} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Escalation Rules</label>
                <TextArea value={form.escalationRules} onChange={(v) => setForm({ ...form, escalationRules: v })} placeholder="Escalate to human if: customer is angry, refund requested over $100" rows={2} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Lead Capture Settings (JSON)</label>
                <TextArea value={form.leadCaptureSettings} onChange={(v) => setForm({ ...form, leadCaptureSettings: v })} placeholder='{"captureEmail": true, "captureName": true, "capturePhone": false}' rows={2} />
              </div>
            </div>
          </div>
        )}

        {/* API Access */}
        {activeTab === "api" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Key className="w-5 h-5 text-emerald-400" /> API Access</h2>
            <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-medium">Workspace API Key</div>
                  <div className="text-xs text-gray-500">Use this key to connect your website to CircuCity AI</div>
                </div>
                <button
                  onClick={handleGenerateKey}
                  className="bg-emerald-400 text-slate-900 px-3 py-1.5 rounded text-xs font-medium"
                >
                  {apiKey ? "Regenerate" : "Generate Key"}
                </button>
              </div>
              {apiKey && (
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono break-all">
                    {apiKey}
                  </code>
                  <button onClick={handleCopyKey} className="p-2 hover:bg-white/5 rounded-lg">
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
              <h3 className="text-sm font-medium mb-2">Workspace ID</h3>
              <code className="block bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono break-all">
                {workspace?.id || "\u2014"}
              </code>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
              <h3 className="text-sm font-medium mb-2">Embed Code</h3>
              <code className="block bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono whitespace-pre-wrap break-all">
                {`<script src="https://chatbot.circucity.com/api/widget?key=${apiKey || "YOUR_API_KEY"}" async></script>`}
              </code>
            </div>
          </div>
        )}

        {/* Team Members */}
        {activeTab === "team" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Users className="w-5 h-5 text-emerald-400" /> Team Members</h2>
            <p className="text-sm text-gray-400">Manage who has access to this organization's workspaces.</p>

            {/* Member List */}
            {org?.members?.length > 0 ? (
              <div className="space-y-2">
                {org.members.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-400/20 rounded-full flex items-center justify-center text-emerald-400 text-xs font-bold">
                        {(m.user?.name || m.user?.email || "U")[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{m.user?.name || "\u2014"}</div>
                        <div className="text-xs text-gray-500">{m.user?.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs bg-white/5 text-gray-400 capitalize">{m.role}</span>
                      {m.userId !== org?.userId && (
                        <button
                          onClick={() => handleRemoveMember(m.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Remove member"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 text-sm">No team members yet</div>
            )}

            {/* Invite Form */}
            <div className="border-t border-white/5 pt-4">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400" /> Invite Team Member
              </h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400/50"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={handleInvite}
                  disabled={teamLoading || !inviteEmail.trim()}
                  className="bg-emerald-400 text-slate-900 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                >
                  {teamLoading ? "Sending..." : <><Plus className="w-4 h-4" /> Invite</>}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                The invited user will receive credentials to log in. They'll be added as a {inviteRole} of your organization.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      {!["api", "team", "knowledge"].includes(activeTab) && (
        <div className="flex justify-end mt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-400 text-slate-900 px-6 py-2 rounded-lg text-sm font-medium hover:bg-emerald-300 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      )}
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400/50"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400/50 resize-none"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
    />
  );
}
