'use client';

import { motion } from 'framer-motion';
import MarketingShell from '@/components/marketing/MarketingShell';
import { Code2, BookOpen, Bot, Globe, MessageSquare, BarChart3, Webhook, Lock, Smartphone, Workflow, Database, Server, ChevronRight, Terminal, Link } from 'lucide-react';
import DashboardMockup from '@/components/marketing/DashboardMockup';

const categories = [
  {
    id: 'chat',
    label: 'Chat API',
    icon: MessageSquare,
    endpoints: [
      { method: 'POST', path: '/api/chat', desc: 'Send a message to the AI chatbot and receive a response.', auth: 'API Key', body: '{ "workspace_id": "str", "message": "str", "conversation_id?": "str", "session_id?": "str" }', response: '{ "reply": "str", "conversation_id": "str", "intent": "str", "products?": "array" }' },
      { method: 'GET', path: '/api/chat/history', desc: 'Retrieve conversation history for a workspace.', auth: 'API Key', params: 'workspace_id, limit?, offset?', response: '{ "conversations": "array", "total": "number" }' },
    ],
  },
  {
    id: 'widget',
    label: 'Widget API',
    icon: Smartphone,
    endpoints: [
      { method: 'GET', path: '/api/widget', desc: 'Fetch widget configuration (branding, greeting, position).', auth: 'API Key', params: 'key, workspace_id', response: '{ "bot_name": "str", "greeting": "str", "primary_color": "str", "position": "str" }' },
      { method: 'POST', path: '/api/widget/bootstrap', desc: 'Initialize widget session and receive embed script.', auth: 'Public', body: '{ "workspace_id": "str" }', response: '{ "embed_url": "str", "session_token": "str" }' },
    ],
  },
  {
    id: 'knowledge',
    label: 'Knowledge Base API',
    icon: Database,
    endpoints: [
      { method: 'POST', path: '/api/knowledge/documents', desc: 'Upload a document to the knowledge base (PDF, TXT, CSV, MD, JSON).', auth: 'API Key', body: '{ "workspace_id": "str", "file": "binary / base64", "title?": "str" }', response: '{ "document_id": "str", "status": "processing | ready | error" }' },
      { method: 'GET', path: '/api/knowledge/documents', desc: 'List all documents in a workspace.', auth: 'API Key', params: 'workspace_id, status?', response: '{ "documents": "array", "total": "number" }' },
      { method: 'DELETE', path: '/api/knowledge/documents', desc: 'Delete a document from the knowledge base.', auth: 'API Key', body: '{ "document_id": "str" }', response: '{ "success": true }' },
      { method: 'POST', path: '/api/knowledge/faq', desc: 'Add a manual FAQ entry.', auth: 'API Key', body: '{ "workspace_id": "str", "question": "str", "answer": "str", "category?": "str" }', response: '{ "faq_id": "str" }' },
      { method: 'GET', path: '/api/knowledge/faq', desc: 'List all FAQ entries.', auth: 'API Key', params: 'workspace_id, category?', response: '{ "faqs": "array" }' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics API',
    icon: BarChart3,
    endpoints: [
      { method: 'GET', path: '/api/client/analytics', desc: 'Retrieve conversation metrics (count, avg duration, satisfaction).', auth: 'API Key', params: 'workspace_id, period? (7d | 30d | 90d)', response: '{ "total_conversations": "number", "avg_duration": "number", "satisfaction_rate": "number" }' },
      { method: 'GET', path: '/api/client/metrics', desc: 'Get real-time dashboard metrics.', auth: 'API Key', params: 'workspace_id', response: '{ "active_conversations": "number", "messages_today": "number", "escalations": "number" }' },
      { method: 'GET', path: '/api/client/unanswered', desc: 'List unanswered questions (knowledge base gaps).', auth: 'API Key', params: 'workspace_id', response: '{ "unanswered": "array" }' },
    ],
  },
  {
    id: 'conversations',
    label: 'Conversations API',
    icon: MessageSquare,
    endpoints: [
      { method: 'GET', path: '/api/client/conversations', desc: 'List all conversations with pagination.', auth: 'API Key', params: 'workspace_id, page?, limit?, status?', response: '{ "conversations": "array", "page": "number", "total": "number" }' },
      { method: 'GET', path: '/api/client/escalations', desc: 'List conversations escalated to human agents.', auth: 'API Key', params: 'workspace_id, status?', response: '{ "escalations": "array" }' },
    ],
  },
  {
    id: 'store',
    label: 'Store & Products',
    icon: Globe,
    endpoints: [
      { method: 'GET', path: '/api/client/store', desc: 'Get store configuration and linked e-commerce platform info.', auth: 'API Key', params: 'workspace_id', response: '{ "store_name": "str", "platform": "str", "sync_status": "str" }' },
      { method: 'GET', path: '/api/client/products', desc: 'List synced products from the connected store.', auth: 'API Key', params: 'workspace_id, search?, category?', response: '{ "products": "array", "total": "number" }' },
      { method: 'GET', path: '/api/client/sync-status', desc: 'Check the status of the latest product catalog sync.', auth: 'API Key', params: 'workspace_id', response: '{ "status": "str", "last_sync": "ISO8601", "products_count": "number" }' },
    ],
  },
  {
    id: 'webhooks',
    label: 'Webhooks',
    icon: Webhook,
    endpoints: [
      { method: 'POST', path: '/webhook', desc: 'Receive real-time events (new conversation, escalation, message).', auth: 'Signed Payload', body: '{ "event": "conversation.created | conversation.escalated | message.received", "payload": "object" }' },
      { method: 'POST', path: '/api/channels/webhook', desc: 'External channel webhook receiver (WhatsApp, Messenger, Instagram).', auth: 'Platform Secret', body: 'Platform-specific format', response: '{ "received": true }' },
    ],
  },
  {
    id: 'auth',
    label: 'Authentication',
    icon: Lock,
    endpoints: [
      { method: 'POST', path: '/api/auth/login', desc: 'Authenticate with email and password to receive a JWT.', auth: 'None', body: '{ "email": "str", "password": "str" }', response: '{ "token": "jwt", "user": "object" }' },
      { method: 'POST', path: '/api/auth/register', desc: 'Create a new account.', auth: 'None', body: '{ "email": "str", "password": "str", "name": "str", "company?": "str" }', response: '{ "token": "jwt", "user": "object" }' },
      { method: 'POST', path: '/api/me', desc: 'Get current user profile and workspace info.', auth: 'JWT', response: '{ "id": "str", "email": "str", "workspace": "object" }' },
    ],
  },
  {
    id: 'admin',
    label: 'Admin API',
    icon: Server,
    endpoints: [
      { method: 'GET', path: '/api/admin/users', desc: 'List all users (admin only).', auth: 'Admin JWT' },
      { method: 'GET', path: '/api/admin/metrics', desc: 'Platform-wide analytics (admin only).', auth: 'Admin JWT' },
      { method: 'PUT', path: '/api/admin/settings', desc: 'Update platform settings (admin only).', auth: 'Admin JWT' },
    ],
  },
];

export default function ApiReferencePage() {
  return (
    <MarketingShell>
      <section className="pt-32 pb-24 bg-gradient-to-b from-[#0A1428] to-[#121c3a] text-white text-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 25px 25px, #A3E635 1px, transparent 0)', backgroundSize: '50px 50px' }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <div className="w-16 h-16 bg-[#A3E635]/15 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Code2 className="w-8 h-8 text-[#A3E635]" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-4">API <span className="text-lemon-green">Reference</span></h1>
          <p className="text-gray-400 max-w-xl mx-auto">Comprehensive documentation for the CircuCity AI REST API. Base URL: https://api.circucity.com</p>
        </motion.div>
      </section>

      <div className="max-w-5xl mx-auto px-6 mb-12">
        <DashboardMockup variant="analytics" />
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex flex-wrap gap-2 mb-12">
          {categories.map(cat => (
            <a key={cat.id} href={`#${cat.id}`}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-[#A3E635]/10 hover:text-[#0A1428] transition-all">
              {cat.label}
            </a>
          ))}
        </div>

        <div className="space-y-12">
          {categories.map((category, ci) => {
            const CatIcon = category.icon;
            return (
              <motion.section key={category.id} id={category.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-[#A3E635]/10 rounded-xl flex items-center justify-center">
                    <CatIcon className="w-5 h-5 text-[#A3E635]" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#0A1428]">{category.label}</h2>
                </div>
                <div className="space-y-3">
                  {category.endpoints.map((ep, ei) => (
                    <div key={ei} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-[#A3E635]/30 transition-all shadow-sm">
                      <div className="flex items-center gap-3 p-4 border-b border-gray-50">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shrink-0 ${ep.method === 'GET' ? 'bg-green-50 text-green-700' : ep.method === 'POST' ? 'bg-blue-50 text-blue-700' : ep.method === 'DELETE' ? 'bg-red-50 text-red-700' : ep.method === 'PUT' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                          {ep.method}
                        </span>
                        <code className="text-sm font-mono text-[#0A1428]">{ep.path}</code>
                        <span className="text-[10px] text-gray-400 ml-auto">{ep.auth}</span>
                      </div>
                      <div className="p-4 space-y-3">
                        <p className="text-sm text-gray-600">{ep.desc}</p>
                        <div className="grid sm:grid-cols-2 gap-4">
                          {ep.body && (
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 block">Request Body</span>
                              <code className="text-xs font-mono bg-[#FAFAFA] p-2 rounded block border border-gray-100 text-gray-700 leading-relaxed">{ep.body}</code>
                            </div>
                          )}
                          {ep.params && (
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 block">Query Parameters</span>
                              <code className="text-xs font-mono bg-[#FAFAFA] p-2 rounded block border border-gray-100 text-gray-700">{ep.params}</code>
                            </div>
                          )}
                          {ep.response && (
                            <div className={ep.body || ep.params ? '' : 'sm:col-span-2'}>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 block">Response</span>
                              <code className="text-xs font-mono bg-[#FAFAFA] p-2 rounded block border border-gray-100 text-gray-700 leading-relaxed">{ep.response}</code>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            );
          })}
        </div>

        <section className="mt-16 bg-[#FAFAFA] rounded-[20px] p-6 sm:p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-5 h-5 text-[#A3E635]" />
            <h2 className="text-lg font-bold text-[#0A1428]">Authentication</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">All API requests (except widget bootstrap and auth endpoints) require authentication via one of the following methods:</p>
          <div className="space-y-3">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <span className="text-xs font-bold text-[#0A1428] block mb-1">API Key (Recommended for server-to-server)</span>
              <code className="text-xs font-mono text-gray-600">Authorization: Bearer &lt;your_api_key&gt;</code>
              <p className="text-xs text-gray-400 mt-1">Generate API keys in Dashboard &gt; Settings &gt; API Keys.</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <span className="text-xs font-bold text-[#0A1428] block mb-1">JWT Token (User sessions)</span>
              <code className="text-xs font-mono text-gray-600">Authorization: Bearer &lt;jwt_token&gt;</code>
              <p className="text-xs text-gray-400 mt-1">JWT tokens are obtained via /api/auth/login and expire after 24 hours.</p>
            </div>
          </div>
        </section>

        <section className="mt-8 bg-[#FAFAFA] rounded-[20px] p-6 sm:p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-[#A3E635]" />
            <h2 className="text-lg font-bold text-[#0A1428]">Rate Limits</h2>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Free Plan:</strong> 60 requests per minute per API key</p>
            <p><strong>Pro Plan:</strong> 300 requests per minute per API key</p>
            <p><strong>Enterprise:</strong> Custom rate limits (contact support@circucity.com)</p>
            <p className="mt-2">Rate limit headers are returned with every response: <code className="text-xs font-mono bg-white px-1.5 py-0.5 rounded border">X-RateLimit-Limit</code>, <code className="text-xs font-mono bg-white px-1.5 py-0.5 rounded border">X-RateLimit-Remaining</code>, <code className="text-xs font-mono bg-white px-1.5 py-0.5 rounded border">X-RateLimit-Reset</code></p>
          </div>
        </section>

        <section className="mt-8 bg-[#FAFAFA] rounded-[20px] p-6 sm:p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <Code2 className="w-5 h-5 text-[#A3E635]" />
            <h2 className="text-lg font-bold text-[#0A1428]">Errors</h2>
          </div>
          <p className="text-sm text-gray-600 mb-3">The API uses standard HTTP status codes. All errors return a consistent JSON response:</p>
          <code className="text-xs font-mono bg-white p-3 rounded block border border-gray-100 text-gray-700 mb-3">{'{ "error": "string", "code": "string", "details?": "object" }'}</code>
          <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-600">
            <div className="bg-white rounded-lg p-3 border border-gray-100"><span className="font-bold text-amber-600">401</span> ??? Unauthorized (missing/invalid API key)</div>
            <div className="bg-white rounded-lg p-3 border border-gray-100"><span className="font-bold text-red-600">403</span> ??? Forbidden (insufficient permissions)</div>
            <div className="bg-white rounded-lg p-3 border border-gray-100"><span className="font-bold text-blue-600">404</span> ??? Not Found</div>
            <div className="bg-white rounded-lg p-3 border border-gray-100"><span className="font-bold text-purple-600">429</span> ??? Too Many Requests (rate limit exceeded)</div>
            <div className="bg-white rounded-lg p-3 border border-gray-100 sm:col-span-2"><span className="font-bold text-gray-600">500</span> ??? Internal Server Error (retry after a few seconds)</div>
          </div>
        </section>
      </div>
    </MarketingShell>
  );
}

