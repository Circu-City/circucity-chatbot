"use client";

import { useState } from "react";
import MarketingShell from '@/components/marketing/MarketingShell';
import { cn } from "@/lib/utils";
import { Code, Terminal, Zap, Globe, Shield, Copy, Check, Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";

const TABS = [
  { id: "chat", label: "Chat API", icon: Terminal },
  { id: "listings", label: "Listings API", icon: Sparkles },
  { id: "products", label: "Products API", icon: Globe },
  { id: "conversations", label: "Conversations API", icon: Code },
  { id: "documents", label: "Documents API", icon: Shield },
  { id: "analytics", label: "Analytics API", icon: Zap },
];

const AUTH_BLOCK = {
  title: "Authentication",
  code: `Authorization: Bearer YOUR_API_KEY`,
  note: "All API requests require authentication. Get your API key from Settings → API Keys in the dashboard. Keys are scoped per workspace."
};

const ENDPOINTS = {
  chat: {
    title: "Chat API",
    description: "Send messages to your AI chatbot and receive responses. Supports both standard and streaming (SSE) responses.",
    endpoints: [
      {
        method: "POST",
        path: "/api/chat",
        description: "Send a message to the AI and get a response.",
        example: `curl -X POST https://chatbot.circucity.com/api/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Do you have eco-friendly options?",
    "session_id": "visitor-abc-123",
    "context": {
      "page_url": "https://mystore.com/products",
      "user_name": "Alice"
    }
  }'`,
        response: `{
  "success": true,
  "reply": "Absolutely! Here are our eco-friendly picks...",
  "session_id": "visitor-abc-123",
  "confidence": 0.95,
  "sources": ["https://mystore.com/eco-collection"],
  "product_references": ["prod-001", "prod-002"]
}`,
        params: [
          { name: "message", type: "string", required: true, description: "The user's message text" },
          { name: "session_id", type: "string", required: true, description: "Unique session identifier for conversation continuity" },
          { name: "context", type: "object", required: false, description: "Additional context (page_url, user_name, preferences)" },
        ],
      },
      {
        method: "POST",
        path: "/api/chat/stream",
        description: "Stream a chat response using Server-Sent Events (SSE) for real-time typing effect.",
        example: `POST /api/chat/stream
Content-Type: application/json

{
  "message": "Tell me about your shipping policy",
  "session_id": "visitor-abc-123"
}`,
        response: `// Server-Sent Events stream:
data: {"type":"token","content":"Our"}

data: {"type":"token","content":" shipping"}

data: {"type":"token","content":" policy"}

data: {"type":"token","content":"..."}

data: {"type":"done","session_id":"visitor-abc-123"}`,
        params: [
          { name: "message", type: "string", required: true, description: "The user's message text" },
          { name: "session_id", type: "string", required: true, description: "Unique session identifier" },
          { name: "stream", type: "boolean", required: false, description: "Enable SSE streaming (default: true)" },
        ],
      },
      {
        method: "POST",
        path: "/api/chat/reset",
        description: "Reset a conversation session, clearing all message history.",
        example: `curl -X POST https://chatbot.circucity.com/api/chat/reset \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"session_id": "visitor-abc-123"}'`,
        response: `{
  "success": true,
  "message": "Session reset successfully",
  "session_id": "visitor-abc-123"
}`,
        params: [
          { name: "session_id", type: "string", required: true, description: "Session to reset" },
        ],
      },
    ],
  },
  listings: {
    title: "Listings API",
    description: "Generate complete product listings from a single photo and publish them to your connected stores (Shopify, WooCommerce, eBay, Etsy, webhook). Authenticated endpoints use your dashboard session; the sandbox below is public for testing.",
    endpoints: [
      {
        method: "POST",
        path: "/api/listings/analyze",
        description: "Send a product photo and receive an AI-generated listing draft plus a listingId. Gemini searches the web for real pricing when available. Drafts count against your plan quota.",
        example: `curl -X POST https://chatbot.circucity.com/api/listings/analyze \\
  -H "Content-Type: application/json" \\
  --cookie "session=YOUR_SESSION_COOKIE" \\
  -d '{
    "imageDataUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "titleHint": "Nikon film camera",
    "language": "de"
  }'`,
        response: `{
  "source": "gemini",
  "priceGrounded": true,
  "category": "Electronics",
  "title": "Nikon F-601 Filmkamera",
  "description": "Funktionierende Nikon F-601 mit 50mm f/1.8 Objektiv...",
  "condition": "good",
  "suggestedPriceSek": 1450,
  "estimatedAge": "10 years",
  "estimatedWeightKg": 1.1,
  "attributes": { "Lens": "50mm f/1.8" },
  "co2Saved": 8.8,
  "listingId": "clx9abc...",
  "quota": { "used": 12, "limit": 500, "plan": "growth" }
}`,
        params: [
          { name: "imageDataUrl", type: "string", required: true, description: "Base64 data URL of a JPEG, PNG or WEBP photo (max 8 MB)" },
          { name: "titleHint", type: "string", required: false, description: "Optional seller hint such as brand/model (max 120 chars)" },
          { name: "language", type: "string", required: false, description: "Language for the generated title and description. One of: sv (default), en, nl, de, fi, fr, es, it, da, no" },
        ],
      },
      {
        method: "POST",
        path: "/api/listings/publish",
        description: "Publish a reviewed draft (by listingId) to a connected store. Requires a Growth plan or higher. eBay listings convert the SEK price to EUR with a live FX rate; Shopify/WooCommerce publish drafts into your store's currency.",
        example: `curl -X POST https://chatbot.circucity.com/api/listings/publish \\
  -H "Content-Type: application/json" \\
  --cookie "session=YOUR_SESSION_COOKIE" \\
  -d '{
    "listingId": "clx9abc...",
    "platform": "shopify",
    "images": ["data:image/jpeg;base64,..."]
  }'`,
        response: `{
  "success": true,
  "record": {
    "id": "clx9abc...",
    "platform": "shopify",
    "status": "published",
    "remoteId": "7342348234",
    "remoteUrl": "https://your-store.myshopify.com/admin/products/7342348234"
  }
}`,
        params: [
          { name: "listingId", type: "string", required: true, description: "Draft id returned by /api/listings/analyze" },
          { name: "platform", type: "string", required: true, description: "shopify | woocommerce | ebay | etsy | webhook" },
          { name: "images", type: "array", required: false, description: "Base64 data URLs of the photos (max 4)" },
          { name: "target.webhookUrl", type: "string", required: false, description: "Required when platform is webhook" },
          { name: "target.webhookSecret", type: "string", required: false, description: "Optional HMAC-SHA256 signing secret for webhooks" },
        ],
      },
      {
        method: "GET",
        path: "/api/listings/connectors",
        description: "Your connected stores, configured platforms, plan quota and publish history.",
        example: `curl https://chatbot.circucity.com/api/listings/connectors \\
  --cookie "session=YOUR_SESSION_COOKIE"`,
        response: `{
  "success": true,
  "data": {
    "plan": "growth",
    "quota": { "used": 12, "limit": 500, "plan": "growth" },
    "connected": ["shopify"],
    "configured": { "shopify": true, "woocommerce": true, "ebay": false, "etsy": false, "webhook": true },
    "history": []
  }
}`,
        params: [],
      },
      {
        method: "POST",
        path: "/api/demo/listings/analyze",
        description: "Public sandbox of the same engine — no account needed. Per-visitor cap: 25 analyses/day (50/day with the demo key). Drafts are returned as files only; nothing is published.",
        example: `curl -X POST https://chatbot.circucity.com/api/demo/listings/analyze \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_DEMO_KEY" \\
  -d '{
    "imageDataUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "titleHint": "Nikon film camera",
    "language": "sv"
  }'`,
        response: `{
  "source": "gemini",
  "priceGrounded": true,
  "category": "Electronics",
  "title": "Nikon F-601 filmkamera",
  "description": "Working Nikon F-601 with 50mm f/1.8 lens...",
  "condition": "good",
  "suggestedPriceSek": 1450,
  "co2Saved": 8.8,
  "quota": { "keyed": true, "used": 3, "limit": 50 }
}`,
        params: [
          { name: "imageDataUrl", type: "string", required: true, description: "Base64 data URL of a JPEG, PNG or WEBP photo (max 8 MB)" },
          { name: "titleHint", type: "string", required: false, description: "Optional seller hint (max 120 chars)" },
          { name: "language", type: "string", required: false, description: "Language for the generated title and description. One of: sv (default), en, nl, de, fi, fr, es, it, da, no" },
          { name: "x-api-key", type: "header", required: false, description: "Demo key lifts the per-visitor cap to 50 analyses/day" },
        ],
      },
      {
        method: "GET",
        path: "/demo/listing",
        description: "The interactive test desk — camera capture queue, AI drafts, review gate and CSV/JSON export.",
        example: `# Open in a browser
https://chatbot.circucity.com/demo/listing`,
        response: `// Interactive web app — no response body`,
        params: [
          { name: "embed", type: "query", required: false, description: "embed=1 hides the header so the desk can live inside an iframe plugin" },
        ],
      },
    ],
  },
  products: {
    title: "Products API",
    description: "Manage your product catalog. Sync, query, and update products that the AI references in conversations.",
    endpoints: [
      {
        method: "POST",
        path: "/api/products/sync",
        description: "Sync your product catalog. Products are indexed for AI reference in chats.",
        example: `curl -X POST https://chatbot.circucity.com/api/products/sync \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "products": [
      {
        "id": "prod-001",
        "name": "Organic Cotton T-Shirt",
        "description": "100% organic cotton, fair trade certified",
        "price": 299.00,
        "currency": "SEK",
        "category": "Clothing",
        "subcategory": "T-Shirts",
        "image_url": "https://store.com/images/shirt.jpg",
        "product_url": "https://store.com/products/shirt",
        "stock": 45,
        "brand": "EcoWear",
        "tags": ["sustainable", "cotton", "casual", "fair-trade"],
        "variants": [
          { "size": "S", "color": "White", "stock": 10 },
          { "size": "M", "color": "White", "stock": 15 }
        ]
      }
    ]
  }'`,
        response: `{
  "success": true,
  "synced": 1,
  "total_products": 150,
  "errors": []
}`,
        params: [
          { name: "products", type: "array", required: true, description: "Array of product objects (up to 1000 per request)" },
        ],
      },
      {
        method: "GET",
        path: "/api/products",
        description: "List products in your catalog with pagination and filtering.",
        example: `GET /api/products?page=1&limit=20&category=Clothing&search=cotton`,
        response: `{
  "products": [
    {
      "id": "prod-001",
      "name": "Organic Cotton T-Shirt",
      "price": 299.00,
      "category": "Clothing",
      "stock": 45,
      "last_synced": "2024-06-11T10:30:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "pages": 8
}`,
      },
      {
        method: "DELETE",
        path: "/api/products/:id",
        description: "Remove a product from the catalog.",
        example: `curl -X DELETE https://chatbot.circucity.com/api/products/prod-001 \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
        response: `{
  "success": true,
  "message": "Product deleted successfully"
}`,
      },
    ],
  },
  conversations: {
    title: "Conversations API",
    description: "Access and manage chat conversations between your AI and customers.",
    endpoints: [
      {
        method: "GET",
        path: "/api/conversations",
        description: "List recent conversations with optional filters.",
        example: `GET /api/conversations?page=1&limit=20&status=active&from=2024-06-01&to=2024-06-11`,
        response: `{
  "conversations": [
    {
      "id": "conv-001",
      "session_id": "visitor-abc-123",
      "status": "active",
      "message_count": 14,
      "first_message": "2024-06-11T09:00:00Z",
      "last_message": "2024-06-11T09:15:00Z"
    }
  ],
  "total": 523,
  "page": 1,
  "limit": 20
}`,
      },
      {
        method: "GET",
        path: "/api/conversations/:id",
        description: "Get full details of a specific conversation including all messages.",
        response: `{
  "conversation": {
    "id": "conv-001",
    "session_id": "visitor-abc-123",
    "status": "active",
    "messages": [
      { "role": "user", "content": "Hello!", "timestamp": "2024-06-11T09:00:00Z" },
      { "role": "assistant", "content": "Hi! How can I help?", "timestamp": "2024-06-11T09:00:02Z" }
    ],
    "product_references": ["prod-001"],
    "duration": "15m 30s"
  }
}`,
      },
      {
        method: "DELETE",
        path: "/api/conversations/:id",
        description: "Permanently delete a conversation and all its messages.",
      },
    ],
  },
  documents: {
    title: "Documents API",
    description: "Upload and manage documents for your AI's knowledge base.",
    endpoints: [
      {
        method: "POST",
        path: "/api/documents/upload",
        description: "Upload PDF, CSV, or TXT files to your knowledge base.",
        example: `curl -X POST https://chatbot.circucity.com/api/documents/upload \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@faq.pdf"`,
        response: `{
  "success": true,
  "document": {
    "filename": "faq.pdf",
    "size": 245760,
    "type": "application/pdf",
    "status": "uploaded",
    "uploaded_at": "2024-06-11T10:00:00Z"
  }
}`,
      },
      {
        method: "GET",
        path: "/api/documents",
        description: "List all uploaded documents and their indexing status.",
        response: `{
  "documents": [
    { "filename": "faq.pdf", "index_status": "indexed", "uploaded_at": "2024-06-10T00:00:00Z" },
    { "filename": "returns.csv", "index_status": "pending", "uploaded_at": "2024-06-11T10:00:00Z" }
  ]
}`,
      },
      {
        method: "DELETE",
        path: "/api/documents/:filename",
        description: "Remove a document from your knowledge base.",
      },
    ],
  },
  analytics: {
    title: "Analytics API",
    description: "Retrieve usage statistics and performance metrics for your chatbot.",
    endpoints: [
      {
        method: "GET",
        path: "/api/analytics/summary",
        description: "Get a summary of chatbot usage and performance metrics.",
        example: `GET /api/analytics/summary?from=2024-06-01&to=2024-06-11`,
        response: `{
  "summary": {
    "total_messages": 15420,
    "total_conversations": 2340,
    "avg_response_time": "1.2s",
    "avg_conversation_length": 6.5,
    "human_escalation_rate": "3.2%",
    "top_questions": [
      { "question": "return policy", "count": 890 },
      { "question": "shipping time", "count": 654 }
    ],
    "daily_messages": [
      { "date": "2024-06-01", "count": 1402 },
      { "date": "2024-06-02", "count": 1387 }
    ]
  }
}`,
      },
      {
        method: "POST",
        path: "/api/events",
        description: "Track custom events for analytics and AI context.",
        example: `curl -X POST https://chatbot.circucity.com/api/events \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"event":"order.completed","user_id":"cust@email.com","properties":{"order_id":"ORD-001","total":149.95}}'`,
      },
    ],
  },
};

export default function ApiDocsPage() {
  const [activeTab, setActiveTab] = useState("chat");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const copyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentSection = ENDPOINTS[activeTab as keyof typeof ENDPOINTS];

  return (
    <MarketingShell>
      <section className="pt-28 pb-20 bg-dark-navy text-white text-center px-6">
        <h1 className="text-4xl lg:text-5xl font-extrabold mb-4">API <span className="text-lemon-green">Documentation</span></h1>
        <p className="text-gray-400 max-w-2xl mx-auto mb-6">
          Complete reference for the CircuCity AI REST API. Integrate chatbot, products, conversations, and analytics into your platform.
        </p>
        <div className="relative w-full max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search endpoints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500 h-11"
          />
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-12 flex gap-8 min-h-[600px]">
        {/* Left Tabs */}
        <div className="w-52 shrink-0 space-y-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Endpoints</p>
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
          {currentSection && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-dark-navy">{currentSection.title}</h2>
                <p className="text-gray-500 mt-1">{currentSection.description}</p>
              </div>

              {/* Auth block */}
              <div className="bg-slate-50 border rounded-xl p-5">
                <h4 className="font-bold text-dark-navy text-sm mb-2">{AUTH_BLOCK.title}</h4>
                <div className="relative bg-slate-900 text-slate-200 rounded-lg p-3 font-mono text-sm group">
                  <pre>{AUTH_BLOCK.code}</pre>
                </div>
                <p className="text-xs text-gray-500 mt-2">{AUTH_BLOCK.note}</p>
              </div>

              {/* Endpoints */}
              {currentSection.endpoints.map((ep, idx) => (
                <div key={idx} className="border rounded-2xl overflow-hidden">
                  <div className="p-6 border-b bg-slate-50/50">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-md text-xs font-mono font-bold",
                        ep.method === "GET" ? "bg-green-100 text-green-700" :
                        ep.method === "POST" ? "bg-blue-100 text-blue-700" :
                        ep.method === "DELETE" ? "bg-red-100 text-red-700" :
                        "bg-slate-200 text-slate-700"
                      )}>
                        {ep.method}
                      </span>
                      <code className="text-sm font-mono font-bold text-dark-navy">{ep.path}</code>
                    </div>
                    <p className="text-sm text-gray-500">{ep.description}</p>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Parameters */}
                    {ep.params && (
                      <div>
                        <h4 className="text-sm font-bold text-dark-navy mb-3">Parameters</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border rounded-lg">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="text-left p-3 font-bold text-xs">Name</th>
                                <th className="text-left p-3 font-bold text-xs">Type</th>
                                <th className="text-left p-3 font-bold text-xs">Required</th>
                                <th className="text-left p-3 font-bold text-xs">Description</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {ep.params.map((p, pi) => (
                                <tr key={pi}>
                                  <td className="p-3 font-mono text-xs">{p.name}</td>
                                  <td className="p-3 text-xs text-gray-500">{p.type}</td>
                                  <td className="p-3 text-xs">{p.required ? <span className="text-red-600 font-bold">Yes</span> : <span className="text-gray-400">No</span>}</td>
                                  <td className="p-3 text-xs text-gray-600">{p.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Example Request */}
                    {ep.example && (
                      <div>
                        <h4 className="text-sm font-bold text-dark-navy mb-2 flex items-center gap-2">
                          Request Example
                          <button
                            onClick={() => copyCode(`req-${activeTab}-${idx}`, ep.example)}
                            className="text-gray-400 hover:text-primary"
                          >
                            {copiedId === `req-${activeTab}-${idx}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </h4>
                        <div className="bg-slate-900 text-slate-200 rounded-xl p-4 font-mono text-xs overflow-x-auto">
                          <pre>{ep.example}</pre>
                        </div>
                      </div>
                    )}

                    {/* Response */}
                    {ep.response && (
                      <div>
                        <h4 className="text-sm font-bold text-dark-navy mb-2 flex items-center gap-2">
                          Response
                          <button
                            onClick={() => copyCode(`res-${activeTab}-${idx}`, ep.response)}
                            className="text-gray-400 hover:text-primary"
                          >
                            {copiedId === `res-${activeTab}-${idx}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </h4>
                        <div className="bg-slate-900 text-slate-200 rounded-xl p-4 font-mono text-xs overflow-x-auto">
                          <pre>{ep.response}</pre>
                        </div>
                      </div>
                    )}

                    {/* Errors */}
                    <div>
                      <h4 className="text-sm font-bold text-dark-navy mb-2">Error Codes</h4>
                      <div className="flex gap-3 flex-wrap">
                        {[
                          { code: 200, label: "OK", color: "bg-green-100 text-green-700" },
                          { code: 400, label: "Bad Request", color: "bg-yellow-100 text-yellow-700" },
                          { code: 401, label: "Unauthorized", color: "bg-red-100 text-red-700" },
                          { code: 404, label: "Not Found", color: "bg-red-100 text-red-700" },
                          { code: 429, label: "Rate Limited", color: "bg-orange-100 text-orange-700" },
                          { code: 500, label: "Server Error", color: "bg-red-100 text-red-700" },
                        ].map(err => (
                          <span key={err.code} className={`text-xs font-bold px-2 py-0.5 rounded-md ${err.color}`}>
                            {err.code} {err.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rate Limits */}
      <div className="border-t">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <h2 className="text-xl font-bold text-dark-navy mb-4">Rate Limits</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { plan: "Starter", limit: "100 requests/min", burst: "200 requests/min" },
              { plan: "Pro", limit: "500 requests/min", burst: "1000 requests/min" },
              { plan: "Enterprise", limit: "2000 requests/min", burst: "5000 requests/min" },
            ].map(rate => (
              <div key={rate.plan} className="border rounded-xl p-5 text-center">
                <h4 className="font-bold text-dark-navy mb-3">{rate.plan}</h4>
                <p className="text-3xl font-bold text-primary mb-1">{rate.limit}</p>
                <p className="text-xs text-gray-500">Burst: {rate.burst}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
