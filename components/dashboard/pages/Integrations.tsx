"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  Search, Plus, Check, X, ExternalLink, RefreshCw, AlertCircle,
} from "lucide-react";

const CATEGORIES = ["all", "ecommerce", "crm", "social", "email", "workflow", "support", "analytics"];

const PLATFORMS = [
  // Google
  { id: "gmail", name: "Gmail", icon: "https://cdn.simpleicons.org/gmail/0A1428", category: "support", desc: "Send and receive email tickets", oauth: "gmail" },
  { id: "google_analytics", name: "Google Analytics", icon: "https://cdn.simpleicons.org/googleanalytics/0A1428", category: "analytics", desc: "Track chat performance", oauth: "google_analytics" },
  { id: "google_calendar", name: "Google Calendar", icon: "https://cdn.simpleicons.org/googlecalendar/0A1428", category: "workflow", desc: "Schedule events & meetings", oauth: "google_calendar" },
  // Ecommerce
  { id: "shopify", name: "Shopify", icon: "https://cdn.simpleicons.org/shopify/0A1428", category: "ecommerce", desc: "Sync products, orders, and customers", oauth: "shopify", doc: "https://partners.shopify.com" },
  { id: "woocommerce", name: "WooCommerce", icon: "https://cdn.simpleicons.org/woocommerce/0A1428", category: "ecommerce", desc: "Connect WordPress store", oauth: null },
  { id: "stripe", name: "Stripe", icon: "https://cdn.simpleicons.org/stripe/0A1428", category: "ecommerce", desc: "Payment processing", oauth: "stripe", doc: "https://dashboard.stripe.com/apikeys" },
  // Social / Messaging
  { id: "messenger", name: "Messenger", icon: "https://cdn.simpleicons.org/messenger/0A1428", category: "social", desc: "Facebook Messenger integration", oauth: "messenger" },
  { id: "instagram", name: "Instagram", icon: "https://cdn.simpleicons.org/instagram/0A1428", category: "social", desc: "Instagram DMs and comments", oauth: "instagram" },
  { id: "whatsapp", name: "WhatsApp", icon: "https://cdn.simpleicons.org/whatsapp/0A1428", category: "social", desc: "24/7 WhatsApp support", oauth: "whatsapp" },
  // CRM
  { id: "hubspot", name: "HubSpot", icon: "https://cdn.simpleicons.org/hubspot/0A1428", category: "crm", desc: "Sync contacts and conversations", oauth: null },
  { id: "salesforce", name: "Salesforce", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230A1428'%3E%3Ccircle cx='8' cy='12' r='4'/%3E%3Ccircle cx='16' cy='12' r='4'/%3E%3Cpath d='M12 4c-1.5 0-2.8.6-3.8 1.5C9.7 6.8 11 8 12 8s2.3-1.2 3.8-2.5C14.8 4.6 13.5 4 12 4zm0 16c-1.5 0-2.8-.6-3.8-1.5C9.7 17.2 11 16 12 16s2.3 1.2 3.8 2.5C14.8 19.4 13.5 20 12 20z'/%3E%3C/svg%3E", category: "crm", desc: "Enterprise CRM", oauth: null },
  { id: "zoho", name: "Zoho CRM", icon: "https://cdn.simpleicons.org/zoho/0A1428", category: "crm", desc: "Seamless data flow", oauth: null },
  // Email
  { id: "mailchimp", name: "Mailchimp", icon: "https://cdn.simpleicons.org/mailchimp/0A1428", category: "email", desc: "Capture leads & automate", oauth: null },
  { id: "klaviyo", name: "Klaviyo", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230A1428'%3E%3Cpath d='M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.5 14.5H14l-2-3.5-2 3.5H7.5L11 11 7.5 6.5H10l2 3.5 2-3.5h2.5L13 11l3.5 5.5z'/%3E%3C/svg%3E", category: "email", desc: "Sync lists & trigger flows", oauth: null },
  { id: "brevo", name: "Brevo", icon: "https://cdn.simpleicons.org/brevo/0A1428", category: "email", desc: "Transactional emails", oauth: null },
  // Workflow
  { id: "slack", name: "Slack", icon: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/slack.svg", category: "workflow", desc: "Chat notifications in Slack", oauth: "slack", doc: "https://api.slack.com/apps" },
  { id: "zapier", name: "Zapier", icon: "https://cdn.simpleicons.org/zapier/0A1428", category: "workflow", desc: "5,000+ app integrations", oauth: null },
  // Support
  { id: "zendesk", name: "Zendesk", icon: "https://cdn.simpleicons.org/zendesk/0A1428", category: "support", desc: "Tickets from chat", oauth: null },
  { id: "intercom", name: "Intercom", icon: "https://cdn.simpleicons.org/intercom/0A1428", category: "support", desc: "Two-way sync", oauth: null },
];

export default function Integrations() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [connected, setConnected] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/channels").then(r => r.json()),
      fetch("/api/integrations/oauth").then(r => r.json().catch(() => ({}))),
    ])
      .then(([channelsRes]) => {
        if (channelsRes.success) {
          setConnected(channelsRes.data.map((c: any) => c.type));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleConnect = async (platform: any) => {
    if (!platform.oauth) { alert(platform.name + " integration coming soon."); return; }

    // Messenger — Facebook OAuth
    if (platform.id === "messenger") {
      try {
        const res = await fetch("/api/channels/oauth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform: "messenger" }),
        });
        const d = await res.json();
        if (d.success && d.data?.url) {
          window.open(d.data.url, "_blank", "width=600,height=700");
          setTimeout(() => {
            fetch("/api/channels").then(r => r.json()).then(chRes => {
              if (chRes.success) setConnected(chRes.data.map((c: any) => c.type));
            });
          }, 5000);
        } else if (d.needsConfig) {
          alert("Configure Meta App in Admin > Settings first.");
        } else {
          alert(d.error || "OAuth failed");
        }
      } catch {}
      return;
    }

    // WhatsApp — WhatsApp Business Configuration (not OAuth)
    if (platform.id === "whatsapp") {
      const configId = prompt("Enter your WhatsApp Configuration ID (from Meta Business Platform):\n\nGet this from Meta Developer Portal > WhatsApp > Configuration");
      if (!configId) return;
      try {
        const res = await fetch("/api/channels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "whatsapp", name: "WhatsApp Business", credentials: JSON.stringify({ configId }) }),
        });
        const d = await res.json();
        if (d.success) {
          const chRes = await fetch("/api/channels").then(r => r.json());
          if (chRes.success) setConnected(chRes.data.map((c: any) => c.type));
        } else {
          alert(d.error || "Failed to connect WhatsApp");
        }
      } catch {}
      return;
    }

    // Instagram — Separate connection (uses its own Page)
    if (platform.id === "instagram") {
      try {
        const res = await fetch("/api/channels/oauth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform: "instagram" }),
        });
        const d = await res.json();
        if (d.success && d.data?.url) {
          window.open(d.data.url, "_blank", "width=600,height=700");
          setTimeout(() => {
            fetch("/api/channels").then(r => r.json()).then(chRes => {
              if (chRes.success) setConnected(chRes.data.map((c: any) => c.type));
            });
          }, 5000);
        } else if (d.needsConfig) {
          alert("Configure Meta App in Admin > Settings first.");
        } else if (d.error && d.error.includes("pages")) {
          alert("Instagram uses Facebook Pages to manage messages. Please select a Facebook Page that has your Instagram Business account linked. If Messenger is already connected to a different Page, you'll need to authorize with a different Facebook account.");
        } else {
          alert(d.error || "OAuth failed. Make sure your Instagram is a Business/Creator account.");
        }
      } catch {}
      return;
    }

    // Other platforms — Generic OAuth
    try {
      const body: any = { platform: platform.oauth };
      if (platform.oauth === "shopify") {
        const shop = prompt("Enter your Shopify store subdomain (e.g. my-store.myshopify.com):");
        if (!shop) return;
        body.shopDomain = shop.trim();
      }
      const res = await fetch("/api/integrations/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (d.success && d.data?.url) {
        window.open(d.data.url, "_blank", "width=600,height=700");
        setConnected(prev => prev.includes(platform.id) ? prev : [...prev, platform.id]);
      } else if (d.needsConfig) {
        alert("Configure credentials in Admin > Platform Config first.");
      } else {
        alert(d.error || "OAuth failed");
      }
    } catch {}
  };

  const handleDisconnect = async (id: string) => {
    try {
      const integrationsRes = await fetch("/api/channels").then(r => r.json());
      if (integrationsRes.success) {
        const channel = integrationsRes.data.find((c: any) => c.type === id);
        if (channel) {
          await fetch("/api/channels/" + channel.id, { method: "DELETE" });
        }
      }
      setConnected(prev => prev.filter(c => c !== id));
    } catch {}
  };

  const filtered = PLATFORMS.filter(p => (activeCategory === "all" || p.category === activeCategory) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.desc.toLowerCase().includes(search.toLowerCase())));

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark-navy">Integrations</h2>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input className="w-full pl-9 pr-3 h-9 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="Search integrations..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeCategory === cat ? "bg-primary text-dark-navy" : "text-gray-500 hover:bg-gray-100"}`}>
              {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map(platform => {
          const isConnected = connected.includes(platform.id);
          return (
            <div key={platform.id} className={`rounded-xl border p-4 transition-all ${isConnected ? "border-green-200 bg-green-50/20" : "border-border bg-white hover:border-primary/30 hover:shadow-sm"}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center p-2 bg-white overflow-hidden">
                  <img src={platform.icon} alt={platform.name} className="w-6 h-6 object-contain" />
                </div>
                {isConnected && <Badge className="bg-green-500 text-[10px]">Connected</Badge>}
              </div>
              <h3 className="text-sm font-semibold text-dark-navy mb-0.5">{platform.name}</h3>
              <p className="text-xs text-muted-foreground mb-3">{platform.desc}</p>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleDisconnect(platform.id)}>
                    <X className="w-3 h-3" /> Disconnect
                  </Button>
                ) : (
                  <Button size="sm" className="gap-1.5" onClick={() => handleConnect(platform)}>
                    <Plus className="w-3 h-3" />
                    {platform.oauth ? "Connect" : "Coming Soon"}
                  </Button>
                )}
                {platform.doc && (
                  <a href={platform.doc} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
