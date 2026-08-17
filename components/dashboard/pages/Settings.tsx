"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  getCurrentOrganization,
  getWorkspaceById,
  updateWorkspace,
  generateWorkspaceApiKey,
  triggerCrawl,
} from "@/lib/actions/organization";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import SecuritySettings from "./SecuritySettings";
import {  User, Globe, Bot, FileText, Key, Save, RefreshCw,
  Copy, Check, Database, Search, Trash2, Bell, Loader2,
} from "lucide-react";
import { useDashboardI18n } from "@/components/dashboard/I18nProvider";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "business", label: "Business Profile", icon: Globe },
  { id: "website", label: "Website Source", icon: Search },
  { id: "knowledge", label: "Knowledge Sources", icon: Database },
  { id: "ai", label: "AI Settings", icon: Bot },
  { id: "api", label: "API Access", icon: Key },
  { id: "notifications", label: "Notifications", icon: Bell },
];

export default function SettingsPage() {
  const { t } = useDashboardI18n();
  const [org, setOrg] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [copied, setCopied] = useState(false);

  const [profileForm, setProfileForm] = useState({ name: "", email: "", url: "", industry: "" });

  const [wsForm, setWsForm] = useState({
    name: "", businessName: "", aboutBusiness: "", contactInfo: "", operatingHours: "",
    websiteUrl: "", personality: "professional", greetingMessage: "", suggestedPrompts: "",
    salesRules: "", escalationRules: "", leadCaptureSettings: "", tone: "professional",
  });

  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);
  const [documents, setDocuments] = useState<{ name: string; content: string; addedAt: string }[]>([]);
  const [newFaqQ, setNewFaqQ] = useState("");
  const [newFaqA, setNewFaqA] = useState("");
  const [newDocName, setNewDocName] = useState("");
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    escalationAlerts: true,
    weeklyReport: false,
    productUpdates: true,
  });
  const [newDocContent, setNewDocContent] = useState("");
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const settingTab = searchParams.get("settingTab");
    if (settingTab) setActiveTab(settingTab);
    async function load() {
      try {
        const orgData = await getCurrentOrganization();
        setOrg(orgData);
        const ws = orgData?.workspaces?.[0];
        if (ws) {
          const fullWs = await getWorkspaceById(ws.id);
          setWorkspace(fullWs);
          setWsForm({
            name: fullWs?.name || "", businessName: fullWs?.businessName || "",
            aboutBusiness: fullWs?.aboutBusiness || "", contactInfo: fullWs?.contactInfo || "",
            operatingHours: fullWs?.operatingHours || "", websiteUrl: fullWs?.websiteUrl || "",
            personality: fullWs?.personality || "professional", greetingMessage: fullWs?.greetingMessage || "",
            suggestedPrompts: fullWs?.suggestedPrompts || "", salesRules: fullWs?.salesRules || "",
            escalationRules: fullWs?.escalationRules || "", leadCaptureSettings: fullWs?.leadCaptureSettings || "",
            tone: fullWs?.tone || "professional",
          });
          setApiKey(fullWs?.apiKey || "");
          if (fullWs?.crawlData) {
            try { const p = JSON.parse(fullWs.crawlData); setFaqs(p.faqs || []); setDocuments(p.documents || []); } catch {}
          }
          try {
            const meta = fullWs?.metadata ? JSON.parse(fullWs.metadata) : {};
            if (meta.notifications) {
              setNotifications(meta.notifications);
            }
          } catch {}
        }
        const storeRes = await fetch("/api/client/store");
        const sd = await storeRes.json();
        if (sd.success && sd.data) {
          setProfileForm({ name: sd.data.name || "", email: sd.data.user?.email || "", url: sd.data.url || "", industry: sd.data.industry || "" });
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    load();
  }, []);

  const showMsg = (m: string) => { setMessage(m); setTimeout(() => setMessage(""), 3000); };

  const handleSaveProfile = async () => {
    setSaving(true);
    try { await fetch("/api/client/store", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: profileForm.name, url: profileForm.url, industry: profileForm.industry }) }); showMsg("Profile saved"); }
    catch { showMsg("Error saving profile"); }
    setSaving(false);
  };

  const handleSaveWorkspace = async () => {
    if (!workspace) return; setSaving(true);
    try {
      await updateWorkspace(workspace.id, wsForm);
      const storeRes = await fetch("/api/client/store");
      const storeData = await storeRes.json();
      if (storeData.success && storeData.data) {
        let meta = {};
        if (storeData.data.metadata) try { meta = JSON.parse(storeData.data.metadata); } catch {}
        meta = { ...meta, notifications };
        await fetch("/api/client/store", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metadata: JSON.stringify(meta) }),
        });
      }
      showMsg("Settings saved");
    }
    catch (e: any) { showMsg("Error: " + (e.message || "Save failed")); }
    setSaving(false);
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      const storeRes = await fetch("/api/client/store");
      const storeData = await storeRes.json();
      if (storeData.success && storeData.data) {
        let meta = {};
        if (storeData.data.metadata) try { meta = JSON.parse(storeData.data.metadata); } catch {}
        meta = { ...meta, notifications };
        await fetch("/api/client/store", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metadata: JSON.stringify(meta) }),
        });
        showMsg("Notification preferences saved");
      }
    }
    catch (e: any) { showMsg("Error: " + (e.message)); }
    setSaving(false);
  };

  const handleGenerateKey = async () => {
    if (!workspace) return;
    try { const res = await generateWorkspaceApiKey(workspace.id); setApiKey(res.apiKey); showMsg("API key generated"); }
    catch (e: any) { showMsg("Error: " + (e.message)); }
  };
  const handleCopyKey = () => { navigator.clipboard.writeText(apiKey); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const handleCrawl = async () => {
    if (!workspace) return;
    try { await triggerCrawl(workspace.id); showMsg("Crawl started"); }
    catch (e: any) { showMsg("Error: " + (e.message)); }
  };

  const handleAddFaq = async () => {
    if (!newFaqQ.trim() || !newFaqA.trim()) return; setKnowledgeLoading(true);
    try { const r = await fetch("/api/knowledge/faq", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: newFaqQ, answer: newFaqA }) }); const d = await r.json(); if (d.success) { setFaqs(d.data); setNewFaqQ(""); setNewFaqA(""); showMsg("FAQ added"); } } catch {}
    setKnowledgeLoading(false);
  };
  const handleDeleteFaq = async (i: number) => { const r = await fetch("/api/knowledge/faq", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ index: i }) }); const d = await r.json(); if (d.success) setFaqs(d.data); };

  const handleAddDoc = async () => {
    if (!newDocName.trim() || !newDocContent.trim()) return; setKnowledgeLoading(true);
    try { const r = await fetch("/api/knowledge/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newDocName, content: newDocContent }) }); const d = await r.json(); if (d.success) { setDocuments(d.data); setNewDocName(""); setNewDocContent(""); showMsg("Document added"); } } catch {}
    setKnowledgeLoading(false);
  };
  const handleDeleteDoc = async (i: number) => { const r = await fetch("/api/knowledge/documents", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ index: i }) }); const d = await r.json(); if (d.success) setDocuments(d.data); };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 max-w-full overflow-hidden">

{message && (
        <div className={cn("p-3 rounded-lg text-sm border", message.startsWith("Error") ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-600 border-green-200")}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all font-medium",
              activeTab === tab.id ? "bg-white text-dark-navy shadow-sm" : "text-slate-500 hover:text-dark-navy hover:bg-white/50")}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Profile */}
      {activeTab === "profile" && (
        <Card className="border-border shadow-sm">
          <CardContent className="p-6 space-y-6">
            <h3 className="font-bold text-dark-navy flex items-center gap-2"><User className="w-5 h-5 text-primary" /> {t("set.profileInfo")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><label className="text-sm font-medium text-dark-navy">{t("set.storeName")}</label>
                <Input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-dark-navy">{t("common.email")}</label>
                <Input value={profileForm.email} disabled className="bg-slate-50" /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-dark-navy">{t("set.websiteUrl")}</label>
                <Input value={profileForm.url} onChange={(e) => setProfileForm({ ...profileForm, url: e.target.value })} placeholder="https://example.com" /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-dark-navy">{t("set.industry")}</label>
                <Input value={profileForm.industry} onChange={(e) => setProfileForm({ ...profileForm, industry: e.target.value })} placeholder="e.g. Electronics, Fashion" /></div>
            </div>
          </CardContent>
          <div className="border-t border-border px-6 py-4 flex justify-end">
            <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </Card>
      )}

      {/* Business Profile */}
      {activeTab === "business" && (
        <Card className="border-border shadow-sm">
          <CardContent className="p-6 space-y-6">
            <h3 className="font-bold text-dark-navy flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> {t("set.businessProfile")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><label className="text-sm font-medium text-dark-navy">{t("set.workspaceName")}</label>
                <Input value={wsForm.name} onChange={(e) => setWsForm({ ...wsForm, name: e.target.value })} /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-dark-navy">{t("set.businessName")}</label>
                <Input value={wsForm.businessName} onChange={(e) => setWsForm({ ...wsForm, businessName: e.target.value })} /></div>
              <div className="md:col-span-2 space-y-2"><label className="text-sm font-medium text-dark-navy">{t("set.aboutBusiness")}</label>
                <textarea className="w-full px-3 py-2 border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary resize-none" rows={3}
                  value={wsForm.aboutBusiness} onChange={(e) => setWsForm({ ...wsForm, aboutBusiness: e.target.value })} /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-dark-navy">{t("set.contactInfo")}</label>
                <Input value={wsForm.contactInfo} onChange={(e) => setWsForm({ ...wsForm, contactInfo: e.target.value })} placeholder="phone, email, address" /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-dark-navy">{t("set.operatingHours")}</label>
                <Input value={wsForm.operatingHours} onChange={(e) => setWsForm({ ...wsForm, operatingHours: e.target.value })} placeholder="Mon-Fri 9-17" /></div>
            </div>
          </CardContent>
          <div className="border-t border-border px-6 py-4 flex justify-end">
            <Button onClick={handleSaveWorkspace} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save Business Settings"}
            </Button>
          </div>
        </Card>
      )}

      {/* Website Source */}
      {activeTab === "website" && (
        <Card className="border-border shadow-sm">
          <CardContent className="p-6 space-y-6">
            <h3 className="font-bold text-dark-navy flex items-center gap-2"><Search className="w-5 h-5 text-primary" /> {t("set.websiteSource")}</h3>
            <div className="space-y-2"><label className="text-sm font-medium text-dark-navy">{t("set.primaryWebsiteUrl")}</label>
              <div className="flex gap-2">
                <Input className="flex-1" value={wsForm.websiteUrl} onChange={(e) => setWsForm({ ...wsForm, websiteUrl: e.target.value })} placeholder="https://example.com" />
                <Button variant="outline" onClick={handleCrawl}><RefreshCw className="w-4 h-4 mr-2" /> {t("set.reindex")}</Button>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
              <div><p className="text-sm font-medium text-dark-navy">{t("set.crawlStatus")}</p><p className="text-xs text-muted-foreground">{workspace?.crawlStatus === "crawling" ? "Crawling..." : workspace?.crawlStatus || "Not yet crawled"}</p></div>
              <p className="text-xs text-muted-foreground">Last: {workspace?.lastCrawl ? new Date(workspace.lastCrawl).toLocaleString() : "Never"}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Knowledge Sources */}
      {activeTab === "knowledge" && (
        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-dark-navy flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> FAQs ({faqs.length})</h3>
              {faqs.map((faq, i) => (
                <div key={i} className="flex items-start justify-between gap-3 p-3 bg-slate-50 rounded-lg border">
                  <div className="flex-1"><p className="text-sm font-medium text-primary">Q: {faq.question}</p><p className="text-xs text-muted-foreground mt-1">A: {faq.answer}</p></div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteFaq(i)} className="text-red-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
              {faqs.length === 0 && <p className="text-sm text-muted-foreground">{t("set.noFaqs")}</p>}
              <div className="border-t pt-4 space-y-3">
                <Input value={newFaqQ} onChange={(e) => setNewFaqQ(e.target.value)} placeholder="Question" />
                <textarea className="w-full px-3 py-2 border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary resize-none" rows={2} placeholder="Answer"
                  value={newFaqA} onChange={(e) => setNewFaqA(e.target.value)} />
                <Button size="sm" onClick={handleAddFaq} disabled={knowledgeLoading || !newFaqQ.trim() || !newFaqA.trim()}>
                  {knowledgeLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Add FAQ
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-dark-navy flex items-center gap-2"><Database className="w-5 h-5 text-primary" /> Documents ({documents.length})</h3>
              {documents.map((doc, i) => (
                <div key={i} className="flex items-start justify-between gap-3 p-3 bg-slate-50 rounded-lg border">
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-dark-navy">{doc.name}</p><p className="text-xs text-muted-foreground mt-1 truncate">{doc.content.substring(0, 120)}...</p></div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteDoc(i)} className="text-red-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
              {documents.length === 0 && <p className="text-sm text-muted-foreground">{t("set.noDocuments")}</p>}
              <div className="border-t pt-4 space-y-3">
                <Input value={newDocName} onChange={(e) => setNewDocName(e.target.value)} placeholder="Document name" />
                <textarea className="w-full px-3 py-2 border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary resize-none" rows={4} placeholder="Document content..."
                  value={newDocContent} onChange={(e) => setNewDocContent(e.target.value)} />
                <Button size="sm" onClick={handleAddDoc} disabled={knowledgeLoading || !newDocName.trim() || !newDocContent.trim()}>
                  {knowledgeLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Add Document
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Settings */}
      {activeTab === "ai" && (
        <Card className="border-border shadow-sm">
          <CardContent className="p-6 space-y-6">
            <h3 className="font-bold text-dark-navy flex items-center gap-2"><Bot className="w-5 h-5 text-primary" /> {t("set.aiConfig")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><label className="text-sm font-medium text-dark-navy">{t("set.personality")}</label>
                <select className="w-full px-3 py-2 bg-white border border-border rounded-md text-sm outline-none" value={wsForm.personality} onChange={(e) => setWsForm({ ...wsForm, personality: e.target.value })}>
                  <option value="professional">{t("set.professional")}</option><option value="friendly">{t("set.friendly")}</option><option value="sales">{t("set.salesFocused")}</option><option value="custom">{t("set.custom")}</option>
                </select></div>
              <div className="space-y-2"><label className="text-sm font-medium text-dark-navy">{t("set.tone")}</label>
                <select className="w-full px-3 py-2 bg-white border border-border rounded-md text-sm outline-none" value={wsForm.tone} onChange={(e) => setWsForm({ ...wsForm, tone: e.target.value })}>
                  <option value="professional">{t("set.professional")}</option><option value="friendly">{t("set.friendly")}</option><option value="casual">{t("set.casual")}</option><option value="formal">Formal</option>
                </select></div>
              <div className="md:col-span-2 space-y-2"><label className="text-sm font-medium text-dark-navy">Greeting Message</label>
                <Input value={wsForm.greetingMessage} onChange={(e) => setWsForm({ ...wsForm, greetingMessage: e.target.value })} placeholder="Hi! How can I help you today?" /></div>
              <div className="md:col-span-2 space-y-2"><label className="text-sm font-medium text-dark-navy">Suggested Prompts</label>
                <textarea className="w-full px-3 py-2 border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary resize-none" rows={2}
                  value={wsForm.suggestedPrompts} onChange={(e) => setWsForm({ ...wsForm, suggestedPrompts: e.target.value })} placeholder="How does shipping work?, Return policy?" /></div>
              <div className="md:col-span-2 space-y-2"><label className="text-sm font-medium text-dark-navy">Sales Rules</label>
                <textarea className="w-full px-3 py-2 border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary resize-none" rows={2}
                  value={wsForm.salesRules} onChange={(e) => setWsForm({ ...wsForm, salesRules: e.target.value })} placeholder="Upsell premium products, mention free shipping over $50" /></div>
              <div className="md:col-span-2 space-y-2"><label className="text-sm font-medium text-dark-navy">Escalation Rules</label>
                <textarea className="w-full px-3 py-2 border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary resize-none" rows={2}
                  value={wsForm.escalationRules} onChange={(e) => setWsForm({ ...wsForm, escalationRules: e.target.value })} placeholder="Escalate if customer is angry, refund > $100" /></div>
              <div className="md:col-span-2 space-y-2"><label className="text-sm font-medium text-dark-navy">Lead Capture (JSON)</label>
                <textarea className="w-full px-3 py-2 border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary resize-none" rows={2}
                  value={wsForm.leadCaptureSettings} onChange={(e) => setWsForm({ ...wsForm, leadCaptureSettings: e.target.value })} placeholder='{"captureEmail": true}' /></div>
            </div>
          </CardContent>
          <div className="border-t border-border px-6 py-4 flex justify-end">
            <Button onClick={handleSaveWorkspace} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save AI Settings"}
            </Button>
          </div>
        </Card>
      )}

      {/* Notifications */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardContent className="p-6 space-y-6">
              <h3 className="font-bold text-dark-navy flex items-center gap-2"><Bell className="w-5 h-5 text-primary" /> Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { key: "emailAlerts", label: "Email Alerts", desc: "Receive email notifications for important events" },
                  { key: "escalationAlerts", label: "Escalation Alerts", desc: "Get notified when conversations get escalated" },
                  { key: "weeklyReport", label: "Weekly Report", desc: "Receive a weekly summary of your store's performance" },
                  { key: "productUpdates", label: "Product Updates", desc: "Get notified about new features and updates" },
                ].map((n) => (
                  <div key={n.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-dark-navy">{n.label}</p>
                      <p className="text-xs text-muted-foreground">{n.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifications((prev: any) => ({ ...prev, [n.key]: !prev[n.key] }))}
                      className={cn(
                        "relative w-11 h-6 rounded-full transition-colors",
                        (notifications as any)[n.key] ? "bg-lemon-green" : "bg-gray-300"
                      )}
                    >
                      <span className={cn(
                        "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                        (notifications as any)[n.key] && "translate-x-5"
                      )} />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
            <div className="border-t border-border px-6 py-4 flex justify-end">
              <Button onClick={handleSaveNotifications} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving..." : "Save Notification Settings"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* API Access */}
      {activeTab === "api" && (
        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-dark-navy flex items-center gap-2"><Key className="w-5 h-5 text-primary" /> API Key</h3>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Use this key to connect your website</p>
                <Button variant="outline" size="sm" onClick={handleGenerateKey}>{apiKey ? "Regenerate" : "Generate Key"}</Button>
              </div>
              {apiKey && (
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-slate-100 border border-border rounded-lg px-3 py-2 text-xs font-mono break-all">{apiKey}</code>
                  <Button variant="ghost" size="sm" onClick={handleCopyKey}>{copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}</Button>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-dark-navy">{t("set.workspaceId")}</h3>
              <code className="block bg-slate-100 border border-border rounded-lg px-3 py-2 text-xs font-mono break-all">{workspace?.id || "\u2014"}</code>
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-dark-navy">{t("set.embedCode")}</h3>
              <code className="block bg-slate-100 border border-border rounded-lg px-3 py-2 text-xs font-mono whitespace-pre-wrap break-all">
                {`<script src="https://chatbot.circucity.com/api/widget?key=${apiKey || "YOUR_API_KEY"}" async></script>`}
              </code>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
