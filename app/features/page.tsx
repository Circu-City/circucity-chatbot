'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import MarketingShell from '@/components/marketing/MarketingShell';
import {
  Bot, MessageSquare, TicketCheck, Workflow, Globe, BarChart3, Palette,
  Smartphone, ArrowRight, ShieldCheck, ChevronRight
} from 'lucide-react';

const categories = [
  { id: 'ai-agent', label: 'AI Agent', icon: 'Bot' },
  { id: 'live-chat', label: 'Live Chat', icon: 'MessageSquare' },
  { id: 'ticketing', label: 'Ticketing', icon: 'TicketCheck' },
  { id: 'flows', label: 'Flows', icon: 'Workflow' },
  { id: 'channels', label: 'Channels', icon: 'Globe' },
  { id: 'analytics', label: 'Analytics', icon: 'BarChart3' },
  { id: 'customization', label: 'Customization', icon: 'Palette' },
];

const iconMap: Record<string, any> = {
  Bot, MessageSquare, TicketCheck, Workflow, Globe, BarChart3, Palette, Smartphone
};

const features = [
  {
    category: 'ai-agent',
    title: 'AI Agent',
    subtitle: 'Answer customer questions automatically with AI',
    description: 'Reclaim up to 67% of your team\'s time by letting AI handle common questions. Trained on your product catalog, support docs, and policies.',
    items: [
      'Smart Actions — AI performs tasks like order updates & lead qualification',
      'Product recommendations — pulls real-time catalog data',
      'AI-driven email resolutions — scans and solves common problems',
      'Multi-language support — English, Spanish, French, Portuguese, German',
      'Multichannel — works on live chat, WhatsApp, Instagram, Messenger',
      'Smart redirections — escalates to humans when needed',
      'Playground — test responses and update knowledge base instantly',
      'Custom name & branding',
    ],
  },
  {
    category: 'live-chat',
    title: 'Live Chat',
    subtitle: 'Real-time conversations that convert',
    description: 'Offer instant support through a lightweight widget. See what visitors type before they send it and manage everything from one inbox.',
    items: [
      'Live typing preview — see what customers are typing in real-time',
      'Macros — save and reuse common replies',
      'AI Reply Assistant — GPT-4 powered response suggestions',
      'Pre-chat survey — collect contact data before the chat starts',
      'File & image attachments',
      'Tags and contact properties',
      'Customer satisfaction surveys — collect CSAT scores',
      'Operating hours & offline messages',
      'Live visitor list — see who is on your site right now',
    ],
  },
  {
    category: 'ticketing',
    title: 'Ticketing (Help Desk)',
    subtitle: 'Organized support at scale',
    description: 'Turn chats and emails into tickets. Assign priorities, track ownership, and automate repetitive actions.',
    items: [
      'Create tickets from chats and emails',
      'Workflows — auto-close, auto-reply, spam management',
      'Tags, priorities, and custom filters',
      'Track operator tickets — oversee your team',
      'Tickets history — full audit trail',
      'Switch ownership between agents',
      'Smart views — analyze topics',
    ],
  },
  {
    category: 'flows',
    title: 'Flows (Automation)',
    subtitle: 'No-code automation that converts',
    description: 'Build visual automation paths that trigger on page visits, exit intent, and scroll depth. 40+ pre-built e-commerce templates.',
    items: [
      'Visual automation builder — no coding required',
      '40+ e-commerce templates — plug-and-play',
      'Abandoned cart recovery — send discounts automatically',
      'Scroll percentage & mobile-specific triggers',
      'Data collection — capture leads automatically',
      'Post-communication surveys',
      'Transfer to operator — escalate seamlessly',
    ],
  },
  {
    category: 'channels',
    icon: 'Globe',
    title: 'Communication Channels',
    subtitle: 'All your channels in one inbox',
    description: 'Handle live chat, email, Instagram, Messenger, and WhatsApp from a single dashboard.',
    items: [
      'Live Chat — website widget',
      'Email — connect multiple inboxes',
      'Instagram — DMs, mentions, story replies',
      'Messenger (Meta) — Facebook messages',
      'WhatsApp — instant 24/7 support',
    ],
  },
  {
    category: 'analytics',
    title: 'Analytics & Insights',
    subtitle: 'Understand your support performance',
    description: 'Track conversations, operator performance, channel effectiveness, and revenue impact.',
    items: [
      'Sales attribution — revenue from chat',
      'Conversation metrics — response time, resolution time',
      'Operator performance — individual and team stats',
      'Channel performance — compare channels',
      'Flows performance — conversion & engagement',
      'CSAT tracking — customer satisfaction scores',
    ],
  },
  {
    category: 'customization',
    title: 'Customization',
    subtitle: 'Make the widget yours',
    description: 'Match your brand with customizable colors, positions, visibility rules, and welcome screens.',
    items: [
      'Widget color & profile picture',
      'Widget position — left or right',
      'Remove branding — white-label option',
      'Chat visibility — per device and per page',
      'Offline visibility — based on working hours',
      'Welcome screen — custom greeting',
      'Multi-language widget',
    ],
  },
];

export default function FeaturesPage() {
  const [activeCategory, setActiveCategory] = useState('ai-agent');

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && categories.some(c => c.id === hash)) {
      setActiveCategory(hash);
    }
  }, []);

  useEffect(() => {
    window.location.hash = activeCategory;
  }, [activeCategory]);

  const activeFeature = features.find(f => f.category === activeCategory) || features[0];
  const ActiveIcon = iconMap[activeFeature.category] || Bot;

  return (
    <MarketingShell>
      <section className="py-24 px-6 bg-gradient-to-b from-[#FAFAFA] to-white text-center">
        <div className="max-w-4xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#A3E635] mb-4 block">Everything you need</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0A1428] leading-tight mb-4">
            All the tools to run{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A3E635] to-[#9EF01A]">world-class support</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            AI-powered chatbot, live chat, ticketing, automation flows, analytics, and integrations.
          </p>
        </div>
      </section>

      <section className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 overflow-x-auto">
          <div className="flex gap-1 py-3 ">
            {categories.map((cat) => {
              const CatIcon = iconMap[cat.icon];
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#0A1428] text-white shadow-lg'
                      : 'text-gray-500 hover:text-[#0A1428] hover:bg-gray-100'
                  }`}
                >
                  <CatIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid lg:grid-cols-2 gap-12 items-start"
          >
            <div>
              <div className="w-12 h-12 bg-[#A3E635]/20 rounded-2xl flex items-center justify-center mb-6">
                <ActiveIcon className="w-6 h-6 text-[#0A1428]" />
              </div>
              <h2 className="text-3xl font-extrabold text-[#0A1428] mb-2">{activeFeature.title}</h2>
              <p className="text-lg text-[#A3E635] font-semibold mb-4">{activeFeature.subtitle}</p>
              <p className="text-gray-500 leading-relaxed mb-8">{activeFeature.description}</p>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 bg-[#0A1428] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#1a2744] transition-all"
              >
                Start free trial
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-[#FAFAFA] rounded-[24px] p-8 border border-gray-100">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6">Includes</h3>
              <ul className="space-y-4">
                {activeFeature.items.map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    className="flex items-start gap-3"
                  >
                    <ShieldCheck className="w-5 h-5 text-[#A3E635] shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-[#FAFAFA] border-t border-gray-100 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-[#0A1428] mb-3">Explore all features</h2>
            <p className="text-gray-500 text-sm">Click any category above to dive deep.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => {
              const FIcn = iconMap[f.category] || Bot;
              const pageMap: Record<string, string> = {
                'ai-agent': '/ai-agent',
                'live-chat': '/live-chat',
                'ticketing': '/help-desk',
                'flows': '/features#flows',
                'channels': '/features#channels',
                'analytics': '/features#analytics',
                'customization': '/features#customization',
              };
              const href = pageMap[f.category] || `/features#${f.category}`;
              return (
                <Link key={f.category} href={href}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="bg-white rounded-[20px] p-6 border border-gray-200 hover:shadow-lg hover:border-[#A3E635]/30 transition-all cursor-pointer h-full"
                  >
                    <div className="w-10 h-10 bg-[#A3E635]/15 rounded-xl flex items-center justify-center mb-4">
                      <FIcn className="w-5 h-5 text-[#0A1428]" />
                    </div>
                    <h3 className="font-bold text-[#0A1428] mb-2">{f.title}</h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{f.subtitle}</p>
                    <span className="text-xs text-[#A3E635] font-semibold flex items-center gap-1">
                      Learn more <ChevronRight className="w-3 h-3" />
                    </span>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#0A1428] relative overflow-hidden px-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#A3E635]/3 rounded-full blur-[120px]" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
            Ready to transform your support?
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto mb-8">
            Join 300,000+ businesses using CircuCity AI. Start free, no credit card needed.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="bg-[#A3E635] hover:bg-[#8DC92E] text-[#0A1428] font-semibold rounded-xl h-12 px-8 text-base shadow-xl shadow-[#A3E635]/20 transition-all inline-flex items-center"
            >
              Start free trial
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="border border-white/20 text-white hover:bg-white/10 rounded-xl h-12 px-8 text-base inline-flex items-center transition-all"
            >
              Talk to sales
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
