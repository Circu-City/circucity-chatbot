"use client";

import React, { useState, useEffect } from "react";
import { Save, Loader2, CheckCircle2, AlertCircle, ExternalLink, Eye, EyeOff, Key, RefreshCw, Globe, ShoppingBag, MessageSquare, Database, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLATFORM_META: Record<string, { icon: React.ElementType; color: string; bg: string; docUrl: string }> = {
  shopify: { icon: ShoppingBag, color: "text-green-600", bg: "bg-green-50", docUrl: "https://partners.shopify.com" },
  gmail: { icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50", docUrl: "https://console.cloud.google.com/apis/credentials" },
  google_analytics: { icon: Globe, color: "text-orange-600", bg: "bg-orange-50", docUrl: "https://console.cloud.google.com/apis/credentials" },
  stripe: { icon: Database, color: "text-purple-600", bg: "bg-purple-50", docUrl: "https://dashboard.stripe.com/apikeys" },
  slack: { icon: Zap, color: "text-yellow-600", bg: "bg-yellow-50", docUrl: "https://api.slack.com/apps" },
};

function Wrapper({ children }: { children: React.ReactNode }) {
  return <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">{children}</div>;
}

export default function PlatformConfigPage() {
  const [platforms, setPlatforms] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/platform-config");
      const d = await res.json();
      if (d.success) setPlatforms(d.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadConfigs(); }, []);

  const update = (id: string, field: string, value: string) => {
    setPlatforms((prev: any) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleSave = async (platformId: string) => {
    setSaving(platformId);
    setSaved(null);
    const p = platforms[platformId];
    try {
      const res = await fetch("/api/admin/platform-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platformId, clientId: p.clientId, clientSecret: p.clientSecret }),
      });
      const d = await res.json();
      if (d.success) {
        setSaved(platformId);
        setTimeout(() => setSaved(null), 3000);
      } else {
        alert(d.error || "Failed to save");
      }
    } catch {
      alert("Failed to save");
    }
    setSaving(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>;
  }

  const platformList = Object.values(platforms) as any[];

  return (
    <Wrapper>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Platform Configurations</h2>
          <p className="text-sm text-slate-500 mt-1">Configure OAuth credentials for third-party integrations.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={loadConfigs}>
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      <div className="space-y-6">
        {platformList.map((p: any) => {
          const meta = PLATFORM_META[p.id] || { icon: Key, color: "text-slate-600", bg: "bg-slate-50", docUrl: "#" };
          const Icon = meta.icon;
          const showSecret = showSecrets[p.id];

          return (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-3 p-5 border-b border-gray-100">
                <div className={"w-10 h-10 rounded-xl flex items-center justify-center " + meta.bg}>
                  <Icon className={"w-5 h-5 " + meta.color} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{p.name}</h3>
                    {p.envDefined && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200 font-medium">
                        ENV
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 capitalize">{p.category} integration</p>
                </div>
                <a href={meta.docUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  Get Credentials <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Client ID <span className="text-[10px] font-mono lowercase normal-case text-slate-400">({p.clientIdEnv})</span>
                    </label>
                    <input
                      type="text"
                      value={p.clientId}
                      onChange={(e) => update(p.id, "clientId", e.target.value)}
                      placeholder={"Enter " + p.name + " Client ID"}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Client Secret <span className="text-[10px] font-mono lowercase normal-case text-slate-400">({p.clientSecretEnv})</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showSecret ? "text" : "password"}
                        value={p.clientSecret}
                        onChange={(e) => update(p.id, "clientSecret", e.target.value)}
                        placeholder={"Enter " + p.name + " Client Secret"}
                        className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecrets((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {p.scopes && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Required Scopes</p>
                    <p className="text-xs text-slate-600 font-mono">{p.scopes}</p>
                  </div>
                )}

                {p.envDefined && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                    <p className="text-xs text-amber-800">
                      This platform is configured via environment variables. Saved DB credentials will override env vars at runtime.
                    </p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={() => handleSave(p.id)}
                    disabled={saving === p.id}
                    size="sm"
                    className="gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    {saving === p.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : saved === p.id ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    {saving === p.id ? "Saving..." : saved === p.id ? "Saved!" : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Wrapper>
  );
}
