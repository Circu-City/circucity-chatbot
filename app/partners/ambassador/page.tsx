'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import MarketingShell from '@/components/marketing/MarketingShell';
import { ArrowRight, ThumbsUp, Users, TrendingUp, ShoppingCart, Sparkles, CheckCircle2, Handshake, DollarSign, ShieldCheck } from 'lucide-react';

const steps = [
  { step: 1, icon: ThumbsUp, title: 'Refer a business', desc: 'Fill out a short form to introduce a brand in your network. We will take it from there.' },
  { step: 2, icon: Users, title: 'They start with CircuCity AI', desc: 'Once your referral becomes a paying customer, your reward is unlocked.' },
  { step: 3, icon: DollarSign, title: 'You get a one-time cash reward', desc: 'We pay a flat fee based on the new customer monthly subscription value.' },
  { step: 4, icon: TrendingUp, title: 'Bigger plans, bigger bonus', desc: 'Referring larger or annual-prepay customers? Talk to us about custom enterprise bonuses.' },
];

const criteria = [
  { icon: ShoppingCart, title: 'They are an employee of an ecommerce store', desc: 'Your referral works for an ecommerce store as a customer support manager. Feel free to refer anyone: business owner, founder, support agent, etc.' },
  { icon: Sparkles, title: 'They have enough ticket volume', desc: 'Your referral is not a small store! Their monthly live chat/ticket volume and social media usage justify the need (500+ support requests/month).' },
  { icon: Users, title: 'They are not a part of your team', desc: 'You need to refer a business that is not a part of your own company. Referring a client is different from inviting a new user to an existing account.' },
];

export default function AmbassadorPage() {
  return (
    <MarketingShell>
      <section className="py-24 px-6 bg-gradient-to-b from-[#FAFAFA] to-white text-center">
        <div className="max-w-4xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#A3E635] mb-4 block">Ambassadors</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0A1428] leading-tight mb-4">
            Earn rewards for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A3E635] to-[#9EF01A]">business referrals</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-8">
            Become a CircuCity AI ambassador and earn up to $3,000 when your referrals become customers.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/partners/apply?program=ambassador"
              className="inline-flex items-center gap-2 bg-[#0A1428] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#1a2744] transition-all">
              Start referring <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#FAFAFA] px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-extrabold text-[#0A1428] mb-4 text-center">Spread the word, it&apos;s worth it</h2>
          <p className="text-gray-500 text-sm text-center mb-12 max-w-xl mx-auto">We are rewarding partners who can help us reach new businesses running on popular ecommerce platforms.</p>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div key={s.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.1 }}
                className="bg-white rounded-[20px] p-6 border border-gray-200 text-center"
              >
                <div className="w-12 h-12 bg-[#A3E635]/15 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <s.icon className="w-6 h-6 text-[#0A1428]" />
                </div>
                <span className="text-xs font-bold text-[#A3E635] block mb-2">Step {s.step}</span>
                <h3 className="font-bold text-[#0A1428] text-sm mb-2">{s.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-extrabold text-[#0A1428] mb-8 text-center">Is my referral a good fit?</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {criteria.map((c, i) => {
              const CIcon = c.icon;
              return (
                <motion.div key={c.title} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.2, delay: i * 0.08 }}
                  className="bg-white rounded-[20px] p-6 border border-gray-200 flex items-start gap-4"
                >
                  <div className="w-12 h-12 bg-[#A3E635]/15 rounded-xl flex items-center justify-center shrink-0">
                    <CIcon className="w-6 h-6 text-[#0A1428]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0A1428] mb-1">{c.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{c.desc}</p>
                  </div>
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
            Finally, a partner program that truly feels like a partnership
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto mb-8">Easy to join, easy to grow. Have questions? Our team is here to help.</p>
          <Link href="/partners/apply?program=ambassador"
            className="bg-[#A3E635] hover:bg-[#8DC92E] text-[#0A1428] font-semibold rounded-xl h-12 px-8 text-base shadow-xl shadow-[#A3E635]/20 transition-all inline-flex items-center">
            Start referring <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}

