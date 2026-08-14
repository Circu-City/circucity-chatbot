'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import MarketingShell from '@/components/marketing/MarketingShell';
import {
  ArrowRight, MessageSquare, Clock, Users, Globe, BarChart3,
  Zap, ShieldCheck, Keyboard, Eye, Video, Smartphone, Bot, ExternalLink
} from "lucide-react";

const features = [
  { icon: Keyboard, title: 'Live typing preview', desc: 'See what customers type before they hit send. Prepare answers in real-time.' },
  { icon: Eye, title: 'Live visitor list', desc: 'See every visitor on your site and which pages they\'re browsing.' },
  { icon: Video, title: 'Video calls', desc: 'Start a video call inside the widget to close deals faster.' },
  { icon: Clock, title: 'Canned responses (Macros)', desc: 'Save and reuse common replies to speed up response times.' },
  { icon: Users, title: 'Automatic chat assignment', desc: 'Route chats to the right operator based on skill and availability.' },
  { icon: Globe, title: 'Multi-language widget', desc: 'Support customers in their preferred language automatically.' },
  { icon: BarChart3, title: 'CSAT surveys', desc: 'Collect satisfaction scores after every conversation.' },
  { icon: Smartphone, title: 'Mobile responsive', desc: 'Fully responsive widget that works on all devices.' },
];

const steps = [
  { num: '01', title: 'Create your account', desc: 'Sign up free in under 60 seconds. No credit card required.' },
  { num: '02', title: 'Install the widget', desc: 'Add our script to your site via Shopify, WordPress, or a simple code snippet.' },
  { num: '03', title: 'Customize & go live', desc: 'Set your brand colors, welcome message, and operating hours. Done.' },
];

export default function LiveChatPage() {
  return (
    <MarketingShell>
      <section className="py-24 px-6 bg-gradient-to-b from-[#FAFAFA] to-white text-center">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="w-16 h-16 bg-[#A3E635]/15 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-8 h-8 text-[#A3E635]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#A3E635] mb-4 block">Live Chat</span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0A1428] leading-tight mb-4">
              Real-time conversations{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A3E635] to-[#9EF01A]">that convert</span>
            </h1>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-8">
              Build lasting customer relationships with intuitive live chat. See what visitors type before they send, respond with AI-assisted replies, and manage everything from one inbox.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/sign-up"
                className="bg-[#A3E635] hover:bg-[#8DC92E] text-[#0A1428] font-semibold rounded-xl h-12 px-8 text-base shadow-xl shadow-[#A3E635]/20 transition-all inline-flex items-center"
              >
                Start for free
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="border border-gray-300 text-[#0A1428] hover:bg-gray-50 rounded-xl h-12 px-8 text-base inline-flex items-center transition-all"
              >
                Talk to sales
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-[#0A1428] mb-3">Everything you need for live chat</h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">Features designed to help you sell more and support better.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="bg-[#FAFAFA] rounded-[20px] p-6 border border-gray-100"
                >
                  <div className="w-10 h-10 bg-[#A3E635]/15 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#0A1428]" />
                  </div>
                  <h3 className="font-bold text-[#0A1428] text-sm mb-1">{f.title}</h3>
                  <p className="text-xs text-gray-500">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───── WIDGET PREVIEW URL INPUT ───── */}
      <section className="py-16 px-6 bg-gradient-to-b from-[#FAFAFA] to-white text-center border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold text-[#0A1428] mb-3">See it live on your website</h2>
          <p className="text-gray-500 text-sm mb-8">Enter your website URL to preview the widget on your actual site.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const url = (e.target as HTMLFormElement).url.value;
              if (url) window.location.href = '/widget-preview?url=' + encodeURIComponent(url);
            }}
            className="flex flex-col sm:flex-row items-center gap-3 max-w-xl mx-auto"
          >
            <div className="flex-1 w-full">
              <input
                type="url"
                name="url"
                placeholder="https://yourstore.com"
                required
                className="w-full h-12 px-5 text-sm border border-gray-300 rounded-xl outline-none focus:border-[#A3E635] focus:ring-2 focus:ring-[#A3E635]/20 transition-all"
              />
            </div>
            <button
              type="submit"
              className="bg-[#0A1428] hover:bg-[#1a2744] text-white font-semibold rounded-xl h-12 px-8 text-sm transition-all whitespace-nowrap w-full sm:w-auto flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Show preview
            </button>
          </form>
        </div>
      </section>

      <section className="py-20 bg-[#FAFAFA] border-t border-gray-100 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-white rounded-[24px] p-6 border border-gray-200 shadow-sm max-w-md">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="text-xs text-gray-400 ml-2">circucity.com</span>
                </div>
                <div className="bg-gray-100 rounded-2xl p-4 mb-3 max-w-[80%]">
                  <p className="text-sm text-gray-700">Hi! I\'m looking at the running shoes in your store. Do you have them in size 11?</p>
                  <p className="text-xs text-gray-400 mt-1">typing...</p>
                </div>
                <div className="bg-[#A3E635]/10 rounded-2xl p-4 max-w-[80%] ml-auto">
                  <p className="text-sm text-[#0A1428]">Great choice! Yes, the AirStride Pro is available in size 11. Shall I check stock?</p>
                </div>
                <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
                  <Bot className="w-3 h-3" />
                  <span>AI Reply Assistant suggests: &quot;Would you like to see them in blue or black?&quot;</span>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-extrabold text-[#0A1428] mb-4">The truly live experience</h2>
              <p className="text-gray-500 mb-6">No waiting. No awkward pauses. Real-time conversations with live typing preview, video calls, and instant responses.</p>
              <ul className="space-y-3">
                {[
                  'Live typing preview — see what visitors type before they send',
                  'AI Reply Assistant — GPT-4 powered response suggestions',
                  'Video calls — face-to-face when it matters most',
                  'Real-time visitors — see who is on your site and what they\'re browsing',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-[#A3E635] shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-[#0A1428] mb-3">Get started in 3 steps</h2>
            <p className="text-gray-500 text-sm">From zero to live chat in under 5 minutes.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-[#A3E635]/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-extrabold text-[#A3E635]">{s.num}</span>
                </div>
                <h3 className="font-bold text-[#0A1428] mb-1">{s.title}</h3>
                <p className="text-xs text-gray-500">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#0A1428] relative overflow-hidden px-6">
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <MessageSquare className="w-12 h-12 text-[#A3E635] mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
            Start chatting with your customers today
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto mb-8">
            Free plan includes 50 conversations/month. Upgrade anytime as you grow.
          </p>
          <Link
            href="/sign-up"
            className="bg-[#A3E635] hover:bg-[#8DC92E] text-[#0A1428] font-semibold rounded-xl h-12 px-8 text-base shadow-xl shadow-[#A3E635]/20 transition-all inline-flex items-center"
          >
            Start for free
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
