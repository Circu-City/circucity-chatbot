'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import MarketingShell from '@/components/marketing/MarketingShell';
import { ArrowRight, CheckCircle2, ShoppingCart, TrendingUp, Settings, Bot, MessageSquare, TicketCheck, Sparkles, Users, Zap } from 'lucide-react';

const steps = [
  { step: 1, icon: CheckCircle2, title: 'Create your Partner Account', desc: 'Get instant access to your referral link and lead-submit form in PartnerStack.' },
  { step: 2, icon: Users, title: 'Meet your Partner Manager', desc: 'Align on a quick launch plan tailored to your clients and services.' },
  { step: 3, icon: Settings, title: 'Complete onboarding & certify', desc: 'Get onboarded, discover advantages, and access resources to boost your commission.' },
  { step: 4, icon: TrendingUp, title: 'Register deals & scale reward', desc: 'Refer or co-sell to your clients, track progress, and earn monthly revenue share.' },
];

const deliverables = [
  { icon: Bot, title: 'AI support without compromise', desc: 'Arm your clients with a personalized AI Agent, always on brand, always ready, delivering human-like resolutions at scale.' },
  { icon: Zap, title: 'Automation built to convert', desc: 'Help clients sell more with automation: capture, qualify, recommend, and re-engage. All in one connected platform.' },
  { icon: TicketCheck, title: 'Support designed to scale', desc: 'Set clients up for scale with multichannel Help Desk, Shopify integrations, and expert playbooks that accelerate results.' },
];

const audiences = [
  { icon: ShoppingCart, text: 'You build or optimize Shopify, WordPress or custom stores' },
  { icon: Settings, text: 'You run CX, performance, or lifecycle programs for ecommerce brands' },
  { icon: TrendingUp, text: 'You deliver retainers and want predictable recurring revenue' },
  { icon: Sparkles, text: 'Your clients need AI-assisted support, live chat, and ticketing in one place' },
];

export default function AgencyPage() {
  return (
    <MarketingShell>
      <section className="py-24 px-6 bg-gradient-to-b from-[#FAFAFA] to-white text-center">
        <div className="max-w-4xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#A3E635] mb-4 block">Agency Partners</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0A1428] leading-tight mb-4">
            Get paid for the service{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A3E635] to-[#9EF01A]">your clients already trust</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-8">
            Earn up to $27,000 per referral while your clients get trustworthy AI and human support in one inbox.
          </p>
          <Link href="/partners/apply?program=agency"
            className="inline-flex items-center gap-2 bg-[#0A1428] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#1a2744] transition-all">
            Become a Partner <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <section className="py-20 bg-[#FAFAFA] px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-[#0A1428] mb-3">Why agencies choose CircuCity AI</h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">Earn revenue that grows with you, bring top-rated AI into a complete support stack, and work with a team that communicates clearly and moves fast.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div key={s.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.1 }}
                className="bg-white rounded-[20px] p-6 border border-gray-200 text-center"
              >
                <div className="w-12 h-12 bg-[#A3E635]/15 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <s.icon className="w-6 h-6 text-[#0A1428]" />
                </div>
                <span className="text-xs font-bold text-[#A3E635] block mb-2">Step {s.step}</span>
                <h3 className="font-bold text-[#0A1428] mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-extrabold text-[#0A1428] mb-12 text-center">What you can deliver to clients</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {deliverables.map((d, i) => {
              const DIcon = d.icon;
              return (
                <motion.div key={d.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.1 }}
                  className="bg-white rounded-[24px] p-8 border border-gray-200 hover:shadow-lg hover:border-[#A3E635]/30 transition-all"
                >
                  <div className="w-12 h-12 bg-[#A3E635]/15 rounded-2xl flex items-center justify-center mb-5">
                    <DIcon className="w-6 h-6 text-[#0A1428]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#0A1428] mb-3">{d.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{d.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#FAFAFA] px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-extrabold text-[#0A1428] mb-8 text-center">Who it&apos;s for</h2>
          <p className="text-gray-500 text-sm text-center mb-10 max-w-lg mx-auto">Built for agencies shipping ecommerce growth ??? digital, CX, and ecommerce agencies that want to launch AI support fast.</p>
          <div className="max-w-2xl mx-auto space-y-4">
            {audiences.map((a, i) => {
              const AIcon = a.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.2, delay: i * 0.05 }}
                  className="flex items-center gap-4 bg-white rounded-xl p-4 border border-gray-200"
                >
                  <div className="w-10 h-10 bg-[#A3E635]/15 rounded-xl flex items-center justify-center shrink-0">
                    <AIcon className="w-5 h-5 text-[#0A1428]" />
                  </div>
                  <p className="text-sm text-gray-700">{a.text}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#0A1428] relative overflow-hidden px-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#A3E635]/3 rounded-full blur-[120px]" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
            Apply in minutes and start registering leads today
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto mb-8">Get up to 25% revenue share for up to 3 years, plus tier benefits and bounty opportunities.</p>
          <Link href="/partners/apply?program=agency"
            className="bg-[#A3E635] hover:bg-[#8DC92E] text-[#0A1428] font-semibold rounded-xl h-12 px-8 text-base shadow-xl shadow-[#A3E635]/20 transition-all inline-flex items-center">
            Become a Partner <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}

