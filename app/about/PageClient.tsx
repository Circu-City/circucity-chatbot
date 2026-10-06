'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import MarketingShell from '@/components/marketing/MarketingShell';
import { ArrowRight, Bot, Target, Heart, Zap, ShieldCheck } from 'lucide-react';

const values = [
  { icon: Zap, title: 'Speed', desc: 'We believe customer support should be instant. Every second of wait time is lost opportunity.' },
  { icon: Target, title: 'Accuracy', desc: 'AI is only as good as its training. We obsess over answer quality and relevance.' },
  { icon: Heart, title: 'Customer-first', desc: 'Every feature we build starts with a customer problem. No bloat, no noise.' },
  { icon: ShieldCheck, title: 'Trust & security', desc: 'Your data is your own. SOC 2 compliant, encrypted at rest and in transit.' },
];

const team = [
  { name: 'Dennis Mafunga', role: 'Tech Lead / Platform', bio: 'AI and platform architecture lead driving the intelligence layer.' },
  { name: 'Alome Emmanuel', role: 'Head of Product and Development', bio: 'Product and development leadership across the entire CircuCity ecosystem.' },
  { name: 'Shakira Ssebunya', role: 'Co-Founder / Growth', bio: 'Community growth and strategic partnerships for circular economy impact.' },
  { name: 'Shangwe Nasser', role: 'Co-Founder / COO / Operations', bio: 'Operations and execution — turning vision into reality every day.' },
  { name: 'Akintunde Akinmusuyi', role: 'Co-Founder / Finance', bio: 'Financial strategy and sustainability-driven business modelling.' },
];

export default function AboutPage() {
  return (
    <MarketingShell>
      <section className="py-24 px-6 bg-gradient-to-b from-[#FAFAFA] to-white text-center">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#A3E635] mb-4 block">About</span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0A1428] leading-tight mb-4">
              Making customer support{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A3E635] to-[#9EF01A]">instant & intelligent</span>
            </h1>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              We built CircuCity to make sustainable living rewarding, measurable, and accessible to everyone. Founded in Skellefteå, Sweden — empowering thousands to choose second-hand first.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-[#0A1428] mb-3">Our story</h2>
          </div>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 leading-relaxed mb-4">
              CircuCity was born in Skellefteå, northern Sweden — a region known for its commitment to sustainability and innovation.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Our mission is simple: make second-hand the natural first choice. We built CircuCity to give fashion, electronics, and home goods a second life — reducing waste, emissions, and overproduction.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Every transaction shows your environmental impact — CO₂ saved, water conserved, waste diverted. We gamify sustainability with Eco-Points, leaderboards, and community challenges.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Today CircuCity serves thousands of Swedish households, powered by AI-driven recommendations, intelligent customer support, and a passionate team committed to circular living.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#FAFAFA] border-t border-gray-100 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-[#0A1428] mb-3">Our values</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="bg-white rounded-[20px] p-6 border border-gray-200"
                >
                  <div className="w-10 h-10 bg-[#A3E635]/15 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#0A1428]" />
                  </div>
                  <h3 className="font-bold text-[#0A1428] mb-2">{v.title}</h3>
                  <p className="text-sm text-gray-500">{v.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-[#0A1428] mb-3">Our team</h2>
            <p className="text-gray-500 text-sm">The people behind CircuCity — driving circular commerce and AI-powered sustainability.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {team.map((m, i) => (
              <motion.div
                key={m.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="bg-[#FAFAFA] rounded-[20px] p-6 border border-gray-100"
              >
                <div className="w-14 h-14 bg-[#A3E635]/20 rounded-2xl flex items-center justify-center mb-4">
                  <span className="text-xl font-extrabold text-[#A3E635]">{m.name.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <h3 className="font-bold text-[#0A1428]">{m.name}</h3>
                <p className="text-sm text-[#A3E635] font-medium mb-2">{m.role}</p>
                <p className="text-sm text-gray-500">{m.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#0A1428] relative overflow-hidden px-6">
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <Bot className="w-12 h-12 text-[#A3E635] mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
            Join the circular movement
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto mb-8">
            Start shopping second-hand today. Every purchase saves CO₂, water, and waste.
          </p>
          <Link
            href="https://circucity.com"
            className="bg-[#A3E635] hover:bg-[#8DC92E] text-[#0A1428] font-semibold rounded-xl h-12 px-8 text-base shadow-xl shadow-[#A3E635]/20 transition-all inline-flex items-center"
          >
            Visit CircuCity
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
