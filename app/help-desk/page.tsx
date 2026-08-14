'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import MarketingShell from '@/components/marketing/MarketingShell';
import {
  ArrowRight, TicketCheck, Workflow, Tag, Flag as PriorityIcon,
  History, ArrowLeftRight as SwitchIcon, Filter, Shield, Bot
} from 'lucide-react';

const features = [
  { icon: TicketCheck, title: 'Ticket creation', desc: 'Turn any chat or email into a trackable ticket automatically.' },
  { icon: Workflow, title: 'Automated workflows', desc: 'Auto-close stale tickets, send follow-ups, and organize inbox.' },
  { icon: Tag, title: 'Tags & priorities', desc: 'Organize tickets by topic, urgency, and customer type.' },
  { icon: PriorityIcon, title: 'Priority levels', desc: 'Set urgency flags so nothing critical slips through.' },
  { icon: History, title: 'Full ticket history', desc: 'Complete audit trail of every interaction with a customer.' },
  { icon: SwitchIcon, title: 'Ownership switching', desc: 'Reassign tickets between agents with full context.' },
  { icon: Filter, title: 'Advanced filtering', desc: 'Custom filters and smart views for managing queue.' },
  { icon: Shield, title: 'Spam management', desc: 'Auto-detect and quarantine spam messages.' },
];

export default function HelpDeskPage() {
  return (
    <MarketingShell>
      <section className="py-24 px-6 bg-gradient-to-b from-[#FAFAFA] to-white text-center">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="w-16 h-16 bg-[#A3E635]/15 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <TicketCheck className="w-8 h-8 text-[#A3E635]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#A3E635] mb-4 block">Help Desk</span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0A1428] leading-tight mb-4">
              Organized support{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A3E635] to-[#9EF01A]">at scale</span>
            </h1>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-8">
              Turn every customer inquiry into a trackable ticket. Assign, prioritize, automate — all from one inbox.
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
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

      <section className="py-20 bg-[#FAFAFA] border-t border-gray-100 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-[#0A1428] mb-3">How ticketing works</h2>
            <p className="text-gray-500 text-sm">From first message to resolution — all in one place.</p>
          </div>
          <div className="space-y-6">
            {[
              { step: '1', title: 'Customer sends a message', desc: 'Whether via live chat, email, or social media — it creates a ticket automatically.' },
              { step: '2', title: 'Ticket is categorized & assigned', desc: 'AI tags the ticket by topic and urgency. Routes to the right agent or queue.' },
              { step: '3', title: 'Agent responds with full context', desc: 'See the full customer history, past tickets, and order details alongside the conversation.' },
              { step: '4', title: 'Automated follow-ups', desc: 'Workflows trigger follow-up emails, satisfaction surveys, and close resolved tickets.' },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                className="flex items-start gap-6 bg-white rounded-[20px] p-6 border border-gray-200"
              >
                <div className="w-10 h-10 bg-[#A3E635]/15 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-lg font-extrabold text-[#A3E635]">{s.step}</span>
                </div>
                <div>
                  <h3 className="font-bold text-[#0A1428] mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-500">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#0A1428] relative overflow-hidden px-6">
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <TicketCheck className="w-12 h-12 text-[#A3E635] mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
            Get your ticket system today
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto mb-8">
            Free plan includes basic ticketing. Upgrade for workflows, priorities, and automation.
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
