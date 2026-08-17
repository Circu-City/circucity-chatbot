"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Smartphone, Palette, MessageCircle, Check, Code, Copy, Globe, ShieldCheck, Settings, Save, ExternalLink, Bot, Sparkles, Eye, Loader2, QrCode, Link2, Unlink, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardI18n } from "@/components/dashboard/I18nProvider";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-8  max-w-full overflow-hidden">
      {children}
    </div>
  );
}

interface Channel {
  id: string;
  type: string;
  name: string;
  status: string;
  credentials?: string;
  settings?: string;
  errorMessage?: string;
}

interface EmbedSettings {
  primaryColor?: string;
  position?: string;
  welcomeMessage?: string;
  botName?: string;
  showBranding?: boolean;
  voiceEnabled?: boolean;
  proactiveEnabled?: boolean;
  autoOpen?: boolean;
  autoOpenDelay?: number;
}


export default function ChatWidget() {
  const { t } = useDashboardI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [settings, setSettings] = useState<EmbedSettings>({});
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<string>("free");

  const fetchData = useCallback(async () => {
    try {
      const [channelsRes, settingsRes, subRes] = await Promise.all([
        fetch("/api/channels").then(r => r.json()),
        fetch("/api/client/embed-settings").then(r => r.json()),
        fetch("/api/client/subscription").then(r => r.json()).catch(() => ({ success: false })),
      ]);
      if (channelsRes.success) setChannels(channelsRes.data || []);
      if (settingsRes.success && settingsRes.data) setSettings(settingsRes.data);
      if (subRes.success && subRes.data?.plan) {
        setPlan(subRes.data.plan);
        if (subRes.data.plan === "free" || !subRes.data.plan) {
          setSettings((prev: any) => ({ ...prev, showBranding: true }));
        }
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/client/embed-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const d = await res.json();
      if (!d.success) setError(d.error || "Failed to save");
    } catch {
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = async (platform: string) => {
    setConnecting(platform);
    setError("");
    try {
      const res = await fetch("/api/channels/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      const d = await res.json();
      if (d.success && d.data?.url) {
        window.open(d.data.url, "_blank", "width=600,height=700");
        setTimeout(fetchData, 5000);
      } else if (d.needsConfig) {
        setError(d.error || "Platform not configured. Configure it in Settings.");
      } else {
        setError(d.error || "Failed to connect");
      }
    } catch {
      setError("Failed to initiate connection");
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (channelId: string) => {
    setDisconnecting(channelId);
    try {
      await fetch(`/api/channels/${channelId}`, { method: "DELETE" });
      fetchData();
    } catch {
      setError("Failed to disconnect");
    } finally {
      setDisconnecting(null);
    }
  };

  const copySnippet = () => {
    navigator.clipboard.writeText('<script src="YOUR_DOMAIN/widget.js" data-key="YOUR_API_KEY"></script>');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateSetting = (key: keyof EmbedSettings, value: any) => setSettings({ ...settings, [key]: value });

  const getChannel = (type: string) => channels.find(c => c.type === type);

  const channelStatusBadge = (channel?: Channel) => {
    if (!channel) return <Badge variant="outline" className="text-[10px]">{t("widget.notConnected")}</Badge>;
    switch (channel.status) {
      case "connected": return <Badge className="bg-green-500 text-[10px]">{t("common.connected")}</Badge>;
      case "error": return <Badge variant="destructive" className="text-[10px]">{t("widget.error")}</Badge>;
      default: return <Badge variant="outline" className="text-[10px]">{t("common.disconnected")}</Badge>;
    }
  };

  const channelConfig = {
    whatsapp: { label: "WhatsApp", desc: "Connect your WhatsApp Business number via QR code", icon: MessageCircle, color: "text-green-600", bg: "bg-green-50" },
    messenger: { label: "Facebook Messenger", desc: "Connect Messenger page via OAuth", icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50" },
    instagram: { label: "Instagram", desc: "Connect Instagram Business account via OAuth", icon: Smartphone, color: "text-pink-600", bg: "bg-pink-50" },
  };

  const primaryColor = settings.primaryColor || "#2563eb";
  const botName = settings.botName || "Cira";
  const welcomeMessage = settings.welcomeMessage || "Hi there! I'm Cira, your AI shopping assistant. How can I help you today?";

  return (
    <Wrapper>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-dark-navy">{t("widget.title")}</h2>
            <div className="flex items-center gap-2">
              {error && <p className="text-xs text-red-500 max-w-[200px] truncate">{error}</p>}
              <Button variant="outline" size="sm" className="gap-2" onClick={copySnippet}>
                {copied ? <Check className="w-4 h-4" /> : <Code className="w-4 h-4" />}
                {copied ? t("widget.copied") : t("widget.getSnippet")}
              </Button>
              <Button size="sm" className="gap-2" onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4" />
                {saving ? t("widget.saving") : t("widget.save")}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <Card className="border-border shadow-sm">
                <div className="p-6 border-b border-border flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-dark-navy">{t("widget.channelVerification")}</h3>
                </div>
                <CardContent className="p-6 space-y-4">
                  {(Object.keys(channelConfig) as Array<keyof typeof channelConfig>).map((type) => {
                    const cfg = channelConfig[type];
                    const Icon = cfg.icon;
                    const channel = getChannel(type);
                    return (
                      <div key={type} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-border">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", cfg.bg)}>
                            <Icon className={cn("w-5 h-5", cfg.color)} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-dark-navy">{cfg.label}</p>
                            <p className="text-xs text-muted-foreground">{cfg.desc}</p>
                            {channel?.errorMessage && <p className="text-xs text-red-500 mt-0.5">{channel.errorMessage}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {channelStatusBadge(channel)}
                          {channel?.status === "connected" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8 gap-1"
                              onClick={() => handleDisconnect(channel.id)}
                              disabled={disconnecting === channel.id}
                            >
                              {disconnecting === channel.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlink className="w-3 h-3" />}
                              {t("widget.disconnect")}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="text-xs h-8 gap-1"
                              onClick={() => handleConnect(type)}
                              disabled={connecting === type}
                            >
                              {connecting === type ? <Loader2 className="w-3 h-3 animate-spin" /> : <QrCode className="w-3 h-3" />}
                              {type === "whatsapp" ? t("widget.qrCode") : t("widget.connect")}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <div className="p-6 border-b border-border flex items-center gap-2">
                  <Bot className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-dark-navy">{t("widget.personality")}</h3>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-dark-navy">{t("widget.botName")}</span>
                      <Input value={settings.botName || ""} onChange={(e) => updateSetting("botName", e.target.value)} className="h-9 text-sm" placeholder="Cira" />
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-dark-navy">{t("widget.welcomeMessage")}</span>
                      <textarea value={settings.welcomeMessage || ""} onChange={(e) => updateSetting("welcomeMessage", e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background resize-none" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-border">
                    <div>
                      <p className="text-sm font-medium text-dark-navy">{t("widget.voiceEnabled")}</p>
                      <p className="text-xs text-muted-foreground">{t("widget.allowVoice")}</p>
                    </div>
                    <button type="button" className={"w-10 h-5 rounded-full transition-colors " + (settings.voiceEnabled ? "bg-primary" : "bg-gray-200")} onClick={() => updateSetting("voiceEnabled", !settings.voiceEnabled)}>
                      <div className={"w-4 h-4 rounded-full bg-white shadow-sm transition-transform " + (settings.voiceEnabled ? "translate-x-5" : "translate-x-0.5")} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-border">
                    <div>
                      <p className="text-sm font-medium text-dark-navy">{t("widget.proactiveChat")}</p>
                      <p className="text-xs text-muted-foreground">{t("widget.autoTrigger")}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {settings.proactiveEnabled && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">{t("widget.delay")}</span>
                          <Input type="number" value={settings.autoOpenDelay || 5} onChange={(e) => updateSetting("autoOpenDelay", parseInt(e.target.value) || 5)} className="w-16 h-7 text-xs" />
                          <span className="text-xs text-muted-foreground">s</span>
                        </div>
                      )}
                      <button type="button" className={"w-10 h-5 rounded-full transition-colors shrink-0 " + (settings.proactiveEnabled ? "bg-primary" : "bg-gray-200")} onClick={() => updateSetting("proactiveEnabled", !settings.proactiveEnabled)}>
                        <div className={"w-4 h-4 rounded-full bg-white shadow-sm transition-transform " + (settings.proactiveEnabled ? "translate-x-5" : "translate-x-0.5")} />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <div className="p-6 border-b border-border flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-dark-navy">{t("widget.customization")}</h3>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-dark-navy">{t("widget.position")}</span>
                      <select value={settings.position || "bottom-right"} onChange={(e) => updateSetting("position", e.target.value)} className="w-full h-9 px-3 rounded-lg border border-border text-sm bg-background">
                        <option value="bottom-right">{t("widget.bottomRight")}</option>
                        <option value="bottom-left">{t("widget.bottomLeft")}</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-dark-navy">{t("widget.primaryColor")}</span>
                      <Input type="color" value={settings.primaryColor || "#2563eb"} onChange={(e) => updateSetting("primaryColor", e.target.value)} className="h-9 p-1" />
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-dark-navy">{t("widget.autoOpen")}</span>
                      <select value={settings.autoOpen ? "true" : "false"} onChange={(e) => updateSetting("autoOpen", e.target.value === "true")} className="w-full h-9 px-3 rounded-lg border border-border text-sm bg-background">
                        <option value="false">{t("widget.disabled")}</option>
                        <option value="true">{t("widget.enabled")}</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-border">
                    <div>
                      <p className="text-sm font-medium text-dark-navy">{t("widget.showBranding")}</p>
                      <p className="text-xs text-muted-foreground">{t("widget.poweredBy")}</p>
                      {(plan === "free" || !plan) && <p className="text-[10px] text-amber-600 mt-1">{t("widget.freePlanNote")}</p>}
                    </div>
                    <button type="button" disabled={plan === "free" || !plan} className={"w-10 h-5 rounded-full transition-colors cursor-pointer " + (settings.showBranding ? "bg-primary" : "bg-gray-200") + (plan === "free" || !plan ? " opacity-70 cursor-not-allowed" : "")} onClick={() => updateSetting("showBranding", !settings.showBranding)}>
                      <div className={"w-4 h-4 rounded-full bg-white shadow-sm transition-transform " + (settings.showBranding ? "translate-x-5" : "translate-x-0.5")} />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="border-border shadow-sm sticky top-6">
                <div className="p-6 border-b border-border flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-dark-navy">{t("widget.livePreview")}</h3>
                </div>
                <CardContent className="p-6">
                  <div className="bg-gray-100 rounded-2xl p-4 h-[520px] flex flex-col">
                    <div className="bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden flex-1" style={{ borderColor: primaryColor + "20", borderWidth: "1px" }}>
                      {/* Header */}
                      <div className="p-3 flex items-center gap-3 shrink-0" style={{ backgroundColor: primaryColor }}>
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{botName}</p>
                          <p className="text-[10px] text-white/70 truncate">{t("widget.replyWithin")}</p>
                        </div>
                      </div>

                      {/* Chat area - shows greeting message */}
                      <div className="flex-1 p-4 overflow-y-auto flex flex-col justify-start gap-3" style={{ backgroundColor: "#ffffff" }}>
                        <div className="flex justify-start">
                          <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#f3f4f6", color: "#1a1a2e" }}>
                            <p>{settings.welcomeMessage || "Hi there! I'm Cira, your AI shopping assistant. How can I help you today?"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Input field */}
                      <div className="p-3 border-t border-gray-100 shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-10 rounded-xl border border-gray-200 px-4 text-xs text-gray-400 flex items-center bg-white">
                            {t("widget.typeMessage")}
                          </div>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
                          </div>
                        </div>

                        {/* Branding under text input */}
                        {settings.showBranding && (
                          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pt-2">
                            <Sparkles className="w-3 h-3" />
                            <span>{t("widget.poweredByCircuCity")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </Wrapper>
  );
}
