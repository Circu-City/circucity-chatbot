'use client';

import { useState } from "react";
import MarketingShell from '@/components/marketing/MarketingShell';
import { LayoutDashboard, MessageCircle, Bot, BarChart3, Brain, Globe, ShoppingCart, Puzzle, Layers, HelpCircle, Users, Monitor, CreditCard, Settings, Sparkles, AlertTriangle, CheckCircle, ChevronDown, Search, BookOpen, Shield, Clock, ArrowLeft } from "lucide-react";

const SECTIONS = [
  {
    id: "overview",
    title: "Overview (Home Page)",
    icon: "LayoutDashboard",
    desc: "The main dashboard page where you see all your stats at a glance",
    steps: [
      "When you log in, this is the first page you see.",
      "Look at the big numbers at the top — they show Conversations, Messages, Conversion Rate, and Resolution Rate.",
      "Below that, you can see your Recent Conversations list. Click any conversation to read it.",
      "Check the Store Sync Status section. If it says 'Synced', your products are up to date.",
      "Tip: Refresh this page every morning to see how your bot performed overnight.",
    ],
    problems: [
      { q: "Numbers look wrong or show 0", a: "Wait 30 seconds and refresh the page. If still wrong, check that your widget is Active in Chat Widget settings." },
      { q: "Recent conversations are empty", a: "The widget needs to be installed on your website first. Go to Quick Start Guide." },
    ],
  },
  {
    id: "conversations",
    title: "Conversations",
    icon: "MessageCircle",
    desc: "Every chat your AI has with customers",
    steps: [
      "Click Conversations in the sidebar menu.",
      "You'll see a list of all chats. New ones appear at the top.",
      "Click any conversation to read the full chat between the customer and your AI.",
      "Use the search bar at the top to find a specific conversation by customer name, email, or keyword.",
      "Click the 'Export CSV' button to download your conversations as a spreadsheet.",
      "You can add tags to conversations (like 'refund' or 'question') to organize them. Click the tag icon.",
    ],
    problems: [
      { q: "Can't see a conversation that just happened", a: "Refresh the page. Conversations update in real-time but may need a moment to appear." },
      { q: "Export is not working", a: "Try a smaller date range. If you have thousands of conversations, export in monthly batches." },
    ],
  },
  {
    id: "ai-agent",
    title: "AI Agent",
    icon: "Bot",
    desc: "Test and configure your AI assistant",
    steps: [
      "Click AI Agent in the sidebar. You'll see two tabs: Playground and Configure.",
      "Playground: Type any message to test how your AI responds. Try 'What is your return policy?' or 'Do you have this in stock?'",
      "Configure: Set your AI's personality — choose Friendly, Professional, Playful, or Empathetic.",
      "Set the Greeting Message — this is the first thing customers see when they open the chat.",
      "Add Suggested Prompts — these are buttons that appear for customers, like 'Where is my order?'",
      "Turn on Lead Capture to collect customer emails during chats.",
    ],
    problems: [
      { q: "AI gives wrong answers", a: "Upload more documents to Knowledge Base. The AI can only answer based on what you've taught it." },
      { q: "AI sounds too robotic", a: "Change the personality to 'Friendly' in Configure tab, and add emoji usage." },
      { q: "Playground won't send messages", a: "Refresh the page. If it still doesn't work, check your internet connection." },
    ],
  },
  {
    id: "analytics",
    title: "Analytics",
    icon: "BarChart3",
    desc: "See how well your AI is performing",
    steps: [
      "Click Analytics in the sidebar.",
      "Look at the stat cards: Total Messages, Conversations, Conversion Rate, Resolution Rate, Avg Response Time.",
      "Use the date picker to change the time period (7 days, 30 days, or custom range).",
      "Scroll down to see the daily chart — it shows messages per day as a bar graph.",
      "Click 'Export CSV' to download the analytics data for your records.",
    ],
    problems: [
      { q: "Analytics show 0 for everything", a: "Make sure the widget is Active and installed. Data only appears after customers start chatting." },
      { q: "Date range won't change", a: "Click the date input directly. On mobile, tap the field twice." },
    ],
  },
  {
    id: "intelligence",
    title: "Intelligence",
    icon: "Brain",
    desc: "Advanced AI analytics with 12 sub-tabs",
    steps: [
      "Click Intelligence in the sidebar.",
      "This page has 12 tabs: Summary, Product Interests, Intent Breakdown, Sentiment, Unanswered, Funnel, Recommendations, Transcripts, Events, Alerts, System, and Ask AI.",
      "Summary: Overview of everything in one place.",
      "Product Interests: See which products customers ask about most.",
      "Intent Breakdown: See WHY customers are chatting (questions, complaints, orders).",
      "Sentiment: See if customers are happy, neutral, or upset during chats.",
      "Unanswered: See questions your AI couldn't answer. Add these to Knowledge Base to make your AI smarter.",
      "Ask AI: Type a question in plain English and the AI will analyze your data for you.",
    ],
    problems: [
      { q: "Some tabs show no data", a: "You need at least 10-20 conversations before these analytics become meaningful." },
      { q: "Ask AI doesn't respond", a: "Make sure you typed a complete question. Try 'How many conversations did we have yesterday?'" },
    ],
  },
  {
    id: "chat-widget",
    title: "Chat Widget",
    icon: "Globe",
    desc: "Manage how the chat bubble looks and connects to channels",
    steps: [
      "Click Chat Widget in the sidebar under Configuration.",
      "Appearance: Change the primary color, position (bottom-right or bottom-left), bot name, and welcome message.",
      "Branding: Show or hide the CircuCity AI branding.",
      "Voice: Choose the bot's voice and language.",
      "Proactive: Turn on to make the bot send the first message after a few seconds.",
      "Auto-Open: The chat opens automatically when someone visits your site.",
      "Channels: Connect WhatsApp, Messenger, or Instagram here.",
      "Embed Code: Copy the JavaScript snippet to install on your website.",
    ],
    problems: [
      { q: "Chat bubble not showing on my site", a: "Go to Troubleshooting → Widget Not Showing for step-by-step fixes." },
      { q: "Channel connection failed", a: "Make sure you have a Facebook Business Manager account for Messenger/Instagram, or a WhatsApp Business Account for WhatsApp." },
    ],
  },
  {
    id: "catalog",
    title: "Product Catalog",
    icon: "ShoppingCart",
    desc: "Manage the products your AI knows about",
    steps: [
      "Click Product Catalog in the sidebar under Configuration.",
      "You'll see a list of all products your AI knows about.",
      "To add products: Click 'Add Product' and fill in the form (name, description, price, category).",
      "To upload many products at once: Click 'Import CSV'. Your file needs headers: id, name, description, price, category.",
      "Use the search bar to find a specific product.",
      "Check the Indexing Stats at the top to see how many products are ready for the AI to use.",
    ],
    problems: [
      { q: "Products not showing after CSV upload", a: "Check that your CSV has the required columns. Max file size is 10MB." },
      { q: "AI doesn't know about a product I added", a: "Wait 2-3 minutes for indexing. Refresh the page and check if the product shows as 'Indexed'." },
    ],
  },
  {
    id: "integrations",
    title: "Integrations",
    icon: "Puzzle",
    desc: "Connect external services to your AI",
    steps: [
      "Click Integrations in the sidebar under Configuration.",
      "Browse available integrations by category: Sales, Support, Marketing.",
      "To connect: Click the integration card, then click 'Connect'.",
      "Follow the OAuth flow — you'll be redirected to the service (like Shopify or Google) to authorize access.",
      "Once connected, the integration card shows a 'Connected' badge.",
      "To disconnect: Click the card and click 'Disconnect'.",
    ],
    problems: [
      { q: "Integration won't connect", a: "Make sure you have admin access to the external service. Try disconnecting and reconnecting." },
      { q: "Data not syncing after connecting", a: "Some integrations sync every hour. Wait 60 minutes and check again." },
    ],
  },
  {
    id: "flows",
    title: "Flows (Automations)",
    icon: "Layers",
    desc: "Create automatic conversation paths",
    steps: [
      "Click Flows in the sidebar under Configuration.",
      "Click 'Create Flow' to start building a new automation.",
      "Give your flow a name, like 'Order Status Check' or 'Return Request'.",
      "Add steps: Each step can be a Message (what the bot says), Condition (if/else logic), or Action (do something).",
      "After creating, toggle the flow to Active.",
      "Test it by typing a trigger phrase in the Playground.",
    ],
    problems: [
      { q: "Flow is not triggering", a: "Make sure the flow is set to Active. Check that the trigger conditions match what customers actually type." },
      { q: "Flow gets stuck in a loop", a: "Add a condition that limits how many times a step can repeat. Contact support if needed." },
    ],
  },
  {
    id: "unanswered",
    title: "Unanswered Questions",
    icon: "HelpCircle",
    desc: "See what your AI couldn't answer",
    steps: [
      "Click Unanswered in the sidebar under Configuration.",
      "This shows every question customers asked that your AI didn't know the answer to.",
      "Click any question and choose 'Add to FAQ' — type the correct answer and save it.",
      "You can also click 'Generate Answer' to let the AI suggest an answer based on your knowledge base.",
      "Check this page daily — each answer you add makes your AI smarter!",
    ],
    problems: [
      { q: "Same questions keep appearing", a: "When you add an answer to FAQ, make sure it's thorough. The AI needs clear, complete answers." },
      { q: "Generate Answer button is not working", a: "You need content in your Knowledge Base first. Upload documents before using auto-generate." },
    ],
  },
  {
    id: "visitors",
    title: "Live Visitors",
    icon: "Monitor",
    desc: "See who's on your website right now",
    steps: [
      "Click Live Visitors in the sidebar under Management.",
      "This shows a real-time list of everyone currently browsing your website.",
      "For each visitor, you can see: Which page they're on, their approximate location (country/city), and how long they've been browsing.",
      "If a visitor is on a page for a long time, they might need help — consider sending a proactive chat message.",
      "Note: Visitor data refreshes automatically every few seconds.",
    ],
    problems: [
      { q: "No visitors shown", a: "Make sure the widget is installed on your website. Visitors only appear if the widget script is running." },
      { q: "Location shows wrong city", a: "Location is approximate (based on IP address). It's usually accurate to the country level." },
    ],
  },
  {
    id: "monitoring",
    title: "Monitoring",
    icon: "BarChart3",
    desc: "System health and performance over time",
    steps: [
      "Click Monitoring in the sidebar under Management.",
      "This shows graphs of your system performance over the last 30 days.",
      "Check Total Conversations, Messages, and Avg Response Time.",
      "Monitor Escalation Rate — if this is high, your AI might need more training.",
      "Sentiment Trends show if customer satisfaction is going up or down.",
    ],
    problems: [
      { q: "Graphs are empty", a: "You need at least a few days of data before graphs appear." },
    ],
  },
  {
    id: "team",
    title: "Team Management",
    icon: "Users",
    desc: "Add or remove team members",
    steps: [
      "Click Team in the sidebar under Management.",
      "To add someone: Click 'Invite Member', enter their email, and choose a role (Admin or Member).",
      "Admins can change settings and manage billing. Members can view conversations and analytics.",
      "To remove someone: Find them in the list and click 'Remove'. They lose access immediately.",
      "Team members receive an email invitation to join.",
    ],
    problems: [
      { q: "Invited member didn't get the email", a: "Ask them to check their Spam folder. Resend the invitation from the Team page." },
      { q: "Can't remove a team member", a: "Only Admin roles can remove members. If you're an Admin and can't remove them, contact support." },
    ],
  },
  {
    id: "partner",
    title: "Partner Program",
    icon: "Users",
    desc: "Refer others and earn commissions",
    steps: [
      "Click Partner Program in the sidebar under Management.",
      "Overview: See your total referrals, commissions earned, and payouts.",
      "Referrals: Get your unique referral link and share it with others.",
      "Commissions: See how much you've earned from each referral.",
      "Payouts: Request payouts once you reach the minimum threshold.",
      "Settings: Update your payout preferences.",
    ],
    problems: [
      { q: "Referral link not working", a: "Copy the link again from the Referrals tab. Make sure you're sharing the full URL." },
      { q: "Commission not showing", a: "Commissions appear after the referred person makes a payment. This can take up to 48 hours." },
    ],
  },
  {
    id: "billing",
    title: "Billing and Plans",
    icon: "CreditCard",
    desc: "Manage your subscription and payments",
    steps: [
      "Click Billing & Plans in the sidebar under Management.",
      "View your current plan and usage stats at the top.",
      "To change plans: Click 'Change Plan' and select Free, Starter, Growth, or Enterprise.",
      "To see past invoices: Click 'Invoices' to view and download all billing history.",
      "To update payment method: Click 'Payment Method' to add or change your credit card.",
      "Stuck on Free plan? Upgrade to Starter to unlock more features and higher message limits.",
    ],
    problems: [
      { q: "Card is being declined", a: "Check that your card details are correct and has sufficient funds. Try a different card." },
      { q: "I was charged but plan didn't upgrade", a: "Wait 5 minutes and refresh. If still not upgraded, contact support with the payment receipt." },
      { q: "How to cancel?", a: "Go to Billing → Cancel. Your account stays active until the end of the billing period." },
    ],
  },
  {
    id: "settings",
    title: "Settings",
    icon: "Settings",
    desc: "Profile, business info, API keys, and more",
    steps: [
      "Click Settings in the sidebar under Management.",
      "Profile: Change your name, email, and industry.",
      "Business Profile: Update your business name, about section, contact info, and operating hours.",
      "Website Source: Configure website crawling. Click 'Start Crawl' to let the AI scan your site.",
      "Knowledge Sources: Add FAQs (questions + answers) and upload documents directly.",
      "AI Settings: Fine-tune personality, greeting, prompts, sales rules, and lead capture.",
      "API Access: Generate or reset your API key for programmatic access. Keep this key secret!",
      "Notifications: Choose which alerts you want to receive by email.",
    ],
    problems: [
      { q: "Can't save settings", a: "Make sure all required fields are filled (marked with *). Try refreshing and saving again." },
      { q: "Forgot my API key", a: "Go to Settings → API Access and click 'Regenerate' to get a new key. The old one will stop working." },
      { q: "Crawl not finding pages", a: "Make sure your website is accessible (not behind a login page). The crawler needs to reach your pages." },
    ],
  },
  {
    id: "docs",
    title: "Docs (In-App Help)",
    icon: "BookOpen",
    desc: "Built-in documentation and guides",
    steps: [
      "Click Docs in the sidebar under Management.",
      "This opens a built-in browser of help articles — the same ones you're reading now!",
      "Browse by category or use the search bar to find specific topics.",
      "Articles cover: Getting Started, Installation, Integrations, Best Practices, Troubleshooting, and API Reference.",
    ],
    problems: [
      { q: "Can't find what I'm looking for", a: "Try different keywords in search. If still stuck, open a support ticket from the Support page." },
    ],
  },
  {
    id: "general-tips",
    title: "General Tips for Everyone",
    icon: "Sparkles",
    desc: "Things every CircuCity AI user should know",
    steps: [
      "Refresh the page if something looks wrong — it fixes most issues.",
      "Check your internet connection if pages load slowly.",
      "Use the search bar in Conversations to find specific chats.",
      "Check Unanswered Questions daily — every answer you add makes your AI smarter.",
      "Upload your return policy and shipping info to Knowledge Base first — they're the most common questions.",
      "If something breaks, check this guide first, then contact support.",
      "Keep your API key secret — never share it or post it online.",
      "Check Billing regularly to avoid unexpected charges.",
    ],
    problems: [
      { q: "Page is stuck loading", a: "Refresh (F5 or Ctrl+R). If it keeps happening, clear your browser cache (Ctrl+Shift+Delete)." },
      { q: "Something is broken and I can't fix it", a: "Go to Support page and submit a ticket. Include your workspace ID and describe what happened." },
      { q: "I want to suggest a feature", a: "Post in the Community Forum! Other users can vote on your idea." },
    ],
  },
];

const ICON_MAP: Record<string, any> = {
  LayoutDashboard, MessageCircle, Bot, BarChart3, Brain, Globe,
  ShoppingCart, Puzzle, Layers, HelpCircle, Users, Monitor,
  CreditCard, Settings, Sparkles, Search, BookOpen,
  Shield, Clock, AlertTriangle, CheckCircle, ChevronDown, ArrowLeft
};

export default function DashboardGuidePage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedProblems, setExpandedProblems] = useState<Record<string, boolean>>({});

  const getIcon = (name: string) => ICON_MAP[name] || HelpCircle;

  const filteredSections = SECTIONS.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q) || s.steps.some(st => st.toLowerCase().includes(q));
  });

  const activeData = SECTIONS.find(s => s.id === activeSection);

  return (
    <MarketingShell>
      {/* Hero */}
      <section className="pt-28 pb-20 bg-gradient-to-b from-[#0A1428] to-[#121c3a] text-white text-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 25px 25px, #A3E635 1px, transparent 0)', backgroundSize: '50px 50px' }} />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="w-14 h-14 bg-[#A3E635]/15 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <LayoutDashboard className="w-7 h-7 text-[#A3E635]" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-3">Dashboard Guide</h1>
          <p className="text-gray-400 max-w-xl mx-auto">Everything in your dashboard, explained simply. Click any section below to learn how to use it and fix common problems.</p>
          <div className="relative w-full max-w-lg mx-auto mt-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dashboard sections..."
              className="w-full pl-10 pr-4 h-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#A3E635]/40 focus:border-transparent"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        {activeSection && activeData ? (
          <button onClick={() => setActiveSection(null)} className="text-[#A3E635] text-sm font-bold mb-6 flex items-center gap-1 hover:underline">
            ← Back to all sections
          </button>
        ) : null}

        {activeSection && activeData ? (
          /* Section Detail View */
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#A3E635]/10 flex items-center justify-center">
                {(() => { const Icn = getIcon(activeData.icon); return <Icn className="w-7 h-7 text-[#A3E635]" />; })()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#0A1428]">{activeData.title}</h1>
                <p className="text-gray-500">{activeData.desc}</p>
              </div>
            </div>

            {/* Steps */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-[#0A1428] text-lg mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#A3E635]" />
                How to use this section
              </h2>
              <ol className="space-y-3">
                {activeData.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-700">
                    <span className="w-6 h-6 rounded-full bg-[#A3E635]/20 text-[#A3E635] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Common Problems */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-[#0A1428] text-lg mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Common Problems and Fixes
              </h2>
              <div className="space-y-3">
                {activeData.problems.map((p, i) => {
                  const key = activeSection + '-' + i;
                  const isOpen = expandedProblems[key];
                  return (
                    <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedProblems(prev => ({ ...prev, [key]: !prev[key] }))}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-all"
                      >
                        <span className="font-medium text-sm text-[#0A1428]">{p.q}</span>
                        <ChevronDown className={'w-4 h-4 text-gray-400 transition-transform ' + (isOpen ? 'rotate-180' : '')} />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4">
                          <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{p.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Section Grid */
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-6">
              {searchQuery.trim() ? `${filteredSections.length} section${filteredSections.length !== 1 ? 's' : ''} found` : `${SECTIONS.length} dashboard sections — click any one to learn more`}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSections.map(s => {
                const Icn = getIcon(s.icon);
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left hover:border-[#A3E635]/30 hover:shadow-md transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#A3E635]/10 flex items-center justify-center mb-3">
                      <Icn className="w-5 h-5 text-[#A3E635]" />
                    </div>
                    <h3 className="font-bold text-[#0A1428] group-hover:text-[#A3E635] transition-colors">{s.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 mb-3">{s.desc}</p>
                    <div className="flex items-center gap-2 text-xs text-[#A3E635] font-bold">
                      <span>{s.steps.length} steps</span>
                      <span className="text-gray-300">&middot;</span>
                      <span>{s.problems.length} fixes</span>
                    </div>
                  </button>
                );
              })}
            </div>
            {filteredSections.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-500">No sections found for &ldquo;{searchQuery}&rdquo;</p>
                <button onClick={() => setSearchQuery('')} className="text-[#A3E635] font-bold mt-2 hover:underline text-sm">Clear search</button>
              </div>
            )}
          </div>
        )}
      </div>
    </MarketingShell>
  );
}
