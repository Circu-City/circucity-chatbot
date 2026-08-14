'use client';

import { motion } from 'framer-motion';
import MarketingShell from '@/components/marketing/MarketingShell';
import { Code2, BookOpen, Bot, Globe, MessageSquare, BarChart3, Webhook, Smartphone, Workflow, Database, Terminal, Link, Settings, Rocket, ShieldCheck, Palette, ChevronRight, Copy, CheckCircle } from 'lucide-react';
import DashboardMockup from '@/components/marketing/DashboardMockup';

const steps = [
  {
    icon: Rocket,
    title: '1. Create an Account',
    content: 'Sign up at https://circucity.com/sign-up to get your workspace. After registration, you\'ll find your workspace ID and API keys in Dashboard &gt; Settings &gt; API Keys.',
  },
  {
    icon: Bot,
    title: '2. Configure Your AI Agent',
    content: 'Upload knowledge base documents (PDF, TXT, CSV, MD, JSON), add FAQs, sync your product catalog, and customize the chatbot\'s personality, name, and greeting message. Test responses in the Playground before going live.',
  },
  {
    icon: Palette,
    title: '3. Customize Appearance',
    content: 'Set your brand colors, position (bottom-right, bottom-left), enable/disable branding, configure proactive messaging, and set the bot name and avatar in Widget Settings.',
  },
  {
    icon: Code2,
    title: '4. Embed on Your Website',
    content: 'Add the widget script to your site. See "Embed Methods" below for detailed options including the standard snippet, React component, and custom integration via API.',
  },
  {
    icon: Globe,
    title: '5. Connect Channels (Optional)',
    content: 'Extend your AI agent to WhatsApp, Facebook Messenger, and Instagram. Each channel requires OAuth setup through the CircuCity dashboard. Messages across channels are unified in your inbox.',
  },
  {
    icon: Workflow,
    title: '6. Automate with Flows',
    content: 'Create automated workflows triggered by specific events: new conversations, escalations, lead capture, order status checks, and more. Flows can send emails, update CRM records, or notify your team via Slack/Webhook.',
  },
];

const embedMethods = [
  {
    name: 'Standard Script Tag',
    code: `<script>
  window.CircuCityAI = {
    workspaceId: "YOUR_WORKSPACE_ID",
    apiKey: "YOUR_API_KEY"
  };
</script>
<script src="https://cdn.circucity.com/widget.js" defer></script>`,
    desc: 'Place these tags just before the closing </body> tag. The widget loads asynchronously and will appear on all pages.',
  },
  {
    name: 'React Component',
    code: `import { CircuCityWidget } from '@circucity/widget';

function App() {
  return (
    <CircuCityWidget
      workspaceId="YOUR_WORKSPACE_ID"
      apiKey="YOUR_API_KEY"
      position="bottom-right"
      primaryColor="#A3E635"
      botName="Cira"
    />
  );
}`,
    desc: 'Install @circucity/widget from npm. Works with Next.js, React, and any React-based framework.',
  },
  {
    name: 'Custom Integration (API)',
    code: `// 1. Fetch widget config
const config = await fetch(
  'https://api.circucity.com/api/widget?key=YOUR_API_KEY&workspace_id=YOUR_WORKSPACE_ID'
);

// 2. Initialize chat session
const session = await fetch(
  'https://api.circucity.com/api/widget/bootstrap',
  { method: 'POST', body: JSON.stringify({ workspace_id: 'YOUR_WORKSPACE_ID' }) }
);

// 3. Send messages
const reply = await fetch('https://api.circucity.com/api/chat', {
  method: 'POST',
  headers: { Authorization: 'Bearer YOUR_API_KEY' },
  body: JSON.stringify({
    workspace_id: 'YOUR_WORKSPACE_ID',
    message: 'Hello!'
  })
});`,
    desc: 'Build a completely custom chat UI using our REST API. Full control over the user experience.',
  },
];

const webhookEvents = [
  { event: 'conversation.created', desc: 'A new conversation has started', payload: '{ "conversation_id": "str", "customer": "object", "first_message": "str" }' },
  { event: 'conversation.escalated', desc: 'Conversation escalated to a human agent', payload: '{ "conversation_id": "str", "reason": "str", "transcript": "array" }' },
  { event: 'message.received', desc: 'A new message in an existing conversation', payload: '{ "conversation_id": "str", "message": "str", "timestamp": "ISO8601" }' },
  { event: 'lead.captured', desc: 'AI identified and captured a lead', payload: '{ "conversation_id": "str", "lead": "object", "source": "str" }' },
  { event: 'order.status', desc: 'Order status update requested by customer', payload: '{ "order_id": "str", "status": "str", "customer_email": "str" }' },
  { event: 'product.inquiry', desc: 'Customer asked about a specific product', payload: '{ "product_id": "str", "product_name": "str", "question": "str" }' },
];

const codeSamples = [
  {
    lang: 'cURL',
    code: `curl -X POST https://api.circucity.com/api/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "workspace_id": "YOUR_WORKSPACE_ID",
    "message": "What are your business hours?",
    "conversation_id": "opt"
  }'`,
  },
  {
    lang: 'JavaScript',
    code: `const response = await fetch('https://api.circucity.com/api/chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    workspace_id: 'YOUR_WORKSPACE_ID',
    message: 'Do you ship internationally?',
  }),
});

const data = await response.json();
console.log(data.reply);`,
  },
  {
    lang: 'Python',
    code: `import requests

response = requests.post(
    'https://api.circucity.com/api/chat',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json',
    },
    json={
        'workspace_id': 'YOUR_WORKSPACE_ID',
        'message': 'What is my order status?',
    }
)

print(response.json()['reply'])`,
  },
  {
    lang: 'PHP',
    code: `$ch = curl_init('https://api.circucity.com/api/chat');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    'Authorization: Bearer YOUR_API_KEY',
    'Content-Type: application/json',
  ],
  CURLOPT_POSTFIELDS => json_encode([
    'workspace_id' => 'YOUR_WORKSPACE_ID',
    'message' => 'How do I return an item?',
  ]),
  CURLOPT_RETURNTRANSFER => true,
]);
$response = curl_exec($ch);
$data = json_decode($response, true);
echo $data['reply'];`,
  },
];

export default function DeveloperGuidePage() {
  return (
    <MarketingShell>
      <section className="pt-32 pb-24 bg-gradient-to-b from-[#0A1428] to-[#121c3a] text-white text-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 25px 25px, #A3E635 1px, transparent 0)', backgroundSize: '50px 50px' }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <div className="w-16 h-16 bg-[#A3E635]/15 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Code2 className="w-8 h-8 text-[#A3E635]" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-4">Developer <span className="text-lemon-green">Guide</span></h1>
          <p className="text-gray-400 max-w-xl mx-auto">Everything you need to integrate CircuCity AI into your application or website.</p>
        </motion.div>
      </section>

      <div className="max-w-4xl mx-auto px-6 mb-12">
        <DashboardMockup variant="chat" />
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-16">
        <section>
          <div className="flex items-center gap-3 mb-8">
            <Rocket className="w-6 h-6 text-[#A3E635]" />
            <h2 className="text-2xl font-bold text-[#0A1428]">Getting Started</h2>
          </div>
          <div className="space-y-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-4 bg-white rounded-xl p-5 border border-gray-100 hover:border-[#A3E635]/20 transition-all">
                  <div className="w-10 h-10 bg-[#A3E635]/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-5 h-5 text-[#A3E635]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0A1428] mb-1">{step.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{step.content}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-8">
            <Smartphone className="w-6 h-6 text-[#A3E635]" />
            <h2 className="text-2xl font-bold text-[#0A1428]">Embed Methods</h2>
          </div>
          <div className="space-y-6">
            {embedMethods.map((method, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="bg-white rounded-[20px] border border-gray-100 overflow-hidden hover:border-[#A3E635]/20 transition-all shadow-sm">
                <div className="p-5 border-b border-gray-50">
                  <h3 className="text-base font-bold text-[#0A1428]">{method.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{method.desc}</p>
                </div>
                <div className="bg-[#0A1428] p-4 overflow-x-auto">
                  <pre className="text-xs font-mono text-[#A3E635] leading-relaxed whitespace-pre">{method.code}</pre>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-8">
            <Terminal className="w-6 h-6 text-[#A3E635]" />
            <h2 className="text-2xl font-bold text-[#0A1428]">API Code Samples</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">Send messages to the AI chatbot in your preferred language:</p>
          <div className="space-y-4">
            {codeSamples.map((sample, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-[#A3E635]/20 transition-all shadow-sm">
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{sample.lang}</span>
                </div>
                <div className="bg-[#0A1428] p-4 overflow-x-auto">
                  <pre className="text-xs font-mono text-[#A3E635] leading-relaxed whitespace-pre">{sample.code}</pre>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-8">
            <Webhook className="w-6 h-6 text-[#A3E635]" />
            <h2 className="text-2xl font-bold text-[#0A1428]">Webhooks</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">Real-time event notifications delivered via POST to your webhook URL. Configure webhooks in Dashboard &gt; Settings &gt; Webhooks.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 font-bold text-[#0A1428] text-xs uppercase tracking-wider border-b">Event</th>
                  <th className="text-left p-3 font-bold text-[#0A1428] text-xs uppercase tracking-wider border-b">Description</th>
                  <th className="text-left p-3 font-bold text-[#0A1428] text-xs uppercase tracking-wider border-b hidden sm:table-cell">Sample Payload</th>
                </tr>
              </thead>
              <tbody>
                {webhookEvents.map((ev, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="p-3"><code className="text-xs font-mono bg-[#A3E635]/10 text-[#0A1428] px-2 py-0.5 rounded">{ev.event}</code></td>
                    <td className="p-3 text-gray-600">{ev.desc}</td>
                    <td className="p-3 hidden sm:table-cell"><code className="text-xs font-mono text-gray-500">{ev.payload}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 bg-[#FAFAFA] rounded-xl p-5 border border-gray-100">
            <h3 className="text-sm font-bold text-[#0A1428] mb-2">Webhook Security</h3>
            <p className="text-sm text-gray-600 mb-3">All webhook payloads are signed with your webhook secret using HMAC-SHA256. Verify the signature in the <code className="text-xs font-mono bg-white px-1.5 py-0.5 rounded border">X-Webhook-Signature</code> header:</p>
            <div className="bg-[#0A1428] p-3 rounded-lg overflow-x-auto">
              <pre className="text-xs font-mono text-[#A3E635]">{`const crypto = require('crypto');
const signature = req.headers['x-webhook-signature'];
const expected = crypto
  .createHmac('sha256', YOUR_WEBHOOK_SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex');
if (signature !== expected) throw new Error('Invalid signature');`}</pre>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-8">
            <Database className="w-6 h-6 text-[#A3E635]" />
            <h2 className="text-2xl font-bold text-[#0A1428]">Product Catalog Sync</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">Sync your e-commerce product catalog to enable AI-powered product recommendations and order status queries.</p>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 border border-gray-100 hover:border-[#A3E635]/20 transition-all">
              <Globe className="w-5 h-5 text-[#A3E635] mb-3" />
              <h3 className="text-sm font-bold text-[#0A1428] mb-1">Auto-Crawl</h3>
              <p className="text-xs text-gray-500">Provide your store URL and we automatically crawl product listings, prices, categories, and descriptions. Supports most e-commerce platforms (Shopify, WooCommerce, Magento, custom stores).</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100 hover:border-[#A3E635]/20 transition-all">
              <Database className="w-5 h-5 text-[#A3E635] mb-3" />
              <h3 className="text-sm font-bold text-[#0A1428] mb-1">API Sync</h3>
              <p className="text-xs text-gray-500">Use the Products API to programmatically sync your catalog. POST product data in bulk or individually. Supports real-time inventory updates.</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100 hover:border-[#A3E635]/20 transition-all">
              <FileText className="w-5 h-5 text-[#A3E635] mb-3" />
              <h3 className="text-sm font-bold text-[#0A1428] mb-1">CSV Import</h3>
              <p className="text-xs text-gray-500">Upload a CSV file with columns: title, description, price, category, image_url, sku. Batch upload up to 10,000 products at once.</p>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-8">
            <Globe className="w-6 h-6 text-[#A3E635]" />
            <h2 className="text-2xl font-bold text-[#0A1428]">Channel Integration</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">Connect your AI agent to messaging platforms for unified multi-channel support.</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { name: 'WhatsApp', setup: 'Link your WhatsApp Business Account via OAuth. Requires a verified Meta Business Manager account.', icon: MessageSquare },
              { name: 'Facebook Messenger', setup: 'Connect your Facebook Page. Messages from your page\'s inbox are routed to the AI agent.', icon: MessageSquare },
              { name: 'Instagram', setup: 'Link your Instagram Business account. DM responses are handled by AI with fallback to human agents.', icon: MessageSquare },
            ].map((ch, i) => {
              const ChIcon = ch.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  className="bg-white rounded-xl p-5 border border-gray-100 hover:border-[#A3E635]/20 transition-all">
                  <div className="w-10 h-10 bg-[#A3E635]/10 rounded-xl flex items-center justify-center mb-3">
                    <ChIcon className="w-5 h-5 text-[#A3E635]" />
                  </div>
                  <h3 className="text-sm font-bold text-[#0A1428] mb-2">{ch.name}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{ch.setup}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-8">
            <ShieldCheck className="w-6 h-6 text-[#A3E635]" />
            <h2 className="text-2xl font-bold text-[#0A1428]">Best Practices</h2>
          </div>
          <div className="bg-white rounded-[20px] p-6 sm:p-8 border border-gray-100">
            <ul className="space-y-4">
              {[
                'Store API keys in environment variables ??? never expose them in client-side code.',
                'Use the conversation_id parameter to maintain context across messages in the same conversation.',
                'Set up webhooks to receive real-time notifications instead of polling the API.',
                'Upload comprehensive knowledge base documents for better AI response accuracy.',
                'Test responses in the Playground before updating your knowledge base in production.',
                'Monitor unanswered questions in the dashboard to identify knowledge base gaps.',
                'Use unique conversation IDs (e.g., UUID) to prevent context collisions across users.',
                'Implement webhook signature verification to ensure payload authenticity.',
                'Rate limit your requests ??? implement exponential backoff for 429 responses.',
                'Keep your knowledge base documents up to date as your products and policies change.',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-[#A3E635] mt-0.5 shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-[#FAFAFA] rounded-[20px] p-6 sm:p-8 border border-gray-100 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <MessageSquare className="w-5 h-5 text-[#A3E635]" />
            <h2 className="text-lg font-bold text-[#0A1428]">Need Help?</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">Our developer support team is ready to help you with integration.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="/contact" className="inline-flex items-center gap-2 bg-[#0A1428] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#1a2744] transition-all">
              Contact Support <ChevronRight className="w-4 h-4" />
            </a>
            <a href="mailto:support@circucity.com" className="inline-flex items-center gap-2 bg-white border border-gray-200 text-[#0A1428] px-5 py-2.5 rounded-xl font-semibold text-sm hover:border-[#A3E635]/50 transition-all">
              support@circucity.com
            </a>
          </div>
        </section>
      </div>
    </MarketingShell>
  );
}

function FileText({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
}

