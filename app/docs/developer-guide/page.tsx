"use client";

import { useState } from "react";
import MarketingShell from '@/components/marketing/MarketingShell';
import { cn } from "@/lib/utils";
import { Code, Terminal, BookOpen, Key, Globe, Zap, Copy, Check, ChevronRight, ExternalLink } from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "sdk", label: "SDK & Snippet", icon: Code },
  { id: "api", label: "REST API", icon: Terminal },
  { id: "webhooks", label: "Webhooks", icon: Zap },
  { id: "events", label: "Custom Events", icon: Globe },
];

export default function DeveloperGuidePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <MarketingShell>
      <section className="pt-28 pb-20 bg-dark-navy text-white text-center px-6">
        <h1 className="text-4xl lg:text-5xl font-extrabold mb-4">Developer Guide</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Complete SDK and API documentation for integrating CircuCity AI into your store.
        </p>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-12 flex gap-8 min-h-[600px]">
        {/* Left Tabs */}
        <div className="w-56 shrink-0 space-y-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all text-sm font-medium",
                activeTab === tab.id
                  ? "bg-primary/20 text-dark-navy font-bold"
                  : "text-gray-500 hover:text-dark-navy hover:bg-slate-50"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "overview" && (
            <div className="space-y-6 text-gray-700 leading-relaxed">
              <h2 className="text-2xl font-bold text-dark-navy">Integration Overview</h2>
              <p>CircuCity AI offers multiple ways to integrate, from a simple JavaScript snippet to a full REST API. Choose the approach that fits your technical requirements.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {[
                  { icon: Code, title: "Widget Snippet", desc: "One line of JavaScript. Add to any website in seconds.", time: "5 min" },
                  { icon: Terminal, title: "REST API", desc: "Full control over chat, products, and analytics.", time: "30 min" },
                  { icon: Zap, title: "Webhooks", desc: "Real-time event notifications to your server.", time: "15 min" },
                ].map(item => (
                  <div key={item.title} className="border rounded-xl p-5 text-center">
                    <item.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                    <h4 className="font-bold text-dark-navy">{item.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
                    <span className="inline-block mt-3 text-xs bg-slate-100 px-3 py-1 rounded-full font-bold">~{item.time}</span>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 border rounded-xl p-6 mt-6">
                <h3 className="font-bold text-dark-navy mb-3">Authentication</h3>
                <p>All API and SDK integrations require a workspace API key. Get yours from <strong>Settings → API Keys</strong> in the dashboard. Keys have the format:</p>
                <div className="bg-slate-900 text-slate-200 rounded-xl p-4 font-mono text-sm mt-3">cck_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</div>
                <p className="mt-3 text-sm text-gray-500">Keep your API keys secret. Use environment variables in your server code. Rotate keys regularly for security.</p>
              </div>
            </div>
          )}

          {activeTab === "sdk" && (
            <div className="space-y-6 text-gray-700 leading-relaxed">
              <h2 className="text-2xl font-bold text-dark-navy">Widget Snippet Integration</h2>
              <p>The simplest way to add CircuCity AI to your website. Copy and paste one line of JavaScript.</p>

              <h4 className="font-bold text-dark-navy text-lg mt-6">Basic Installation</h4>
              <div className="relative bg-slate-900 text-slate-200 rounded-xl p-5 font-mono text-sm group">
                <button onClick={() => copyCode("snippet-basic", `<script src="https://chatbot.circucity.com/widget.js" data-workspace="ws_circucity_001" data-primary="#A3E635" async></script>`)} className="absolute top-3 right-3 text-slate-400 hover:text-white">
                  {copiedId === "snippet-basic" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <pre>{`<script
  src="https://chatbot.circucity.com/widget.js"
  data-workspace="ws_circucity_001"
  data-primary="#A3E635"
  async
></script>`}</pre>
              </div>

              <h4 className="font-bold text-dark-navy text-lg mt-6">Full Configuration</h4>
              <div className="relative bg-slate-900 text-slate-200 rounded-xl p-5 font-mono text-sm group">
                <button onClick={() => copyCode("snippet-full", `<script src="https://chatbot.circucity.com/widget.js" data-workspace="ws_circucity_001" data-primary="#A3E635" data-position="bottom-right" data-greeting="Hi! How can I help you today?" data-lang="en" data-theme="light" data-auto-open="false" data-auto-open-delay="3000" async></script>`)} className="absolute top-3 right-3 text-slate-400 hover:text-white">
                  {copiedId === "snippet-full" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <pre>{`<script
  src="https://chatbot.circucity.com/widget.js"
  data-workspace="ws_circucity_001"
  data-primary="#A3E635"
  data-position="bottom-right"
  data-greeting="Hi! How can I help you today?"
  data-lang="en"
  data-theme="light"
  data-auto-open="false"
  data-auto-open-delay="3000"
  async
></script>`}</pre>
              </div>

              <h4 className="font-bold text-dark-navy text-lg mt-6">JavaScript API</h4>
              <p>After the widget loads, you can control it programmatically:</p>
              <div className="relative bg-slate-900 text-slate-200 rounded-xl p-5 font-mono text-sm group">
                <button onClick={() => copyCode("sdk-js", `window.CircuCity.open()`)} className="absolute top-3 right-3 text-slate-400 hover:text-white">
                  {copiedId === "sdk-js" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <pre>{`// Open the chat widget
window.CircuCity.open();

// Close the chat widget
window.CircuCity.close();

// Toggle visibility
window.CircuCity.toggle();

// Send a message programmatically
window.CircuCity.sendMessage("Tell me about your return policy");

// Track a custom event
window.CircuCity.track("page.viewed", {
  url: window.location.href,
  title: document.title
});

// Get the current session ID
const sessionId = window.CircuCity.getSessionId();`}</pre>
              </div>

              <h4 className="font-bold text-dark-navy text-lg mt-6">Configuration Attributes</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead className="bg-slate-50">
                    <tr><th className="text-left p-3 font-bold">Attribute</th><th className="text-left p-3 font-bold">Type</th><th className="text-left p-3 font-bold">Default</th><th className="text-left p-3 font-bold">Description</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      ["data-workspace", "string", "Required", "Your workspace ID for the chatbot"],
                      ["data-primary", "hex color", "#A3E635", "Primary accent color for the widget"],
                      ["data-position", "string", "bottom-right", "bottom-right or bottom-left"],
                      ["data-greeting", "string", "Hi! How can I help?", "Custom welcome message"],
                      ["data-lang", "string", "en", "Language code (en, sv, de, fr, es)"],
                      ["data-theme", "string", "light", "light or dark theme"],
                      ["data-auto-open", "boolean", "false", "Auto-open widget on page load"],
                      ["data-auto-open-delay", "number", "3000", "Delay before auto-open in ms"],
                      ["data-brand-name", "string", "", "Displayed brand name in widget header"],
                      ["data-brand-logo", "url", "", "Logo URL for widget header"],
                    ].map(([attr, type, def, desc]) => (
                      <tr key={attr}>
                        <td className="p-3 font-mono text-xs">{attr}</td>
                        <td className="p-3 text-xs">{type}</td>
                        <td className="p-3 text-xs text-gray-500">{def}</td>
                        <td className="p-3 text-xs text-gray-600">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "api" && (
            <div className="space-y-6 text-gray-700 leading-relaxed">
              <h2 className="text-2xl font-bold text-dark-navy">REST API Reference</h2>
              <p>Full programmatic access to the CircuCity AI platform. Authenticate with your API key.</p>

              <div className="bg-slate-50 border rounded-xl p-6">
                <h4 className="font-bold text-dark-navy mb-2">Base URL</h4>
                <code className="bg-slate-900 text-slate-200 px-3 py-1.5 rounded text-sm">https://chatbot.circucity.com/api</code>
              </div>

              <h4 className="font-bold text-dark-navy text-lg mt-6">Authentication</h4>
              <div className="relative bg-slate-900 text-slate-200 rounded-xl p-5 font-mono text-sm group">
                <button onClick={() => copyCode("api-auth", `Authorization: Bearer YOUR_API_KEY`)} className="absolute top-3 right-3 text-slate-400 hover:text-white">
                  {copiedId === "api-auth" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <pre>{`Authorization: Bearer YOUR_API_KEY`}</pre>
              </div>

              <h4 className="font-bold text-dark-navy text-lg mt-6">Chat</h4>
              <p>Send messages and receive AI responses.</p>
              <div className="relative bg-slate-900 text-slate-200 rounded-xl p-5 font-mono text-sm group">
                <button onClick={() => copyCode("api-chat", `curl -X POST https://chatbot.circucity.com/api/chat \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "message": "Hello!",\n    "session_id": "unique-session-id",\n    "context": {}\n  }'`)} className="absolute top-3 right-3 text-slate-400 hover:text-white">
                  {copiedId === "api-chat" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <pre>{`POST /api/chat
Content-Type: application/json

{
  "message": "Do you have eco-friendly options?",
  "session_id": "visitor-abc-123",
  "context": {
    "page_url": "https://mystore.com/products",
    "user_name": "Alice"
  }
}

Response:
{
  "reply": "Absolutely! Here are our eco-friendly picks...",
  "session_id": "visitor-abc-123",
  "confidence": 0.95,
  "sources": ["https://mystore.com/eco-collection"],
  "product_references": ["prod-001", "prod-002"]
}`}</pre>
              </div>

              <h4 className="font-bold text-dark-navy text-lg mt-6">Streaming Chat (SSE)</h4>
              <div className="relative bg-slate-900 text-slate-200 rounded-xl p-5 font-mono text-sm group">
                <pre>{`POST /api/chat/stream
Content-Type: application/json

{
  "message": "What products do you recommend?",
  "session_id": "visitor-abc-123"
}

// Server-Sent Events response:
data: {"type":"token","content":"I"}

data: {"type":"token","content":" recommend"}

data: {"type":"token","content":" our"}

data: {"type":"done","session_id":"visitor-abc-123"}`}</pre>
              </div>

              <h4 className="font-bold text-dark-navy text-lg mt-6">Products</h4>
              <div className="space-y-4">
                <div className="relative bg-slate-900 text-slate-200 rounded-xl p-5 font-mono text-sm group">
                  <pre>{`POST /api/products/sync
Content-Type: application/json

{
  "products": [
    {
      "id": "prod-001",
      "name": "Organic Cotton T-Shirt",
      "description": "100% organic cotton...",
      "price": 299.00,
      "currency": "SEK",
      "category": "Clothing",
      "image_url": "https://...",
      "stock": 45,
      "brand": "EcoWear",
      "tags": ["sustainable", "cotton", "casual"]
    }
  ]
}`}</pre>
                </div>
                <div className="relative bg-slate-900 text-slate-200 rounded-xl p-5 font-mono text-sm group">
                  <pre>{`GET /api/products?page=1&limit=20&category=Clothing

Response:
{
  "products": [...],
  "total": 150,
  "page": 1,
  "pages": 8
}`}</pre>
                </div>
              </div>

              <h4 className="font-bold text-dark-navy text-lg mt-6">All Endpoints</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead className="bg-slate-50">
                    <tr><th className="text-left p-3 font-bold">Method</th><th className="text-left p-3 font-bold">Endpoint</th><th className="text-left p-3 font-bold">Description</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      ["POST", "/api/chat", "Send a message to the AI"],
                      ["POST", "/api/chat/stream", "Stream a chat response (SSE)"],
                      ["GET", "/api/conversations", "List conversations"],
                      ["GET", "/api/conversations/:id", "Get conversation details"],
                      ["DELETE", "/api/conversations/:id", "Delete a conversation"],
                      ["POST", "/api/products/sync", "Sync product catalog"],
                      ["GET", "/api/products", "List products"],
                      ["DELETE", "/api/products/:id", "Remove a product"],
                      ["GET", "/api/analytics/summary", "Usage analytics"],
                      ["POST", "/api/documents/upload", "Upload training docs"],
                      ["DELETE", "/api/documents/delete", "Remove a document"],
                      ["POST", "/api/crawl/start", "Start website crawl"],
                      ["POST", "/api/verify", "Verify workspace connection"],
                      ["POST", "/api/chat/reset", "Reset a conversation session"],
                    ].map(([m, ep, d]) => (
                      <tr key={ep}>
                        <td className="p-3"><span className="bg-slate-900 text-slate-200 px-2 py-0.5 rounded text-xs font-mono">{m}</span></td>
                        <td className="p-3 font-mono text-xs">{ep}</td>
                        <td className="p-3 text-sm text-gray-600">{d}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "webhooks" && (
            <div className="space-y-6 text-gray-700 leading-relaxed">
              <h2 className="text-2xl font-bold text-dark-navy">Webhooks</h2>
              <p>Receive real-time notifications when events happen in your chatbot. Perfect for triggering automations, CRM updates, and analytics.</p>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <h4 className="font-bold text-blue-800 mb-2">Setup</h4>
                <p className="text-blue-700">Configure your webhook URL in <strong>Settings → Webhooks</strong> in the dashboard. All webhooks are delivered as HTTP POST with a JSON payload.</p>
              </div>

              <h4 className="font-bold text-dark-navy text-lg mt-6">Available Events</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { event: "chat.started", desc: "New conversation begins" },
                  { event: "chat.ended", desc: "Conversation is closed or times out" },
                  { event: "message.received", desc: "User sends a message" },
                  { event: "message.sent", desc: "AI sends a response" },
                  { event: "product.recommended", desc: "AI recommends a product" },
                  { event: "human.requested", desc: "User requests human agent" },
                  { event: "human.connected", desc: "Human agent joins conversation" },
                  { event: "human.disconnected", desc: "Human agent leaves conversation" },
                ].map(ev => (
                  <div key={ev.event} className="border rounded-xl p-4">
                    <code className="bg-slate-100 px-2 py-0.5 rounded text-xs font-bold text-dark-navy">{ev.event}</code>
                    <p className="text-sm text-gray-500 mt-1">{ev.desc}</p>
                  </div>
                ))}
              </div>

              <h4 className="font-bold text-dark-navy text-lg mt-6">Payload Format</h4>
              <div className="relative bg-slate-900 text-slate-200 rounded-xl p-5 font-mono text-sm group">
                <button onClick={() => copyCode("webhook-payload", `{\n  "event": "message.received",\n  "timestamp": "2024-06-11T14:30:00Z",\n  "workspace_id": "ws_circucity_001",\n  "data": {\n    "session_id": "visitor-abc-123",\n    "message": "Hello!",\n    "page_url": "https://store.com/products"\n  }\n}`)} className="absolute top-3 right-3 text-slate-400 hover:text-white">
                  {copiedId === "webhook-payload" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <pre>{`{
  "event": "message.received",
  "timestamp": "2024-06-11T14:30:00Z",
  "workspace_id": "ws_circucity_001",
  "data": {
    "session_id": "visitor-abc-123",
    "message": "Hello! Do you have this in green?",
    "page_url": "https://store.com/products/shirt",
    "user_agent": "Mozilla/5.0 ..."
  }
}`}</pre>
              </div>

              <h4 className="font-bold text-dark-navy text-lg mt-6">Signature Verification (Node.js)</h4>
              <div className="relative bg-slate-900 text-slate-200 rounded-xl p-5 font-mono text-sm group">
                <button onClick={() => copyCode("webhook-verify", `const crypto = require("crypto");\n\nfunction verifyWebhook(req, secret) {\n  const signature = req.headers["x-cc-signature"];\n  const payload = JSON.stringify(req.body);\n  const expected = crypto\n    .createHmac("sha256", secret)\n    .update(payload)\n    .digest("hex");\n  return crypto.timingSafeEqual(\n    Buffer.from(signature),\n    Buffer.from(expected)\n  );\n}`)} className="absolute top-3 right-3 text-slate-400 hover:text-white">
                  {copiedId === "webhook-verify" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <pre>{`const crypto = require("crypto");

function verifyWebhook(req, secret) {
  const signature = req.headers["x-cc-signature"];
  const payload = JSON.stringify(req.body);
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`}</pre>
              </div>

              <h4 className="font-bold text-dark-navy text-lg mt-6">Retry Policy</h4>
              <p>If your endpoint returns a non-2xx status code, we retry up to 3 times with exponential backoff (1s, 5s, 25s). Webhooks timeout after 10 seconds.</p>
            </div>
          )}

          {activeTab === "events" && (
            <div className="space-y-6 text-gray-700 leading-relaxed">
              <h2 className="text-2xl font-bold text-dark-navy">Custom Events</h2>
              <p>Track user interactions and business events to power your analytics and AI context.</p>

              <h4 className="font-bold text-dark-navy text-lg mt-6">Client-Side (Widget SDK)</h4>
              <div className="relative bg-slate-900 text-slate-200 rounded-xl p-5 font-mono text-sm group">
                <button onClick={() => copyCode("events-client", `window.CircuCity.track("cart.added", { product_id: "prod-001", price: 29.99, currency: "SEK" });`)} className="absolute top-3 right-3 text-slate-400 hover:text-white">
                  {copiedId === "events-client" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <pre>{`// Product views
window.CircuCity.track("product.viewed", {
  product_id: "prod-001",
  name: "Organic Cotton T-Shirt",
  price: 29.99,
  category: "Clothing"
});

// Cart actions
window.CircuCity.track("cart.added", {
  product_id: "prod-001",
  quantity: 2,
  price: 29.99
});

// Order completed
window.CircuCity.track("order.completed", {
  order_id: "ORD-001",
  total: 149.95,
  currency: "SEK",
  products: ["prod-001", "prod-002"]
});

// Custom business events
window.CircuCity.track("newsletter.subscribed", {
  email: "customer@example.com",
  source: "footer-form"
});`}</pre>
              </div>

              <h4 className="font-bold text-dark-navy text-lg mt-6">Server-Side (REST API)</h4>
              <div className="relative bg-slate-900 text-slate-200 rounded-xl p-5 font-mono text-sm group">
                <button onClick={() => copyCode("events-server", `curl -X POST https://chatbot.circucity.com/api/events \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"event":"order.shipped","user_id":"customer@email.com","properties":{"order_id":"ORD-001","tracking_number":"SE123"}}'`)} className="absolute top-3 right-3 text-slate-400 hover:text-white">
                  {copiedId === "events-server" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <pre>{`POST /api/events
Content-Type: application/json

{
  "event": "order.shipped",
  "user_id": "customer@email.com",
  "session_id": "visitor-abc-123",
  "properties": {
    "order_id": "ORD-001",
    "tracking_number": "SE123456789",
    "carrier": "PostNord",
    "estimated_delivery": "2024-06-18"
  }
}`}</pre>
              </div>

              <h4 className="font-bold text-dark-navy text-lg mt-6">View & Analyze Events</h4>
              <p>All tracked events appear in the <strong>Analytics</strong> tab of your dashboard. Filter by event type, date range, session, or user to analyze customer behavior and optimize your AI's responses.</p>
            </div>
          )}
        </div>
      </div>
    </MarketingShell>
  );
}
