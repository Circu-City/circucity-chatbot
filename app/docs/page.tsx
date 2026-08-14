'use client';

import { useState, useMemo, useEffect } from "react";
import MarketingShell from '@/components/marketing/MarketingShell';
import {
  Search, Zap, MessageCircle, Code, ChevronRight, Terminal, Shield,
  Sparkles, Globe, Copy, Check, Mail, MessageSquare, ShoppingCart,
  Users, BookOpen, HelpCircle, AlertTriangle, Wifi, Bot, ArrowRight,
  Puzzle, Upload, Clock, CheckCircle, Layers
} from "lucide-react";

const CATEGORIES = [
  { id: "getting-started", label: "Getting Started", icon: "Zap", color: "from-green-500 to-emerald-600", desc: "Set up your bot in minutes" },
  { id: "ai-customization", label: "AI Customization", icon: "Bot", color: "from-yellow-500 to-amber-600", desc: "Train tone, guardrails and flows" },
  { id: "channels", label: "Integration Channels", icon: "Puzzle", color: "from-blue-500 to-indigo-600", desc: "Widget, WhatsApp, Messenger, Email" },
  { id: "developer-api", label: "Developer API", icon: "Terminal", color: "from-purple-500 to-violet-600", desc: "REST API and webhooks" },
  { id: "troubleshooting", label: "Troubleshooting", icon: "HelpCircle", color: "from-red-500 to-rose-600", desc: "Fix common problems" },
];

interface Article {
  id: string;
  title: string;
  desc: string;
  icon: string;
  content: React.ReactNode;
}

const CATEGORY_ARTICLES: Record<string, string[]> = {
  "getting-started": ["quick-start", "install-snippet", "connect-store", "test-bot"],
  "ai-customization": ["train-ai", "guardrails", "tone", "flows"],
  "channels": ["web-widget", "whatsapp", "messenger", "instagram", "email", "shopify", "crm"],
  "developer-api": ["api-reference", "webhooks"],
  "troubleshooting": ["widget-not-showing", "ai-not-answering", "slow-response", "sync-errors", "billing-issues", "team-access"],
};

const GUIDE_CONTENT: Record<string, Article> = {
  "quick-start": {
    id: "quick-start", title: "Quick Start Guide", desc: "Get your bot live in 5 minutes", icon: "Zap",
    content: (
      <div className="space-y-6">
        <p className="text-gray-600">Follow these 5 steps to get your AI sales bot up and running in minutes.</p>
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
            <span className="text-[#A3E635] font-bold text-sm">1</span>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-[#0A1428]">Create Your Account</h4>
            <p className="text-gray-600">Go to <a href="/signup" className="text-[#A3E635] font-bold hover:underline">circucity.ai/signup</a> and create a free account. No credit card required. Verify your email to get started.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
            <span className="text-[#A3E635] font-bold text-sm">2</span>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-[#0A1428]">Configure Your Bot</h4>
            <p className="text-gray-600">From the dashboard, click <strong>Bots</strong> then <strong>Create Bot</strong>. Give it a name (e.g. "Sales Assistant") and select your industry. The AI auto-configures based on your selection.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
            <span className="text-[#A3E635] font-bold text-sm">3</span>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-[#0A1428]">Add Your Products</h4>
            <p className="text-gray-600">Upload your product catalog via CSV, connect your e-commerce platform, or let us crawl your website. Your bot needs product data to answer customer questions accurately.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
            <span className="text-[#A3E635] font-bold text-sm">4</span>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-[#0A1428]">Install the Widget</h4>
            <p className="text-gray-600">Copy the install snippet from <strong>Settings &rarr; Widget</strong> and paste it into your website&apos;s <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">&lt;head&gt;</code> tag. The chat bubble appears on all pages automatically.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
            <span className="text-[#A3E635] font-bold text-sm">5</span>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-[#0A1428]">Go Live &amp; Test</h4>
            <p className="text-gray-600">Toggle your bot to <strong>Live</strong> in the dashboard. Visit your site and click the chat bubble to test. Your bot is now answering customer questions!</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-[#A3E635]/10 to-[#A3E635]/5 border border-[#A3E635]/20 rounded-xl p-4">
          <div className="flex gap-3">
            <Sparkles className="w-5 h-5 text-[#A3E635] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-[#0A1428] text-sm">Pro Tip</h4>
              <p className="text-gray-600 text-sm">Use the <strong>Playground</strong> in your dashboard before going live to test how your bot responds to common customer questions.</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  "install-snippet": {
    id: "install-snippet", title: "Install the Widget Snippet", desc: "Add the chat widget to your website", icon: "Code",
    content: (
      <div className="space-y-6">
        <p className="text-gray-600">Add the CircuCity AI chat widget to your website by pasting the install snippet. Platform-specific instructions below.</p>
        <h4 className="font-bold text-[#0A1428]">The Snippet</h4>
        <div className="bg-[#0A1428] rounded-xl p-4 overflow-x-auto">
          <pre className="text-sm text-gray-300 font-mono">{`<script>\n  window.circucityConfig = {\n    workspaceId: "YOUR_WORKSPACE_ID",\n    botId: "YOUR_BOT_ID"\n  };\n</script>\n<script src="https://cdn.circucity.ai/widget/v1.js" defer></script>`}</pre>
        </div>
        <p className="text-gray-600 text-sm">Replace <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">YOUR_WORKSPACE_ID</code> and <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">YOUR_BOT_ID</code> with the values from your dashboard <strong>Settings &rarr; Widget</strong>.</p>
        <h4 className="font-bold text-[#0A1428]">Platform Instructions</h4>
        <div className="space-y-3">
          <div className="border border-gray-200 rounded-xl p-4">
            <h5 className="font-bold text-[#0A1428] mb-1">Shopify</h5>
            <p className="text-gray-600 text-sm">Go to <strong>Online Store &rarr; Themes &rarr; Edit Code</strong>. Open <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">theme.liquid</code> and paste the snippet just before <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">&lt;/head&gt;</code>. Save.</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4">
            <h5 className="font-bold text-[#0A1428] mb-1">WordPress</h5>
            <p className="text-gray-600 text-sm">Install a "Header Footer Code" plugin (e.g. WPCode). Add the snippet and set it to display on "Everywhere" in the site header. Save and publish.</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4">
            <h5 className="font-bold text-[#0A1428] mb-1">Wix</h5>
            <p className="text-gray-600 text-sm">Go to <strong>Settings &rarr; Custom Code</strong>. Click <strong>Add Custom Code</strong>, paste the snippet, set it to load on <strong>All Pages</strong> in the <strong>Head</strong> section. Apply.</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4">
            <h5 className="font-bold text-[#0A1428] mb-1">Squarespace</h5>
            <p className="text-gray-600 text-sm">Go to <strong>Settings &rarr; Advanced &rarr; Code Injection</strong>. Paste the snippet in the <strong>Header</strong> field and click <strong>Save</strong>.</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4">
            <h5 className="font-bold text-[#0A1428] mb-1">Webflow</h5>
            <p className="text-gray-600 text-sm">Go to <strong>Project Settings &rarr; Custom Code</strong>. Paste the snippet in the <strong>Head Code</strong> section and save. Publish your site.</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4">
            <h5 className="font-bold text-[#0A1428] mb-1">Custom HTML</h5>
            <p className="text-gray-600 text-sm">Open your HTML file(s) and paste the snippet just before <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">&lt;/head&gt;</code>. Upload the updated files.</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
          <div className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-[#0A1428] text-sm">Verify Installation</h4>
              <p className="text-gray-600 text-sm">After installing, visit your site and look for the chat bubble in the bottom-right corner. See Troubleshooting if it doesn't appear.</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  "connect-store": {
    id: "connect-store", title: "Connect Your Store", desc: "Sync products via CSV, API or crawl", icon: "ShoppingCart",
    content: (
      <div className="space-y-6">
        <p className="text-gray-600">Sync your product catalog so your bot can answer questions about pricing, availability, and descriptions. Choose the method that works for you.</p>
        <h4 className="font-bold text-[#0A1428] text-lg">Method 1: CSV Import</h4>
        <div className="bg-[#0A1428] rounded-xl p-4 overflow-x-auto">
          <pre className="text-sm text-gray-300 font-mono">{`sku,name,description,price,category,url,in_stock,image_url\nTSH001,Classic Cotton Tee,Soft 100% cotton t-shirt,29.99,Apparel,https://.../tsh001,true,https://.../tsh001.jpg\nMUG001,Ceramic Mug,12oz ceramic mug,14.99,Drinkware,https://.../mug001,true,https://.../mug001.jpg`}</pre>
        </div>
        <p className="text-gray-600 text-sm">Required columns: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">sku</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">name</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">description</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">price</code>. Optional: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">category</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">url</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">in_stock</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">image_url</code>.</p>
        <h4 className="font-bold text-[#0A1428] text-lg">Method 2: API Sync</h4>
        <div className="bg-[#0A1428] rounded-xl p-4 overflow-x-auto">
          <pre className="text-sm text-gray-300 font-mono">{`curl -X POST https://api.circucity.ai/v1/products/sync \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "products": [\n      { "sku": "TSH001", "name": "Classic Cotton Tee", "price": 29.99 }\n    ]\n  }'`}</pre>
        </div>
        <h4 className="font-bold text-[#0A1428] text-lg">Method 3: Website Crawl</h4>
        <div className="space-y-3">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">1</span>
            </div>
            <div><p className="text-gray-600">Go to <strong>Settings &rarr; Products &rarr; Website Crawl</strong> in your dashboard.</p></div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">2</span>
            </div>
            <div><p className="text-gray-600">Enter your store URL (e.g. <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">https://yourstore.com</code>).</p></div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">3</span>
            </div>
            <div><p className="text-gray-600">Set the product page pattern (e.g. <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">/products/*</code>) and click <strong>Start Crawl</strong>.</p></div>
          </div>
        </div>
      </div>
    ),
  },
  "test-bot": {
    id: "test-bot", title: "Test Your Bot", desc: "Use the playground before going live", icon: "Bot",
    content: (
      <div className="space-y-6">
        <p className="text-gray-600">Before going live, use the <strong>Playground</strong> in your dashboard to test your bot's responses thoroughly.</p>
        <h4 className="font-bold text-[#0A1428]">How to Use the Playground</h4>
        <div className="space-y-3">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">1</span>
            </div>
            <div><p className="text-gray-600">Open your dashboard and navigate to <strong>Bots &rarr; Your Bot &rarr; Playground</strong>.</p></div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">2</span>
            </div>
            <div><p className="text-gray-600">Type messages as if you were a customer. Ask about products, shipping, returns, and policies.</p></div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">3</span>
            </div>
            <div><p className="text-gray-600">Review each response for accuracy, tone, and relevance. Toggle <strong>Show Debug Info</strong> to see which sources were used.</p></div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">4</span>
            </div>
            <div><p className="text-gray-600">Test edge cases: off-topic questions, vague messages, and follow-up questions to verify context retention.</p></div>
          </div>
        </div>
        <h4 className="font-bold text-[#0A1428]">What to Test</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="border border-gray-200 rounded-xl p-4">
            <h5 className="font-bold text-[#0A1428] text-sm">Product Questions</h5>
            <p className="text-gray-600 text-sm">"What's the price of X?" "Is Y in stock?" "Do you have size Z?" "What colors are available?"</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4">
            <h5 className="font-bold text-[#0A1428] text-sm">Policy Questions</h5>
            <p className="text-gray-600 text-sm">"What's your return policy?" "How long does shipping take?" "Do you ship internationally?"</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4">
            <h5 className="font-bold text-[#0A1428] text-sm">Edge Cases</h5>
            <p className="text-gray-600 text-sm">Off-topic questions, vague queries, abusive language. Verify guardrails work correctly.</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4">
            <h5 className="font-bold text-[#0A1428] text-sm">Conversation Flow</h5>
            <p className="text-gray-600 text-sm">Ask follow-up questions to test context retention across multiple turns.</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-[#A3E635]/10 to-[#A3E635]/5 border border-[#A3E635]/20 rounded-xl p-4">
          <div className="flex gap-3">
            <Sparkles className="w-5 h-5 text-[#A3E635] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-[#0A1428] text-sm">Pro Tip</h4>
              <p className="text-gray-600 text-sm">Test on mobile too! Open the Playground on your phone to see how the widget looks on a smaller screen.</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  "train-ai": {
    id: "train-ai", title: "Train Your AI", desc: "Upload knowledge base and set behavior", icon: "BookOpen",
    content: (
      <div className="space-y-6">
        <p className="text-gray-600">Train your AI by uploading knowledge documents and configuring the system prompt to match your business.</p>
        <h4 className="font-bold text-[#0A1428]">What to Upload</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="border border-gray-200 rounded-xl p-4">
            <h5 className="font-bold text-[#0A1428] text-sm">Return Policy</h5>
            <p className="text-gray-600 text-sm">Upload your full return and exchange policy so the bot can answer questions about timeframes and conditions.</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4">
            <h5 className="font-bold text-[#0A1428] text-sm">Shipping Guide</h5>
            <p className="text-gray-600 text-sm">Include shipping rates, delivery times, international shipping, and tracking details.</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4">
            <h5 className="font-bold text-[#0A1428] text-sm">FAQ Document</h5>
            <p className="text-gray-600 text-sm">Compile your most frequently asked questions and answers into a single document.</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4">
            <h5 className="font-bold text-[#0A1428] text-sm">Product Catalog</h5>
            <p className="text-gray-600 text-sm">Detailed product info: descriptions, specs, sizes, colors, and pricing.</p>
          </div>
        </div>
        <h4 className="font-bold text-[#0A1428]">System Prompt Customization</h4>
        <p className="text-gray-600">Navigate to <strong>Bots &rarr; Your Bot &rarr; Behavior</strong> to customize how your bot behaves.</p>
        <div className="bg-[#0A1428] rounded-xl p-4 overflow-x-auto">
          <pre className="text-sm text-gray-300 font-mono">{`You are a helpful sales assistant for Acme Store.\n- Answer questions about products, shipping, returns, and policies.\n- Always be polite, professional, and concise.\n- Recommend products based on customer preferences.\n- Never make up pricing or availability information.\n- If unsure, offer to connect with a human agent.`}</pre>
        </div>
        <h4 className="font-bold text-[#0A1428]">Continuous Learning</h4>
        <p className="text-gray-600">Review <strong>Analytics &rarr; Unanswered Questions</strong> regularly to see what the bot couldn't answer. Add these to your knowledge base to improve accuracy over time.</p>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
          <div className="flex gap-3">
            <Upload className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-[#0A1428] text-sm">Supported Formats</h4>
              <p className="text-gray-600 text-sm">Upload PDF, DOCX, TXT, or Markdown. Max 25 MB per document.</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  "guardrails": {
    id: "guardrails", title: "Set Guardrails", desc: "Prevent hallucinations and off-topic replies", icon: "Shield",
    content: (
      <div className="space-y-6">
        <p className="text-gray-600">Guardrails keep your bot on-topic, prevent hallucinations, and handle out-of-scope requests appropriately.</p>
        <h4 className="font-bold text-[#0A1428]">Knowledge-Only Mode</h4>
        <p className="text-gray-600">When enabled, the bot only answers from your uploaded knowledge base and product catalog. It won't use its general training data, eliminating hallucinations entirely.</p>
        <p className="text-gray-600">Toggle this on at <strong>Bots &rarr; Your Bot &rarr; Guardrails &rarr; Knowledge-Only Mode</strong>.</p>
        <h4 className="font-bold text-[#0A1428]">Blocked Topics</h4>
        <p className="text-gray-600">Define topics the bot should never discuss. Add keywords or phrases that trigger a polite refusal.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="border border-gray-200 rounded-xl p-4">
            <h5 className="font-bold text-[#0A1428] text-sm">Common Blocked Topics</h5>
            <ul className="text-gray-600 text-sm space-y-1">
              <li>&bull; Competitor comparisons</li>
              <li>&bull; Internal company data</li>
              <li>&bull; Promo codes / discounts</li>
              <li>&bull; Legal advice</li>
              <li>&bull; Personal customer data</li>
            </ul>
          </div>
          <div className="border border-gray-200 rounded-xl p-4">
            <h5 className="font-bold text-[#0A1428] text-sm">Customization</h5>
            <p className="text-gray-600 text-sm">Add exact phrases or keywords. The bot responds: "I'm sorry, I can't help with that. Please contact support."</p>
          </div>
        </div>
        <h4 className="font-bold text-[#0A1428]">Escalation Rules</h4>
        <p className="text-gray-600">Set criteria for transferring to a human agent: customer asks for a human, expresses frustration, requests account data, or bot confidence is below threshold.</p>
        <h4 className="font-bold text-[#0A1428]">Testing Guardrails</h4>
        <p className="text-gray-600">After configuring guardrails, use the Playground to test off-topic questions and verify the bot stays within bounds.</p>
      </div>
    ),
  },
  "tone": {
    id: "tone", title: "Tone and Personality", desc: "Make the AI sound like your brand", icon: "MessageCircle",
    content: (
      <div className="space-y-6">
        <p className="text-gray-600">Your bot's tone should match your brand voice. CircuCity AI offers preset tones and full customization.</p>
        <h4 className="font-bold text-[#0A1428]">Tone Presets</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="border border-green-200 bg-green-50/30 rounded-xl p-4">
            <h5 className="font-bold text-green-700 text-sm mb-1">Friendly</h5>
            <p className="text-gray-600 text-sm">Warm, approachable, conversational. Uses casual language. Great for lifestyle brands.</p>
            <p className="text-gray-500 text-xs mt-2 italic">"Hey! That ceramic mug is $14.99 and comes in 4 colors!"</p>
          </div>
          <div className="border border-blue-200 bg-blue-50/30 rounded-xl p-4">
            <h5 className="font-bold text-blue-700 text-sm mb-1">Professional</h5>
            <p className="text-gray-600 text-sm">Formal, precise, business-oriented. Ideal for B2B and financial services.</p>
            <p className="text-gray-500 text-xs mt-2 italic">"The ceramic mug is priced at $14.99 and available in four colors."</p>
          </div>
          <div className="border border-purple-200 bg-purple-50/30 rounded-xl p-4">
            <h5 className="font-bold text-purple-700 text-sm mb-1">Playful</h5>
            <p className="text-gray-600 text-sm">Fun, witty, energetic. Uses humor and personality. Perfect for youth brands.</p>
            <p className="text-gray-500 text-xs mt-2 italic">"Our mug is only $14.99. It's mug-nificent! Comes in 4 colors!"</p>
          </div>
          <div className="border border-rose-200 bg-rose-50/30 rounded-xl p-4">
            <h5 className="font-bold text-rose-700 text-sm mb-1">Empathetic</h5>
            <p className="text-gray-600 text-sm">Caring, understanding, supportive. Ideal for healthcare and support.</p>
            <p className="text-gray-500 text-xs mt-2 italic">"I understand you're looking for something special. Our $14.99 mug might be perfect."</p>
          </div>
        </div>
        <h4 className="font-bold text-[#0A1428]">Custom Tone Settings</h4>
        <p className="text-gray-600">In <strong>Bots &rarr; Your Bot &rarr; Tone</strong>, write a custom instruction for full control:</p>
        <div className="bg-[#0A1428] rounded-xl p-4 overflow-x-auto">
          <pre className="text-sm text-gray-300 font-mono">{`Speak like a knowledgeable store associate.\n- Use "we" and "our" to represent the brand\n- Be concise but helpful\n- Never use emojis\n- End with an open-ended question`}</pre>
        </div>
      </div>
    ),
  },
  "flows": {
    id: "flows", title: "Conversation Flows", desc: "Build automated conversation paths", icon: "Layers",
    content: (
      <div className="space-y-6">
        <p className="text-gray-600">Flows are predefined conversation paths that guide customers through multi-step interactions like order status checks or returns.</p>
        <h4 className="font-bold text-[#0A1428]">Example: Order Status Flow</h4>
        <div className="space-y-3">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">1</span>
            </div>
            <div>
              <p className="font-bold text-[#0A1428]">Trigger</p>
              <p className="text-gray-600 text-sm">Customer says "Where is my order?" or "Order status"</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">2</span>
            </div>
            <div>
              <p className="font-bold text-[#0A1428]">Ask for Order Number</p>
              <p className="text-gray-600 text-sm">Bot: "I'd be happy to help! Could you please provide your order number?"</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">3</span>
            </div>
            <div>
              <p className="font-bold text-[#0A1428]">Validate &amp; Look Up</p>
              <p className="text-gray-600 text-sm">Bot validates the order number and looks up the status in your system.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">4</span>
            </div>
            <div>
              <p className="font-bold text-[#0A1428]">Display Status</p>
              <p className="text-gray-600 text-sm">Bot shows the order status, estimated delivery, and tracking link.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">5</span>
            </div>
            <div>
              <p className="font-bold text-[#0A1428]">Offer Help</p>
              <p className="text-gray-600 text-sm">Bot asks if there's anything else it can help with.</p>
            </div>
          </div>
        </div>
        <h4 className="font-bold text-[#0A1428]">How to Create Flows</h4>
        <ol className="text-gray-600 space-y-2 ml-4 list-decimal">
          <li>Go to <strong>Bots &rarr; Your Bot &rarr; Flows</strong> in the dashboard.</li>
          <li>Click <strong>Create Flow</strong>, name it (e.g., "Order Status"), and define trigger keywords.</li>
          <li>Add steps using the visual builder. Each step can have a message, input, or API call.</li>
          <li>Set the flow to <strong>Active</strong> and test in the Playground.</li>
        </ol>
        <div className="bg-gradient-to-r from-[#A3E635]/10 to-[#A3E635]/5 border border-[#A3E635]/20 rounded-xl p-4">
          <div className="flex gap-3">
            <Sparkles className="w-5 h-5 text-[#A3E635] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-[#0A1428] text-sm">Pro Tip</h4>
              <p className="text-gray-600 text-sm">Start with 1-2 essential flows (Order Status + Return Request) before building more complex automations.</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  "web-widget": {
    id: "web-widget", title: "Web Widget", desc: "Chat bubble on your website", icon: "Globe",
    content: (
      <div className="space-y-6">
        <p className="text-gray-600">The web widget adds a chat bubble to your website for instant AI-powered customer support.</p>
        <h4 className="font-bold text-[#0A1428]">Setup</h4>
        <div className="space-y-3">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">1</span>
            </div>
            <div><p className="text-gray-600">Go to <strong>Settings &rarr; Channels &rarr; Web Widget</strong> in your dashboard.</p></div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">2</span>
            </div>
            <div><p className="text-gray-600">Configure appearance: position (left/right), theme (light/dark), primary color, greeting message.</p></div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">3</span>
            </div>
            <div><p className="text-gray-600">Copy the install snippet and paste it into your website's HTML before <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">&lt;/head&gt;</code>.</p></div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">4</span>
            </div>
            <div><p className="text-gray-600">Toggle the widget to <strong>Active</strong> and test on your live site.</p></div>
          </div>
        </div>
        <h4 className="font-bold text-[#0A1428]">Configuration Options</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-3 border border-gray-200 font-bold text-[#0A1428]">Setting</th>
                <th className="text-left p-3 border border-gray-200 font-bold text-[#0A1428]">Options</th>
                <th className="text-left p-3 border border-gray-200 font-bold text-[#0A1428]">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="p-3 border border-gray-200 font-bold">Position</td><td className="p-3 border border-gray-200">Left / Right</td><td className="p-3 border border-gray-200">Screen corner for the bubble</td></tr>
              <tr className="bg-gray-50"><td className="p-3 border border-gray-200 font-bold">Theme</td><td className="p-3 border border-gray-200">Light / Dark</td><td className="p-3 border border-gray-200">Color scheme</td></tr>
              <tr><td className="p-3 border border-gray-200 font-bold">Primary Color</td><td className="p-3 border border-gray-200">Hex color</td><td className="p-3 border border-gray-200">Custom accent color</td></tr>
              <tr className="bg-gray-50"><td className="p-3 border border-gray-200 font-bold">Greeting</td><td className="p-3 border border-gray-200">Text</td><td className="p-3 border border-gray-200">First message (e.g. "Hi! How can I help?")</td></tr>
              <tr><td className="p-3 border border-gray-200 font-bold">Auto-Open</td><td className="p-3 border border-gray-200">Seconds</td><td className="p-3 border border-gray-200">Delay before auto-open (0 = disabled)</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  "whatsapp": {
    id: "whatsapp", title: "WhatsApp Integration", desc: "Connect WhatsApp Business", icon: "MessageSquare",
    content: (
      <div className="space-y-6">
        <p className="text-gray-600">Connect WhatsApp Business so customers can reach your AI bot on WhatsApp.</p>
        <h4 className="font-bold text-[#0A1428]">Prerequisites</h4>
        <ul className="text-gray-600 space-y-1 ml-4 list-disc">
          <li>A <strong>WhatsApp Business Account</strong> approved by Meta</li>
          <li>A <strong>Meta Business Manager</strong> account</li>
          <li>Your phone number verified with WhatsApp Business</li>
        </ul>
        <h4 className="font-bold text-[#0A1428]">Setup</h4>
        <div className="space-y-3">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">1</span>
            </div>
            <div><p className="text-gray-600">Go to <strong>Settings &rarr; Channels &rarr; WhatsApp</strong> and click <strong>Connect WhatsApp</strong>.</p></div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">2</span>
            </div>
            <div><p className="text-gray-600">You'll be redirected to Meta. Log in and select your WhatsApp Business account.</p></div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">3</span>
            </div>
            <div><p className="text-gray-600">Grant permissions and you'll be redirected back to the dashboard.</p></div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">4</span>
            </div>
            <div><p className="text-gray-600">Send a test message to your WhatsApp number to confirm the integration works.</p></div>
          </div>
        </div>
        <h4 className="font-bold text-[#0A1428]">How It Works</h4>
        <p className="text-gray-600">When a customer messages your WhatsApp number, CircuCity AI processes it and sends an AI-generated response back. All conversation history is stored in your dashboard.</p>
      </div>
    ),
  },
  "messenger": {
    id: "messenger", title: "Facebook Messenger", desc: "Chat via Facebook Messenger", icon: "MessageCircle",
    content: (
      <div className="space-y-6">
        <p className="text-gray-600">Connect your Facebook Page to let customers chat with your AI bot via Messenger.</p>
        <h4 className="font-bold text-[#0A1428]">Prerequisites</h4>
        <ul className="text-gray-600 space-y-1 ml-4 list-disc">
          <li>A <strong>Facebook Page</strong> for your business</li>
          <li>Admin access to the Page</li>
          <li>A <strong>Meta Developer</strong> account (free)</li>
        </ul>
        <h4 className="font-bold text-[#0A1428]">Setup</h4>
        <div className="space-y-3">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">1</span>
            </div>
            <div><p className="text-gray-600">Go to <strong>Settings &rarr; Channels &rarr; Messenger</strong> and click <strong>Connect Messenger</strong>.</p></div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">2</span>
            </div>
            <div><p className="text-gray-600">Select your Facebook Page and authorize the CircuCity AI app.</p></div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">3</span>
            </div>
            <div><p className="text-gray-600">Configure a greeting message and response timeout.</p></div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">4</span>
            </div>
            <div><p className="text-gray-600">Send a test message to your Page from a personal Facebook account to verify.</p></div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-[#A3E635]/10 to-[#A3E635]/5 border border-[#A3E635]/20 rounded-xl p-4">
          <div className="flex gap-3">
            <Sparkles className="w-5 h-5 text-[#A3E635] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-[#0A1428] text-sm">Pro Tip</h4>
              <p className="text-gray-600 text-sm">Add the Messenger Chat Plugin to your website for a seamless experience. Customers can start on your site and continue in Messenger.</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  "instagram": {
    id: "instagram", title: "Instagram Messaging", desc: "Handle Instagram DMs with AI", icon: "MessageSquare",
    content: (
      <div className="space-y-6">
        <p className="text-gray-600">Connect your Instagram Business account to let the AI bot handle incoming direct messages.</p>
        <h4 className="font-bold text-[#0A1428]">Prerequisites</h4>
        <ul className="text-gray-600 space-y-1 ml-4 list-disc">
          <li>An <strong>Instagram Business</strong> or <strong>Creator</strong> account</li>
          <li>Account connected to a <strong>Facebook Page</strong></li>
          <li>Admin access to both Instagram and the Facebook Page</li>
        </ul>
        <h4 className="font-bold text-[#0A1428]">Setup</h4>
        <div className="space-y-3">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">1</span>
            </div>
            <div><p className="text-gray-600">Go to <strong>Settings &rarr; Channels &rarr; Instagram</strong> and click <strong>Connect Instagram</strong>.</p></div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">2</span>
            </div>
            <div><p className="text-gray-600">Log into Meta and select your Facebook Page connected to Instagram.</p></div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">3</span>
            </div>
            <div><p className="text-gray-600">Grant permissions for CircuCity AI to read and respond to messages.</p></div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">4</span>
            </div>
            <div><p className="text-gray-600">Send a test DM to your Instagram account and verify the bot responds.</p></div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
          <div className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-[#0A1428] text-sm">Note</h4>
              <p className="text-gray-600 text-sm">Instagram requires your business account to have received a message within 24 hours for the API to activate. Send yourself a test message after setup.</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  "email": {
    id: "email", title: "Email Integration", desc: "AI-powered email support", icon: "Mail",
    content: (
      <div className="space-y-6">
        <p className="text-gray-600">Route incoming support emails through your AI bot for instant automated replies.</p>
        <h4 className="font-bold text-[#0A1428]">How It Works</h4>
        <div className="space-y-3">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">1</span>
            </div>
            <div><p className="font-bold text-[#0A1428]">Customer sends email</p><p className="text-gray-600 text-sm">Email arrives at your support address.</p></div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">2</span>
            </div>
            <div><p className="font-bold text-[#0A1428]">AI processes</p><p className="text-gray-600 text-sm">CircuCity analyzes the email and searches your knowledge base.</p></div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">3</span>
            </div>
            <div><p className="font-bold text-[#0A1428]">Auto-reply sent</p><p className="text-gray-600 text-sm">If confidence &gt; 90%, bot sends a reply. Otherwise, it creates a draft for your team.</p></div>
          </div>
        </div>
        <h4 className="font-bold text-[#0A1428]">Setup</h4>
        <ol className="text-gray-600 space-y-2 ml-4 list-decimal">
          <li>Go to <strong>Settings &rarr; Channels &rarr; Email</strong>.</li>
          <li>Enter your support email or create a forwarding address.</li>
          <li>Configure email forwarding from your provider to CircuCity's inbox.</li>
          <li>Set the confidence threshold (recommended: 90%).</li>
          <li>Send a test email to verify.</li>
        </ol>
      </div>
    ),
  },
  "shopify": {
    id: "shopify", title: "Shopify Integration", desc: "Native Shopify plugin coming soon", icon: "ShoppingCart",
    content: (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-5">
          <div className="flex gap-3">
            <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-[#0A1428] text-sm">Coming Soon</h4>
              <p className="text-gray-600 text-sm">Our native Shopify plugin is in development. You'll be notified when it's available. Use the workaround below in the meantime.</p>
            </div>
          </div>
        </div>
        <h4 className="font-bold text-[#0A1428]">Workaround: CSV + Widget</h4>
        <div className="space-y-3">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">1</span>
            </div>
            <div><p className="text-gray-600">Export products from <strong>Shopify Admin &rarr; Products &rarr; Export</strong> as CSV.</p></div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">2</span>
            </div>
            <div><p className="text-gray-600">Import the CSV in CircuCity <strong>Settings &rarr; Products &rarr; Import CSV</strong>.</p></div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <span className="text-[#A3E635] font-bold text-sm">3</span>
            </div>
            <div><p className="text-gray-600">Install the web widget in your Shopify theme via <strong>Edit Code &rarr; theme.liquid</strong>.</p></div>
          </div>
        </div>
      </div>
    ),
  },
  "crm": {
    id: "crm", title: "CRM Integrations", desc: "HubSpot, Salesforce, Zoho and more", icon: "Users",
    content: (
      <div className="space-y-6">
        <p className="text-gray-600">Connect your CRM to sync customer data and conversation history for unified support.</p>
        <h4 className="font-bold text-[#0A1428]">Available Integrations</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="border border-orange-200 bg-orange-50/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-bold text-[#0A1428]">HubSpot</h5>
              <span className="text-xs bg-[#A3E635] text-[#0A1428] font-bold px-2 py-0.5 rounded-full">Available</span>
            </div>
            <p className="text-gray-600 text-sm">Sync contacts, companies, and deals. Log conversations as tickets.</p>
          </div>
          <div className="border border-blue-200 bg-blue-50/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-bold text-[#0A1428]">Salesforce</h5>
              <span className="text-xs bg-[#A3E635] text-[#0A1428] font-bold px-2 py-0.5 rounded-full">Available</span>
            </div>
            <p className="text-gray-600 text-sm">Bi-directional sync of leads, contacts, and cases.</p>
          </div>
          <div className="border border-green-200 bg-green-50/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-bold text-[#0A1428]">Zoho CRM</h5>
              <span className="text-xs bg-gray-200 text-gray-600 font-bold px-2 py-0.5 rounded-full">Coming Q3</span>
            </div>
            <p className="text-gray-600 text-sm">Sync accounts, contacts, and leads.</p>
          </div>
          <div className="border border-purple-200 bg-purple-50/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-bold text-[#0A1428]">Pipedrive</h5>
              <span className="text-xs bg-gray-200 text-gray-600 font-bold px-2 py-0.5 rounded-full">Coming Q3</span>
            </div>
            <p className="text-gray-600 text-sm">Create and update deals from conversations.</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
          <div className="flex gap-3">
            <Users className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-[#0A1428] text-sm">How to Connect</h4>
              <p className="text-gray-600 text-sm">Go to <strong>Settings &rarr; Integrations &rarr; CRM</strong>, select your CRM, and follow the OAuth flow. Contact mapping is automatic.</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  "api-reference": {
    id: "api-reference", title: "API Reference", desc: "Full REST API documentation", icon: "Terminal",
    content: (
      <div className="space-y-6">
        <p className="text-gray-600">The CircuCity AI REST API lets you programmatically manage products, conversations, and bot configuration.</p>
        <h4 className="font-bold text-[#0A1428]">Authentication</h4>
        <p className="text-gray-600">Generate an API key at <strong>Settings &rarr; Developer &rarr; API Keys</strong>. Include it in the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">Authorization</code> header.</p>
        <div className="bg-[#0A1428] rounded-xl p-4 overflow-x-auto">
          <pre className="text-sm text-gray-300 font-mono">{`curl -H "Authorization: Bearer YOUR_API_KEY" \\\n     -H "Content-Type: application/json" \\\n     https://api.circucity.ai/v1/products`}</pre>
        </div>
        <h4 className="font-bold text-[#0A1428]">Endpoints</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-3 border border-gray-200 font-bold text-[#0A1428]">Method</th>
                <th className="text-left p-3 border border-gray-200 font-bold text-[#0A1428]">Endpoint</th>
                <th className="text-left p-3 border border-gray-200 font-bold text-[#0A1428]">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="p-3 border border-gray-200"><span className="text-green-600 font-bold">GET</span></td><td className="p-3 border border-gray-200 font-mono text-xs">/v1/products</td><td className="p-3 border border-gray-200">List all products</td></tr>
              <tr className="bg-gray-50"><td className="p-3 border border-gray-200"><span className="text-green-600 font-bold">GET</span></td><td className="p-3 border border-gray-200 font-mono text-xs">/v1/products/:sku</td><td className="p-3 border border-gray-200">Get product by SKU</td></tr>
              <tr><td className="p-3 border border-gray-200"><span className="text-blue-600 font-bold">POST</span></td><td className="p-3 border border-gray-200 font-mono text-xs">/v1/products/sync</td><td className="p-3 border border-gray-200">Bulk sync products</td></tr>
              <tr className="bg-gray-50"><td className="p-3 border border-gray-200"><span className="text-blue-600 font-bold">POST</span></td><td className="p-3 border border-gray-200 font-mono text-xs">/v1/chat</td><td className="p-3 border border-gray-200">Send message to bot</td></tr>
              <tr><td className="p-3 border border-gray-200"><span className="text-green-600 font-bold">GET</span></td><td className="p-3 border border-gray-200 font-mono text-xs">/v1/conversations</td><td className="p-3 border border-gray-200">List conversations</td></tr>
            </tbody>
          </table>
        </div>
        <h4 className="font-bold text-[#0A1428]">Chat Example</h4>
        <div className="bg-[#0A1428] rounded-xl p-4 overflow-x-auto">
          <pre className="text-sm text-gray-300 font-mono">{`curl -X POST https://api.circucity.ai/v1/chat \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "bot_id": "your-bot-id",\n    "message": "What is the price of the leather wallet?",\n    "session_id": "abc123",\n    "user_id": "user_456"\n  }'\n\n# Response:\n{\n  "response": "The leather wallet is priced at $79.99.",\n  "confidence": 0.97,\n  "sources": ["product_catalog"],\n  "suggestions": ["Do you want to see it in other colors?"]\n}`}</pre>
        </div>
      </div>
    ),
  },
  "webhooks": {
    id: "webhooks", title: "Webhooks Guide", desc: "Real-time event notifications", icon: "Wifi",
    content: (
      <div className="space-y-6">
        <p className="text-gray-600">Webhooks send real-time notifications to your application when events occur in CircuCity AI.</p>
        <h4 className="font-bold text-[#0A1428]">Available Events</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-3 border border-gray-200 font-bold text-[#0A1428]">Event</th>
                <th className="text-left p-3 border border-gray-200 font-bold text-[#0A1428]">Triggered When</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="p-3 border border-gray-200 font-mono text-xs">conversation.created</td><td className="p-3 border border-gray-200">New conversation starts</td></tr>
              <tr className="bg-gray-50"><td className="p-3 border border-gray-200 font-mono text-xs">conversation.message</td><td className="p-3 border border-gray-200">Message sent or received</td></tr>
              <tr><td className="p-3 border border-gray-200 font-mono text-xs">conversation.escalated</td><td className="p-3 border border-gray-200">Escalated to human</td></tr>
              <tr className="bg-gray-50"><td className="p-3 border border-gray-200 font-mono text-xs">product.synced</td><td className="p-3 border border-gray-200">Products synced</td></tr>
              <tr><td className="p-3 border border-gray-200 font-mono text-xs">bot.status_changed</td><td className="p-3 border border-gray-200">Bot goes live/paused/offline</td></tr>
            </tbody>
          </table>
        </div>
        <h4 className="font-bold text-[#0A1428]">Signature Verification</h4>
        <p className="text-gray-600">Each webhook includes a <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">X-CircuCity-Signature</code> header. Verify it using your webhook secret.</p>
        <div className="bg-[#0A1428] rounded-xl p-4 overflow-x-auto">
          <pre className="text-sm text-gray-300 font-mono">{`const crypto = require("crypto");\nfunction verifySignature(payload, signature, secret) {\n  const hash = crypto\n    .createHmac("sha256", secret)\n    .update(JSON.stringify(payload))\n    .digest("hex");\n  return crypto.timingSafeEqual(\n    Buffer.from(hash),\n    Buffer.from(signature)\n  );\n}`}</pre>
        </div>
        <h4 className="font-bold text-[#0A1428]">Setup</h4>
        <ol className="text-gray-600 space-y-2 ml-4 list-decimal">
          <li>Go to <strong>Settings &rarr; Developer &rarr; Webhooks</strong>.</li>
          <li>Click <strong>Add Webhook</strong>, enter your HTTPS endpoint URL.</li>
          <li>Select events to subscribe to and copy the webhook secret.</li>
          <li>Click <strong>Save</strong> and send a test event to verify.</li>
        </ol>
      </div>
    ),
  },
  "widget-not-showing": {
    id: "widget-not-showing", title: "Widget Not Showing", desc: "Chat bubble does not appear", icon: "AlertTriangle",
    content: (
      <div className="space-y-6">
        <p className="text-gray-600">If the chat widget isn't appearing on your website, follow these steps in order.</p>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <span className="text-red-500 font-bold text-sm">1</span>
            </div>
            <div>
              <h4 className="font-bold text-[#0A1428]">Check Widget is Active</h4>
              <p className="text-gray-600">Go to <strong>Settings &rarr; Widget</strong> and ensure the toggle is <strong>Active</strong>. If paused or offline, the bubble won't show.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <span className="text-red-500 font-bold text-sm">2</span>
            </div>
            <div>
              <h4 className="font-bold text-[#0A1428]">Verify Snippet Placement</h4>
              <p className="text-gray-600">The snippet must be in the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">&lt;head&gt;</code> section above <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">&lt;/head&gt;</code>. Check it's not in the body.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <span className="text-red-500 font-bold text-sm">3</span>
            </div>
            <div>
              <h4 className="font-bold text-[#0A1428]">Check JavaScript Errors</h4>
              <p className="text-gray-600">Open browser Dev Console (F12) and look for JS errors. Conflicting scripts might block the widget.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <span className="text-red-500 font-bold text-sm">4</span>
            </div>
            <div>
              <h4 className="font-bold text-[#0A1428]">Clear Cache</h4>
              <p className="text-gray-600">Hard refresh (Ctrl+F5 / Cmd+Shift+R) to bypass cached files.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <span className="text-red-500 font-bold text-sm">5</span>
            </div>
            <div>
              <h4 className="font-bold text-[#0A1428]">Check Workspace ID</h4>
              <p className="text-gray-600">Verify <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">workspaceId</code> in your snippet matches dashboard settings.</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-xl p-4">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-[#0A1428] text-sm">Still Not Working?</h4>
              <p className="text-gray-600 text-sm">Test the snippet on a plain HTML page. If it works there, the issue is likely a theme conflict.</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  "ai-not-answering": {
    id: "ai-not-answering", title: "AI Not Answering Correctly", desc: "Wrong or generic responses", icon: "Bot",
    content: (
      <div className="space-y-6">
        <p className="text-gray-600">If your bot gives incorrect or generic answers, here's how to improve accuracy.</p>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <span className="text-red-500 font-bold text-sm">1</span>
            </div>
            <div>
              <h4 className="font-bold text-[#0A1428]">Upload More Data</h4>
              <p className="text-gray-600">The bot needs comprehensive knowledge base documents. Add your complete product catalog, policies, and FAQs. The more relevant data, the better the answers.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <span className="text-red-500 font-bold text-sm">2</span>
            </div>
            <div>
              <h4 className="font-bold text-[#0A1428]">Check Knowledge-Only Mode</h4>
              <p className="text-gray-600">If Knowledge-Only Mode is enabled, make sure your knowledge base covers the questions customers are asking. Review <strong>Analytics &rarr; Unanswered Questions</strong>.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <span className="text-red-500 font-bold text-sm">3</span>
            </div>
            <div>
              <h4 className="font-bold text-[#0A1428]">Improve System Prompt</h4>
              <p className="text-gray-600">Make your system prompt more specific. Include instructions on how to handle common scenarios and what information to prioritize.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <span className="text-red-500 font-bold text-sm">4</span>
            </div>
            <div>
              <h4 className="font-bold text-[#0A1428]">Review Unanswered Questions</h4>
              <p className="text-gray-600">Go to <strong>Analytics &rarr; Unanswered Questions</strong> to see what customers are asking that the bot can't answer. Add these to your knowledge base.</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  "slow-response": {
    id: "slow-response", title: "Slow Response Times", desc: "Bot takes too long to reply", icon: "Clock",
    content: (
      <div className="space-y-6">
        <p className="text-gray-600">If your bot is responding slowly, try these solutions.</p>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center shrink-0">
              <span className="text-yellow-600 font-bold text-sm">1</span>
            </div>
            <div>
              <h4 className="font-bold text-[#0A1428]">Check Your Internet Connection</h4>
              <p className="text-gray-600">Slow internet on your end can make the Playground feel sluggish. Test on a different network.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center shrink-0">
              <span className="text-yellow-600 font-bold text-sm">2</span>
            </div>
            <div>
              <h4 className="font-bold text-[#0A1428]">Reduce Knowledge Base Size</h4>
              <p className="text-gray-600">Large knowledge bases (100+ documents) can slow down response times. Split into focused documents and remove outdated content.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center shrink-0">
              <span className="text-yellow-600 font-bold text-sm">3</span>
            </div>
            <div>
              <h4 className="font-bold text-[#0A1428]">Simplify Conversation Flows</h4>
              <p className="text-gray-600">Complex flows with many steps or API calls can increase response time. Keep flows simple and direct.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center shrink-0">
              <span className="text-yellow-600 font-bold text-sm">4</span>
            </div>
            <div>
              <h4 className="font-bold text-[#0A1428]">Check System Status</h4>
              <p className="text-gray-600">Visit <a href="/status" className="text-[#A3E635] font-bold hover:underline">status.circucity.ai</a> to check if there are any ongoing incidents or degraded performance.</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  "sync-errors": {
    id: "sync-errors", title: "Product Sync Errors", desc: "Products not showing in catalog", icon: "AlertTriangle",
    content: (
      <div className="space-y-6">
        <p className="text-gray-600">If your products aren't appearing in the catalog after syncing, check these common issues.</p>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <span className="text-red-500 font-bold text-sm">1</span>
            </div>
            <div>
              <h4 className="font-bold text-[#0A1428]">Check CSV Format</h4>
              <p className="text-gray-600">Ensure your CSV uses the correct column headers: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">sku</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">name</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">price</code>. Check for encoding issues (save as UTF-8).</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <span className="text-red-500 font-bold text-sm">2</span>
            </div>
            <div>
              <h4 className="font-bold text-[#0A1428]">File Size Limit</h4>
              <p className="text-gray-600">CSV files must be under 50 MB. For larger catalogs, use the API sync method or split into multiple CSV files.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <span className="text-red-500 font-bold text-sm">3</span>
            </div>
            <div>
              <h4 className="font-bold text-[#0A1428]">API Sync Issues</h4>
              <p className="text-gray-600">Check your API key is valid and has the correct permissions. Verify the request payload format matches the API docs.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <span className="text-red-500 font-bold text-sm">4</span>
            </div>
            <div>
              <h4 className="font-bold text-[#0A1428]">Crawl Issues</h4>
              <p className="text-gray-600">Ensure your store URL is correct and accessible. Check that product pages aren't blocked by robots.txt or require login.</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  "billing-issues": {
    id: "billing-issues", title: "Billing and Plan Questions", desc: "Upgrade, downgrade, invoices", icon: "HelpCircle",
    content: (
      <div className="space-y-6">
        <p className="text-gray-600">Manage your subscription, view invoices, and update payment methods.</p>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <span className="text-blue-500 font-bold text-sm">1</span>
            </div>
            <div>
              <h4 className="font-bold text-[#0A1428]">View Your Current Plan</h4>
              <p className="text-gray-600">Go to <strong>Settings &rarr; Billing</strong> to see your current plan, usage limits, and next billing date.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <span className="text-blue-500 font-bold text-sm">2</span>
            </div>
            <div>
              <h4 className="font-bold text-[#0A1428]">Change Your Plan</h4>
              <p className="text-gray-600">Click <strong>Change Plan</strong> to upgrade or downgrade. Changes take effect immediately. Credits are prorated.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <span className="text-blue-500 font-bold text-sm">3</span>
            </div>
            <div>
              <h4 className="font-bold text-[#0A1428]">Download Invoices</h4>
              <p className="text-gray-600">All invoices are available under <strong>Settings &rarr; Billing &rarr; Invoices</strong>. You can download them as PDF.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <span className="text-blue-500 font-bold text-sm">4</span>
            </div>
            <div>
              <h4 className="font-bold text-[#0A1428]">Update Payment Method</h4>
              <p className="text-gray-600">Go to <strong>Settings &rarr; Billing &rarr; Payment Method</strong> to update your credit card or payment details.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <span className="text-blue-500 font-bold text-sm">5</span>
            </div>
            <div>
              <h4 className="font-bold text-[#0A1428]">Cancel Subscription</h4>
              <p className="text-gray-600">You can cancel anytime from <strong>Settings &rarr; Billing &rarr; Cancel Plan</strong>. Access continues until the end of your billing period.</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  "team-access": {
    id: "team-access", title: "Team and Access Issues", desc: "Inviting team, permissions, 2FA", icon: "Users",
    content: (
      <div className="space-y-6">
        <p className="text-gray-600">Manage your team members, permissions, and account security.</p>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <span className="text-blue-500 font-bold text-sm">1</span>
            </div>
            <div>
              <h4 className="font-bold text-[#0A1428]">Invite Team Members</h4>
              <p className="text-gray-600">Go to <strong>Settings &rarr; Team</strong>. Click <strong>Invite Member</strong>, enter their email, and select a role (Admin, Editor, Viewer). They'll receive an invitation email.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <span className="text-blue-500 font-bold text-sm">2</span>
            </div>
            <div>
              <h4 className="font-bold text-[#0A1428]">Manage Permissions</h4>
              <p className="text-gray-600">Admins have full access. Editors can manage bots and content. Viewers can only see analytics and conversations.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <span className="text-blue-500 font-bold text-sm">3</span>
            </div>
            <div>
              <h4 className="font-bold text-[#0A1428]">Remove Members</h4>
              <p className="text-gray-600">Go to <strong>Settings &rarr; Team</strong>, find the member, and click <strong>Remove</strong>. They lose access immediately.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <span className="text-blue-500 font-bold text-sm">4</span>
            </div>
            <div>
              <h4 className="font-bold text-[#0A1428]">Set Up Two-Factor Authentication</h4>
              <p className="text-gray-600">Go to <strong>Settings &rarr; Security &rarr; Two-Factor Auth</strong>. Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.) and enter the verification code.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <span className="text-blue-500 font-bold text-sm">5</span>
            </div>
            <div>
              <h4 className="font-bold text-[#0A1428]">Lost 2FA Device</h4>
              <p className="text-gray-600">Contact support at <a href="mailto:support@circucity.ai" className="text-[#A3E635] font-bold hover:underline">support@circucity.ai</a> to regain access. Have your account email and recovery codes ready if you saved them during setup.</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
};
const ALL_ARTICLES = Object.values(CATEGORY_ARTICLES).flat();

const ICON_MAP: Record<string, any> = {
  Zap, Code, ShoppingCart, Bot, BookOpen, Shield, MessageCircle, Layers,
  Globe, MessageSquare, Mail, Users, Terminal, Wifi, AlertTriangle,
  Clock, HelpCircle, CheckCircle, ArrowRight, ChevronRight, Search, Sparkles, Puzzle, Upload
};

export default function DocsPage() {
  const [activeCategory, setActiveCategory] = useState("getting-started");
  const [activeArticle, setActiveArticle] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash && GUIDE_CONTENT[hash]) {
      setActiveArticle(hash);
      const cat = Object.entries(CATEGORY_ARTICLES).find(([, articles]) => articles.includes(hash));
      if (cat) setActiveCategory(cat[0]);
    }
  }, []);

  useEffect(() => {
    if (activeArticle) {
      window.location.hash = activeArticle;
    }
  }, [activeArticle]);

  const currentArticles = CATEGORY_ARTICLES[activeCategory] || [];

  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return ALL_ARTICLES.filter((id) => {
      const a = GUIDE_CONTENT[id];
      return a && (a.title.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q));
    });
  }, [searchQuery]);

  const getIcon = (name: string) => ICON_MAP[name] || HelpCircle;

  const currentArticle = activeArticle ? GUIDE_CONTENT[activeArticle] : null;

  const handleArticleClick = (id: string) => {
    setActiveArticle(id);
    window.location.hash = id;
  };

  return (
    <MarketingShell>
      {/* Hero */}
      <section className="pt-28 pb-20 bg-gradient-to-b from-[#0A1428] to-[#121c3a] text-white text-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 25px 25px, #A3E635 1px, transparent 0)', backgroundSize: '50px 50px' }} />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="w-14 h-14 bg-[#A3E635]/15 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <BookOpen className="w-7 h-7 text-[#A3E635]" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-3">Help Center</h1>
          <p className="text-gray-400 max-w-xl mx-auto">Guides, references, and troubleshooting for CircuCity AI.</p>
          <div className="relative w-full max-w-lg mx-auto mt-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              className="w-full pl-10 pr-4 h-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#A3E635]/40 focus:border-transparent"
            />
          </div>
        </div>
      </section>

      {/* Search Results */}
      {searchQuery.trim() && filteredArticles ? (
        <div className="max-w-4xl mx-auto px-6 py-12">
          <p className="text-sm text-gray-500 mb-4">
            {filteredArticles.length} article{filteredArticles.length !== 1 ? "s" : ""} found
          </p>
          <div className="space-y-3">
            {filteredArticles.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500">No articles found. Try different keywords.</p>
                <button onClick={() => setSearchQuery("")} className="text-[#A3E635] font-bold mt-2 hover:underline text-sm">
                  Clear search
                </button>
              </div>
            ) : (
              filteredArticles.map((id) => {
                const a = GUIDE_CONTENT[id];
                if (!a) return null;
                const Icn = getIcon(a.icon);
                return (
                  <button
                    key={id}
                    onClick={() => { handleArticleClick(id); setSearchQuery(""); }}
                    className="w-full border rounded-xl p-5 text-left hover:border-[#A3E635]/40 hover:shadow-sm transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#A3E635]/10 flex items-center justify-center">
                        <Icn className="w-5 h-5 text-[#A3E635]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#0A1428] group-hover:text-[#A3E635] transition-colors">{a.title}</h3>
                        <p className="text-sm text-gray-500">{a.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#A3E635] shrink-0" />
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : activeArticle && currentArticle ? (
        /* Article Detail View */
        <div className="max-w-4xl mx-auto px-6 py-12">
          <button
            onClick={() => { setActiveArticle(null); window.location.hash = ""; }}
            className="text-[#A3E635] text-sm font-bold mb-6 flex items-center gap-1 hover:underline"
          >
            &larr; Back to {CATEGORIES.find((c) => c.id === activeCategory)?.label || "Help Center"}
          </button>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <h2 className="text-2xl font-bold text-[#0A1428]">{currentArticle.title}</h2>
            <p className="text-gray-500">{currentArticle.desc}</p>
            {currentArticle.content}
          </div>
        </div>
      ) : (
        <>
          {/* Category Cards */}
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
              {CATEGORIES.map((cat) => {
                const Icn = getIcon(cat.icon);
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveCategory(cat.id); setActiveArticle(null); window.location.hash = ""; }}
                    className={`relative rounded-2xl p-6 text-left border transition-all ${
                      isActive
                        ? "border-[#A3E635] ring-2 ring-[#A3E635]/20 bg-white shadow-md"
                        : "border-gray-100 bg-white hover:shadow-sm hover:border-gray-200"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-4`}>
                      <Icn className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-[#0A1428] text-lg">{cat.label}</h3>
                    <p className="text-sm text-gray-500 mt-1">{cat.desc}</p>
                    <p className="text-xs text-[#A3E635] font-bold mt-3">
                      {(CATEGORY_ARTICLES[cat.id] || []).length} articles
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Article List */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-[#0A1428] mb-4">
                {CATEGORIES.find((c) => c.id === activeCategory)?.label || ""}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentArticles.map((id) => {
                  const a = GUIDE_CONTENT[id];
                  if (!a) return null;
                  const Icn = getIcon(a.icon);
                  return (
                    <button
                      key={id}
                      onClick={() => handleArticleClick(id)}
                      className="border rounded-xl p-5 text-left hover:border-[#A3E635]/40 hover:shadow-sm transition-all group flex items-start gap-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#A3E635]/10 flex items-center justify-center shrink-0">
                        <Icn className="w-5 h-5 text-[#A3E635]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[#0A1428] group-hover:text-[#A3E635] transition-colors">{a.title}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{a.desc}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#A3E635] shrink-0 mt-1" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bottom Links */}
      <div className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-5">
          <a href="/docs/developer-guide" className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-all group flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#A3E635]/10 flex items-center justify-center shrink-0">
              <Terminal className="w-5 h-5 text-[#A3E635]" />
            </div>
            <div>
              <h4 className="font-bold text-[#0A1428] group-hover:text-[#A3E635] transition-colors">Developer Guide</h4>
              <p className="text-sm text-gray-500 mt-0.5">SDK docs, code examples and API details.</p>
            </div>
          </a>
          <a href="/community-forum" className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-all group flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h4 className="font-bold text-[#0A1428] group-hover:text-blue-500 transition-colors">Community Forum</h4>
              <p className="text-sm text-gray-500 mt-0.5">Discuss with other store owners.</p>
            </div>
          </a>
          <a href="/support" className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-all group flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-bold text-[#0A1428] group-hover:text-green-600 transition-colors">Direct Support</h4>
              <p className="text-sm text-gray-500 mt-0.5">Open a ticket &mdash; we respond within 24h.</p>
            </div>
          </a>
        </div>
      </div>
    </MarketingShell>
  );
}
