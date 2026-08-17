"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  FileText,
  Globe,
  Plus,
  Trash2,
  Loader2,
  Search,
  RefreshCw,
} from "lucide-react";
import { useDashboardI18n } from "@/components/dashboard/I18nProvider";

export default function KnowledgeBase() {
  const { t } = useDashboardI18n();
  const [activeTab, setActiveTab] = useState<"faqs" | "documents">("faqs");
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);
  const [documents, setDocuments] = useState<{ name: string; content: string; addedAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // FAQ form
  const [newFaqQ, setNewFaqQ] = useState("");
  const [newFaqA, setNewFaqA] = useState("");

  // Document form
  const [newDocName, setNewDocName] = useState("");
  const [newDocContent, setNewDocContent] = useState("");

  // Crawl data
  const [crawlData, setCrawlData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [faqRes, docRes, storeRes] = await Promise.all([
        fetch("/api/knowledge/faq"),
        fetch("/api/knowledge/documents"),
        fetch("/api/client/store"),
      ]);
      const faqData = await faqRes.json();
      const docData = await docRes.json();
      const storeData = await storeRes.json();

      if (faqData.success) setFaqs(faqData.data || []);
      if (docData.success) setDocuments(docData.data || []);
      if (storeData.success && storeData.data?.crawlData) {
        try { setCrawlData(JSON.parse(storeData.data.crawlData)); } catch {}
      }
    } catch {}
    setLoading(false);
  };

  const handleAddFaq = async () => {
    if (!newFaqQ.trim() || !newFaqA.trim()) return;
    setSaving(true);
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
    setSaving(false);
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
    setSaving(true);
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
    setSaving(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {message && (
        <div className="p-3 rounded-lg bg-emerald-400/10 text-emerald-400 border border-emerald-400/30 text-sm">
          {message}
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-dark-navy">{t("kb.title")}</h2>
        <p className="text-muted-foreground text-sm">Manage FAQs and documents that your AI uses to answer customers.</p>
      </div>

      {/* Website Data Status */}
      <Card className="p-6 border-border shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <Globe className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-dark-navy">{t("kb.websiteData")}</h3>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {crawlData ? "Crawled data is being used by your AI assistant." : "No crawled data yet. Go to Settings to crawl your website."}
          </p>
          {crawlData && (
            <Badge className="bg-green-100 text-green-700 border-green-200">{t("common.active")}</Badge>
          )}
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "faqs" ? "default" : "outline"}
          onClick={() => setActiveTab("faqs")}
          className={activeTab === "faqs" ? "bg-dark-navy text-white" : ""}
        >
          <FileText className="w-4 h-4 mr-2" />
          FAQs ({faqs.length})
        </Button>
        <Button
          variant={activeTab === "documents" ? "default" : "outline"}
          onClick={() => setActiveTab("documents")}
          className={activeTab === "documents" ? "bg-dark-navy text-white" : ""}
        >
          <Database className="w-4 h-4 mr-2" />
          Documents ({documents.length})
        </Button>
      </div>

      {/* FAQs Tab */}
      {activeTab === "faqs" && (
        <div className="space-y-6">
          <Card className="p-6 border-border shadow-sm">
            <h3 className="font-bold text-dark-navy mb-4">{t("kb.addFaq")}</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newFaqQ}
                onChange={(e) => setNewFaqQ(e.target.value)}
                placeholder="Question (e.g. What is your return policy?)"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              />
              <textarea
                value={newFaqA}
                onChange={(e) => setNewFaqA(e.target.value)}
                placeholder="Answer"
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
              />
              <Button
                onClick={handleAddFaq}
                disabled={saving || !newFaqQ.trim() || !newFaqA.trim()}
                className="bg-dark-navy text-white hover:bg-dark-navy/90"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                {t("kb.addFaq")}
              </Button>
            </div>
          </Card>

          {faqs.length > 0 ? (
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <Card key={i} className="p-4 border-border shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-primary">Q: {faq.question}</p>
                      <p className="text-sm text-muted-foreground mt-1">A: {faq.answer}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFaq(i)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 border-border shadow-sm text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground">{t("kb.noFaqs")}</p>
            </Card>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === "documents" && (
        <div className="space-y-6">
          <Card className="p-6 border-border shadow-sm">
            <h3 className="font-bold text-dark-navy mb-4">{t("kb.addDocument")}</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                placeholder="Document name (e.g. Return Policy, Shipping Info)"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              />
              <textarea
                value={newDocContent}
                onChange={(e) => setNewDocContent(e.target.value)}
                placeholder="Paste the document content here. Your AI will use this to answer customer questions."
                rows={6}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
              />
              <Button
                onClick={handleAddDocument}
                disabled={saving || !newDocName.trim() || !newDocContent.trim()}
                className="bg-dark-navy text-white hover:bg-dark-navy/90"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                {t("kb.addDocument")}
              </Button>
            </div>
          </Card>

          {documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc, i) => (
                <Card key={i} className="p-4 border-border shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-dark-navy">{doc.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{doc.content.substring(0, 150)}...</p>
                      <p className="text-[10px] text-gray-400 mt-1">Added {new Date(doc.addedAt).toLocaleDateString()}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDocument(i)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 border-border shadow-sm text-center">
              <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground">{t("kb.noDocuments")}</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
