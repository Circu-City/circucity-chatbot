"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save, ArrowLeft, Store, Bot, Palette, Package, MessageSquare, CreditCard, Loader2, CheckCircle } from "lucide-react";

export default function StoreDetailClient() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState("");
  const [store, setStore] = useState<any>(null);

  const [storeForm, setStoreForm] = useState({ name: "", status: "", industry: "", url: "" });
  const [aiForm, setAiForm] = useState({ tone: "", personality: "", greetingMessage: "", aboutBusiness: "" });
  const [embedForm, setEmbedForm] = useState({ botName: "", primaryColor: "#9EF01A", position: "bottom-right", welcomeMessage: "", showBranding: true, voiceEnabled: true, proactiveEnabled: true });

  useEffect(() => {
    fetch(`/api/admin/stores/${storeId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          const s = d.data;
          setStore(s);
          setStoreForm({ name: s.name || "", status: s.status || "active", industry: s.industry || "", url: s.url || "" });
          setAiForm({ tone: s.tone || "professional", personality: s.personality || "professional", greetingMessage: s.greetingMessage || "", aboutBusiness: s.aboutBusiness || "" });
          if (s.embedSettings) {
            setEmbedForm({
              botName: s.embedSettings.botName || "AI Assistant",
              primaryColor: s.embedSettings.primaryColor || "#9EF01A",
              position: s.embedSettings.position || "bottom-right",
              welcomeMessage: s.embedSettings.welcomeMessage || "",
              showBranding: s.embedSettings.showBranding ?? true,
              voiceEnabled: s.embedSettings.voiceEnabled ?? true,
              proactiveEnabled: s.embedSettings.proactiveEnabled ?? true,
            });
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [storeId]);

  const saveStore = async () => {
    setSaving("store");
    try {
      const res = await fetch(`/api/admin/stores/${storeId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(storeForm) });
      const d = await res.json();
      if (d.success) { setSaved("Store saved"); setTimeout(() => setSaved(""), 2000); }
    } catch {}
    setSaving(null);
  };

  const saveAi = async () => {
    setSaving("ai");
    try {
      const res = await fetch(`/api/admin/stores/${storeId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(aiForm) });
      const d = await res.json();
      if (d.success) { setSaved("AI settings saved"); setTimeout(() => setSaved(""), 2000); }
    } catch {}
    setSaving(null);
  };

  const saveEmbed = async () => {
    setSaving("embed");
    try {
      const res = await fetch("/api/client/embed-settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(embedForm) });
      const d = await res.json();
      if (d.success) { setSaved("Widget settings saved"); setTimeout(() => setSaved(""), 2000); }
    } catch {}
    setSaving(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>;
  }

  if (!store) {
    return <div className="text-center py-12 text-slate-500">Store not found</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/admin/stores")} className="p-2 hover:bg-gray-100 rounded-lg text-slate-400">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{store.name}</h2>
            <p className="text-sm text-slate-500">{store.user?.email} · {store.subscriptions?.[0]?.plan || "free"} plan</p>
          </div>
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">
            <CheckCircle className="w-4 h-4" /> {saved}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="p-2 bg-blue-50 rounded-lg"><Store className="w-5 h-5 text-blue-600" /></div>
          <div><h3 className="font-semibold text-slate-900">Store Details</h3></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Name</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-400" value={storeForm.name} onChange={e => setStoreForm({ ...storeForm, name: e.target.value })} /></div>
          <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Status</label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-400" value={storeForm.status} onChange={e => setStoreForm({ ...storeForm, status: e.target.value })}>
              <option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option>
            </select></div>
          <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Industry</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-400" value={storeForm.industry} onChange={e => setStoreForm({ ...storeForm, industry: e.target.value })} /></div>
          <div className="md:col-span-3"><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">URL</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-400 font-mono" value={storeForm.url} onChange={e => setStoreForm({ ...storeForm, url: e.target.value })} /></div>
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={saveStore} disabled={saving === "store"} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving === "store" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="p-2 bg-purple-50 rounded-lg"><Bot className="w-5 h-5 text-purple-600" /></div>
          <div><h3 className="font-semibold text-slate-900">AI Agent</h3><p className="text-xs text-slate-400">Cira personality and knowledge</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tone</label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-400" value={aiForm.tone} onChange={e => setAiForm({ ...aiForm, tone: e.target.value })}>
              <option value="professional">Professional</option><option value="friendly">Friendly</option><option value="casual">Casual</option>
            </select></div>
          <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Personality</label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-400" value={aiForm.personality} onChange={e => setAiForm({ ...aiForm, personality: e.target.value })}>
              <option value="professional">Professional</option><option value="friendly">Friendly</option><option value="helpful">Helpful</option>
            </select></div>
          <div className="md:col-span-2"><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Greeting Message</label>
            <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-400 resize-none" rows={2} value={aiForm.greetingMessage} onChange={e => setAiForm({ ...aiForm, greetingMessage: e.target.value })} /></div>
          <div className="md:col-span-2"><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">About Business</label>
            <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-400 resize-none" rows={3} value={aiForm.aboutBusiness} onChange={e => setAiForm({ ...aiForm, aboutBusiness: e.target.value })} /></div>
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={saveAi} disabled={saving === "ai"} className="flex items-center gap-2 px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
            {saving === "ai" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="p-2 bg-green-50 rounded-lg"><Palette className="w-5 h-5 text-green-600" /></div>
          <div><h3 className="font-semibold text-slate-900">Chat Widget</h3><p className="text-xs text-slate-400">Embedded chat appearance and behavior</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Bot Name</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-400" value={embedForm.botName} onChange={e => setEmbedForm({ ...embedForm, botName: e.target.value })} /></div>
          <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Primary Color</label>
            <input type="color" className="w-full h-9 px-1 border border-gray-200 rounded-lg cursor-pointer" value={embedForm.primaryColor} onChange={e => setEmbedForm({ ...embedForm, primaryColor: e.target.value })} /></div>
          <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Position</label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-400" value={embedForm.position} onChange={e => setEmbedForm({ ...embedForm, position: e.target.value })}>
              <option value="bottom-right">Bottom Right</option><option value="bottom-left">Bottom Left</option>
            </select></div>
          <div className="md:col-span-3"><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Welcome Message</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-400" value={embedForm.welcomeMessage} onChange={e => setEmbedForm({ ...embedForm, welcomeMessage: e.target.value })} /></div>
        </div>
        <div className="flex items-center gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-emerald-500" checked={embedForm.showBranding} onChange={e => setEmbedForm({ ...embedForm, showBranding: e.target.checked })} /><span className="text-sm text-slate-700">Show Branding</span></label>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-emerald-500" checked={embedForm.voiceEnabled} onChange={e => setEmbedForm({ ...embedForm, voiceEnabled: e.target.checked })} /><span className="text-sm text-slate-700">Voice Enabled</span></label>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-emerald-500" checked={embedForm.proactiveEnabled} onChange={e => setEmbedForm({ ...embedForm, proactiveEnabled: e.target.checked })} /><span className="text-sm text-slate-700">Proactive Chat</span></label>
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={saveEmbed} disabled={saving === "embed"} className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            {saving === "embed" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <Package className="w-5 h-5 text-slate-400 mb-2" />
          <p className="text-2xl font-bold text-slate-900">{store.products?.length || 0}</p>
          <p className="text-xs text-slate-500">Products</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <MessageSquare className="w-5 h-5 text-slate-400 mb-2" />
          <p className="text-2xl font-bold text-slate-900">{store.conversations?.length || 0}</p>
          <p className="text-xs text-slate-500">Conversations</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <CreditCard className="w-5 h-5 text-slate-400 mb-2" />
          <p className="text-2xl font-bold text-slate-900 capitalize">{store.subscriptions?.[0]?.plan || "free"}</p>
          <p className="text-xs text-slate-500 capitalize">{store.subscriptions?.[0]?.status || "inactive"}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <KeyIcon />
          <p className="text-2xl font-bold text-slate-900">{store.apiKeys?.length || 0}</p>
          <p className="text-xs text-slate-500">API Keys</p>
        </div>
      </div>
    </div>
  );
}

function KeyIcon() {
  return (
    <svg className="w-5 h-5 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  );
}
