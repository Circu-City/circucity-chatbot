'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import MarketingShell from '@/components/marketing/MarketingShell';
import {
  ArrowRight, Bot, Sparkles, ShieldCheck, Globe, MessageSquare,
  BarChart3, Clock, Users, Zap, Layers, Search, RefreshCw
} from 'lucide-react';

const benefits = [
  { icon: Clock, title: '24/7 instant responses', desc: 'Answer customers any time, day or night, in under 2 seconds.' },
  { icon: BarChart3, title: '67% auto-resolution rate', desc: 'Resolve most common questions without human intervention.' },
  { icon: Globe, title: 'Multi-language support', desc: 'Respond in English, Spanish, French, Portuguese, German and more.' },
  { icon: Users, title: 'Human handoff when needed', desc: 'Seamlessly transfer complex issues to your team.' },
  { icon: Layers, title: 'Trained on your data', desc: 'Uses your product catalog, support docs, and policies for accurate answers.' },
  { icon: RefreshCw, title: 'Real-time knowledge updates', desc: 'Update the AI knowledge base instantly — no retraining needed.' },
];

const capabilities = [
  'Smart Actions — AI performs tasks like order updates, refunds, and lead qualification',
  'Product recommendations — real-time catalog integration for accurate suggestions',
  'AI-driven email resolutions — scans incoming emails and solves common problems',
  'Playground — test and iterate on AI responses before going live',
  'Missed questions report — see exactly what the AI couldn\'t answer',
  'Conversation control — jump in and take over any conversation in real-time',
  'Custom name & branding — make the AI feel like part of your team',
  'Multichannel — works across live chat, WhatsApp, Instagram, and Messenger',
];

export default function AIAgentPage() {
  return (
    <MarketingShell>
      <section className="py-24 px-6 bg-gradient-to-b from-[#0A1428] to-[#0F1D3A] text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#A3E635]/5 rounded-full blur-[150px]" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="w-16 h-16 bg-[#A3E635]/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Bot className="w-8 h-8 text-[#A3E635]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#A3E635] mb-4 block">AI Agent</span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
              Hire AI to handle{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A3E635] to-[#9EF01A]">customer support</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
              CircuCity AI Agent answers customer questions automatically — trained on your product catalog, support docs, and policies. Works across live chat, WhatsApp, Instagram, and Messenger.
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
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-[#0A1428] mb-3">Why use an AI Agent?</h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">Cut response time from hours to seconds while maintaining quality.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="bg-[#FAFAFA] rounded-[20px] p-6 border border-gray-100"
                >
                  <div className="w-10 h-10 bg-[#A3E635]/15 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#0A1428]" />
                  </div>
                  <h3 className="font-bold text-[#0A1428] mb-2">{b.title}</h3>
                  <p className="text-sm text-gray-500">{b.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#FAFAFA] border-t border-gray-100 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-[#0A1428] mb-4">Capabilities</h2>
              <p className="text-gray-500 mb-8">CircuCity AI Agent isn\'t just a chatbot — it\'s a proactive support assistant that takes action.</p>
              <ul className="space-y-4">
                {capabilities.map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    className="flex items-start gap-3"
                  >
                    <ShieldCheck className="w-5 h-5 text-[#A3E635] shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-[24px] p-8 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#A3E635] rounded-xl flex items-center justify-center">
                  <Bot className="w-5 h-5 text-[#0A1428]" />
                </div>
                <div>
                  <p className="font-bold text-[#0A1428] text-sm">CircuCity AI</p>
                  <p className="text-xs text-gray-400">Online</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm p-4 max-w-[85%]">
                  <p className="text-sm text-gray-700">Hey! Do you have this blue sweater in size large?</p>
                </div>
                <div className="bg-[#A3E635]/10 rounded-2xl rounded-tr-sm p-4 max-w-[85%] ml-auto">
                  <p className="text-sm text-[#0A1428]">Hi! Yes, the Blue Heritage Sweater is available in size large. It's $89 and in stock. Want me to check the estimated delivery date?</p>
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm p-4 max-w-[85%]">
                  <p className="text-sm text-gray-700">Yes please! Also, can you apply the promo code WELCOME10?</p>
                </div>
                <div className="bg-[#A3E635]/10 rounded-2xl rounded-tr-sm p-4 max-w-[85%] ml-auto">
                  <p className="text-sm text-[#0A1428]">Done! Promo applied — that\'s $80.10 with free shipping. Delivery estimate is 3-5 business days. Shall I add it to your cart?</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="bg-[#0A1428] text-white rounded-[24px] p-8 lg:col-span-2">
              <h3 className="text-2xl font-extrabold mb-2">Real results</h3>
              <p className="text-gray-400 mb-6">Businesses using CircuCity AI Agent see measurable improvements.</p>
              <div className="grid grid-cols-3 gap-6">
                {[
                  { value: '73%', label: 'Auto-resolution rate' },
                  { value: '< 2s', label: 'Avg response time' },
                  { value: '67%', label: 'Team time saved' },
                ].map((s, i) => (
                  <div key={i}>
                    <p className="text-3xl font-extrabold text-[#A3E635]">{s.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#FAFAFA] rounded-[24px] p-8 border border-gray-100">
              <Sparkles className="w-8 h-8 text-[#A3E635] mb-4" />
              <h3 className="font-bold text-[#0A1428] mb-2">Quick setup</h3>
              <p className="text-sm text-gray-500 mb-4">Get your AI agent up and running in less than 2 minutes. Share links to your support content and you\'re live.</p>
              <Link
                href="/sign-up"
                className="text-sm text-[#A3E635] font-semibold flex items-center gap-1"
              >
                Try it now <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#0A1428] relative overflow-hidden px-6">
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <Bot className="w-12 h-12 text-[#A3E635] mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
            Ready to automate your support?
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto mb-8">
            Start free — no credit card required. Your AI agent will be live in under 2 minutes.
          </p>
          <Link
            href="/sign-up"
            className="bg-[#A3E635] hover:bg-[#8DC92E] text-[#0A1428] font-semibold rounded-xl h-12 px-8 text-base shadow-xl shadow-[#A3E635]/20 transition-all inline-flex items-center"
          >
            Start free trial
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
